import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

const HEADERS_MOBILE = {
  "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.snapchat.com/",
};

async function find() {
  try {
    const url = "https://www.snapchat.com/spotlight";
    console.log("Fetching spotlight main page...");
    const res = await axios.get(url, { headers: HEADERS_MOBILE });
    const $ = cheerio.load(res.data);

    const nextDataScript = $('script#__NEXT_DATA__').html();
    if (nextDataScript) {
      const nextData = JSON.parse(nextDataScript.trim());
      const pp = nextData.props?.pageProps;
      if (pp) {
        console.log("Saving full pageProps of spotlight feed to spotlight_homepage_props.json...");
        fs.writeFileSync('scratch/spotlight_homepage_props.json', JSON.stringify(pp, null, 2));
        
        if (pp.spotlightFeed) {
          console.log("spotlightFeed count:", pp.spotlightFeed.length);
          if (pp.spotlightFeed.length > 0) {
            const firstFeedItem = pp.spotlightFeed[0];
            console.log("firstFeedItem keys:", Object.keys(firstFeedItem));
            console.log("firstFeedItem content:", JSON.stringify(firstFeedItem, null, 2).substring(0, 1000));
          }
        }
      }
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

find();
