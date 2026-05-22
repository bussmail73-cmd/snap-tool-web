import axios from 'axios';

async function test(usernameOrUrl) {
  console.log(`\n--- Testing Bulk Videos with input: "${usernameOrUrl}" ---`);
  try {
    const res = await axios.post("http://localhost:3000/api/bulk-videos", {
      username: usernameOrUrl
    });
    console.log("Status:", res.status);
    console.log("Response fields:", Object.keys(res.data));
    console.log("Username:", res.data.username);
    console.log("DisplayName:", res.data.displayName);
    console.log("Uploader:", res.data.uploader);
    console.log("Stories Count:", res.data.stories ? res.data.stories.length : 0);
    if (res.data.stories && res.data.stories.length > 0) {
      console.log("First Story fields:", Object.keys(res.data.stories[0]));
      console.log("First Story:", JSON.stringify(res.data.stories[0], null, 2));
    }
  } catch (err) {
    if (err.response) {
      console.log("Status:", err.response.status);
      console.log("Error:", JSON.stringify(err.response.data, null, 2));
    } else {
      console.error("Error:", err.message);
    }
  }
}

async function runTests() {
  // Test a simple username
  await test("wwe");
  
  // Test a spotlight URL
  await test("https://www.snapchat.com/spotlight/W7_EDlXWTBiXAEEniNoMPwAAYd2NxbHJydHZmAZNOSWErAZNOSDxMAAAAAw");
  
  // Test a profile URL
  await test("https://www.snapchat.com/add/wwe");
}

runTests();
