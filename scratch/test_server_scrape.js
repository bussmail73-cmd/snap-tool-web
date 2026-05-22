import axios from "axios";
import * as cheerio from "cheerio";
import http from "http";
import https from "https";

const axiosInstance = axios.create({
  timeout: 8000,
  httpAgent: new http.Agent({ 
    keepAlive: true, 
    maxSockets: 50,
    keepAliveMsecs: 30000,
  }),
  httpsAgent: new https.Agent({
    keepAlive: true,
    maxSockets: 50,
    keepAliveMsecs: 30000,
    rejectUnauthorized: false,
  }),
});

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

async function test() {
  const username = "neymarjr";
  const pageUrl = `https://www.snapchat.com/add/${username}`;
  try {
    console.log("Fetching with server.ts config...");
    const response = await axiosInstance.get(pageUrl, {
      headers: HEADERS_MOBILE,
      timeout: 8000,
    });
    
    console.log("Response status:", response.status);
    console.log("Response data length:", response.data?.length);
    
    const $ = cheerio.load(response.data);
    const nextDataScript = $('script#__NEXT_DATA__').html();
    console.log("Has __NEXT_DATA__ script tag:", !!nextDataScript);
    if (nextDataScript) {
      console.log("__NEXT_DATA__ snippet:", nextDataScript.substring(0, 200));
      const nextData = JSON.parse(nextDataScript.trim());
      const pageProps = nextData.props?.pageProps;
      console.log("Has pageProps:", !!pageProps);
      if (pageProps) {
        console.log("userProfile:", !!pageProps.userProfile);
        console.log("publicProfileInfo:", !!pageProps.userProfile?.publicProfileInfo);
        console.log("subscriberCount:", pageProps.userProfile?.publicProfileInfo?.subscriberCount);
      }
    } else {
      console.log("Looking at other scripts...");
      $('script').each((i, el) => {
        const text = $(el).html() || '';
        if (text.includes("props") || text.includes("subscriber")) {
          console.log(`Script ${i} length ${text.length} has keywords`);
        }
      });
    }
  } catch (err) {
    console.error("Fetch failed:", err.message);
  }
}

test();
