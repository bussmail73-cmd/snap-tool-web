import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scratch_next_data.json', 'utf8'));
const pp = data.props.pageProps;

console.log("=== SCANNING ALL pageProps KEYS ===");
for (const key of Object.keys(pp)) {
  const value = pp[key];
  if (!value) continue;
  
  if (Array.isArray(value)) {
    console.log(`Key [${key}] is an Array of length ${value.length}`);
    if (value.length > 0) {
      console.log(`  Sample item keys:`, Object.keys(value[0]));
    }
  } else if (typeof value === 'object') {
    console.log(`Key [${key}] is an Object with keys:`, Object.keys(value));
  } else {
    console.log(`Key [${key}] is a primitive: ${value}`);
  }
}
