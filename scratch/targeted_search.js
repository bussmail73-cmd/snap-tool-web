import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scratch_next_data.json', 'utf8'));
const pp = data.props.pageProps;

console.log("=== TARGETED KEYS SEARCH ===");
const keywords = ['spotlight', 'highlight', 'story', 'video', 'feed', 'card', 'user', 'profile'];
for (const key of Object.keys(pp)) {
  const lowercaseKey = key.toLowerCase();
  const match = keywords.some(kw => lowercaseKey.includes(kw));
  if (match) {
    const value = pp[key];
    console.log(`\nFound matching key: ${key}`);
    if (value === null || value === undefined) {
      console.log(`  Value: ${value}`);
    } else if (Array.isArray(value)) {
      console.log(`  Type: Array, Length: ${value.length}`);
      if (value.length > 0) {
        console.log(`  First item keys:`, Object.keys(value[0]));
        console.log(`  First item sample:`, JSON.stringify(value[0]).substring(0, 500));
      }
    } else if (typeof value === 'object') {
      console.log(`  Type: Object, Keys:`, Object.keys(value));
      console.log(`  Sample:`, JSON.stringify(value).substring(0, 500));
    } else {
      console.log(`  Type: Primitive, Value: ${value}`);
    }
  }
}
