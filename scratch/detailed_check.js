import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scratch_next_data.json', 'utf8'));
const pp = data.props.pageProps;

console.log("=== curatedHighlights detailed check ===");
if (pp.curatedHighlights && pp.curatedHighlights.length > 0) {
  const ch = pp.curatedHighlights[0];
  console.log("curatedHighlight 0 storyTitle:", ch.storyTitle?.value);
  console.log("curatedHighlight 0 snapList length:", ch.snapList?.length);
  if (ch.snapList && ch.snapList.length > 0) {
    const snap = ch.snapList[0];
    console.log("First snap keys:", Object.keys(snap));
    console.log("First snap mediaType:", snap.snapMediaType);
    console.log("First snap urls:", JSON.stringify(snap.snapUrls, null, 2));
    console.log("First snap timestamp:", snap.timestampInSec?.value);
  }
}

console.log("\n=== Checking other pageProps keys ===");
for (const key of Object.keys(pp)) {
  if (pp[key] && typeof pp[key] === 'object') {
    if (Array.isArray(pp[key])) {
      console.log(`Array key: ${key}, length: ${pp[key].length}`);
    } else {
      console.log(`Object key: ${key}, keys:`, Object.keys(pp[key]));
    }
  } else {
    console.log(`Primitive key: ${key} = ${pp[key]}`);
  }
}
