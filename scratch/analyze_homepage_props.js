import fs from 'fs';

const pp = JSON.parse(fs.readFileSync('scratch/spotlight_homepage_props.json', 'utf8'));

console.log("=== pageProps Keys ===");
for (const key of Object.keys(pp)) {
  const value = pp[key];
  if (value && typeof value === 'object') {
    if (Array.isArray(value)) {
      console.log(`Array: "${key}" length: ${value.length}`);
    } else {
      console.log(`Object: "${key}" keys:`, Object.keys(value));
    }
  } else {
    console.log(`Primitive: "${key}" = ${value}`);
  }
}

// Let's search inside the entire pageProps object for any spotlight video URLs (containing snapchat.com/spotlight/ or video urls containing .mp4 or .cf-st.sc-cdn.net or similar)
console.log("\n=== Checking for video/media objects ===");
if (pp.videoMetadata) {
  console.log("videoMetadata:", JSON.stringify(pp.videoMetadata, null, 2));
}

if (pp.linkPreview) {
  console.log("linkPreview keys:", Object.keys(pp.linkPreview));
  console.log("linkPreview:", JSON.stringify(pp.linkPreview, null, 2).substring(0, 1000));
}
