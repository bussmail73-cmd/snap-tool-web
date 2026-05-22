import fs from 'fs';

const content = fs.readFileSync('server.ts', 'utf8');
const lines = content.split('\n');

const keywords = ['/api/download', 'yt-dlp', '/api/dp', '/api/stories', '/api/bulk-videos', 'downloadVideo', 'scrapeProfile'];

keywords.forEach(keyword => {
  console.log(`=== Matches for "${keyword}": ===`);
  lines.forEach((line, index) => {
    if (line.includes(keyword)) {
      console.log(`Line ${index + 1}: ${line.trim()}`);
    }
  });
});
