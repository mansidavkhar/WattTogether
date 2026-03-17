const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Creates a multer-compatible Cloudinary storage engine.
 * @param {string} folder - Sub-folder within the 'watttogether' Cloudinary folder
 * @param {string[]} formats - Allowed file formats
 */
const createCloudinaryStorage = (folder, formats = ['jpg', 'jpeg', 'png', 'webp', 'gif']) =>
  new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `watttogether/${folder}`,
      allowed_formats: formats,
      resource_type: 'auto',
    },
  });

module.exports = { cloudinary, createCloudinaryStorage };
