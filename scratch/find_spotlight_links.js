import axios from 'axios';
import * as cheerio from 'cheerio';

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
    console.log("Status:", res.status);
    const $ = cheerio.load(res.data);
    const links = [];
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href && href.includes('/spotlight/')) {
        links.push(href);
      }
    });
    console.log("Found links in a elements:", links.slice(0, 10));

    const nextDataScript = $('script#__NEXT_DATA__').html();
    if (nextDataScript) {
      console.log("Found __NEXT_DATA__!");
      const nextData = JSON.parse(nextDataScript.trim());
      // Let's write the JSON keys
      console.log("Root props:", Object.keys(nextData.props || {}));
      if (nextData.props?.pageProps) {
        console.log("pageProps keys:", Object.keys(nextData.props.pageProps));
      }
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

find();
