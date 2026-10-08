/**
 * Screenshot capture for the KBlog dissertation.
 * Captures real application states against the running dev stack
 * (frontend http://localhost:5173, backend http://localhost:5005).
 * Auth is injected via the real login API -> localStorage['user'].
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:5173';
const API = 'http://localhost:5005';
const OUT = path.join(__dirname, '..', 'screenshots');
const ACCOUNTS = [
  { email: 'austin@kblog.com', password: 'Password@8' },
  { email: 'sarah@kblog.com', password: 'Password@8' },
];

fs.mkdirSync(OUT, { recursive: true });

async function login(email, password) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`login failed for ${email}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function shot(page, name, opts = {}) {
  await page.waitForTimeout(opts.settle ?? 1500);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: opts.fullPage ?? false });
  console.log(`  captured ${name}.png  <- ${page.url()}`);
}

async function go(page, name, url, opts = {}) {
  await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle' }).catch(() => {});
  await shot(page, name, opts);
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });

  // ---------- PUBLIC (unauthenticated) ----------
  const pub = await ctx.newPage();
  console.log('PUBLIC:');
  await go(pub, '01-landing', '/', { fullPage: true });
  await go(pub, '02-about', '/about', { fullPage: true });
  await go(pub, '03-membership', '/membership');
  await go(pub, '04-contact', '/contact');
  await go(pub, '05-login', '/auth/login');
  // login validation error state (evidence for testing section)
  await pub.fill('#email', 'notanemail');
  await pub.fill('#password', 'x');
  await pub.click('button[type=submit]');
  await shot(pub, '07-login-validation-error', { settle: 800 });
  // failed login (server error) state
  await pub.fill('#email', 'austin@kblog.com');
  await pub.fill('#password', 'wrongpassword');
  await pub.click('button[type=submit]');
  await shot(pub, '08-login-failed-state', { settle: 2500 });
  await go(pub, '06-signup', '/auth/signup');
  // protected-route redirect evidence
  await go(pub, '09-protected-redirect', '/bookmarks', { settle: 2000 });

  // ---------- AUTHENTICATED ----------
  const user = await login(ACCOUNTS[0].email, ACCOUNTS[0].password);
  console.log(`logged in as ${user.username} (${user.role})`);

  const page = await ctx.newPage();
  await page.goto(BASE);
  await page.evaluate((u) => localStorage.setItem('user', JSON.stringify(u)), user);
  await page.reload({ waitUntil: 'networkidle' });

  console.log('AUTHENTICATED:');
  await go(page, '10-home-feed', '/', { settle: 3000, fullPage: true });
  await go(page, '11-social-feed', '/feed', { settle: 3000 });
  await go(page, '12-explore', '/explore', { settle: 3000 });
  await go(page, '13-bookmarks', '/bookmarks', { settle: 2000 });
  await go(page, '14-my-stories', '/me/stories', { settle: 2500 });
  await go(page, '15-write-editor', '/write', { settle: 2500 });
  await go(page, '16-profile', '/profile', { settle: 2500 });
  await go(page, '17-reviews', '/reviews', { settle: 2500 });
  await go(page, '18-authors-admin', '/authors', { settle: 2500 });
  await go(page, '19-author-profile', `/@${user.username}`, { settle: 2500, fullPage: true });

  // open an article from the feed if present
  await page.goto(`${BASE}/explore`, { waitUntil: 'networkidle' });
  const link = page.locator('a[href^="/blog/"]').first();
  if (await link.count()) {
    const href = await link.getAttribute('href');
    await go(page, '20-article-view', href, { settle: 3000, fullPage: true });
  } else {
    console.log('  (no article link found on /explore)');
  }

  // keyboard shortcuts modal (usually "?")
  await page.keyboard.press('?');
  await shot(page, '21-keyboard-shortcuts', { settle: 800 });
  await page.keyboard.press('Escape');

  // dark mode
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await shot(page, '22-home-dark-mode', { settle: 2500 });

  // ---------- MOBILE ----------
  const mob = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
  const mp = await mob.newPage();
  await mp.goto(BASE);
  await mp.evaluate((u) => localStorage.setItem('user', JSON.stringify(u)), user);
  await mp.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await shot(mp, '23-mobile-home', { settle: 2500 });
  await mp.goto(`${BASE}/explore`, { waitUntil: 'networkidle' });
  await shot(mp, '24-mobile-explore', { settle: 2500 });

  await browser.close();
  console.log('DONE');
})().catch((e) => { console.error(e); process.exit(1); });
