/**
 * Evidence collection for the dissertation:
 *  - API response-time samples (authenticated + public endpoints)
 *  - Moderation engine test-case outputs (run against the real service)
 *  - Bundle-size report from dist/
 * Writes CSV/JSON into ../evidence/
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const API = 'http://localhost:5005';
const OUT = path.join(__dirname, '..', 'evidence');
fs.mkdirSync(OUT, { recursive: true });

async function login() {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'austin@kblog.com', password: 'Password@8' }),
  });
  return (await res.json()).token;
}

async function time(url, token, n = 5) {
  const times = [];
  for (let i = 0; i < n; i++) {
    const t0 = performance.now();
    const res = await fetch(`${API}${url}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    await res.json().catch(() => {});
    times.push(Math.round(performance.now() - t0));
    if (res.status >= 400) return { url, status: res.status, times, error: true };
  }
  return { url, status: 200, times, avg: Math.round(times.reduce((a, b) => a + b) / times.length), min: Math.min(...times), max: Math.max(...times) };
}

(async () => {
  const token = await login();

  const endpoints = [
    ['/api/submissions', false],
    ['/api/submissions/feed?tab=for-you&page=1&limit=20', true],
    ['/api/submissions/feed?tab=following&page=1&limit=20', true],
    ['/api/submissions/search/explore', false],
    ['/api/submissions/popular/tags', false],
    ['/api/categories', false],
    ['/api/users/authors', false],
    ['/api/submissions/moderation/audit', true],
  ];

  const results = [];
  for (const [url, auth] of endpoints) {
    const r = await time(url, auth ? token : null);
    results.push({ endpoint: url, auth, ...r });
    console.log(`${r.avg ?? 'ERR'}ms  ${r.status}  ${url}`);
  }
  fs.writeFileSync(path.join(OUT, 'api-timings.json'), JSON.stringify(results, null, 2));
  fs.writeFileSync(path.join(OUT, 'api-timings.csv'),
    'endpoint,auth,status,min_ms,avg_ms,max_ms\n' +
    results.map(r => `${r.endpoint},${r.auth},${r.status},${r.min ?? ''},${r.avg ?? ''},${r.max ?? ''}`).join('\n'));

  // ---- Moderation engine test cases (run the REAL service) ----
  const cases = [
    ['TC-M01 clean technology article', 'An in-depth analysis of typography as the interface: editorial design fundamentals and layout systems for the modern web.'],
    ['TC-M02 mild profanity', 'This code is shit and the documentation is damn near useless honestly.'],
    ['TC-M03 severe explicit + sexual', 'This fucking site is full of porn and hardcore garbage, absolute filth.'],
    ['TC-M04 racist/hate content', 'All immigrants should be deported, they are inferior people ruining our country.'],
    ['TC-M05 leetspeak obfuscation', 'th1s 1s such bullsh1t y0u fuck1ng 1d10t'],
    ['TC-M06 borderline adult', 'The casino review covers blackjack strategies and where to find the best whiskey bars downtown.'],
  ];
  const mod = await import('../../server/services/moderationService.js');
  const fn = mod.analyzeSubmission;
  const modResults = [];
  for (const [name, text] of cases) {
    try {
      const r = fn({ title: 'Test case submission', content: text, abstract: text.slice(0, 200), tags: [] });
      modResults.push({ case: name, input: text, result: r });
      console.log(`${name}: grade=${r.grade ?? r.overallScore ?? JSON.stringify(r).slice(0, 80)}`);
    } catch (e) {
      modResults.push({ case: name, input: text, error: e.message });
      console.log(`${name}: ERROR ${e.message}`);
    }
  }
  fs.writeFileSync(path.join(OUT, 'moderation-tests.json'), JSON.stringify(modResults, null, 2));

  // ---- Bundle stats ----
  const distAssets = path.join(__dirname, '..', '..', 'dist', 'assets');
  if (fs.existsSync(distAssets)) {
    const files = fs.readdirSync(distAssets).map(f => {
      const s = fs.statSync(path.join(distAssets, f));
      return { file: f, bytes: s.size, kb: +(s.size / 1024).toFixed(1) };
    }).sort((a, b) => b.bytes - a.bytes);
    const total = files.reduce((a, f) => a + f.bytes, 0);
    fs.writeFileSync(path.join(OUT, 'bundle-stats.json'),
      JSON.stringify({ totalKB: +(total / 1024).toFixed(1), fileCount: files.length, files }, null, 2));
    console.log(`bundle: ${files.length} files, ${(total / 1024).toFixed(0)} KiB total`);
  }
  console.log('EVIDENCE DONE');
})().catch(e => { console.error(e); process.exit(1); });
