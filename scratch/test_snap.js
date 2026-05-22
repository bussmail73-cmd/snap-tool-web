import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

const HEADERS_MOBILE = {
  "User-Agent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  Referer: "https://www.snapchat.com/",
};

async function test() {
  try {
    console.log("Fetching profile...");
    const url = "https://www.snapchat.com/add/wwe";
    const res = await axios.get(url, { headers: HEADERS_MOBILE });
    console.log("Status:", res.status);
    fs.writeFileSync('scratch_profile.html', res.data);
    console.log("Saved to scratch_profile.html. Checking for INITIAL_STATE...");
    
    const stateMatch = res.data.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?})\s*;/);
    if (stateMatch) {
      console.log("Found __INITIAL_STATE__!");
      const stateJson = JSON.parse(stateMatch[1]);
      fs.writeFileSync('scratch_state.json', JSON.stringify(stateJson, null, 2));
      console.log("Saved state JSON to scratch_state.json");
      
      // Analyze keys in the state
      console.log("Root keys:", Object.keys(stateJson));
      if (stateJson.snapContext) {
        console.log("snapContext keys:", Object.keys(stateJson.snapContext));
      }
    } else {
      console.log("No INITIAL_STATE found.");
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

test();
