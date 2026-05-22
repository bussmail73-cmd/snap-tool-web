import fs from 'fs';

const pp = JSON.parse(fs.readFileSync('scratch/spotlight_homepage_props.json', 'utf8'));

if (pp.spotlightFeed && pp.spotlightFeed.spotlightStories) {
  const stories = pp.spotlightFeed.spotlightStories;
  if (stories.length > 0) {
    const story = stories[0];
    console.log("=== Story Metadata ===");
    console.log(JSON.stringify(story.metadata || {}, null, 2));
    
    console.log("=== Content Source ===");
    console.log(JSON.stringify(story.contentSource || {}, null, 2));
  }
}
