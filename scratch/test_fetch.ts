import axios from 'axios';

const testUrl = "https://cf-st.sc-cdn.net/d/r56bAiWUPfZzQVBPxbHoe.400.IRZXSOY?mo=Gl0aCxoAGgAyAQRQXmABWhBQdWJsaWNJbWFnZVN0b3J5ogEfCJADIhoKDToBfUIGCPO6yrEGSAISACoHSVJaWFNPWaIBGQjnByIUCgcyAX1IA3ABEgAqB0lSWlhTT1k%3D&uc=94";

const HEADERS_DESKTOP = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  Connection: "keep-alive",
  Referer: "https://www.snapchat.com/",
};

async function run() {
  try {
    const res = await axios.get(testUrl, {
      headers: HEADERS_DESKTOP,
      timeout: 10000,
    });
    console.log("Status:", res.status);
    console.log("Headers:", res.headers);
    console.log("Data length:", res.data.length);
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

run();
