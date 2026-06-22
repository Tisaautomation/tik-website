// One-off: turn the live FAQ section + Privacy page + blog articles into clean
// data files for the Astro pages. Converts em/en dashes (Will: no "—") and sanitizes.
import { readFileSync, writeFileSync } from 'node:fs';

// em/en dash -> comma (then tidy punctuation); keeps Will's "no em-dash" rule.
function dedash(s) {
  if (!s) return s;
  return s
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/,\s*([.,;:!?])/g, '$1')
    .replace(/\s+,/g, ',')
    .replace(/,\s*,/g, ', ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
const stripTags = (h) => dedash((h || '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim());

// ---------- FAQ ----------
const faqLiquid = readFileSync('C:/Users/guill/Desktop/Claude/projects/TIK-Master-Bookings/theme-live-152127832258/sections/faq-page.liquid', 'utf8');
const sections = [];
// split by section blocks
const secRe = /<div class="faq-section[^"]*"[^>]*>([\s\S]*?)(?=<div class="faq-section|<\/div>\s*<\/div>\s*<script)/g;
let sm;
while ((sm = secRe.exec(faqLiquid))) {
  const block = sm[1];
  const titleM = block.match(/faq-section-title[^>]*>([^<]+)</);
  if (!titleM) continue;
  const title = dedash(titleM[1].trim());
  const items = [];
  const itRe = /<summary class="faq-question">([\s\S]*?)<\/summary>\s*<div class="faq-answer">([\s\S]*?)<\/div>/g;
  let im;
  while ((im = itRe.exec(block))) {
    const q = stripTags(im[1]);
    // keep <strong> and <br> in answer html, drop everything else, convert dashes
    let aHtml = im[2]
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/?(strong|b)>/gi, (m) => (m[1] === '/' ? '</strong>' : '<strong>'))
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&');
    aHtml = dedash(aHtml).replace(/\n{3,}/g, '\n\n').trim();
    const aText = stripTags(im[2]);
    if (q && aText) items.push({ q, a: aHtml, aText });
  }
  if (items.length) sections.push({ title, items });
}
writeFileSync(new URL('../src/data/faq.json', import.meta.url), JSON.stringify(sections, null, 2));
console.log('FAQ sections:', sections.length, '| total Q:', sections.reduce((n, s) => n + s.items.length, 0));

// ---------- PRIVACY ----------
let priv = readFileSync('/tmp/privacy.html', 'utf8');
priv = priv
  .replace(/<style[\s\S]*?<\/style>/gi, '')
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/ (style|class|id|dir|data-[a-z-]+)="[^"]*"/gi, '')
  .replace(/<\/?(span|font|div)[^>]*>/gi, '')
  .replace(/&nbsp;/g, ' ')
  .replace(/<p>\s*<\/p>/gi, '')
  .replace(/\s{2,}/g, ' ');
priv = dedash(priv);
// wrap the "Quick Navigation" anchor links as a chip nav (bigger tap targets + on-brand)
priv = priv.replace(/(<h2>[^<]*Quick Navigation<\/h2>)\s*((?:<a\s+href="#[^"]+"[^>]*>[^<]*<\/a>\s*)+)/i,
  (_, h, links) => `${h}<nav class="prose-toc">${links.trim()}</nav>`);
writeFileSync(new URL('../src/data/privacy.json', import.meta.url), JSON.stringify({ html: priv.trim() }, null, 2));
console.log('Privacy html length:', priv.length);

// ---------- BLOG ----------
const articles = JSON.parse(readFileSync('/tmp/articles.json', 'utf8'))
  .filter((a) => a.published_at && a.img)
  .sort((a, b) => (a.published_at < b.published_at ? 1 : -1))
  .map((a) => ({
    title: dedash(a.title),
    url: `https://tourinkohsamui.com/blogs/${a.blog}/${a.handle}`,
    img: a.img.split('?')[0] + '?width=700',
    summary: dedash((a.summary || '').slice(0, 160)),
    date: a.published_at.slice(0, 10),
  }));
writeFileSync(new URL('../src/data/blog.json', import.meta.url), JSON.stringify(articles, null, 2));
console.log('Blog articles:', articles.length);
