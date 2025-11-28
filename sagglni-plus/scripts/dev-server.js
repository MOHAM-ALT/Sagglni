// Minimal dev server placeholder - used as npm start

console.log('Dev server placeholder - this script should be replaced with your real dev server.');

// Optionally serve static folder for manual testing
const path = require('path');
const http = require('http');
const fs = require('fs');

const PORT = process.env.PORT || 3000;
const base = path.resolve(__dirname, '..');

http.createServer((req, res) => {
  let filePath = path.join(base, req.url === '/' ? 'README.md' : req.url);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end('Not found');
    }
    res.writeHead(200);
    res.end(data);
  });
}).listen(PORT, () => console.log(`Dev server running at http://localhost:${PORT}`));
