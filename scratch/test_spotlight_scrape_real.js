import axios from 'axios';
import * as cheerio from 'cheerio';

const url = "https://www.snapchat.com/spotlight/W7_EDlXWTBiXAEEniNoMPwAAYb21tdmFid213AZ2cWQCIAZ2cWQBrAAAAAw";

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
    console.log("Fetching url:", url);
    const start = Date.now();
    const response = await axios.get(url, {
      headers: HEADERS_MOBILE,
      timeout: 8000,
    });
    const duration = Date.now() - start;
    console.log(`Fetched in ${duration}ms, status: ${response.status}`);

    const $ = cheerio.load(response.data);
    const nextDataScript = $('script#__NEXT_DATA__').html();
    if (!nextDataScript) {
      console.log("No __NEXT_DATA__ found!");
      return;
    }

    const nextData = JSON.parse(nextDataScript.trim());
    const pp = nextData.props?.pageProps;
    if (!pp) {
      console.log("No pageProps inside __NEXT_DATA__");
      return;
    }

    const videoMeta = pp.videoMetadata;
    console.log("Has videoMetadata:", !!videoMeta);
    if (videoMeta) {
      console.log("videoMetadata contentUrl:", videoMeta.contentUrl);
      console.log("videoMetadata creator:", JSON.stringify(videoMeta.creator, null, 2));
    }

    const spotlightFeed = pp.spotlightFeed;
    console.log("Has spotlightFeed:", !!spotlightFeed);
    if (spotlightFeed && spotlightFeed.spotlightStories) {
      console.log("spotlightStories length:", spotlightFeed.spotlightStories.length);
      const story = spotlightFeed.spotlightStories[0];
      if (story) {
        console.log("Story metadata description:", story.metadata?.description);
        console.log("Story metadata hashtags:", story.metadata?.hashtags);
        console.log("Story metadata contextCards:", JSON.stringify(story.metadata?.contextCards, null, 2));
      }
    }

    // Try pageMetadata
    console.log("pageMetadata:", JSON.stringify(pp.pageMetadata, null, 2));

  } catch (err) {
    console.error("Error fetching/parsing:", err.message);
  }
}

test();
