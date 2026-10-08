// Parse Express route files -> markdown API reference table for the dissertation
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '..', '..', 'server', 'routes');
const MOUNT = { 'auth.js': '/api/auth', 'users.js': '/api/users', 'submissions.js': '/api/submissions', 'categories.js': '/api/categories', 'comments.js': '/api/comments' };

const rows = [];
for (const [file, mount] of Object.entries(MOUNT)) {
  const src = fs.readFileSync(path.join(DIR, file), 'utf8');
  // join multi-line route definitions
  const re = /router\.(get|post|put|patch|delete)\s*\(\s*(['"`][^'"`]+['"`])([\s\S]*?)\);/g;
  let m;
  while ((m = re.exec(src))) {
    const [method, rawPath, tail] = [m[1], m[2], m[3]];
    const p = rawPath.slice(1, -1);
    const mw = [];
    if (/protect/.test(tail)) mw.push('auth');
    if (/optionalAuth/.test(tail)) mw.push('opt-auth');
    if (/isReviewer/.test(tail)) mw.push('reviewer+');
    if (/isAdmin|adminOnly/.test(tail)) mw.push('admin');
    if (/isAuthorOrAdmin/.test(tail)) mw.push('author/admin');
    if (/upload/.test(tail)) mw.push('upload');
    const hm = tail.match(/,\s*([a-zA-Z_$][\w$]*)\s*\)?\s*$/) || tail.match(/([a-zA-Z_$][\w$]*)\s*$/);
    let handler = hm ? hm[1] : 'inline';
    if (['id', 'identifier', 'null', 'req', 'res'].includes(handler)) handler = 'inline';
    rows.push({ mount, method: method.toUpperCase(), path: p, access: mw.join(', ') || 'public', handler });
  }
}
rows.sort((a, b) => (a.mount + a.path).localeCompare(b.mount + b.path));
let md = '# KBlog REST API Reference (auto-generated from server/routes)\n\n| Method | Endpoint | Access | Handler |\n|---|---|---|---|\n';
for (const r of rows) md += `| ${r.method} | ${r.mount}${r.path === '/' ? '' : r.path} | ${r.access} | \`${r.handler}\` |\n`;
fs.writeFileSync(path.join(__dirname, '..', 'tables', 'api-reference.md'), md);
console.log(`${rows.length} endpoints -> tables/api-reference.md`);
