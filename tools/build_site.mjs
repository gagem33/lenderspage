#!/usr/bin/env node
// LenderHub encrypted build.
//
// The dealer-only source (private/index.src.html + private/*.json) never goes to
// the public repo in plaintext. This script:
//   build  -> inlines routeone.css/js and both JSON files into one page, gzips it,
//             encrypts it (PBKDF2-SHA256 -> AES-256-GCM) and writes index.html,
//             a small password screen that decrypts in the browser (WebCrypto).
//             Also writes site-src.enc, an encrypted tar.gz of private/ so the
//             source can be restored from the repo with the password.
//   unpack -> restores private/ from site-src.enc.
//
// Password: env LENDERHUB_PASSWORD, or --password-file <path>.
// Usage: node tools/build_site.mjs build --password-file /path/PASSWORD.txt
//        node tools/build_site.mjs unpack --password-file /path/PASSWORD.txt
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PRIV = path.join(ROOT, 'private');
const ITER = 310000;

const args = process.argv.slice(2);
const cmd = args[0] || 'build';
const pf = args.indexOf('--password-file');
const password = (pf > -1 ? fs.readFileSync(args[pf + 1], 'utf8') : process.env.LENDERHUB_PASSWORD || '').trim();
if (!password) { console.error('No password: set LENDERHUB_PASSWORD or pass --password-file'); process.exit(1); }

function encrypt(buf) {
  const salt = crypto.randomBytes(16), iv = crypto.randomBytes(12);
  const key = crypto.pbkdf2Sync(password, salt, ITER, 32, 'sha256');
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([c.update(buf), c.final(), c.getAuthTag()]); // WebCrypto layout: ciphertext||tag
  return { salt, iv, ct };
}
function decrypt({ salt, iv, ct }) {
  const key = crypto.pbkdf2Sync(password, salt, ITER, 32, 'sha256');
  const d = crypto.createDecipheriv('aes-256-gcm', key, iv);
  d.setAuthTag(ct.subarray(ct.length - 16));
  return Buffer.concat([d.update(ct.subarray(0, ct.length - 16)), d.final()]);
}

if (cmd === 'unpack') {
  const j = JSON.parse(fs.readFileSync(path.join(ROOT, 'site-src.enc'), 'utf8'));
  const tgz = decrypt({ salt: Buffer.from(j.salt, 'base64'), iv: Buffer.from(j.iv, 'base64'), ct: Buffer.from(j.ct, 'base64') });
  fs.mkdirSync(PRIV, { recursive: true });
  execFileSync('tar', ['-xzf', '-', '-C', ROOT], { input: tgz });
  console.log('restored private/');
  process.exit(0);
}

// ---- build the single plaintext page
const read = (p) => fs.readFileSync(p, 'utf8');
let html = read(path.join(PRIV, 'index.src.html'));
const css = read(path.join(ROOT, 'routeone.css'));
const js = read(path.join(ROOT, 'routeone.js'));
const data = {
  'lenders.json': JSON.parse(read(path.join(PRIV, 'lenders.json'))),
  'lenders-routeone.json': JSON.parse(read(path.join(PRIV, 'lenders-routeone.json'))),
};
const safe = (s) => s.replace(/<\/(script)/gi, '<\\/$1');
const dataJs = JSON.stringify(data).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
const shim = `<script>
/* Data is embedded in the encrypted page; nothing is fetched from the server. */
(function () {
  var D = ${dataJs};
  var f = window.fetch ? window.fetch.bind(window) : null;
  window.fetch = function (u, o) {
    var k = String(u && u.url || u).split('?')[0].split('#')[0].split('/').pop();
    if (Object.prototype.hasOwnProperty.call(D, k)) {
      return Promise.resolve(new Response(JSON.stringify(D[k]), { status: 200, headers: { 'content-type': 'application/json' } }));
    }
    return f ? f(u, o) : Promise.reject(new Error('fetch unavailable'));
  };
})();
</script>`;
const must = (s, re) => { if (!re.test(s)) throw new Error('build: pattern not found ' + re); };
must(html, /<link rel="stylesheet" href="routeone\.css">/);
must(html, /<script src="routeone\.js" defer><\/script>/);
must(html, /<head>/);
html = html.replace('<link rel="stylesheet" href="routeone.css">', () => `<style>\n${css}\n</style>`);
html = html.replace('<script src="routeone.js" defer></script>', () => `<script>\n${safe(js)}\n</script>`);
html = html.replace('<head>', () => `<head>\n${shim}`);

const page = encrypt(zlib.gzipSync(Buffer.from(html, 'utf8'), { level: 9 }));
const payload = JSON.stringify({ v: 1, iter: ITER, salt: page.salt.toString('base64'), iv: page.iv.toString('base64'), ct: page.ct.toString('base64') });
const tpl = read(path.join(ROOT, 'tools', 'gate.template.html'));
must(tpl, /__LH_PAYLOAD__/);
fs.writeFileSync(path.join(ROOT, 'index.html'), tpl.replace('__LH_PAYLOAD__', () => payload));

// ---- encrypted backup of the private source
const tgz = execFileSync('tar', ['-czf', '-', '-C', ROOT, 'private']);
const b = encrypt(tgz);
fs.writeFileSync(path.join(ROOT, 'site-src.enc'), JSON.stringify({ v: 1, iter: ITER, salt: b.salt.toString('base64'), iv: b.iv.toString('base64'), ct: b.ct.toString('base64') }));
console.log('index.html', fs.statSync(path.join(ROOT, 'index.html')).size, 'bytes; site-src.enc', fs.statSync(path.join(ROOT, 'site-src.enc')).size, 'bytes');
