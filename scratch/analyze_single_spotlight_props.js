import fs from 'fs';

const pp = JSON.parse(fs.readFileSync('scratch/single_spotlight_props.json', 'utf8'));

console.log("=== LINK PREVIEW ===");
if (pp.linkPreview) {
  console.log(JSON.stringify(pp.linkPreview, null, 2));
}

console.log("\n=== PAGE METADATA ===");
if (pp.pageMetadata) {
  console.log(JSON.stringify(pp.pageMetadata, null, 2));
}

console.log("\n=== SPOTLIGHT FEED / STORY METADATA ===");
if (pp.spotlightFeed && pp.spotlightFeed.spotlightStories) {
  const story = pp.spotlightFeed.spotlightStories[0];
  if (story) {
    console.log("Has first spotlightFeed item story keys:", Object.keys(story));
    console.log("Story Metadata keys:", Object.keys(story.metadata || {}));
    if (story.metadata) {
      console.log("Hashtags:", story.metadata.hashtags);
      console.log("Description (story metadata):", story.metadata.description);
    }
  }
}
