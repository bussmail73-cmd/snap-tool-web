import axios from 'axios';

async function testApi() {
  const url = "https://www.snapchat.com/spotlight/W7_EDlXWTBiXAEEniNoMPwAAYd2NxbHJydHZmAZNOSWErAZNOSDxMAAAAAw";
  console.log("Fetching API for:", url);
  try {
    const res = await axios.post("http://localhost:3000/api/download", {
      url,
      toolId: "spotlight-downloader"
    });
    console.log("Status:", res.status);
    console.log("Response:", JSON.stringify(res.data, null, 2));
  } catch (err) {
    if (err.response) {
      console.log("Status:", err.response.status);
      console.log("Error:", JSON.stringify(err.response.data, null, 2));
    } else {
      console.error("Error:", err.message);
    }
  }
}

testApi();
