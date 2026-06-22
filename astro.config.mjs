import { defineConfig } from 'astro/config';

// Standalone preview build. Zero coupling to the live Shopify store:
// every booking CTA links out to the existing tourinkohsamui.com product page,
// so the cart / n8n / Vercel pipeline is never touched.
export default defineConfig({
  site: 'https://tisaautomation.github.io',
  base: '/tik-website',
  build: { inlineStylesheets: 'auto' },
  compressHTML: true,
  // Allow the preview server to be reached via the Cloudflare quick-tunnel host.
  vite: { preview: { allowedHosts: ['.trycloudflare.com'], host: true } },
});
