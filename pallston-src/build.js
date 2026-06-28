// Pallston static site build script.
// Assembles shared header/footer/meta partials around each page's unique
// content and writes plain, dependency-free static HTML to /home/claude/pallston.
// Run with: node build.js

const fs = require('fs');
const path = require('path');

const SRC = __dirname;
const OUT = path.join(__dirname, '..', 'pallston');

function read(p) {
  return fs.readFileSync(path.join(SRC, p), 'utf8');
}

const logoNavy = read('../pallston/assets/logo-horizontal-navy.svg').replace('<svg ', '<svg class="logo-dark" ');
const logoWhite = read('../pallston/assets/logo-horizontal-white.svg').replace('<svg ', '<svg class="logo-light" ');

const SITE_URL = 'https://www.pallston.com';

const NAV_ITEMS = [
  { key: 'home', href: 'index.html?home=1', label: 'Home' },
  { key: 'capabilities', href: 'capabilities.html', label: 'Capabilities' },
  { key: 'industries', href: 'industries.html', label: 'Industries' },
  { key: 'perspectives', href: 'perspectives.html', label: 'Perspectives' }
];

function renderDesktopNav(activeKey) {
  return NAV_ITEMS.map(item => {
    const current = item.key === activeKey ? ' aria-current="page"' : '';
    const homeAttr = item.key === 'home' ? ' data-home-link' : '';
    return `<a href="${item.href}"${current}${homeAttr}>${item.label}</a>`;
  }).join('\n          ');
}

function renderMobileNav(activeKey) {
  const items = NAV_ITEMS.map(item => {
    const current = item.key === activeKey ? ' aria-current="page"' : '';
    const homeAttr = item.key === 'home' ? ' data-home-link' : '';
    return `<a href="${item.href}"${current}${homeAttr}>${item.label}</a>`;
  }).join('\n          ');
  const contactCurrent = activeKey === 'contact' ? ' aria-current="page"' : '';
  return items + `\n          <a href="contact.html"${contactCurrent}>Let's Talk</a>`;
}

function svgWrap(pathsTxt, viewBox, extraClass) {
  return `<svg viewBox="${viewBox}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" class="${extraClass || ''}">\n${pathsTxt}    </svg>`;
}

function header(activeKey) {
  const contactCurrent = activeKey === 'contact' ? ' aria-current="page"' : '';
  return `  <a class="skip-link" href="#main">Skip to main content</a>
  <header class="site-header">
    <div class="nav__bg"></div>
    <div class="container nav">
      <a class="brand" href="index.html?arrival=1" data-arrival-link aria-label="Pallston brand entrance">
        ${logoNavy.trim()}
        ${logoWhite.trim()}
      </a>
      <nav class="nav__links" aria-label="Primary">
          ${renderDesktopNav(activeKey)}
      </nav>
      <div class="nav__actions">
        <button class="theme-toggle" data-theme-toggle type="button" aria-pressed="false" aria-label="Switch to dark mode">
          <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/></svg>
          <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>
        </button>
        <a class="btn btn--primary nav__cta" href="contact.html"${contactCurrent}>Let's Talk</a>
        <button class="menu-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu">
          <svg class="icon-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
          <svg class="icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </div>
    </div>
  </header>

  <div class="mobile-menu" id="mobile-menu">
    <button class="mobile-menu__close" type="button" aria-label="Close menu">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 6l12 12M18 6L6 18"/></svg>
    </button>
    <nav class="mobile-menu__links" aria-label="Mobile">
          ${renderMobileNav(activeKey)}
    </nav>
  </div>
`;
}

function footer() {
  return `  <footer class="site-footer">
    <div class="container site-footer__top">
      <div class="site-footer__brand">
        <svg class="footer-mark" viewBox="-6 -6 152 208" height="38" aria-label="Pallston" role="img"><path d="M0,14 L77,14 A49,49 0 0 1 77,112 L56,112" fill="none" stroke="currentColor" stroke-width="28" stroke-linecap="butt" stroke-linejoin="miter"></path><rect x="0" y="56" width="28" height="84" fill="currentColor"></rect><rect x="0" y="168" width="28" height="28" fill="#0FA18E"></rect></svg>
      </div>
      <div class="site-footer__cols">
        <div class="site-footer__col">
          <h4>Navigate</h4>
          <a href="index.html?home=1">Home</a>
          <a href="capabilities.html">Capabilities</a>
          <a href="industries.html">Industries</a>
          <a href="perspectives.html">Perspectives</a>
          <a href="contact.html">Let's Talk</a>
        </div>
        <div class="site-footer__col">
          <h4>Connect</h4>
          <a href="mailto:contact@pallston.com">contact@pallston.com</a>
        </div>
      </div>
    </div>
    <div class="container site-footer__bottom">
      <div>
        <p class="site-footer__bottom-byline">Pallston. Headquartered in the United States. Serving nationwide.</p>
        <p>Copyright © 2026 Pallston LLC. All rights reserved.</p>
      </div>
    </div>
  </footer>
`;
}

function arrivalOverlay() {
  return `<div class="arrival-overlay" id="arrivalOverlay">
    <canvas class="arrival-fluid" id="arrivalFluid" aria-hidden="true"></canvas>
    <div class="arrival-grain" aria-hidden="true"></div>
    <button class="arrival-overlay__theme" id="arrivalThemeToggle" type="button" aria-label="Toggle dark mode">
      <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/></svg>
      <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true" style="display:none"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>
    </button>
    <div class="arrival-overlay__inner">
      <svg class="arrival-overlay__mark" viewBox="-6 -6 152 208" role="img" aria-label="Pallston">
        <path class="mk-stroke" d="M0,14 L77,14 A49,49 0 0 1 77,112 L56,112" stroke-width="28" stroke-linecap="butt" stroke-linejoin="miter"></path>
        <rect class="mk-ink" x="0" y="56" width="28" height="84"></rect>
        <rect class="mk-teal" x="0" y="168" width="28" height="28"></rect>
      </svg>
      <h1 class="arrival-overlay__headline">Confidence Begins with Clarity<span class="dot">.</span></h1>
      <p class="arrival-overlay__support">Helping organizations solve complex challenges through modern advisory, disciplined execution, and lasting transformation.</p>
      <button class="arrival-overlay__cta" id="exploreBtn" type="button">
        Explore
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6"/></svg>
      </button>
      <span class="arrival-overlay__scrollcue" aria-hidden="true"></span>
    </div>
  </div>
`;
}

function shell({ title, description, ogTitle, ogDescription, canonicalPath, bodyClass, arrival }, activeKey, mainHtml) {
  const ogUrl = `${SITE_URL}/${canonicalPath}`;
  const arrivalMarkup = arrival ? arrivalOverlay() : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${ogUrl}">

<meta property="og:type" content="website">
<meta property="og:title" content="${ogTitle}">
<meta property="og:description" content="${ogDescription}">
<meta property="og:url" content="${ogUrl}">
<meta property="og:image" content="${SITE_URL}/assets/og-image.png">
<meta property="og:site_name" content="Pallston">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${ogTitle}">
<meta name="twitter:description" content="${ogDescription}">
<meta name="twitter:image" content="${SITE_URL}/assets/og-image.png">

<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="alternate icon" href="/favicon.ico">
<link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#0A2342">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">

<link rel="stylesheet" href="css/tokens.css">
<link rel="stylesheet" href="css/main.css">

<script>
  (function(){
    try {
      var t = localStorage.getItem('pallston-theme');
      if (!t) {
        var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        var hour = new Date().getHours();
        var isNight = (hour >= 19 || hour < 7);
        t = (prefersDark || isNight) ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', t);
      // If arriving via a "Home" nav link, suppress the arrival overlay before paint.
      if (new URLSearchParams(location.search).has('home')) {
        document.documentElement.classList.add('skip-arrival');
      }
    } catch(e) {}
  })();
</script>
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ''}>
${arrivalMarkup}${header(activeKey)}
<main id="main">
${mainHtml}
</main>
${footer()}
<script src="js/main.js"></script>
</body>
</html>
`;
}

module.exports = { shell, svgWrap, read, SRC, OUT };
