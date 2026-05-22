const axios = require('axios');

async function test() {
  const originalUrl = "https://cf-st.sc-cdn.net/aps/bolt/aHR0cHM6Ly9jZi1zdC5zYy1jZG4ubmV0L2QvQmFtRHhxdWNhMmxMZGxSem05TTVsP2JvPUVna3lBUVJJQWxBWllBRSUzRCZ1Yz0yNQ._RS0,90_FMjpeg";
  
  // Method 1: Decode Base64 from the URL
  const match = originalUrl.match(/\/aps\/bolt\/([a-zA-Z0-9_-]+)/);
  if (match) {
    const base64Str = match[1];
    // Replace url-safe base64 characters if needed
    const normalizedBase64 = base64Str.replace(/-/g, '+').replace(/_/g, '/');
    const decodedUrl = Buffer.from(normalizedBase64, 'base64').toString('utf8');
    console.log("Decoded Original uncompressed CDN URL:", decodedUrl);
  }
  
  // Method 2: Change _RS0,90 to _RS0,1000 or similar
  const hdUrl = originalUrl.replace(/_RS0,90/g, '_RS0,1000').replace(/_RS0,\d+/g, '_RS0,1000');
  console.log("Modified HD URL:", hdUrl);
}

test();
