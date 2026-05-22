const axios = require('axios');
const cheerio = require('cheerio');

const HEADERS_MOBILE = {
  "User-Agent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.snapchat.com/",
};

async function inspect(username) {
  try {
    const url = `https://www.snapchat.com/add/${username}`;
    const res = await axios.get(url, { headers: HEADERS_MOBILE, timeout: 5000 });
    const $ = cheerio.load(res.data);
    
    // Check if there is next data
    const nextDataScript = $('script#__NEXT_DATA__').html();
    if (nextDataScript) {
      const nextData = JSON.parse(nextDataScript.trim());
      const pageProps = nextData.props?.pageProps;
      const publicProfileInfo = pageProps?.userProfile?.publicProfileInfo;
      console.log(`--- @${username} ---`);
      console.log(`DisplayName: ${publicProfileInfo?.title}`);
      console.log(`ProfilePictureUrl: ${publicProfileInfo?.profilePictureUrl}`);
      console.log(`SnapcodeImageUrl: ${publicProfileInfo?.snapcodeImageUrl}`);
    } else {
      console.log("No NEXT_DATA found");
    }
  } catch (err) {
    console.error(err.message);
  }
}

inspect('taylorswift');
