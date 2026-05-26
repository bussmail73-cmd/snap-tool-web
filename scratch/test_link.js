import axios from "axios";
import * as cheerio from "cheerio";

const HEADERS_MOBILE = {
  "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
};

async function test() {
  const url = "https://www.snapchat.com/spotlight/W7_EDlXWTBiXAEEniNoMPwAAYd2NxbHJydHZmAZNOSWErAZNOSDxMAAAAAw";
  console.log("Fetching URL:", url);
  try {
    const response = await axios.get(url, { headers: HEADERS_MOBILE });
    console.log("Status:", response.status);
    const $ = cheerio.load(response.data);
    
    // Check next data
    const nextDataScript = $('script#__NEXT_DATA__').html();
    console.log("Has __NEXT_DATA__:", !!nextDataScript);
    
    // Check meta tags
    console.log("og:title:", $('meta[property="og:title"]').attr("content"));
    console.log("og:image:", $('meta[property="og:image"]').attr("content"));
    
    if (nextDataScript) {
      const parsed = JSON.parse(nextDataScript);
      const pp = parsed.props?.pageProps;
      console.log("pageProps exists:", !!pp);
      console.log("videoMetadata exists:", !!pp?.videoMetadata);
      console.log("spotlightFeed exists:", !!pp?.spotlightFeed);
      if (pp?.videoMetadata) {
        console.log("videoMetadata:", JSON.stringify(pp.videoMetadata, null, 2));
      } else {
        // Print keys of pageProps
        console.log("pageProps keys:", Object.keys(pp || {}));
      }
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

test();
