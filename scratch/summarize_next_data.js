import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scratch_next_data.json', 'utf8'));
const pp = data.props.pageProps;

console.log("=== NEXT DATA SUMMARY ===");
console.log("publicProfileInfo:", pp.publicProfileInfo ? "Found" : "Not Found");
if (pp.publicProfileInfo) {
  console.log("  Display Name:", pp.publicProfileInfo.title);
  console.log("  Username:", pp.publicProfileInfo.username);
  console.log("  Bio:", pp.publicProfileInfo.bio);
  console.log("  Logo:", pp.publicProfileInfo.snapcodeImageUrl || pp.publicProfileInfo.snapcodeUrl);
}

console.log("\n=== curatedHighlights ===");
if (pp.curatedHighlights) {
  console.log("Count:", pp.curatedHighlights.length);
  if (pp.curatedHighlights.length > 0) {
    const ch = pp.curatedHighlights[0];
    console.log("First curatedHighlight keys:", Object.keys(ch));
    console.log("  title:", ch.title?.value);
    console.log("  snaps count:", ch.snaps?.length);
    if (ch.snaps && ch.snaps.length > 0) {
      console.log("    First snap sample url:", ch.snaps[0].snapUrls?.mediaUrl);
      console.log("    First snap preview url:", ch.snaps[0].snapUrls?.mediaPreviewUrl?.value);
    }
  }
}

console.log("\n=== spotlightCards ===");
if (pp.spotlightCards) {
  console.log("Count:", pp.spotlightCards.length);
  if (pp.spotlightCards.length > 0) {
    const sc = pp.spotlightCards[0];
    console.log("First spotlightCard keys:", Object.keys(sc));
    console.log("  title:", sc.title?.value);
    console.log("  snapUrls:", sc.snapUrls);
    console.log("  storyUrls:", sc.storyUrls);
    console.log("  videoTrackUrl:", sc.videoTrackUrl);
  }
}

console.log("\n=== storyState ===");
if (pp.storyState) {
  console.log("storyState keys:", Object.keys(pp.storyState));
}
