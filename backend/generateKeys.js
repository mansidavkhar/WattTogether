// generateKeys.js
const fs = require('fs');
const jose = require('node-jose');

async function generateKeys() {
    const keyStore = jose.JWK.createKeyStore();
    
    const key = await keyStore.generate('RSA', 2048, {
        alg: 'RS256',
        use: 'sig',
        kid: 'watt-together-key-1' // Key ID - use this consistently
    });
    
    // Save both public and private keys
    fs.writeFileSync('keys.json', JSON.stringify(keyStore.toJSON(true), null, 2));
    
    console.log('Keys generated successfully!');
    console.log('Public JWKS:', keyStore.toJSON()); // Only public keys
}

generateKeys();
