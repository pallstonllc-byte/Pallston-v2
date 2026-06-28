const fs = require('fs');
const path = require('path');

const raw1 = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'articles-1.json'), 'utf8'));
const raw2 = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'articles-2.json'), 'utf8'));
const allRaw = [...raw1, ...raw2];

// Interleave by category so each batch of 6 shown on the listing page has variety,
// matching the original one-of-each-category-per-page arrangement.
const byCategory = {};
allRaw.forEach(a => {
  if (!byCategory[a.category]) byCategory[a.category] = [];
  byCategory[a.category].push(a);
});
const categories = Object.keys(byCategory);
const ARTICLES = [];
for (let i = 0; i < 3; i++) {
  categories.forEach(cat => {
    if (byCategory[cat][i]) ARTICLES.push(byCategory[cat][i]);
  });
}

const BY_SLUG = {};
ARTICLES.forEach((a, i) => { BY_SLUG[a.slug] = { ...a, index: i }; });

function getArticle(slug) { return BY_SLUG[slug]; }
function getNext(slug) {
  const a = BY_SLUG[slug];
  if (!a) return ARTICLES[0];
  return ARTICLES[(a.index + 1) % ARTICLES.length];
}
function getRelated(article) {
  return article.related.map(s => BY_SLUG[s]).filter(Boolean);
}

module.exports = { ARTICLES, getArticle, getNext, getRelated };
