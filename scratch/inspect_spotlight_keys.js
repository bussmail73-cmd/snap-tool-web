import fs from 'fs';

try {
  const data = JSON.parse(fs.readFileSync('scratch/single_spotlight_props.json', 'utf8'));
  console.log("Root keys:", Object.keys(data));
  
  if (data.videoMetadata) {
    console.log("videoMetadata keys:", Object.keys(data.videoMetadata));
    console.log("videoMetadata contentUrl:", data.videoMetadata.contentUrl);
    console.log("videoMetadata creator:", data.videoMetadata.creator);
  }
  
  if (data.spotlightFeed) {
    console.log("spotlightFeed keys:", Object.keys(data.spotlightFeed));
    if (data.spotlightFeed.spotlightStories && data.spotlightFeed.spotlightStories.length > 0) {
      const story = data.spotlightFeed.spotlightStories[0];
      console.log("spotlightStory keys:", Object.keys(story));
      console.log("spotlightStory metadata:", Object.keys(story.metadata || {}));
      console.log("spotlightStory metadata contextCards:", story.metadata?.contextCards);
    }
  }
} catch (e) {
  console.error("Error:", e.message);
}
