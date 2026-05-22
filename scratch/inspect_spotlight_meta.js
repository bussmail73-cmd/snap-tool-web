import fs from 'fs';

const pp = JSON.parse(fs.readFileSync('scratch/single_spotlight_props.json', 'utf8'));

if (pp.spotlightFeed && pp.spotlightFeed.spotlightStories) {
  const story = pp.spotlightFeed.spotlightStories[0];
  if (story && story.metadata) {
    const meta = story.metadata;
    console.log("=== USER METADATA ===");
    console.log(JSON.stringify(meta.userMetadata, null, 2));

    console.log("\n=== CONTEXT CARDS ===");
    console.log(JSON.stringify(meta.contextCards, null, 2));

    console.log("\n=== VIDEO METADATA CREATOR ===");
    console.log(JSON.stringify(meta.videoMetadata?.creator, null, 2));

    console.log("\n=== STORY METADATA DESCRIPTION & DEEPLINK ===");
    console.log("Description:", meta.description);
    console.log("Deeplink:", meta.deeplink);
  }
} else {
  console.log("No spotlightStories in pp");
}
