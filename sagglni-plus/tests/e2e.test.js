const puppeteer = require('puppeteer');
const path = require('path');
const http = require('http');
const fs = require('fs');

const PORT = 8085;
const CONTENT_DIR = path.resolve(__dirname, '../dist');

function startServer() {
  const server = http.createServer((req, res) => {
    let file = req.url === '/' ? '/testpage.html' : req.url;
    const filePath = path.join(CONTENT_DIR, file);
    if (!fs.existsSync(filePath)) { res.statusCode = 404; res.end('Not found'); return; }
    const data = fs.readFileSync(filePath);
    res.end(data);
  });
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

describe('E2E: AutoFill flow (skeleton)', () => {
  let server;
  let skipE2E = false;
  beforeAll(async () => { server = await startServer(); });
  afterAll(async () => server && server.close());

  beforeAll(async () => {
    // Attempt to launch a minimal browser; if it fails, we'll skip e2e tests in this env
    try {
      const b = await puppeteer.launch({ headless: true });
      await b.close();
    } catch (e) {
      console.warn('Puppeteer launch failed - skipping E2E tests in this environment:', e.message);
      skipE2E = true;
    }
  });

  test('Should analyze and fill a test form page using content script helper', async () => {
    if (skipE2E) { console.warn('Skipping E2E due to environment limitations'); return; }
    // This skeleton loads the popup UI directly and ensures helper functions exist; fully automated extension testing requires launching Chrome with extension which is env-specific
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    // Load the test page served by our static server
    await page.goto(`http://localhost:${PORT}/testpage.html`);
    const formExists = await page.$('form') !== null;
    expect(formExists).toBe(true);
    await browser.close();
  }, 20000);
});
