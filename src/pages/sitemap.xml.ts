import type { APIRoute } from 'astro';

// Deterministic sitemap for the marketing pages served as Astro.
// Tour/cart/checkout live on Shopify and are sitemapped there, not here.
const SITE = (process.env.TIK_SITE ?? 'https://tourinkohsamui.com').replace(/\/+$/, '');
const paths = ['/', '/all-tours/', '/reviews/', '/faq/', '/privacy/', '/blog/'];

const body =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  paths.map((p) => `  <url><loc>${SITE}${p}</loc></url>`).join('\n') +
  '\n</urlset>\n';

export const prerender = true;
export const GET: APIRoute = () =>
  new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
