import axios from 'axios';

async function run() {
  try {
    console.log('Sending request to /api/bulk-videos for wwe...');
    const response = await axios.post('http://localhost:3000/api/bulk-videos', {
      username: 'wwe'
    });
    console.log('Response Status:', response.status);
    console.log('Keys of response:', Object.keys(response.data));
    console.log('DisplayName:', response.data.displayName);
    console.log('Total Videos returned:', response.data.stories?.length || response.data.videos?.length || 0);
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
