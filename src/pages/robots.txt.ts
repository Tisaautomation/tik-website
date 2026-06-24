import type { APIRoute } from 'astro';

// Dynamic robots.txt: permissive only on the real production build (apex domain
// or TIK_INDEXABLE=1). GH Pages staging stays fully disallowed so it never indexes.
const indexable =
  process.env.TIK_INDEXABLE === '1' ||
  (process.env.TIK_SITE ?? '').includes('tourinkohsamui.com');

const body = indexable
  ? 'User-agent: *\nAllow: /\n\nSitemap: https://tourinkohsamui.com/sitemap.xml\n'
  : 'User-agent: *\nDisallow: /\n';

export const GET: APIRoute = () =>
  new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
