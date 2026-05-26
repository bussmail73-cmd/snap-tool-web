import axios from "axios";

async function run() {
  const url = "https://www.snapchat.com/spotlight/W7_EDlXWTBiXAEEniNoMPwAAYd2NxbHJydHZmAZNOSWErAZNOSDxMAAAAAw";
  console.log("Sending request to /api/download for URL:", url);
  try {
    const response = await axios.post("http://localhost:3000/api/download", {
      url: url
    });
    console.log("Response Status:", response.status);
    console.log("Response Data keys:", Object.keys(response.data));
    console.log("Uploader:", response.data.uploader);
    console.log("DisplayName:", response.data.displayName);
    console.log("Video URL:", response.data.videoUrl ? "FOUND" : "NOT FOUND");
    console.log("Video URL snippet:", response.data.videoUrl ? response.data.videoUrl.substring(0, 50) + "..." : "");
  } catch (err) {
    if (err.response) {
      console.log("Error Status:", err.response.status);
      console.log("Error Data:", err.response.data);
    } else {
      console.error("Error Message:", err.message);
    }
  }
}

run();
