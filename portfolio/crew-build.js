/* Several decorative cursors assemble the real page as visitors move through it. */
(() => {
  'use strict';
  if (!document.body.classList.contains('portfolio-v2') || document.body.classList.contains('admin-v2')) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches || !('IntersectionObserver' in window) || !Element.prototype.animate) return;

  const stage = document.createElement('div');
  stage.className = 'site-crew';
  stage.setAttribute('aria-hidden', 'true');
  stage.innerHTML = `
    <div class="site-crew__cursor"><svg viewBox="0 0 28 32"><path d="M2 2v24l6.5-6 4.5 10 4-2-4.5-10H23z"/></svg><span>layout</span></div>
    <div class="site-crew__cursor"><svg viewBox="0 0 28 32"><path d="M2 2v24l6.5-6 4.5 10 4-2-4.5-10H23z"/></svg><span>type</span></div>
    <div class="site-crew__cursor"><svg viewBox="0 0 28 32"><path d="M2 2v24l6.5-6 4.5 10 4-2-4.5-10H23z"/></svg><span>media</span></div>
    <div class="site-crew__cursor"><svg viewBox="0 0 28 32"><path d="M2 2v24l6.5-6 4.5 10 4-2-4.5-10H23z"/></svg><span>ship</span></div>
    <div class="site-crew__selection"></div><div class="site-crew__ghost"></div>
    <div class="site-crew__menu"><small>QUICK INSERT</small><span>▧ Insert image</span><span>▣ Insert button</span></div>
    <div class="site-crew__flash"></div>`;
  document.body.append(stage);
  const cursors = [...stage.querySelectorAll('.site-crew__cursor')].slice(0, innerWidth <= 700 ? 2 : 4);
  const effectSelectors = ['.site-crew__selection', '.site-crew__ghost', '.site-crew__menu', '.site-crew__flash'];
  const effects = cursors.map((_, index) => {
    const nodes = effectSelectors.map(selector => {
      const node = stage.querySelector(selector);
      if (index === 0) return node;
      const copy = node.cloneNode(true);
      stage.append(copy);
      return copy;
    });
    return { selection: nodes[0], ghost: nodes[1], menu: nodes[2], flash: nodes[3] };
  });
  const positions = cursors.map((cursor, index) => {
    const p = { x: index % 2 ? innerWidth - 65 : 25, y: index < 2 ? 90 : innerHeight - 100 };
    cursor.style.transform = `translate3d(${p.x}px,${p.y}px,0)`;
    return p;
  });
  const workers = cursors.map(() => false);
  const queue = [];
  const known = new WeakSet();
  let stopped = false;

  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const point = element => {
    const r = element.getBoundingClientRect();
    return { x: clamp(r.left + Math.min(r.width * .52, 180), 12, innerWidth - 55),
      y: clamp(r.top + Math.min(r.height * .38, 85), 12, innerHeight - 48) };
  };
  const usable = element => {
    if (!element.isConnected) return false;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 10 && rect.height > 8;
  };
  const show = element => {
    element.classList.remove('crew-preview');
    element.classList.add('crew-built', 'visible', 'network-in');
  };
  const allBuilt = () => {
    stopped = true;
    queue.splice(0).forEach(show);
    document.querySelectorAll('.crew-piece:not(.crew-built)').forEach(show);
    stage.remove();
  };

  async function move(index, to, duration = 350) {
    if (stopped) return;
    const cursor = cursors[index];
    const from = positions[index];
    cursor.classList.add('is-active');
    const animation = cursor.animate([
      { transform: `translate3d(${from.x}px,${from.y}px,0) rotate(-8deg)` },
      { transform: `translate3d(${to.x}px,${to.y}px,0) rotate(0deg)` }
    ], { duration, easing: 'cubic-bezier(.25,.72,.25,1)', fill: 'forwards' });
    try { await animation.finished; } catch { return; }
    cursor.style.transform = `translate3d(${to.x}px,${to.y}px,0)`;
    animation.cancel();
    positions[index] = to;
  }
  async function press(index, at) {
    const { flash } = effects[index];
    cursors[index].classList.add('is-pressing');
    flash.style.left = `${at.x}px`;
    flash.style.top = `${at.y}px`;
    flash.classList.remove('is-on');
    void flash.offsetWidth;
    flash.classList.add('is-on');
    await pause(150);
    cursors[index].classList.remove('is-pressing');
  }
  async function selectText(index, element) {
    const { selection } = effects[index];
    const r = element.getBoundingClientRect();
    const y = clamp(r.top + Math.min(r.height / 2, 26), 15, innerHeight - 30);
    const left = clamp(r.left + 5, 12, innerWidth - 80);
    const width = Math.min(r.width - 10, innerWidth - left - 18, 440);
    if (width < 25) { show(element); return; }
    const start = { x: left, y };
    await move(index, start, 320);
    if (stopped) return;
    element.classList.add('crew-preview');
    selection.style.left = `${left}px`;
    selection.style.top = `${y - 16}px`;
    selection.style.width = `${width}px`;
    selection.style.height = '32px';
    void selection.offsetWidth;
    selection.classList.add('is-on');
    cursors[index].classList.add('is-pressing');
    await move(index, { x: left + width, y }, 410);
    cursors[index].classList.remove('is-pressing');
    if (stopped) return;
    show(element);
    await pause(100);
    selection.classList.remove('is-on');
  }
  async function dragDrop(index, element) {
    const { ghost } = effects[index];
    const to = point(element);
    const from = { x: clamp(to.x + (index % 2 ? 105 : -105), 16, innerWidth - 70),
      y: clamp(to.y - 95, 20, innerHeight - 80) };
    await move(index, from, 270);
    if (stopped) return;
    const image = element.matches('img') ? element : element.querySelector('img');
    ghost.replaceChildren();
    if (image) {
      const clone = document.createElement('img');
      clone.src = image.currentSrc || image.src;
      clone.alt = '';
      ghost.append(clone);
    }
    ghost.style.transform = `translate3d(${from.x + 10}px,${from.y + 10}px,0)`;
    ghost.classList.add('is-on');
    cursors[index].classList.add('is-pressing');
    const movingGhost = ghost.animate([
      { transform: `translate3d(${from.x + 10}px,${from.y + 10}px,0) scale(.75)` },
      { transform: `translate3d(${to.x + 10}px,${to.y + 10}px,0) scale(1)` }
    ], { duration: 440, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'forwards' });
    await move(index, to, 440);
    cursors[index].classList.remove('is-pressing');
    movingGhost.cancel();
    ghost.classList.remove('is-on');
    if (stopped) return;
    show(element);
    await press(index, to);
  }
  async function rightClickInsert(index, element, button) {
    const { menu } = effects[index];
    const to = point(element);
    await move(index, to, 330);
    if (stopped) return;
    cursors[index].querySelector('span').textContent = 'right click';
    await press(index, to);
    menu.style.left = `${clamp(to.x + 12, 8, innerWidth - 158)}px`;
    menu.style.top = `${clamp(to.y + 16, 8, innerHeight - 115)}px`;
    menu.classList.add('is-on');
    const rows = [...menu.querySelectorAll('span')];
    const row = rows[button ? 1 : 0];
    await pause(130);
    const r = row.getBoundingClientRect();
    await move(index, { x: r.left + 24, y: r.top + r.height / 2 }, 260);
    row.classList.add('is-picked');
    await press(index, { x: r.left + 24, y: r.top + r.height / 2 });
    row.classList.remove('is-picked');
    menu.classList.remove('is-on');
    cursors[index].querySelector('span').textContent = button ? 'button' : 'image';
    if (stopped) return;
    await move(index, to, 260);
    show(element);
    await press(index, to);
  }

  async function build(index, element) {
    if (stopped || element.classList.contains('crew-built') || !usable(element)) { show(element); return; }
    const r = element.getBoundingClientRect();
    if (r.bottom < -20 || r.top > innerHeight + 40) { show(element); return; }
    const isText = element.matches('h1,h2,.hero-name,.page-accent,.hero-eyebrow,.project-category-title');
    const isButton = element.matches('.hero-buttons,.home-all-link,.project-filters,.project-links,.btn-primary,.btn-outline');
    const isMedia = element.matches('.showcase,.hero-bg,.about-hero-img,.drawing-item,.argo-preview-figure,.slipform-hero') || element.querySelector('img,video');
    if (isText) await selectText(index, element);
    else if (isButton) await rightClickInsert(index, element, true);
    else if (isMedia && index % 2 === 0) await dragDrop(index, element);
    else if (isMedia) await rightClickInsert(index, element, false);
    else {
      const to = point(element);
      await move(index, to, 320);
      if (stopped) return;
      show(element);
      await press(index, to);
    }
  }

  function pump() {
    if (stopped || document.hidden) return;
    workers.forEach((busy, index) => {
      if (busy || !queue.length) return;
      const element = queue.shift();
      workers[index] = true;
      build(index, element).catch(() => show(element)).finally(() => {
        workers[index] = false;
        pump();
      });
    });
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      queue.push(entry.target);
      // A throttled browser must still make this element readable.
      setTimeout(() => { if (!entry.target.classList.contains('crew-built')) show(entry.target); }, 5000);
    });
    pump();
  }, { threshold: .06, rootMargin: '0px 0px -4% 0px' });

  const selector = [
    '.navbar .nav-logo', '.footer .container',
    '#hero .hero-bg', '#hero .hero-console', '#hero .hero-eyebrow', '#hero .hero-badge',
    '#hero .hero-name', '#hero .hero-title', '#hero .hero-summary', '#hero .hero-buttons', '#hero .hero-stats',
    '.page-hero .page-accent', '.page-hero h1', '.page-hero .container > p', '.page-hero .showcase',
    '.page-wrapper section h2', '.page-wrapper section > .container > p',
    '.page-wrapper .home-section-heading', '.page-wrapper .network-3d-copy',
    '.page-wrapper .home-work-card', '.page-wrapper .home-contact-strip',
    '.page-wrapper .project-disclaimer', '.page-wrapper .project-filters',
    '.page-wrapper .project-category-title', '.page-wrapper .project-card',
    '.page-wrapper .drawing-item', '.page-wrapper .achievement-card',
    '.page-wrapper .timeline-item', '.page-wrapper .about-hero-img',
    '.page-wrapper .about-hero-info', '.page-wrapper .about-card',
    '.page-wrapper .about-project-skill', '.page-wrapper .contact-link-item',
    '.page-wrapper .contact-form', '.page-wrapper .gb-form', '.page-wrapper .gb-entry',
    '.page-wrapper .slipform-tile', '.page-wrapper .argo-preview-figure',
    '.page-wrapper .yt-channel', '.page-wrapper .section-header',
    '.slipform-main .slipform-hero', '.slipform-main .slipform-notice',
    '.slipform-main .slipform-section > .slipform-kicker',
    '.slipform-main .slipform-section > h2', '.slipform-main .slipform-section > p',
    '.slipform-main .slipform-section > video', '.slipform-main .slipform-tile',
    '.slipform-main .yt-channel', '.slipform-main .yt-live',
    '.argo-preview-main .argo-preview-kicker', '.argo-preview-main h1',
    '.argo-preview-main .argo-preview-lead', '.argo-preview-main .argo-preview-notice',
    '.argo-preview-main .argo-preview-figure', '.argo-preview-main .argo-preview-actions',
    '.slide.active > .slide-bg', '.slide.active > h1', '.slide.active > h2',
    '.slide.active > p', '.slide.active > .grid-2', '.slide.active > ul'
  ].join(',');
  function collect(root = document) {
    root.querySelectorAll(selector).forEach(element => {
      if (known.has(element) || element.closest('.crew-piece')) return;
      known.add(element);
      if (!usable(element)) return;
      element.classList.add('crew-piece');
      observer.observe(element);
    });
  }
  collect();
  // Guestbook entries and other cards can be rendered after the initial HTML.
  let scanQueued = false;
  new MutationObserver(records => {
    if (scanQueued || !records.some(record => [...record.addedNodes].some(node => node.nodeType === 1))) return;
    scanQueued = true;
    requestAnimationFrame(() => { scanQueued = false; if (!stopped) collect(); });
  }).observe(document.querySelector('.page-wrapper, .slipform-main, .argo-preview-main, .slide-track') || document.body,
    { childList: true, subtree: true });
  const slides = document.querySelector('.slide-track');
  if (slides) new MutationObserver(() => collect(slides))
    .observe(slides, { attributes: true, subtree: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) pump(); });
  motion.addEventListener('change', event => { if (event.matches) allBuilt(); });
  window.addEventListener('pagehide', allBuilt, { once: true });
})();
