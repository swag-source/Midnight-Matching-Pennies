// witnesses.js
const witnesses = {
  saltFunction: () => {
    // Generate deterministic 32-byte salt for testing
    const salt = Buffer.alloc(32);
    const timestamp = Date.now();
    salt.writeBigUInt64BE(BigInt(timestamp), 0);
    
    // Fill rest with pattern for uniqueness
    for (let i = 8; i < 32; i++) {
      salt[i] = (timestamp + i) % 256;
    }
    
    return Array.from(salt); // Return as array for Compact runtime
  }
};

module.exports = { witnesses };