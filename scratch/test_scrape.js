const axios = require('axios');
const cheerio = require('cheerio');

const HEADERS_MOBILE = {
  "User-Agent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  Referer: "https://www.snapchat.com/",
  "sec-fetch-dest": "document",
  "sec-fetch-mode": "navigate",
};

async function test(username) {
  try {
    const url = `https://www.snapchat.com/add/${username}`;
    console.log(`Fetching ${url}...`);
    const res = await axios.get(url, { headers: HEADERS_MOBILE, timeout: 5000, validateStatus: () => true });
    console.log(`Status: ${res.status}`);
    const $ = cheerio.load(res.data);
    const title = $('meta[property="og:title"]').attr("content");
    console.log(`Title tag content: ${title}`);
    
    // Check if there is next data
    const nextDataScript = $('script#__NEXT_DATA__').html();
    if (nextDataScript) {
      const nextData = JSON.parse(nextDataScript.trim());
      const pageProps = nextData.props?.pageProps;
      const publicProfileInfo = pageProps?.userProfile?.publicProfileInfo;
      console.log(`Next.js title: ${publicProfileInfo?.title}`);
      console.log(`Next.js username: ${publicProfileInfo?.username}`);
    } else {
      console.log("No NEXT_DATA found");
    }
  } catch (err) {
    console.error(err.message);
  }
}

async function run() {
  await test('taylorswift');
  await test('wwe');
}

run();
