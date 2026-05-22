import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('scratch_profile.html', 'utf8');
const $ = cheerio.load(html);

// Find script containing nextjs data
let nextDataStr = '';
$('script').each((i, el) => {
  const content = $(el).html() || '';
  if (content.startsWith('{"props":')) {
    nextDataStr = content;
  }
});

if (nextDataStr) {
  const data = JSON.parse(nextDataStr);
  fs.writeFileSync('scratch_next_data.json', JSON.stringify(data, null, 2));
  console.log("Saved next data structure!");
  
  // Recursively search for any array that contains objects with url or video attributes
  console.log("Exploring Next.js pageProps keys:");
  if (data.props && data.props.pageProps) {
    const pp = data.props.pageProps;
    console.log("pageProps keys:", Object.keys(pp));
    
    // Check key data structures
    if (pp.curatedHighlights) {
      console.log("curatedHighlights count:", pp.curatedHighlights.length);
      if (pp.curatedHighlights.length > 0) {
        console.log("Sample curatedHighlight:", JSON.stringify(pp.curatedHighlights[0], null, 2));
      }
    }
    if (pp.spotlightCards) {
      console.log("spotlightCards count:", pp.spotlightCards.length);
      if (pp.spotlightCards.length > 0) {
        console.log("Sample spotlightCard:", JSON.stringify(pp.spotlightCards[0], null, 2));
      }
    }
    if (pp.publicProfileInfo) {
      console.log("publicProfileInfo:", JSON.stringify(pp.publicProfileInfo, null, 2));
    }
    if (pp.storyState) {
      console.log("storyState keys:", Object.keys(pp.storyState));
    }
  }
} else {
  console.log("Next data script tag not found.");
}
