import axios from 'axios';

async function run() {
  // Wait a moment for server to warm up
  await new Promise(r => setTimeout(r, 2000));
  
  try {
    console.log('Sending request to /api/bulk-videos for maira_shoukat97...');
    const response = await axios.post('http://localhost:3000/api/bulk-videos', {
      username: 'maira_shoukat97'
    });
    console.log('Response Status:', response.status);
    console.log('Keys of response:', Object.keys(response.data));
    console.log('DisplayName:', response.data.displayName);
    console.log('Subscribers:', response.data.subscribers);
    console.log('Total Videos returned:', response.data.stories?.length || response.data.videos?.length || 0);
    console.log('Videos Sample:', (response.data.stories || response.data.videos)?.slice(0, 2));
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
