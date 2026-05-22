import axios from 'axios';

async function test() {
  const url = "http://localhost:3000/api/download";
  const body = {
    url: "https://www.snapchat.com/spotlight/W7_EDlXWTBiXAEEniNoMPwAAYb21tdmFid213AZ2cWQCIAZ2cWQBrAAAAAw"
  };

  try {
    console.log("Sending POST request to /api/download...");
    const start = Date.now();
    const res = await axios.post(url, body, { timeout: 8000 });
    const end = Date.now();
    
    console.log(`\n=== API SUCCESS IN ${end - start}ms ===`);
    console.log("Status:", res.status);
    console.log("Response Body:", JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error("API Request Failed:", err.message);
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", err.response.data);
    }
  }
}

test();
