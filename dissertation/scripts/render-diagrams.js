/** Render all .mmd files in ../figures/mmd to SVG + PNG in ../figures */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');

const SRC = path.join(__dirname, '..', 'figures', 'mmd');
const OUT = path.join(__dirname, '..', 'figures');
const ROOT = __dirname; // serve node_modules

const MIME = { '.mjs': 'text/javascript', '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html' };

(async () => {
  const server = http.createServer((req, res) => {
    const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    fs.readFile(p, (e, d) => {
      if (e) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
      res.end(d);
    });
  }).listen(0);
  const port = server.address().port;

  const files = fs.readdirSync(SRC).filter(f => f.endsWith('.mmd'));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 2200, height: 1800 } });
  await page.goto(`http://localhost:${port}/render.html`).catch(() => {});
  await page.setContent(`<html><body></body><script type="module">
    import mermaid from '/node_modules/mermaid/dist/mermaid.esm.min.mjs';
    mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });
    window.mermaid = mermaid; window.ready = true;
  </script></html>`);
  await page.waitForFunction('window.ready === true', { timeout: 60000 });

  for (const f of files) {
    const def = fs.readFileSync(path.join(SRC, f), 'utf8');
    const name = f.replace(/\.mmd$/, '');
    try {
      const svg = await page.evaluate(async (d) => {
        const { svg } = await window.mermaid.render('g' + Math.random().toString(36).slice(2), d);
        return svg;
      }, def);
      fs.writeFileSync(path.join(OUT, `${name}.svg`), svg);
      await page.setContent(`<html><body style="margin:0;background:#fff">${svg}</body></html>`);
      await page.locator('svg').first().screenshot({ path: path.join(OUT, `${name}.png`) });
      console.log(`rendered ${name}`);
    } catch (e) {
      console.error(`FAILED ${name}: ${e.message.split('\n')[0]}`);
    }
  }
  await browser.close();
  server.close();
  console.log('DIAGRAMS DONE');
})();
