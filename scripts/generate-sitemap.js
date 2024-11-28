const fs = require('fs');
const path = require('path');

const baseUrl = 'https://your-domain.com';
const pages = [
  '',
  '/opportunities',
  '/history',
  '/backtest',
  '/settings'
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages
    .map(page => `
    <url>
      <loc>${baseUrl}${page}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>daily</changefreq>
      <priority>${page === '' ? '1.0' : '0.8'}</priority>
    </url>
  `)
    .join('')}
</urlset>`;

const publicPath = path.join(__dirname, '..', 'public');
fs.writeFileSync(path.join(publicPath, 'sitemap.xml'), sitemap);
console.log('Sitemap generated successfully!');
