import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');

const HEADERS_DESKTOP = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.snapchat.com/",
};

async function test() {
  try {
    const url = 'https://www.snapchat.com/add/maira_shoukat97';
    console.log('Fetching', url);
    const response = await axios.get(url, { headers: HEADERS_DESKTOP });
    const $ = cheerio.load(response.data);
    
    fs.writeFileSync('scratch_profile.html', response.data);
    console.log('Saved HTML to scratch_profile.html');
    
    const nextDataScript = $('script#__NEXT_DATA__').html();
    if (nextDataScript) {
      console.log('Found __NEXT_DATA__!');
      const nextData = JSON.parse(nextDataScript.trim());
      fs.writeFileSync('scratch_next_data.json', JSON.stringify(nextData, null, 2));
      console.log('Saved next_data to scratch_next_data.json');
      
      const pp = nextData.props?.pageProps;
      if (pp) {
        console.log('Keys of pageProps:', Object.keys(pp));
        if (pp.userProfile) {
          console.log('userProfile keys:', Object.keys(pp.userProfile));
          console.log('publicProfileInfo:', JSON.stringify(pp.userProfile.publicProfileInfo, null, 2));
        }
        if (pp.story) console.log('story keys:', Object.keys(pp.story));
        if (pp.curatedHighlights) console.log('curatedHighlights length:', pp.curatedHighlights.length);
        if (pp.spotlightHighlights) console.log('spotlightHighlights length:', pp.spotlightHighlights.length);
      } else {
        console.log('No pageProps found!');
      }
    } else {
      console.log('__NEXT_DATA__ not found!');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
