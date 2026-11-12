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
    <div class="site-crew__menu"><small>QUICK INSERT</small><span>▧ Insert image</span><span>▣ Insert button</span><span>✎ Insert text</span></div>
    <div class="site-crew__flash"></div><div class="site-crew__guide"></div>
    <div class="site-crew__frame"><span class="site-crew__measure"></span></div>
    <div class="site-crew__caret"></div><div class="site-crew__line"></div>
    <div class="site-crew__ruler-x"></div><div class="site-crew__ruler-y"></div>`;
  document.body.append(stage);
  const cursors = [...stage.querySelectorAll('.site-crew__cursor')].slice(0, innerWidth <= 700 ? 2 : 4);
  const effectSelectors = ['.site-crew__selection', '.site-crew__ghost', '.site-crew__menu', '.site-crew__flash', '.site-crew__guide', '.site-crew__frame', '.site-crew__caret', '.site-crew__line', '.site-crew__ruler-x', '.site-crew__ruler-y'];
  const effects = cursors.map((_, index) => {
    const nodes = effectSelectors.map(selector => {
      const node = stage.querySelector(selector);
      if (index === 0) return node;
      const copy = node.cloneNode(true);
      stage.append(copy);
      return copy;
    });
    return { selection: nodes[0], ghost: nodes[1], menu: nodes[2], flash: nodes[3], guide: nodes[4], frame: nodes[5], caret: nodes[6], line: nodes[7], rulerX: nodes[8], rulerY: nodes[9] };
  });
  const positions = cursors.map((cursor, index) => {
    const p = { x: index % 2 ? innerWidth - 65 : 25, y: index < 2 ? 90 : innerHeight - 100 };
    cursor.style.transform = `translate3d(${p.x}px,${p.y}px,0)`;
    return p;
  });
  const park = index => {
    const p = { x: index % 2 ? innerWidth - 58 : 25,
      y: 84 + Math.floor(index / 2) * 92 };
    positions[index] = p;
    cursors[index].style.transform = `translate3d(${p.x}px,${p.y}px,0)`;
  };
  const workers = cursors.map(() => false);
  const activeTargets = cursors.map(() => null);
  const activeAnimations = cursors.map(() => new Set());
  const interrupted = cursors.map(() => false);
  const queue = [];
  const pending = new Set();
  const known = new WeakSet();
  const enqueued = new Set();
  let stopped = false;
  let idleTimer = 0;
  let textActions = 0;
  let scrolling = false;
  let scrollIdleTimer = 0;
  let introActive = true;
  let speedBoost = 1;
  let fastUntil = 0;
  let lastScrollY = scrollY;
  let lastScrollAt = performance.now();

  const pace = ms => Math.max(55, Math.round(ms / speedBoost));
  const pause = ms => new Promise(resolve => setTimeout(resolve, pace(ms)));
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const halted = index => stopped || interrupted[index];
  const track = (index, animation) => {
    activeAnimations[index].add(animation);
    animation.finished.catch(() => {}).finally(() => activeAnimations[index].delete(animation));
    return animation;
  };
  const hideEffects = index => {
    Object.values(effects[index]).forEach(effect => effect.classList.remove('is-on'));
    cursors[index].classList.remove('is-active', 'is-pressing', 'is-typing', 'is-crosshair', 'is-pen');
  };
  const interrupt = index => {
    interrupted[index] = true;
    activeAnimations[index].forEach(animation => animation.cancel());
    activeAnimations[index].clear();
    if (activeTargets[index]) activeTargets[index].classList.remove('crew-preview', 'crew-typing', 'crew-sweeping');
    hideEffects(index);
  };
  const point = element => {
    const visual = element.querySelector('.home-work-image,.project-thumb,img,video') || element;
    const r = visual.getBoundingClientRect();
    return { x: clamp(r.left + Math.min(r.width * .52, 180), 12, innerWidth - 55),
      y: clamp(r.top + Math.min(r.height * .38, 85), 12, innerHeight - 48) };
  };
  const usable = element => {
    if (!element.isConnected) return false;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 10 && rect.height > 8;
  };
  const inViewport = element => {
    const r = element.getBoundingClientRect();
    return r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  };
  const show = element => {
    pending.delete(element);
    enqueued.delete(element);
    element.classList.remove('crew-preview', 'crew-typing', 'crew-sweeping');
    element.classList.add('crew-built', 'visible', 'network-in');
  };
  const defer = element => {
    if (!element.isConnected || element.classList.contains('crew-built')) return;
    element.classList.remove('crew-preview', 'crew-typing', 'crew-sweeping');
    enqueued.delete(element);
    pending.add(element);
    observer.observe(element);
  };
  const allBuilt = () => {
    stopped = true;
    introActive = false;
    clearTimeout(idleTimer);
    clearTimeout(scrollIdleTimer);
    activeAnimations.forEach(animations => animations.forEach(animation => animation.cancel()));
    queue.splice(0).forEach(show);
    document.querySelectorAll('.crew-piece:not(.crew-built)').forEach(show);
    pending.clear();
    stage.remove();
  };

  async function move(index, to, duration = 350) {
    if (halted(index)) return;
    const cursor = cursors[index];
    const from = positions[index];
    cursor.classList.add('is-active');
    const dx = to.x - from.x, dy = to.y - from.y;
    const mid = { x: from.x + dx * .5 + (index % 2 ? 1 : -1) * Math.min(24, Math.abs(dx) * .12),
      y: from.y + dy * .5 - Math.min(34, Math.abs(dy) * .12 + 12) };
    const animation = track(index, cursor.animate([
      { transform: `translate3d(${from.x}px,${from.y}px,0) rotate(-8deg)` },
      { transform: `translate3d(${mid.x}px,${mid.y}px,0) rotate(4deg)`, offset: .5 },
      { transform: `translate3d(${to.x}px,${to.y}px,0) rotate(0deg)` }
    ], { duration: pace(duration), easing: 'cubic-bezier(.3,.65,.2,1)', fill: 'forwards' }));
    try { await animation.finished; } catch { return; }
    if (halted(index)) return;
    cursor.style.transform = `translate3d(${to.x}px,${to.y}px,0)`;
    animation.cancel();
    positions[index] = to;
  }
  async function moveStraight(index, to, duration) {
    if (halted(index)) return;
    const cursor = cursors[index];
    const from = positions[index];
    const animation = track(index, cursor.animate([
      { transform: `translate3d(${from.x}px,${from.y}px,0)` },
      { transform: `translate3d(${to.x}px,${to.y}px,0)` }
    ], { duration, easing: 'linear', fill: 'forwards' }));
    try { await animation.finished; } catch { return; }
    if (halted(index)) return;
    cursor.style.transform = `translate3d(${to.x}px,${to.y}px,0)`;
    animation.cancel();
    positions[index] = to;
  }
  async function press(index, at) {
    if (halted(index)) return;
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
  function guideFor(index, element) {
    const guide = effects[index].guide;
    const visual = element.querySelector('.home-work-image,.project-thumb,img,video') || element;
    const r = visual.getBoundingClientRect();
    guide.style.left = `${clamp(r.left, 4, innerWidth - 35)}px`;
    guide.style.top = `${clamp(r.top, 4, innerHeight - 35)}px`;
    guide.style.width = `${Math.min(r.width, innerWidth - 12)}px`;
    guide.style.height = `${Math.min(r.height, 190)}px`;
    guide.classList.add('is-on');
    return () => guide.classList.remove('is-on');
  }
  async function selectText(index, element) {
    const { selection } = effects[index];
    cursors[index].querySelector('span').textContent = 'select text';
    const r = element.getBoundingClientRect();
    const y = clamp(r.top + Math.min(r.height / 2, 26), 15, innerHeight - 30);
    const left = clamp(r.left + 5, 12, innerWidth - 80);
    const width = Math.min(r.width - 10, innerWidth - left - 18, 440);
    if (width < 25) { show(element); return; }
    const start = { x: left, y };
    await move(index, start, 320);
    if (halted(index)) return;
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
    if (halted(index)) return;
    show(element);
    await pause(100);
    selection.classList.remove('is-on');
  }
  async function typeText(index, element) {
    const { caret, rulerX, rulerY } = effects[index];
    const textNode = element.matches('h1,h2,p') ? element : element.querySelector('h1,h2,p') || element;
    const rect = textNode.getBoundingClientRect();
    const left = clamp(rect.left + 3, 12, innerWidth - 65);
    const width = Math.min(rect.width - 6, innerWidth - left - 16, 520);
    if (width < 22) { show(element); return; }
    const y = clamp(rect.top + Math.min(rect.height * .48, 32), 20, innerHeight - 35);
    const start = { x: left, y };
    const cursor = cursors[index];
    if (textActions++ % 3 === 0) {
      const { menu } = effects[index];
      await move(index, start, 300);
      if (halted(index)) return;
      cursor.querySelector('span').textContent = 'right click';
      await press(index, start);
      if (halted(index)) return;
      menu.style.left = `${clamp(left + 12, 6, innerWidth - 160)}px`;
      menu.style.top = `${clamp(y + 14, 6, innerHeight - 155)}px`;
      menu.classList.add('is-on');
      const row = menu.querySelectorAll('span')[2];
      await pause(120);
      if (halted(index)) return;
      const option = row.getBoundingClientRect();
      const choose = { x: option.left + 22, y: option.top + option.height / 2 };
      await move(index, choose, 220);
      if (halted(index)) return;
      row.classList.add('is-picked');
      await press(index, choose);
      if (halted(index)) return;
      row.classList.remove('is-picked');
      menu.classList.remove('is-on');
    }
    cursor.querySelector('span').textContent = 'typing text';
    await move(index, start, 240);
    if (halted(index)) return;
    element.classList.add('crew-typing');
    cursor.classList.add('is-typing');
    rulerX.style.top = `${Math.round(y + 26)}px`;
    rulerY.style.left = `${Math.round(left)}px`;
    rulerX.classList.add('is-on');
    rulerY.classList.add('is-on');
    caret.style.left = `${left}px`;
    caret.style.top = `${y - Math.min(rect.height * .45, 27)}px`;
    caret.style.height = `${Math.min(Math.max(rect.height * .75, 18), 54)}px`;
    caret.classList.add('is-on');
    const duration = pace(clamp(520 + width * .5, 590, 850));
    const steps = clamp(Math.round((textNode.textContent || '').length / 2), 12, 34);
    const reveal = track(index, textNode.animate([
      { clipPath: 'inset(0 100% 0 0)' },
      { clipPath: 'inset(0 0 0 0)' }
    ], { duration, easing: `steps(${steps}, end)`, fill: 'both' }));
    const caretMotion = track(index, caret.animate([
      { transform: 'translateX(0)' }, { transform: `translateX(${width}px)` }
    ], { duration, easing: `steps(${steps}, end)`, fill: 'both' }));
    const headingGrow = textNode.matches('h1,h2') ? track(index, textNode.animate([
      { transform: 'translateY(7px) scale(.9)' }, { transform: 'translateY(0) scale(1)' }
    ], { duration: Math.min(duration, 500), easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'both' })) : null;
    try { await Promise.all([moveStraight(index, { x: left + width, y }, duration), reveal.finished, caretMotion.finished, headingGrow?.finished]); } catch {}
    cursor.classList.remove('is-typing');
    if (halted(index)) return;
    show(element);
    reveal.cancel();
    caretMotion.cancel();
    headingGrow?.cancel();
    caret.classList.remove('is-on');
    rulerX.classList.remove('is-on');
    rulerY.classList.remove('is-on');
  }
  async function dragDrop(index, element) {
    const { ghost } = effects[index];
    cursors[index].querySelector('span').textContent = 'drag media';
    const hideGuide = guideFor(index, element);
    const to = point(element);
    const from = { x: clamp(to.x + (index % 2 ? 105 : -105), 16, innerWidth - 70),
      y: clamp(to.y - 95, 20, innerHeight - 80) };
    await move(index, from, 270);
    if (halted(index)) return;
    const image = element.matches('img') ? element : element.querySelector('img');
    ghost.replaceChildren();
    ghost.classList.remove('is-button');
    if (image) {
      const clone = document.createElement('img');
      clone.src = image.currentSrc || image.src;
      clone.alt = '';
      ghost.append(clone);
    }
    ghost.style.transform = `translate3d(${from.x + 10}px,${from.y + 10}px,0)`;
    ghost.classList.add('is-on');
    cursors[index].classList.add('is-pressing');
    const movingGhost = track(index, ghost.animate([
      { transform: `translate3d(${from.x + 10}px,${from.y + 10}px,0) scale(.75)` },
      { transform: `translate3d(${to.x + 10}px,${to.y + 10}px,0) scale(1)` }
    ], { duration: pace(440), easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'forwards' }));
    await move(index, to, 440);
    cursors[index].classList.remove('is-pressing');
    movingGhost.cancel();
    ghost.classList.remove('is-on');
    if (halted(index)) return;
    element.classList.add('crew-sweeping');
    const sweep = track(index, element.animate([
      { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }
    ], { duration: pace(390), easing: 'cubic-bezier(.12,.75,.2,1)', fill: 'both' }));
    try { await sweep.finished; } catch { return; }
    if (halted(index)) return;
    show(element);
    sweep.cancel();
    await press(index, to);
    hideGuide();
  }
  async function rightClickInsert(index, element, button) {
    const { menu, ghost } = effects[index];
    const hideGuide = guideFor(index, element);
    const to = point(element);
    await move(index, to, 330);
    if (halted(index)) return;
    cursors[index].querySelector('span').textContent = 'right click';
    await press(index, to);
    if (halted(index)) return;
    menu.style.left = `${clamp(to.x + 12, 8, innerWidth - 164)}px`;
    menu.style.top = `${clamp(to.y + 16, 8, innerHeight - 155)}px`;
    menu.classList.add('is-on');
    const rows = [...menu.querySelectorAll('span')];
    const row = rows[button ? 1 : 0];
    await pause(130);
    if (halted(index)) return;
    const r = row.getBoundingClientRect();
    await move(index, { x: r.left + 24, y: r.top + r.height / 2 }, 260);
    if (halted(index)) return;
    row.classList.add('is-picked');
    await press(index, { x: r.left + 24, y: r.top + r.height / 2 });
    if (halted(index)) return;
    row.classList.remove('is-picked');
    menu.classList.remove('is-on');
    if (halted(index)) return;
    ghost.replaceChildren();
    ghost.classList.toggle('is-button', button);
    if (button) ghost.textContent = '↗ BUTTON';
    else {
      const source = element.matches('img') ? element : element.querySelector('img');
      if (source) {
        const image = document.createElement('img');
        image.src = source.currentSrc || source.src;
        image.alt = '';
        ghost.append(image);
      }
    }
    const from = { x: r.left + 16, y: r.top + 4 };
    ghost.style.transform = `translate3d(${from.x}px,${from.y}px,0)`;
    ghost.classList.add('is-on');
    const insertion = track(index, ghost.animate([
      { transform: `translate3d(${from.x}px,${from.y}px,0) scale(.72)` },
      { transform: `translate3d(${to.x}px,${to.y}px,0) scale(1)` }
    ], { duration: 380, easing: 'cubic-bezier(.22,.7,.2,1)', fill: 'forwards' }));
    cursors[index].querySelector('span').textContent = button ? 'insert button' : 'insert image';
    await move(index, to, 380);
    insertion.cancel();
    ghost.classList.remove('is-on');
    if (halted(index)) return;
    show(element);
    await press(index, to);
    hideGuide();
  }

  async function drawBox(index, element) {
    const { frame, rulerX, rulerY } = effects[index];
    const r = element.getBoundingClientRect();
    const left = clamp(r.left, 9, innerWidth - 45);
    const top = clamp(r.top, 9, innerHeight - 45);
    const width = clamp(r.right - left, 26, innerWidth - left - 12);
    const height = clamp(r.bottom - top, 22, innerHeight - top - 12);
    const start = { x: left, y: top };
    const end = { x: left + width, y: top + height };
    const cursor = cursors[index];
    cursor.querySelector('span').textContent = 'draw box';
    cursor.classList.add('is-crosshair');
    await move(index, start, 270);
    if (halted(index)) return;
    rulerX.style.top = `${top}px`;
    rulerY.style.left = `${left}px`;
    rulerX.classList.add('is-on');
    rulerY.classList.add('is-on');
    frame.style.left = `${left}px`;
    frame.style.top = `${top}px`;
    frame.style.width = '0px';
    frame.style.height = '0px';
    const measure = frame.querySelector('.site-crew__measure');
    measure.textContent = '0 × 0';
    frame.classList.add('is-on');
    cursor.classList.add('is-pressing');
    const duration = pace(460);
    const drawing = track(index, frame.animate([
      { width: '0px', height: '0px', opacity: .4 },
      { width: `${width}px`, height: `${height}px`, opacity: 1 }
    ], { duration, easing: 'cubic-bezier(.25,.7,.2,1)', fill: 'both' }));
    let measuring = true;
    const started = performance.now();
    const updateMeasure = () => {
      if (!measuring) return;
      const progress = clamp((performance.now() - started) / duration, 0, 1);
      measure.textContent = `${Math.round(width * progress)} × ${Math.round(height * progress)}`;
      if (progress < 1) requestAnimationFrame(updateMeasure);
    };
    requestAnimationFrame(updateMeasure);
    try { await Promise.all([moveStraight(index, end, duration), drawing.finished]); } catch {}
    measuring = false;
    cursor.classList.remove('is-pressing', 'is-crosshair');
    drawing.cancel();
    if (halted(index)) return;
    show(element);
    await press(index, end);
    frame.classList.remove('is-on');
    rulerX.classList.remove('is-on');
    rulerY.classList.remove('is-on');
  }

  async function duplicateCard(index, element) {
    const selector = element.matches('.project-card') ? '.project-card.crew-built' :
      element.matches('.home-work-card') ? '.home-work-card.crew-built' :
        element.matches('.achievement-card') ? '.achievement-card.crew-built' : null;
    const original = selector && [...document.querySelectorAll(selector)].find(item => item !== element);
    if (!original) { await drawBox(index, element); return; }
    const { ghost, frame } = effects[index];
    const target = point(element);
    const from = { x: clamp(target.x - 105, 15, innerWidth - 70),
      y: clamp(target.y - 72, 18, innerHeight - 75) };
    const cursor = cursors[index];
    cursor.querySelector('span').textContent = '⌥ duplicate';
    await move(index, from, 260);
    if (halted(index)) return;
    ghost.replaceChildren();
    ghost.classList.remove('is-button');
    const source = original.querySelector('img');
    if (source) {
      const image = document.createElement('img');
      image.src = source.currentSrc || source.src;
      image.alt = '';
      ghost.append(image);
    }
    ghost.style.transform = `translate3d(${from.x}px,${from.y}px,0)`;
    ghost.classList.add('is-on');
    const r = element.getBoundingClientRect();
    frame.style.left = `${clamp(r.left, 8, innerWidth - 40)}px`;
    frame.style.top = `${clamp(r.top, 8, innerHeight - 40)}px`;
    frame.style.width = `${Math.min(r.width, innerWidth - 18)}px`;
    frame.style.height = `${Math.min(r.height, innerHeight - 18)}px`;
    frame.querySelector('.site-crew__measure').textContent = '⌥ COPY';
    frame.classList.add('is-on');
    cursor.classList.add('is-pressing');
    const duration = pace(470);
    const copying = track(index, ghost.animate([
      { transform: `translate3d(${from.x}px,${from.y}px,0) scale(.8)` },
      { transform: `translate3d(${target.x}px,${target.y}px,0) scale(1)` }
    ], { duration, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'both' }));
    try { await Promise.all([moveStraight(index, target, duration), copying.finished]); } catch {}
    cursor.classList.remove('is-pressing');
    copying.cancel();
    if (halted(index)) return;
    show(element);
    await press(index, target);
    ghost.classList.remove('is-on');
    frame.classList.remove('is-on');
  }

  async function drawLine(index, element) {
    const { line } = effects[index];
    const r = element.getBoundingClientRect();
    const left = clamp(r.left, 12, innerWidth - 55);
    const y = clamp(r.bottom - 2, 16, innerHeight - 26);
    const width = clamp(r.width, 28, innerWidth - left - 15);
    const cursor = cursors[index];
    cursor.querySelector('span').textContent = 'pen tool';
    cursor.classList.add('is-pen');
    await move(index, { x: left, y }, 240);
    if (halted(index)) return;
    line.style.left = `${left}px`;
    line.style.top = `${y}px`;
    line.classList.add('is-on');
    const duration = pace(400);
    const stroke = track(index, line.animate([
      { width: '0px' }, { width: `${width}px` }
    ], { duration, easing: 'ease-out', fill: 'both' }));
    try { await Promise.all([moveStraight(index, { x: left + width, y }, duration), stroke.finished]); } catch {}
    cursor.classList.remove('is-pen');
    stroke.cancel();
    if (halted(index)) return;
    show(element);
    line.classList.remove('is-on');
  }

  async function build(index, element) {
    if (stopped || element.classList.contains('crew-built')) return;
    if (!usable(element)) { defer(element); return; }
    const r = element.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) { defer(element); return; }
    const isTypedText = element.matches('h1,h2,.hero-name,.hero-title,.hero-summary,.page-hero .container > p,.argo-preview-lead,.slipform-hero > div > p,.slipform-section > p,.network-3d-copy,.home-section-heading,.home-contact-strip');
    const isSelectedText = element.matches('.hero-eyebrow,.project-category-title');
    const isLine = element.matches('hr,.page-accent');
    const isButton = element.matches('.hero-buttons,.home-all-link,.project-filters,.project-links,.btn-primary,.btn-outline');
    const isCard = element.matches('.home-work-card,.project-card,.achievement-card');
    const isMedia = element.matches('.showcase,.hero-bg,.about-hero-img,.drawing-item,.argo-preview-figure,.slipform-hero') || element.querySelector('img,video');
    if (isTypedText) await typeText(index, element);
    else if (isSelectedText) await selectText(index, element);
    else if (isLine) await drawLine(index, element);
    else if (isButton) await rightClickInsert(index, element, true);
    else if (isCard) await duplicateCard(index, element);
    else if (isMedia && index % 2 === 0) await dragDrop(index, element);
    else if (isMedia) await rightClickInsert(index, element, false);
    else await drawBox(index, element);
  }

  function pump() {
    if (stopped || document.hidden || scrolling || introActive) return;
    if (performance.now() > fastUntil) speedBoost = 1;
    clearTimeout(idleTimer);
    const agentCount = performance.now() < fastUntil ? cursors.length : innerWidth <= 700 ? 1 : 2;
    workers.forEach((busy, index) => {
      if (busy || index >= agentCount) return;
      let element;
      while (queue.length) {
        const next = queue.shift();
        if (next.isConnected && usable(next) && inViewport(next)) { element = next; break; }
        enqueued.delete(next);
        if (next.isConnected && !next.classList.contains('crew-built')) {
          pending.add(next);
          observer.observe(next);
        }
      }
      if (!element) return;
      workers[index] = true;
      activeTargets[index] = element;
      interrupted[index] = false;
      build(index, element).catch(() => { if (interrupted[index]) defer(element); else show(element); }).finally(() => {
        if (interrupted[index]) defer(element);
        activeTargets[index] = null;
        if (interrupted[index]) { hideEffects(index); park(index); }
        else {
          Object.values(effects[index]).forEach(effect => effect.classList.remove('is-on'));
          cursors[index].classList.remove('is-pressing', 'is-typing');
        }
        workers[index] = false;
        if (!scrolling) scanVisible();
        pump();
      });
    });
    if (!queue.length && workers.every(busy => !busy)) {
      idleTimer = setTimeout(() => cursors.forEach(cursor => cursor.classList.remove('is-active')), 520);
    }
  }
  function enqueue(element) {
    if (stopped || enqueued.has(element) || element.classList.contains('crew-built')) return;
    enqueued.add(element);
    pending.delete(element);
    observer.unobserve(element);
    queue.push(element);
    // A throttled browser must still make this element readable.
    setTimeout(() => { if (!element.classList.contains('crew-built') && inViewport(element)) show(element); }, 5000);
    pump();
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) enqueue(entry.target); });
  }, { threshold: .06, rootMargin: '0px 0px -4% 0px' });
  function scanVisible() {
    for (const element of pending) {
      if (!usable(element)) continue;
      const r = element.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight - 10 && r.right > 0 && r.left < innerWidth) enqueue(element);
    }
  }

  const selector = [
    '.navbar .nav-logo', '.footer .container',
    '#hero .hero-bg', '#hero .hero-console', '#hero .hero-eyebrow', '#hero .hero-badge',
    '#hero .hero-name', '#hero .hero-title', '#hero .hero-summary', '#hero .hero-buttons', '#hero .hero-stats',
    '.page-hero .page-accent', '.page-hero h1', '.page-hero .container > p', '.page-hero .showcase',
    '.page-wrapper hr', '.slipform-main hr',
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
    '.slipform-main .slipform-hero .slipform-kicker', '.slipform-main .slipform-hero h1',
    '.slipform-main .slipform-hero > div > p', '.slipform-main .slipform-hero > img',
    '.slipform-main .slipform-hero .slipform-pills', '.slipform-main .slipform-notice',
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
      pending.add(element);
      observer.observe(element);
    });
  }
  function startIntro() {
    const logo = document.querySelector('.navbar .nav-logo');
    const r = logo?.getBoundingClientRect();
    const x = clamp((r?.left || 50) + (r?.width || 60) / 2, 40, innerWidth - 40);
    const y = clamp((r?.top || 20) + (r?.height || 40) / 2, 35, innerHeight - 35);
    const animations = cursors.map((cursor, index) => {
      cursor.classList.add('is-active');
      cursor.querySelector('span').textContent = ['layout', 'type', 'media', 'details'][index];
      const angle = index * Math.PI * 2 / cursors.length;
      const middle = { x: x + Math.cos(angle) * 36, y: y + Math.sin(angle) * 28 };
      const end = { x: x + Math.cos(angle + .45) * 50, y: y + Math.sin(angle + .45) * 36 };
      const animation = track(index, cursor.animate([
        { transform: `translate3d(${positions[index].x}px,${positions[index].y}px,0) scale(.7)`, opacity: 0 },
        { transform: `translate3d(${middle.x}px,${middle.y}px,0) scale(1.1)`, opacity: 1, offset: .65 },
        { transform: `translate3d(${end.x}px,${end.y}px,0) scale(1)`, opacity: 1 }
      ], { duration: 620, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'forwards' }));
      return { animation, end, cursor, index };
    });
    Promise.allSettled(animations.map(item => item.animation.finished)).then(() => {
      if (!introActive) return;
      animations.forEach(({ animation, end, cursor, index }) => {
        cursor.style.transform = `translate3d(${end.x}px,${end.y}px,0)`;
        positions[index] = end;
        animation.cancel();
        cursor.classList.remove('is-active');
      });
      introActive = false;
      scanVisible();
      pump();
    });
  }
  collect();
  startIntro();
  scanVisible();
  let scanFrame = 0;
  const scheduleScan = () => {
    if (scanFrame || stopped) return;
    scanFrame = requestAnimationFrame(() => { scanFrame = 0; scanVisible(); });
  };
  window.addEventListener('scroll', () => {
    if (stopped) return;
    const now = performance.now();
    const velocity = Math.abs(scrollY - lastScrollY) * 1000 / Math.max(16, now - lastScrollAt);
    lastScrollY = scrollY;
    lastScrollAt = now;
    if (velocity > 850) {
      speedBoost = velocity > 1700 ? 2.1 : 1.55;
      fastUntil = now + 1900;
    }
    if (introActive) introActive = false;
    scrolling = true;
    clearTimeout(scrollIdleTimer);
    clearTimeout(idleTimer);
    workers.forEach((busy, index) => {
      if (busy) interrupt(index);
      else {
        activeAnimations[index].forEach(animation => animation.cancel());
        activeAnimations[index].clear();
        hideEffects(index);
      }
    });
    while (queue.length) {
      const element = queue.shift();
      enqueued.delete(element);
      if (element.isConnected && !element.classList.contains('crew-built')) {
        pending.add(element);
        observer.observe(element);
      }
    }
    scrollIdleTimer = setTimeout(() => {
      scrolling = false;
      workers.forEach((busy, index) => { if (!busy) park(index); });
      scanVisible();
      pump();
    }, 90);
  }, { passive: true });
  window.addEventListener('resize', scheduleScan, { passive: true });
  // Guestbook entries and other cards can be rendered after the initial HTML.
  let scanQueued = false;
  new MutationObserver(records => {
    if (scanQueued || !records.some(record => [...record.addedNodes].some(node => node.nodeType === 1))) return;
    scanQueued = true;
    requestAnimationFrame(() => { scanQueued = false; if (!stopped) { collect(); scanVisible(); } });
  }).observe(document.querySelector('.page-wrapper, .slipform-main, .argo-preview-main, .slide-track') || document.body,
    { childList: true, subtree: true });
  const slides = document.querySelector('.slide-track');
  if (slides) new MutationObserver(() => { collect(slides); scanVisible(); })
    .observe(slides, { attributes: true, subtree: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) pump(); });
  motion.addEventListener('change', event => { if (event.matches) allBuilt(); });
  window.addEventListener('pagehide', allBuilt, { once: true });
})();
