const pinataSDK = require('@pinata/sdk');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize Pinata with JWT or API Key/Secret
let pinata;
if (process.env.PINATA_JWT) {
  // Preferred method: JWT authentication
  pinata = new pinataSDK({ pinataJWTKey: process.env.PINATA_JWT });
} else if (process.env.PINATA_API_KEY && process.env.PINATA_API_SECRET) {
  // Legacy method: API Key + Secret
  pinata = new pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_API_SECRET);
} else {
  console.error('❌ No Pinata credentials found in .env file!');
  console.error('Please add either PINATA_JWT or (PINATA_API_KEY + PINATA_API_SECRET)');
}

/**
 * Upload file to IPFS via Pinata
 * @param {String} filePath - Path to file on local disk
 * @param {Object} metadata - Optional metadata (name, description, campaignId, etc.)
 * @returns {String} IPFS CID
 */
async function uploadFileToIPFS(fileSource, metadata = {}) {
  try {
    // fileSource can be a file path (string) or a multer file object with buffer
    let readableStream;
    let fileName;
    if (typeof fileSource === 'string') {
      readableStream = fs.createReadStream(fileSource);
      fileName = metadata.name || path.basename(fileSource);
    } else {
      // multer memoryStorage file: { buffer, originalname, ... }
      const { Readable } = require('stream');
      readableStream = Readable.from(fileSource.buffer);
      fileName = metadata.name || fileSource.originalname || 'upload';
    }
    const options = {
      pinataMetadata: {
        name: fileName,
        keyvalues: {
          uploadedBy: 'WattTogether',
          timestamp: Date.now().toString(),
          campaignId: (metadata.campaignId || '').toString(),
          milestoneId: (metadata.milestoneId || '').toString(),
          type: (metadata.type || 'proof').toString()
        }
      },
      pinataOptions: {
        cidVersion: 0 // Use CIDv0 (Qm...) for V6 contract validation
      }
    };

    const result = await pinata.pinFileToIPFS(readableStream, options);
    
    console.log(`✅ File pinned to IPFS: ${result.IpfsHash}`);
    return result.IpfsHash; // Returns CID like "QmXyZ..."
    
  } catch (error) {
    console.error('❌ IPFS upload failed:', error);
    throw new Error('Failed to upload to IPFS: ' + error.message);
  }
}

/**
 * Upload JSON data to IPFS
 * @param {Object} data - JSON object to upload
 * @param {Object} metadata - Optional metadata
 * @returns {String} IPFS CID
 */
async function uploadJSONToIPFS(data, metadata = {}) {
  try {
    const options = {
      pinataMetadata: {
        name: metadata.name || 'milestone-data',
        keyvalues: {
          type: 'json',
          uploadedBy: 'WattTogether',
          timestamp: Date.now().toString(),
          campaignId: (metadata.campaignId || '').toString(),
          milestoneId: (metadata.milestoneId || '').toString()
        }
      },
      pinataOptions: {
        cidVersion: 0
      }
    };

    const result = await pinata.pinJSONToIPFS(data, options);
    
    console.log(`✅ JSON pinned to IPFS: ${result.IpfsHash}`);
    return result.IpfsHash;
    
  } catch (error) {
    console.error('❌ IPFS JSON upload failed:', error);
    throw new Error('Failed to upload JSON to IPFS: ' + error.message);
  }
}

/**
 * Upload multiple files and create metadata JSON
 * @param {Array} files - Array of file paths
 * @param {Object} metadata - Metadata for the collection
 * @returns {String} IPFS CID of metadata JSON
 */
async function uploadMultipleFiles(files, metadata = {}) {
  try {
    const fileHashes = [];
    
    // Upload each file
    for (const file of files) {
      const cid = await uploadFileToIPFS(file, {
        name: file.originalname || (typeof file === 'string' ? path.basename(file) : 'upload'),
        campaignId: metadata.campaignId,
        milestoneId: metadata.milestoneId
      });
      
      fileHashes.push({
        filename: file.originalname || path.basename(file.path),
        cid,
        url: getGatewayURL(cid),
        size: file.size || fs.statSync(file.path).size
      });
    }
    
    // Create metadata JSON with all file CIDs
    const metadataJSON = {
      description: metadata.description || '',
      campaignId: metadata.campaignId,
      milestoneId: metadata.milestoneId,
      files: fileHashes,
      timestamp: Date.now(),
      uploadedBy: metadata.uploadedBy || 'WattTogether'
    };
    
    // Upload metadata JSON to IPFS
    const metadataCID = await uploadJSONToIPFS(metadataJSON, {
      name: `milestone-${metadata.milestoneId || 'proof'}`,
      type: 'milestone-proof-metadata',
      campaignId: metadata.campaignId
    });
    
    return metadataCID;
    
  } catch (error) {
    console.error('❌ Multiple file upload failed:', error);
    throw error;
  }
}

/**
 * Unpin file from IPFS (cleanup)
 * @param {String} cid - IPFS CID to unpin
 */
async function unpinFile(cid) {
  try {
    await pinata.unpin(cid);
    console.log(`✅ Unpinned ${cid}`);
    return true;
  } catch (error) {
    console.error('❌ Unpin failed:', error);
    return false;
  }
}

/**
 * Get IPFS gateway URL
 * @param {String} cid - IPFS CID
 * @returns {String} Gateway URL
 */
function getGatewayURL(cid) {
  // Use Pinata's dedicated gateway for faster loading
  return `https://gateway.pinata.cloud/ipfs/${cid}`;
  
  // Alternative public gateways:
  // return `https://ipfs.io/ipfs/${cid}`;
  // return `https://cloudflare-ipfs.com/ipfs/${cid}`;
}

/**
 * Validate IPFS CID format (matches V6 contract validation)
 * @param {String} cid - IPFS CID to validate
 * @returns {Boolean} Is valid CID
 */
function isValidCID(cid) {
  if (!cid || typeof cid !== 'string') return false;
  
  // CIDv0: Starts with "Qm", length 46
  if (cid.length === 46 && cid.startsWith('Qm')) {
    return true;
  }
  
  // CIDv1: Starts with "bafy", length varies (typically 59+)
  if (cid.length >= 49 && cid.startsWith('bafy')) {
    return true;
  }
  
  return false;
}

/**
 * Test Pinata connection
 * @returns {Boolean} Connection status
 */
async function testConnection() {
  try {
    const result = await pinata.testAuthentication();
    console.log('✅ Pinata connection successful:', result);
    return true;
  } catch (error) {
    console.error('❌ Pinata connection failed:', error);
    return false;
  }
}

/**
 * Get pinned files list
 * @param {Object} filters - Optional filters
 * @returns {Array} List of pinned files
 */
async function listPinnedFiles(filters = {}) {
  try {
    const result = await pinata.pinList(filters);
    return result.rows;
  } catch (error) {
    console.error('❌ Failed to list pinned files:', error);
    throw error;
  }
}

module.exports = {
  uploadFileToIPFS,
  uploadJSONToIPFS,
  uploadMultipleFiles,
  unpinFile,
  getGatewayURL,
  isValidCID,
  testConnection,
  listPinnedFiles
};
