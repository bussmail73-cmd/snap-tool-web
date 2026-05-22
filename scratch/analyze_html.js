import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('scratch_profile.html', 'utf8');
const $ = cheerio.load(html);

console.log("Analyzing HTML scripts...");
let count = 0;
$('script').each((i, el) => {
  const content = $(el).html() || '';
  const src = $(el).attr('src') || '';
  if (src) {
    // console.log(`Script tag with src: ${src}`);
  } else {
    count++;
    console.log(`Inline script #${count} length: ${content.length}`);
    if (content.includes('spotlight') || content.includes('story') || content.includes('profile')) {
      console.log(`  -> Contains keywords! First 200 chars: ${content.substring(0, 200)}`);
      // check if it has state
      if (content.includes('STATE') || content.includes('state')) {
        console.log(`  -> Contains state/STATE keyword!`);
      }
    }
  }
});

// Search in body for JSON-LD or meta tags
console.log("\nMeta Tags:");
$('meta').each((i, el) => {
  const name = $(el).attr('name') || $(el).attr('property') || '';
  const content = $(el).attr('content') || '';
  if (name || content) {
    console.log(`  ${name} = ${content}`);
  }
});

// Search for schema.org application/ld+json
console.log("\nJSON-LD tags:");
$('script[type="application/ld+json"]').each((i, el) => {
  console.log(`  JSON-LD #${i+1}: ${$(el).html()?.substring(0, 300)}...`);
});
