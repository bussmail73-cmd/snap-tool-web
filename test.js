const axios = require('axios');
const cheerio = require('cheerio');

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
  const nextData = $('#__NEXT_DATA__').html();
  console.log("Has __NEXT_DATA__:", !!nextData);
  
  if (!nextData) {
      console.log("Looking for snapchat specific scripts...");
      $('script').each((i, el) => {
          const content = $(el).html() || '';
          if (content.includes('videoUrl') || content.includes('contentUrl') || content.includes('window.__INITIAL_STATE__')) {
              console.log("Found potential state script of length:", content.length);
          }
      });
  }
}

test();
