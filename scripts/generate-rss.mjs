import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const blogDir = path.resolve(__dirname, '../src/content/blog');
const publicDir = path.resolve(__dirname, '../public');
const rssPath = path.join(publicDir, 'rss.xml');

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const frontmatter = {};
  const lines = match[1].split(/\r?\n/);
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      frontmatter[key] = value;
    }
  }
  return frontmatter;
}

function escapeXml(unsafe) {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const files = fs.readdirSync(blogDir).filter((file) => file.endsWith('.md') || file.endsWith('.mdx'));

const posts = files.map((file) => {
  const filePath = path.join(blogDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  const fm = parseFrontmatter(content);
  const slug = file.replace(/\.(md|mdx)$/, '');
  return {
    slug,
    title: fm.title || slug,
    description: fm.description || '',
    pubDate: fm.pubDate ? new Date(fm.pubDate) : new Date(),
  };
}).sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Ali Sağırvelioğulları | Senior DBA Blog</title>
    <link>https://alisvo.dev</link>
    <description>PostgreSQL, Oracle, MSSQL, Yüksek Erişilebilirlik ve Veritabanı Performans Optimizasyonu Rehberleri.</description>
    <language>tr-tr</language>
    <atom:link href="https://alisvo.dev/rss.xml" rel="self" type="application/rss+xml"/>
    ${posts.map((post) => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>https://alisvo.dev/blog/${post.slug}/</link>
      <guid isPermaLink="true">https://alisvo.dev/blog/${post.slug}/</guid>
      <pubDate>${post.pubDate.toUTCString()}</pubDate>
      <description>${escapeXml(post.description)}</description>
    </item>`).join('')}
  </channel>
</rss>
`.trim();

fs.writeFileSync(rssPath, rssXml, 'utf-8');
console.log(`[RSS] Generated public/rss.xml with ${posts.length} posts.`);
