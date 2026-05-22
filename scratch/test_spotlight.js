import axios from 'axios';

async function run() {
  try {
    const url = 'https://www.snapchat.com/spotlight/W7_EDlXWTBiXAEEniNoMPwAAYd2NxbHJydHZmAZNOSWErAZNOSDxMAAAAAw';
    console.log('Sending request to /api/bulk-videos for spotlight URL:', url);
    const response = await axios.post('http://localhost:3000/api/bulk-videos', {
      username: url
    });
    console.log('Response Status:', response.status);
    console.log('Keys of response:', Object.keys(response.data));
    console.log('DisplayName:', response.data.displayName);
    console.log('Total Videos returned:', response.data.stories?.length || response.data.videos?.length || 0);
    const vList = response.data.stories || response.data.videos;
    if (vList && vList.length > 0) {
      console.log('First Video details:', JSON.stringify(vList[0], null, 2));
    }
  } catch (err) {
    if (err.response) {
      console.log('Error Status:', err.response.status);
      console.log('Error Data:', err.response.data);
    } else {
      console.error('Error Message:', err.message);
    }
  }
}

run();
