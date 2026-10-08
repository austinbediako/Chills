/** Recapture authenticated screenshots using sarah (student),
 *  reviewer (audits) and admin (authors console) — never Austin. */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const BASE = 'http://localhost:5173';
const API = 'http://localhost:5005';
const OUT = path.join(__dirname, '..', 'screenshots');

async function login(email) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Password@8' }),
  });
  if (!res.ok) throw new Error(`login ${email}: ${res.status}`);
  return res.json();
}
async function authPage(ctx, user) {
  const p = await ctx.newPage();
  await p.goto(BASE);
  await p.evaluate(u => localStorage.setItem('user', JSON.stringify(u)), user);
  return p;
}
async function go(page, name, url, opts = {}) {
  await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(opts.settle ?? 2000);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: opts.fullPage ?? false });
  console.log(`${name} <- ${page.url()}`);
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });

  const sarah = await login('sarah@kblog.com');
  console.log(`sarah: ${sarah.username} (${sarah.role})`);
  const p = await authPage(ctx, sarah);
  await p.reload({ waitUntil: 'networkidle' });

  await go(p, '10-home-feed', '/', { settle: 3000, fullPage: true });
  await go(p, '11-social-feed', '/feed', { settle: 3000 });
  await go(p, '12-explore', '/explore', { settle: 3000 });
  await go(p, '13-bookmarks', '/bookmarks');
  await go(p, '14-my-stories', '/me/stories');
  await go(p, '15-write-editor', '/write');
  await go(p, '16-profile', '/profile');
  await go(p, '19-author-profile', `/@${sarah.username}`, { fullPage: true });

  await p.goto(`${BASE}/explore`, { waitUntil: 'networkidle' });
  const link = p.locator('a[href^="/blog/"]').first();
  if (await link.count()) await go(p, '20-article-view', await link.getAttribute('href'), { settle: 3000, fullPage: true });
  await p.keyboard.press('?');
  await p.waitForTimeout(800);
  await p.screenshot({ path: path.join(OUT, '21-keyboard-shortcuts.png') });
  await p.keyboard.press('Escape');
  await p.evaluate(() => document.documentElement.classList.add('dark'));
  await p.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(2500);
  await p.screenshot({ path: path.join(OUT, '22-home-dark-mode.png') });
  console.log('dark done');

  // reviewer -> Machine Audits
  const reviewer = await login('reviewer@kblog.com');
  console.log(`reviewer: ${reviewer.username} (${reviewer.role})`);
  const rp = await authPage(ctx, reviewer);
  await go(rp, '17-reviews', '/reviews', { settle: 3000 });

  // admin -> authors console
  const admin = await login('admin@kblog.com');
  console.log(`admin: ${admin.username} (${admin.role})`);
  const ap = await authPage(ctx, admin);
  await go(ap, '18-authors-admin', '/authors', { settle: 3000 });

  // mobile as sarah
  const mob = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
  const mp = await authPage(mob, sarah);
  await go(mp, '23-mobile-home', '/', { settle: 3000 });
  await go(mp, '24-mobile-explore', '/explore', { settle: 3000 });

  await browser.close();
  console.log('DONE');
})().catch(e => { console.error(e); process.exit(1); });
