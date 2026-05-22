import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

const HEADERS_MOBILE = {
  "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.snapchat.com/",
};

async function check() {
  const url = "https://www.snapchat.com/spotlight/W7_EDlXWTBiXAEEniNoMPwAAYb21tdmFid213AZ2cWQCIAZ2cWQBrAAAAAw";
  try {
    console.log(`Fetching spotlight page: ${url}...`);
    const res = await axios.get(url, { headers: HEADERS_MOBILE });
    console.log("Status:", res.status);
    const $ = cheerio.load(res.data);
    const nextDataScript = $('script#__NEXT_DATA__').html();
    if (!nextDataScript) {
      console.log("NO __NEXT_DATA__ FOUND on single spotlight page!");
      return;
    }
    
    console.log("Found __NEXT_DATA__!");
    const nextData = JSON.parse(nextDataScript.trim());
    const pp = nextData.props?.pageProps;
    if (pp) {
      console.log("Successfully extracted pageProps!");
      fs.writeFileSync('scratch/single_spotlight_props.json', JSON.stringify(pp, null, 2));
      console.log("Saved keys of pageProps:", Object.keys(pp));
      
      // Let's print out potential keys where video and creator data is located:
      if (pp.videoMetadata) {
        console.log("=== pp.videoMetadata ===");
        console.log(JSON.stringify(pp.videoMetadata, null, 2));
      }
      
      if (pp.spotlightStoryMetadata) {
        console.log("=== pp.spotlightStoryMetadata ===");
        console.log("Count:", pp.spotlightStoryMetadata.length);
        if (pp.spotlightStoryMetadata.length > 0) {
          console.log("First item:", JSON.stringify(pp.spotlightStoryMetadata[0], null, 2).substring(0, 1000));
        }
      }
      
      if (pp.spotlightFeed) {
        console.log("=== pp.spotlightFeed ===");
        console.log("Keys in spotlightFeed:", Object.keys(pp.spotlightFeed));
      }
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

check();
