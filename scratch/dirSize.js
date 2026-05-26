const fs = require('fs');
const path = require('path');

function getDirStats(dirPath, stats = { total: 0, code: 0, node_modules: 0, git: 0, dist: 0 }) {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    try {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (file === 'node_modules') {
          stats.node_modules += getDirSize(fullPath);
        } else if (file === '.git') {
          stats.git += getDirSize(fullPath);
        } else if (file === 'dist') {
          stats.dist += getDirSize(fullPath);
        } else {
          getDirStats(fullPath, stats);
        }
      } else {
        const size = stat.size;
        stats.total += size;
        stats.code += size; // This will accumulate files outside node_modules, .git, dist
      }
    } catch (e) {}
  }
  return stats;
}

function getDirSize(dirPath) {
  let size = 0;
  try {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        size += getDirSize(fullPath);
      } else {
        size += stat.size;
      }
    }
  } catch (e) {}
  return size;
}

const stats = getDirStats(process.cwd());
// Adjust total to include the special directories
stats.total += stats.node_modules + stats.git + stats.dist;

console.log(JSON.stringify({
  total: (stats.total / (1024 * 1024)).toFixed(2) + ' MB',
  code: (stats.code / 1024).toFixed(2) + ' KB (' + (stats.code / (1024 * 1024)).toFixed(2) + ' MB)',
  node_modules: (stats.node_modules / (1024 * 1024)).toFixed(2) + ' MB',
  dist: (stats.dist / (1024 * 1024)).toFixed(2) + ' MB',
  git: (stats.git / (1024 * 1024)).toFixed(2) + ' MB'
}, null, 2));
