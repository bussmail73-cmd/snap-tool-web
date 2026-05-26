import axios from "axios";
import https from "https";

const LIVE_HOST = "https://3.239.159.94";
const TEST_USER_1 = "maira_shoukat97";
const TEST_USER_2 = "wwe";
const TEST_SPOTLIGHT = "https://www.snapchat.com/spotlight/W7_EDlXWTBiXAEEniNoMPwAAYd2NxbHJydHZmAZNOSWErAZNOSDxMAAAAAw";

const agent = new https.Agent({
  rejectUnauthorized: false
});

async function testEndpoint(name, path, payload) {
  const start = Date.now();
  console.log(`[TEST] Hitting ${name} endpoint (${path})...`);
  try {
    const response = await axios.post(`${LIVE_HOST}${path}`, payload, {
      timeout: 15000,
      httpsAgent: agent,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });
    const latency = Date.now() - start;
    console.log(`[SUCCESS] ${name} responded in ${latency}ms with status ${response.status}`);
    console.log(`          Keys returned: [${Object.keys(response.data).join(", ")}]`);
    if (response.data.success) {
      if (name.includes("Story")) {
        const vCount = response.data.videos?.length || 0;
        const pCount = response.data.photos?.length || 0;
        console.log(`          Data details: Username: @${response.data.username}, Videos: ${vCount}, Photos: ${pCount}`);
      } else if (name.includes("Spotlight")) {
        console.log(`          Data details: Uploader: ${response.data.uploader}, Video URL: ${response.data.videoUrl ? "FOUND" : "NOT FOUND"}`);
      } else if (name.includes("Profile")) {
        console.log(`          Data details: DisplayName: ${response.data.displayName}, Subscribers: ${response.data.subscribers}`);
      } else if (name.includes("Bulk")) {
        const storiesCount = response.data.stories?.length || 0;
        const highlightsCount = response.data.highlights?.length || 0;
        console.log(`          Data details: Stories: ${storiesCount}, Highlights: ${highlightsCount}`);
      }
    } else {
      console.log(`          Warning: success flag was false!`);
    }
  } catch (err) {
    const latency = Date.now() - start;
    console.log(`[FAILED] ${name} failed after ${latency}ms`);
    if (err.response) {
      console.log(`         Status: ${err.response.status}`);
      console.log(`         Error Data:`, err.response.data);
    } else {
      console.log(`         Error Message: ${err.message}`);
    }
  }
  console.log("-".repeat(60));
}

async function runAllTests() {
  console.log("=".repeat(60));
  console.log(`STARTING AWS LIGHTSAIL VPS ENDPOINT COMPREHENSIVE AUDIT ON: ${LIVE_HOST}`);
  console.log("=".repeat(60));

  // 1. Test Spotlight Downloader API
  await testEndpoint("Spotlight Downloader", "/api/download", {
    url: TEST_SPOTLIGHT
  });

  // 2. Test Snapchat Story Viewer API
  await testEndpoint("Snapchat Story Viewer", "/api/story-viewer", {
    username: TEST_USER_1
  });

  // 3. Test Snapchat Story Downloader API
  await testEndpoint("Snapchat Story Downloader", "/api/story-downloader", {
    username: TEST_USER_1
  });

  // 4. Test Snapchat DP Downloader API
  await testEndpoint("DP Downloader", "/api/dp", {
    username: TEST_USER_2
  });

  // 4.5. Test Snapchat Profile Viewer API
  await testEndpoint("Profile Viewer & Stats", "/api/profile-viewer", {
    username: TEST_USER_2
  });

  // 5. Test Snapchat Bulk Video Downloader API
  await testEndpoint("Bulk Video Downloader", "/api/bulk-videos", {
    username: TEST_USER_2
  });

  console.log("=".repeat(60));
  console.log("AWS LIGHTSAIL VPS ENDPOINT COMPREHENSIVE AUDIT COMPLETE!");
  console.log("=".repeat(60));
}

runAllTests();
