import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scratch_next_data.json', 'utf8'));
const pp = data.props.pageProps;

console.log("=== userProfile ===");
if (pp.userProfile) {
  console.log(JSON.stringify(pp.userProfile, null, 2));
}

console.log("\n=== curatedHighlights count ===");
if (pp.curatedHighlights) {
  console.log("Highlights count:", pp.curatedHighlights.length);
  // Let's count total snaps in highlights
  let totalSnaps = 0;
  pp.curatedHighlights.forEach((ch, idx) => {
    const title = ch.storyTitle?.value || `Highlight ${idx + 1}`;
    const snapCount = ch.snapList?.length || 0;
    totalSnaps += snapCount;
    console.log(`  Highlight #${idx+1}: "${title}" has ${snapCount} snaps`);
  });
  console.log("Total Highlight snaps:", totalSnaps);
}

console.log("\n=== taggedTabResponse ===");
if (pp.taggedTabResponse) {
  console.log("Keys in taggedTabResponse:", Object.keys(pp.taggedTabResponse));
  const tr = pp.taggedTabResponse;
  if (tr.searchResponse) {
    console.log("Keys in tr.searchResponse:", Object.keys(tr.searchResponse));
    if (tr.searchResponse.searchHits) {
      console.log("searchHits count:", tr.searchResponse.searchHits.length);
      if (tr.searchResponse.searchHits.length > 0) {
        console.log("First searchHit sample:", JSON.stringify(tr.searchResponse.searchHits[0], null, 2));
      }
    }
  }
  if (tr.spotlightCardMap) {
    console.log("spotlightCardMap count:", Object.keys(tr.spotlightCardMap).length);
    const firstKey = Object.keys(tr.spotlightCardMap)[0];
    if (firstKey) {
      console.log(`First key "${firstKey}" card structure:`, JSON.stringify(tr.spotlightCardMap[firstKey], null, 2));
    }
  }
}
