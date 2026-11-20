// LenderHub password gate (Vercel Routing Middleware).
// Every path -- HTML, JSON data, docs, everything -- requires the password.
// The password lives only in the Vercel env var LENDERHUB_PASSWORD (optional second layer;
// the page content is already encrypted client-side, see tools/build_site.mjs).
// After a correct login a signed cookie keeps the browser (phone) logged in for 90 days.
// Changing LENDERHUB_PASSWORD (and redeploying) logs every device out.

export const config = {
  matcher: '/:path*',
};

const COOKIE = 'lh_auth';
const LOGIN_PATH = '/__lh_login';
const LOGOUT_PATH = '/__lh_logout';
const MAX_AGE = 60 * 60 * 24 * 90; // 90 days

const enc = new TextEncoder();

async function token(password) {
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(password), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode('lenderhub-session-v1'));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

function getCookie(request, name) {
  const header = request.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > -1 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}

function safeNext(value) {
  // Only allow same-site relative paths.
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return '/';
  return value;
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function gate(next, error, status = 401) {
  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>LenderHub - sign in</title>
<style>
  :root { color-scheme: light dark; }
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
         font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background:#0f1115; color:#e8e8e8; }
  form { width:min(340px, 88vw); padding:28px; border-radius:14px; background:#1a1d24; box-shadow:0 8px 30px rgba(0,0,0,.4); }
  h1 { margin:0 0 4px; font-size:22px; }
  p { margin:0 0 18px; color:#9aa0aa; font-size:14px; }
  input { width:100%; box-sizing:border-box; font-size:17px; padding:12px; border-radius:10px; border:1px solid #333a45; background:#0f1115; color:inherit; }
  button { width:100%; margin-top:12px; font-size:17px; padding:12px; border:0; border-radius:10px; background:#3b82f6; color:#fff; font-weight:600; }
  .err { color:#f87171; margin:10px 0 0; font-size:14px; }
</style></head>
<body>
<form method="POST" action="${LOGIN_PATH}">
  <h1>LenderHub</h1>
  <p>Dealer-only. Enter the password.</p>
  <input type="hidden" name="next" value="${esc(next)}">
  <input type="password" name="password" autocomplete="current-password" autofocus required aria-label="Password">
  <button type="submit">Sign in</button>
  ${error ? `<div class="err">${esc(error)}</div>` : ''}
</form>
</body></html>`;
  return new Response(html, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow',
    },
  });
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const password = process.env.LENDERHUB_PASSWORD;

  if (!password) {
    // No server password configured: let the request through. The page itself is
    // AES-encrypted (tools/build_site.mjs) and .vercelignore keeps every plaintext
    // source/data file out of the deployment, so nothing readable is exposed.
    // Set LENDERHUB_PASSWORD in Vercel to add this server-side gate on top.
    return new Response(null, { headers: { 'x-middleware-next': '1' } });
  }

  const expected = await token(password);

  if (url.pathname === LOGOUT_PATH) {
    return new Response(null, {
      status: 303,
      headers: {
        location: '/',
        'set-cookie': `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`,
        'cache-control': 'no-store',
      },
    });
  }

  if (url.pathname === LOGIN_PATH) {
    if (request.method !== 'POST') return gate('/', '');
    let form;
    try { form = await request.formData(); } catch { return gate('/', 'Try again.'); }
    const next = safeNext(form.get('next'));
    const given = String(form.get('password') || '').trim();
    if (!safeEqual(given, password)) return gate(next, 'Wrong password.');
    return new Response(null, {
      status: 303,
      headers: {
        location: next,
        'set-cookie': `${COOKIE}=${expected}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
        'cache-control': 'no-store',
      },
    });
  }

  if (safeEqual(getCookie(request, COOKIE) || '', expected)) {
    // Authenticated: continue to the static file (same as next() from @vercel/functions).
    return new Response(null, { headers: { 'x-middleware-next': '1' } });
  }

  return gate(url.pathname + url.search, '');
}
