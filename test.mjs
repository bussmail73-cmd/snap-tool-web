import axios from 'axios';
import * as cheerio from 'cheerio';

async function test() {
  const url = 'https://www.snapchat.com/spotlight/W7_EDlXWTBiXAEEniNoMPwAAYd2NxbHJydHZmAZNOSWErAZNOSDxMAAAAAw';
  const response = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    }
  });

  const $ = cheerio.load(response.data);
  const nextDataScript = $('#__NEXT_DATA__').html();
  if (nextDataScript) {
      const nextData = JSON.parse(nextDataScript.trim());
      const pp = nextData.props?.pageProps;
      if (pp) {
          const videoMeta = pp.videoMetadata;
          if (videoMeta) {
              console.log("videoMetadata:", JSON.stringify(videoMeta, null, 2));
              return;
          }
      }
      console.log("Could not find videoMetadata in pageProps.");
  }
}

test();
