// Minimal build placeholder
console.log('Build placeholder - integrate webpack or your bundler here.');

// For now, just copy files to dist
const fs = require('fs');
const path = require('path');

const base = path.resolve(__dirname, '..');
const dist = path.join(base, 'dist');

if (!fs.existsSync(dist)) fs.mkdirSync(dist);

// Copy minimal files - this is a naive copy and for demonstration only
['manifest.json', 'README.md'].forEach(file => {
  const src = path.join(base, file);
  const dst = path.join(dist, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst);
  }
});
console.log('Copied files to dist');
