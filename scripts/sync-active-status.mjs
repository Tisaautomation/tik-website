// Prebuild step: fetch each tour's LIVE Shopify product status and write the set
// of ACTIVE handles to src/data/active-handles.json. The All Tours page renders
// only active tours, so a draft/active flip in Shopify is reflected on the next
// build (a Shopify products/update webhook -> Vercel deploy hook triggers it).
//
// Self-contained (no shared/ import, so it works in the Vercel build sandbox).
// Token is read from the vault via VAULT_URL + VAULT_SERVICE_KEY, never hardcoded.
// Fail-safe: on ANY error it keeps the last committed active-handles.json and
// exits 0, so a vault/Shopify outage can never empty the site or break the build.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';

const OUT = new URL('../src/data/active-handles.json', import.meta.url);
const CATALOG = new URL('../src/data/all-tours.json', import.meta.url);

function loadDotenv(p) {
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

function keep(reason) {
  console.warn(`[sync-status] ${reason} -> keeping existing active-handles.json`);
  if (!existsSync(OUT)) { try { mkdirSync(new URL('../src/data/', import.meta.url), { recursive: true }); } catch {} writeFileSync(OUT, '[]\n'); }
  process.exit(0);
}

try {
  loadDotenv(new URL('../.env.local', import.meta.url));
  const VAULT_URL = process.env.VAULT_URL;
  const KEY = process.env.VAULT_SERVICE_KEY;
  if (!VAULT_URL || !KEY) keep('VAULT_URL / VAULT_SERVICE_KEY not set');

  // 1) Pull Shopify creds from the vault.
  const vr = await fetch(`${VAULT_URL.replace(/\/+$/, '')}/rest/v1/rpc/get_all_secrets`, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', 'User-Agent': 'node/22' },
    body: '{}',
  });
  if (!vr.ok) keep(`vault HTTP ${vr.status}`);
  const secrets = await vr.json();
  const SHOP = secrets.SHOPIFY_SHOP, TOKEN = secrets.SHOPIFY_ADMIN_TOKEN;
  if (!SHOP || !TOKEN) keep('SHOPIFY_SHOP / SHOPIFY_ADMIN_TOKEN missing in vault');

  // 2) Restrict to the handles we actually ship (the curated catalog).
  const catalog = JSON.parse(readFileSync(CATALOG, 'utf8'));
  const ours = new Set(catalog.map((t) => t.url.split('/').pop()));

  // 3) Page through Shopify products, collect ACTIVE handles in our catalog.
  const active = [];
  let url = `https://${SHOP}/admin/api/2024-10/products.json?fields=handle,status&limit=250`;
  let pages = 0;
  while (url && pages < 20) {
    const r = await fetch(url, { headers: { 'X-Shopify-Access-Token': TOKEN } });
    if (!r.ok) keep(`Shopify HTTP ${r.status}`);
    const d = await r.json();
    for (const p of d.products || []) if (ours.has(p.handle) && p.status === 'active') active.push(p.handle);
    const link = r.headers.get('link');
    const m = link && link.match(/<([^>]+)>;\s*rel="next"/);
    url = m ? m[1] : null;
    pages++;
  }

  if (!active.length) keep('0 active handles returned (suspicious)');
  active.sort();
  writeFileSync(OUT, JSON.stringify(active, null, 0) + '\n');
  console.log(`[sync-status] ${active.length}/${ours.size} tours active -> active-handles.json`);
} catch (e) {
  keep(`error: ${e.message}`);
}
