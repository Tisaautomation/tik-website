// Prebuild step: decide which catalog tours are LIVE and write the set of active
// handles to src/data/active-handles.json. The All Tours page renders only these,
// so a draft -> active flip in Shopify is reflected on the next build.
//
// Source of truth = the store's PUBLIC products.json (no auth, no secrets). A product
// only appears there once it is status=active AND published to the Online Store; drafts
// and unpublished products are absent. That is exactly "should this be shown publicly",
// so it is the correct signal AND it works in any CI sandbox (GitHub Actions has no
// vault creds). No Shopify Admin token needed.
//
// Fail-safe: on ANY error it keeps the last committed active-handles.json and exits 0,
// so a store/network hiccup can never empty the site or break the build.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';

const OUT = new URL('../src/data/active-handles.json', import.meta.url);
const CATALOG = new URL('../src/data/all-tours.json', import.meta.url);
const STORE = process.env.TIK_STORE_ORIGIN || 'https://tourinkohsamui.com';

function keep(reason) {
  console.warn(`[sync-status] ${reason} -> keeping existing active-handles.json`);
  if (!existsSync(OUT)) { try { mkdirSync(new URL('../src/data/', import.meta.url), { recursive: true }); } catch {} writeFileSync(OUT, '[]\n'); }
  process.exit(0);
}

try {
  // Handles we actually ship (the curated catalog).
  const catalog = JSON.parse(readFileSync(CATALOG, 'utf8'));
  const ours = new Set(catalog.map((t) => t.url.split('/').pop()));

  // Page through the public products.json and collect every published handle.
  const published = new Set();
  let page = 1;
  while (page < 20) {
    const r = await fetch(`${STORE.replace(/\/+$/, '')}/products.json?limit=250&page=${page}`, {
      headers: { 'User-Agent': 'tik-website-build', Accept: 'application/json' },
    });
    if (!r.ok) keep(`store HTTP ${r.status}`);
    const d = await r.json();
    const prods = d.products || [];
    if (!prods.length) break;
    for (const p of prods) published.add(p.handle);
    page++;
  }

  if (!published.size) keep('0 published products returned (suspicious)');

  const active = [...ours].filter((h) => published.has(h)).sort();
  if (!active.length) keep('0 catalog tours are published (suspicious)');

  writeFileSync(OUT, JSON.stringify(active, null, 0) + '\n');
  console.log(`[sync-status] ${active.length}/${ours.size} catalog tours live -> active-handles.json`);
} catch (e) {
  keep(`error: ${e.message}`);
}
