import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, '../scratch_next_data.json');
const rawData = fs.readFileSync(dataPath, 'utf8');
const data = JSON.parse(rawData);

const pageProps = data.props.pageProps;

if (pageProps.spotlightStoryMetadata) {
  console.log("Number of spotlight stories:", pageProps.spotlightStoryMetadata.length);
  let totalViews = 0;
  pageProps.spotlightStoryMetadata.forEach((story, idx) => {
    const vcStr = story.engagementStats?.viewCount || story.videoMetadata?.viewCount || '0';
    const vc = Number(vcStr) || 0;
    console.log(`Story ${idx}: viewCount = ${vc} (type: ${typeof vcStr})`);
    totalViews += vc;
  });
  console.log("Summed total views from spotlight stories:", totalViews);
} else {
  console.log("No spotlightStoryMetadata found.");
}
