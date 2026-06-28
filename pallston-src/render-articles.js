const { ARTICLES, getArticle, getNext, getRelated } = require('./articles');

function renderCard(article) {
  return `      <article class="persp-card">
        <span class="persp-card__cat">${article.category}</span>
        <h3>${article.title}</h3>
        <p>${article.excerpt}</p>
        <p class="persp-card__soon"><a href="article-${article.slug}.html">Continue Reading</a></p>
      </article>`;
}

function renderPerspectivesBatches() {
  // All 18 cards rendered into one grid; JS shows 6 at a time and cycles
  // endlessly so the "Next" experience never dead-ends.
  return `    <div class="persp-grid" id="perspGrid">\n${ARTICLES.map(renderCard).join('\n')}\n    </div>`;
}

function renderArticlePage(article) {
  const related = getRelated(article);
  const relatedHtml = related.map(renderCard).join('\n');
  const next = getNext(article.slug);

  return `<article class="page-hero article-hero">
  <div class="container">
    <div class="page-hero__content article-hero__content">
      <a class="article-back" href="perspectives.html">&larr; Back to Perspectives</a>
      <span class="persp-card__cat" style="margin-top: var(--sp-5); display:block;">${article.category}</span>
      <h1>${article.title.replace(/\.$/, '')}<span class="dot">.</span></h1>
      <div class="article-meta">
        <span>${article.date}</span>
        <span aria-hidden="true">&middot;</span>
        <span>${article.readingTime}</span>
        <span aria-hidden="true">&middot;</span>
        <span>Pallston Advisory Team</span>
      </div>
    </div>
  </div>
</article>

<section class="section">
  <div class="container">
    <div class="article-body">
      ${article.body.map((p, i) => `<p${i === 0 ? ' class="lede"' : ''}>${p}</p>`).join('\n      ')}
    </div>

    <div class="article-related">
      <h2 class="article-related__title">Related perspectives</h2>
      <div class="persp-grid">
${relatedHtml}
      </div>
    </div>

    <div class="article-next">
      <span class="article-next__label">Next perspective</span>
      <a class="article-next__link" href="article-${next.slug}.html">${next.title.replace(/\.$/, '')} &rarr;</a>
    </div>
  </div>
</section>

<section class="section section--alt">
  <div class="container">
    <div class="callout">
      <h2>Bring clarity to what matters next<span class="dot">.</span></h2>
      <p>Have a question this perspective didn't answer? Start a conversation directly.</p>
      <div class="cta-row">
        <a class="btn btn--primary" href="contact.html">Let's Talk</a>
      </div>
    </div>
  </div>
</section>
`;
}

module.exports = { renderPerspectivesBatches, renderArticlePage, ARTICLES };
