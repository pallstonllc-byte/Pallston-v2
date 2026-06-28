const fs = require('fs');
const path = require('path');
const { shell, read, OUT } = require('./build');
const { renderPerspectivesBatches, renderArticlePage, ARTICLES } = require('./render-articles');

function loadPage(file) {
  let content = fs.readFileSync(path.join(__dirname, 'pages', file), 'utf8');
  content = content.split('__PERSP_BATCHES__').join(renderPerspectivesBatches());
  return content;
}

const PAGES = [
  {
    key: 'home', file: 'home.html', out: 'index.html',
    title: 'Pallston | Confidence Begins with Clarity',
    description: 'Pallston partners with government and commercial organizations to navigate uncertainty, deliver mission-critical initiatives, and build stronger organizations through practical innovation and trusted judgment.',
    ogTitle: 'Pallston | Confidence Begins with Clarity',
    ogDescription: 'Modern advisory. Disciplined execution. Lasting transformation.',
    canonicalPath: '',
    arrival: true,
    bodyClass: 'page-home'
  },
  {
    key: 'capabilities', file: 'capabilities.html', out: 'capabilities.html',
    title: 'Capabilities | Pallston',
    description: 'Strategic Advisory, Program Delivery, and Modernization: expertise built around every stage of transformation.',
    ogTitle: 'Capabilities | Pallston',
    ogDescription: 'Expertise built around every stage of transformation.',
    canonicalPath: 'capabilities.html'
  },
  {
    key: 'industries', file: 'industries.html', out: 'industries.html',
    title: 'Industries | Pallston',
    description: 'Pallston supports organizations across government and commercial markets where mission success, operational resilience, and long-term performance are essential.',
    ogTitle: 'Industries | Pallston',
    ogDescription: 'Experience where outcomes matter most.',
    canonicalPath: 'industries.html'
  },
  {
    key: 'perspectives', file: 'perspectives.html', out: 'perspectives.html',
    title: 'Perspectives | Pallston',
    description: 'Practical insights and executive perspectives on leadership, modernization, artificial intelligence, acquisition, and operational excellence.',
    ogTitle: 'Perspectives | Pallston',
    ogDescription: 'Ideas that move organizations forward.',
    canonicalPath: 'perspectives.html'
  },
  {
    key: 'contact', file: 'contact.html', out: 'contact.html',
    title: "Let's Talk | Pallston",
    description: "Bring clarity to what matters next. Start a conversation with Pallston.",
    ogTitle: "Let's Talk | Pallston",
    ogDescription: 'Bring clarity to what matters next.',
    canonicalPath: 'contact.html'
  },
  {
    key: '404', file: '404.html', out: '404.html',
    title: 'Page not found | Pallston',
    description: "We couldn't resolve that page. Return to Pallston's homepage.",
    ogTitle: 'Page not found | Pallston',
    ogDescription: "We couldn't resolve that page.",
    canonicalPath: '404.html'
  }
];

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

// Remove stale generated article files before writing fresh ones, so a renamed
// or removed slug never leaves an orphaned page behind (this exact bug shipped once).
const currentArticleFiles = new Set(ARTICLES.map(a => `article-${a.slug}.html`));
fs.readdirSync(OUT).forEach(f => {
  if (f.startsWith('article-') && f.endsWith('.html') && !currentArticleFiles.has(f)) {
    fs.unlinkSync(path.join(OUT, f));
    console.log('Removed stale', f);
  }
});
if (fs.existsSync(path.join(OUT, 'article-template.html'))) {
  fs.unlinkSync(path.join(OUT, 'article-template.html'));
  console.log('Removed stale article-template.html');
}

PAGES.forEach(p => {
  const mainHtml = loadPage(p.file);
  const html = shell({
    title: p.title,
    description: p.description,
    ogTitle: p.ogTitle,
    ogDescription: p.ogDescription,
    canonicalPath: p.canonicalPath,
    arrival: p.arrival,
    bodyClass: p.bodyClass
  }, p.key, mainHtml);
  fs.writeFileSync(path.join(OUT, p.out), html, 'utf8');
  console.log('Wrote', p.out);
});

ARTICLES.forEach(article => {
  const mainHtml = renderArticlePage(article);
  const html = shell({
    title: `${article.title.replace(/\.$/, '')} | Pallston Perspectives`,
    description: article.excerpt,
    ogTitle: `${article.title.replace(/\.$/, '')} | Pallston`,
    ogDescription: article.excerpt,
    canonicalPath: `article-${article.slug}.html`
  }, 'article', mainHtml);
  fs.writeFileSync(path.join(OUT, `article-${article.slug}.html`), html, 'utf8');
  console.log('Wrote', `article-${article.slug}.html`);
});

// Sitemap, generated so it can never drift out of sync with the actual pages.
const SITE_URL = 'https://www.pallston.com';
const staticUrls = [
  { loc: '', changefreq: 'monthly', priority: '1.0' },
  { loc: 'index.html', changefreq: 'monthly', priority: '0.9' },
  { loc: 'capabilities.html', changefreq: 'monthly', priority: '0.9' },
  { loc: 'industries.html', changefreq: 'monthly', priority: '0.9' },
  { loc: 'perspectives.html', changefreq: 'weekly', priority: '0.7' },
  { loc: 'contact.html', changefreq: 'yearly', priority: '0.8' }
];
const articleUrls = ARTICLES.map(a => ({ loc: `article-${a.slug}.html`, changefreq: 'monthly', priority: '0.5' }));
const allUrls = [...staticUrls, ...articleUrls];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>${SITE_URL}/${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), sitemap, 'utf8');
console.log('Wrote sitemap.xml with', allUrls.length, 'urls');
