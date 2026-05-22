import fs from 'fs';
import path from 'path';

const keywords = ['rapid', 'rapidapi', 'rapid-api'];

function searchInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lowercase = content.toLowerCase();
    for (const kw of keywords) {
      if (lowercase.includes(kw)) {
        console.log(`Found "${kw}" in file: ${filePath}`);
        // print matching lines
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.toLowerCase().includes(kw)) {
            console.log(`  Line ${idx + 1}: ${line.trim()}`);
          }
        });
      }
    }
  } catch (err) {
    // skip binary/unreadable files
  }
}

function traverse(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === '.system_generated' || file === 'scratch') continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      traverse(fullPath);
    } else {
      searchInFile(fullPath);
    }
  }
}

console.log("Searching for rapidapi...");
traverse('.');
console.log("Search finished.");
