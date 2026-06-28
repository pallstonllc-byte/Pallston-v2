/* =========================================================
   PALLSTON — MAIN SCRIPT
   No frameworks. Small, deliberate behaviors only.
   ========================================================= */
(function () {
  'use strict';

  /* ---------------- Theme ---------------- */
  var root = document.documentElement;
  var THEME_KEY = 'pallston-theme';

  function getStoredTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }
  function storeTheme(value) {
    try { localStorage.setItem(THEME_KEY, value); } catch (e) { /* ignore */ }
  }
  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    var toggles = document.querySelectorAll('[data-theme-toggle]');
    toggles.forEach(function (t) {
      t.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      t.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    });
  }

  var initialTheme = getStoredTheme();
  if (!initialTheme) {
    initialTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  applyTheme(initialTheme);

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-theme-toggle]');
    if (!btn) return;
    var current = root.getAttribute('data-theme');
    var next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    storeTheme(next);
  });

  /* ---------------- Nav scroll behavior ---------------- */
  var header = document.querySelector('.site-header');
  if (header) {
    var lastY = window.scrollY;
    var ticking = false;

    function onScroll() {
      var y = window.scrollY;
      header.classList.toggle('is-scrolled', y > 8);

      if (y > lastY && y > 120) {
        header.classList.add('is-hidden');
      } else {
        header.classList.remove('is-hidden');
      }
      lastY = y;
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(onScroll);
        ticking = true;
      }
    }, { passive: true });
    onScroll();
  }

  /* ---------------- Mobile menu ---------------- */
  var menuToggle = document.querySelector('.menu-toggle');
  var mobileMenu = document.querySelector('.mobile-menu');
  var menuClose = document.querySelector('.mobile-menu__close');

  function openMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.add('is-open');
    document.body.classList.add('menu-is-open');
    menuToggle.setAttribute('aria-expanded', 'true');
    var firstLink = mobileMenu.querySelector('a');
    if (firstLink) firstLink.focus();
  }
  function closeMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('is-open');
    document.body.classList.remove('menu-is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    if (menuToggle) menuToggle.focus();
  }
  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', function () {
      var expanded = menuToggle.getAttribute('aria-expanded') === 'true';
      expanded ? closeMenu() : openMenu();
    });
    if (menuClose) menuClose.addEventListener('click', closeMenu);
    mobileMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) closeMenu();
    });
  }

  /* ---------------- Arrival overlay ---------------- */
  var overlay = document.getElementById('arrivalOverlay');
  var arrivalLink = document.querySelector('[data-arrival-link]');
  var reducedMotionArrival = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var arrivalListenersArmed = false;

  function armArrivalListeners() {
    if (arrivalListenersArmed) return;
    window.addEventListener('wheel', onArrivalScroll, { passive: true });
    window.addEventListener('touchmove', onArrivalScroll, { passive: true });
    window.addEventListener('keydown', onArrivalKey);
    arrivalListenersArmed = true;
  }
  function disarmArrivalListeners() {
    window.removeEventListener('wheel', onArrivalScroll);
    window.removeEventListener('touchmove', onArrivalScroll);
    window.removeEventListener('keydown', onArrivalKey);
    arrivalListenersArmed = false;
  }

  // Roll the overlay UP and out of view, revealing the page beneath.
  function dismissOverlay() {
    if (!overlay || overlay.classList.contains('is-leaving')) return;
    disarmArrivalListeners();
    overlay.classList.add('is-leaving');       // transform -> translateY(-100%)
    document.body.classList.remove('arrival-active');
    var delay = reducedMotionArrival ? 0 : 1100;
    window.setTimeout(function () {
      overlay.classList.add('is-dismissed');   // display:none once off-screen
      stopFluid();
    }, delay);
  }

  function onArrivalScroll() { dismissOverlay(); }
  function onArrivalKey(e) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'Escape') {
      dismissOverlay();
    }
  }

  // Bring the overlay back: start it ABOVE the viewport, then roll it DOWN into place.
  function showOverlay() {
    if (!overlay) return;
    if (!overlay.classList.contains('is-dismissed') && !overlay.classList.contains('is-leaving')) return; // already showing
    document.documentElement.classList.remove('skip-arrival');
    window.scrollTo(0, 0);

    var inner = overlay.querySelector('.arrival-overlay__inner');

    // 1. Snap instantly to the off-screen-top position with no transition.
    overlay.classList.add('no-anim');
    overlay.classList.remove('is-dismissed');
    overlay.classList.add('is-leaving');     // translateY(-100%)
    // restart the inner reveal animation from scratch
    if (inner) { inner.style.animation = 'none'; }
    document.body.classList.add('arrival-active');
    startFluid();

    // 2. Next frame: re-enable transition and drop it down.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        overlay.classList.remove('no-anim');
        if (inner) { inner.style.animation = ''; }   // re-trigger keyframes
        overlay.classList.remove('is-leaving');       // transform -> 0, animates DOWN
        armArrivalListeners();
      });
    });
  }

  if (overlay) {
    var params = new URLSearchParams(window.location.search);
    var forceArrival = params.has('arrival');
    var skipArrival = params.has('home');

    // A "Home" nav click lands here with ?home=1: skip the arrival entirely
    // and show the home content directly (no overlay, no animation).
    if (skipArrival) {
      overlay.classList.add('is-dismissed');
      document.body.classList.remove('arrival-active');
      if (window.history.replaceState) {
        window.history.replaceState({}, '', window.location.pathname);
      }
    } else {
      // Default the overlay to dark; honor an explicit saved light preference.
      var savedTheme = null;
      try { savedTheme = localStorage.getItem('pallston-theme'); } catch (e) {}
      if (savedTheme === 'light') overlay.classList.add('arrival-overlay--light');

      var exploreBtn = document.getElementById('exploreBtn');
      if (exploreBtn) exploreBtn.addEventListener('click', dismissOverlay);

      // Fresh load, including arriving from an interior page via ?arrival=1:
      // the overlay is already covering the viewport, so the visitor never sees
      // a flash of home content. The roll-down animation is reserved for the
      // same-page logo click (showOverlay), where home is already visible.
      document.body.classList.add('arrival-active');
      window.scrollTo(0, 0);
      armArrivalListeners();
      startFluid();
      if (forceArrival && window.history.replaceState) {
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }

  // Logo click: on the home page, re-show the overlay with a roll-down.
  // On every other page, let the link navigate to index.html?arrival=1.
  if (arrivalLink) {
    arrivalLink.addEventListener('click', function (e) {
      if (overlay) {
        e.preventDefault();
        showOverlay();
      }
      // else: no overlay on this page, link navigates to index.html?arrival=1
    });
  }

  /* ---------------- Arrival fluid teal motion (canvas) ---------------- */
  var fluidRAF = null;
  var fluidCanvas = document.getElementById('arrivalFluid');
  var fluidResizeBound = false;
  function startFluid() {
    if (!fluidCanvas || reducedMotionArrival) return;
    if (fluidRAF) return; // already running
    var ctx = fluidCanvas.getContext('2d');
    var w, h, dpr;
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = fluidCanvas.clientWidth; h = fluidCanvas.clientHeight;
      fluidCanvas.width = w * dpr; fluidCanvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    if (!fluidResizeBound) { window.addEventListener('resize', resize); fluidResizeBound = true; }

    // A few slow, organically drifting teal blobs, blended additively.
    var blobs = [
      { x: 0.30, y: 0.35, r: 0.42, hue: '20,200,175', sx: 0.00007, sy: 0.00005, px: 0, py: 1.7 },
      { x: 0.70, y: 0.30, r: 0.36, hue: '15,161,142', sx: 0.00009, sy: 0.00006, px: 2.1, py: 0.6 },
      { x: 0.55, y: 0.62, r: 0.50, hue: '31,209,184', sx: 0.00005, sy: 0.00008, px: 4.0, py: 3.2 }
    ];
    var start = performance.now();

    function draw(now) {
      var t = now - start;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      var isLight = overlay && overlay.classList.contains('arrival-overlay--light');
      var alpha = isLight ? 0.06 : 0.16;
      for (var i = 0; i < blobs.length; i++) {
        var b = blobs[i];
        var cx = (b.x + Math.sin(t * b.sx + b.px) * 0.08) * w;
        var cy = (b.y + Math.cos(t * b.sy + b.py) * 0.08) * h;
        var rad = b.r * Math.min(w, h) * (1 + Math.sin(t * 0.0001 + b.px) * 0.06);
        var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        g.addColorStop(0, 'rgba(' + b.hue + ',' + alpha + ')');
        g.addColorStop(1, 'rgba(' + b.hue + ',0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      fluidRAF = requestAnimationFrame(draw);
    }
    fluidRAF = requestAnimationFrame(draw);
  }
  function stopFluid() {
    if (fluidRAF) { cancelAnimationFrame(fluidRAF); fluidRAF = null; }
  }

  /* ---------------- Arrival overlay theme toggle ---------------- */
  var arrivalThemeBtn = document.getElementById('arrivalThemeToggle');
  if (arrivalThemeBtn && overlay) {
    var syncArrivalThemeIcon = function () {
      var isLight = overlay.classList.contains('arrival-overlay--light');
      var moon = arrivalThemeBtn.querySelector('.icon-moon');
      var sun = arrivalThemeBtn.querySelector('.icon-sun');
      if (moon) moon.style.display = isLight ? 'none' : 'block';
      if (sun) sun.style.display = isLight ? 'block' : 'none';
    };
    arrivalThemeBtn.addEventListener('click', function () {
      var goingLight = !overlay.classList.contains('arrival-overlay--light');
      overlay.classList.toggle('arrival-overlay--light', goingLight);
      var next = goingLight ? 'light' : 'dark';
      // Carry the choice through to the rest of the site
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('pallston-theme', next); } catch (e) {}
      document.querySelectorAll('[data-theme-toggle]').forEach(function (t) {
        t.setAttribute('aria-pressed', String(next === 'dark'));
      });
      syncArrivalThemeIcon();
    });
    syncArrivalThemeIcon();
  }

  /* ---------------- Perspectives: 6-per-page, fade, shuffle on loop ---------------- */
  var perspGrid = document.getElementById('perspGrid');
  var perspNext = document.getElementById('perspNext');
  if (perspGrid && perspNext) {
    var allCards = Array.prototype.slice.call(perspGrid.querySelectorAll('.persp-card'));
    var PER_PAGE = 6;
    var totalPages = Math.ceil(allCards.length / PER_PAGE);
    var page = 0;
    var prefersReducedPersp = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function showPage(p) {
      var start = p * PER_PAGE;
      allCards.forEach(function (card, i) {
        card.hidden = !(i >= start && i < start + PER_PAGE);
      });
    }

    // Fisher-Yates shuffle, then re-append cards in the new order.
    function shuffleCards() {
      for (var i = allCards.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = allCards[i]; allCards[i] = allCards[j]; allCards[j] = tmp;
      }
      allCards.forEach(function (card) { perspGrid.appendChild(card); });
    }

    showPage(0);

    perspNext.addEventListener('click', function () {
      var wrapping = (page + 1) >= totalPages;
      var nextPage = wrapping ? 0 : page + 1;

      function advance() {
        if (wrapping) shuffleCards();   // fresh order each full cycle
        page = nextPage;
        showPage(page);
      }

      if (prefersReducedPersp) {
        advance();
        return;
      }
      perspGrid.classList.add('is-fading');
      setTimeout(function () {
        advance();
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { perspGrid.classList.remove('is-fading'); });
        });
      }, 320);
    });
  }

  /* ---------------- Contact form (Netlify Forms, AJAX) ---------------- */
  var form = document.querySelector('[data-netlify-form]');
  if (form) {
    var successEl = document.querySelector('[data-form-success]');

    function encode(data) {
      return Object.keys(data).map(function (key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(data[key]);
      }).join('&');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var requiredFields = form.querySelectorAll('[required]');
      var valid = true;
      requiredFields.forEach(function (field) {
        var wrap = field.closest('.field');
        if (!field.value.trim()) {
          valid = false;
          if (wrap) wrap.classList.add('field--error');
        } else if (wrap) {
          wrap.classList.remove('field--error');
        }
      });
      if (!valid) return;

      var formData = new FormData(form);
      var payload = {};
      formData.forEach(function (value, key) { payload[key] = value; });

      var submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }

      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: encode(payload)
      }).then(function () {
        form.classList.add('is-hidden');
        if (successEl) successEl.classList.add('is-visible');
        if (successEl) successEl.setAttribute('tabindex', '-1');
        if (successEl) successEl.focus();
      }).catch(function () {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Send message'; }
        alert('Something went wrong sending your message. Please email contact@pallston.com directly.');
      });
    });

    form.querySelectorAll('[required]').forEach(function (field) {
      field.addEventListener('input', function () {
        var wrap = field.closest('.field');
        if (wrap && field.value.trim()) wrap.classList.remove('field--error');
      });
    });
  }
})();
