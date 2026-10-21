/* Portfolio network motion — one small canvas, shared across public pages. */
(() => {
  'use strict';
  if (!document.body.classList.contains('portfolio-v2')) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const root = document.documentElement;
  try {
    const savedTheme = localStorage.getItem('portfolio-theme');
    if (savedTheme === 'dark' || savedTheme === 'light') root.dataset.theme = savedTheme;
  } catch {}
  new MutationObserver(() => {
    try {
      if (root.dataset.theme === 'dark' || root.dataset.theme === 'light')
        localStorage.setItem('portfolio-theme', root.dataset.theme);
    } catch {}
  }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

  // Inner pages use their own hero artwork; a second network field obscures it.
  const innerPage = Boolean(document.querySelector('.page-hero'));
  if (innerPage) document.getElementById('particles')?.remove();

  // Keep the lightweight background only behind the home page.
  if (!reduced.matches && !innerPage) {
    let canvas = document.getElementById('particles');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'particles';
      canvas.setAttribute('aria-hidden', 'true');
      document.body.prepend(canvas);
    }
    const ctx = canvas.getContext('2d', { alpha: true });
    if (ctx) {
      const nodes = [];
      let width = 0, height = 0, dpr = 1, raf = 0, last = 0;
      let pointerX = 0, pointerY = 0;
      const count = window.innerWidth < 680 ? 22 : 48;
      for (let i = 0; i < count; i++) {
        const ring = i % 4;
        const angle = (i * 2.3999632297) + ring * 0.36;
        const radius = 0.25 + Math.sqrt((i + 1) / count) * 1.2;
        nodes.push({
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius * .78,
          z: ((i * 7) % 13) / 7 - .85,
          size: i % 9 === 0 ? 3.4 : 1.65,
          phase: i * .91
        });
      }
      const edges = [];
      nodes.forEach((node, index) => {
        const close = nodes.map((other, otherIndex) => {
          const dx = node.x - other.x, dy = node.y - other.y, dz = node.z - other.z;
          return { otherIndex, distance: dx * dx + dy * dy + dz * dz };
        }).filter(item => item.otherIndex !== index)
          .sort((a, b) => a.distance - b.distance).slice(0, 2);
        close.forEach(item => {
          if (item.otherIndex > index && item.distance < .95) edges.push([index, item.otherIndex]);
        });
      });
      function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      function render(time) {
        if (document.hidden || document.body.classList.contains('network-3d-active')) { raf = 0; return; }
        raf = requestAnimationFrame(render);
        if (time - last < 32) return;
        last = time;
        ctx.clearRect(0, 0, width, height);
        const t = time * .00012;
        const sine = Math.sin(t + pointerX * .24);
        const cosine = Math.cos(t + pointerX * .24);
        const sineY = Math.sin(t * .67 + pointerY * .16);
        const cosineY = Math.cos(t * .67 + pointerY * .16);
        const span = Math.min(width, height) * (width < 680 ? .40 : .63);
        const centerX = width * (width < 680 ? .50 : .57);
        const centerY = height * .48;
        const projected = nodes.map(node => {
          const x = node.x * cosine - node.z * sine;
          const z = node.x * sine + node.z * cosine;
          const y = node.y * cosineY - z * sineY;
          const depth = node.y * sineY + z * cosineY;
          const scale = 2.8 / (3.5 + depth);
          return { x: centerX + x * span * scale,
                   y: centerY + y * span * scale,
                   size: node.size * scale,
                   depth };
        });
        const light = root.dataset.theme === 'light';
        edges.forEach(([a, b], index) => {
          const from = projected[a], to = projected[b];
          const pulse = Math.sin(time * .0017 + index * .7) * .5 + .5;
          ctx.strokeStyle = light ? 'rgba(4,104,116,' + (.08 + pulse * .09) + ')'
                                  : 'rgba(86,240,206,' + (.08 + pulse * .12) + ')';
          ctx.lineWidth = index % 5 === 0 ? 1.25 : .8;
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.stroke();
          if (index % 3 === 0) {
            const travel = (time * .00028 + index * .137) % 1;
            ctx.fillStyle = light ? 'rgba(6,104,116,.48)' : 'rgba(136,255,233,.65)';
            ctx.beginPath();
            ctx.arc(from.x + (to.x - from.x) * travel,
                    from.y + (to.y - from.y) * travel, 1.35, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        projected.forEach((point, index) => {
          const glow = .55 + Math.sin(time * .0015 + nodes[index].phase) * .25;
          ctx.fillStyle = light ? 'rgba(4,104,116,' + glow + ')'
                                : 'rgba(116,255,225,' + glow + ')';
          if (index % 9 === 0) {
            const s = point.size * 2.2;
            ctx.strokeStyle = light ? 'rgba(4,104,116,.55)' : 'rgba(116,255,225,.58)';
            ctx.lineWidth = 1;
            ctx.strokeRect(point.x - s / 2, point.y - s / 2, s, s);
            ctx.fillRect(point.x - 1, point.y - 1, 2, 2);
          } else {
            ctx.beginPath();
            ctx.arc(point.x, point.y, Math.max(.9, point.size), 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }
      resize();
      window.addEventListener('resize', resize, { passive: true });
      if (finePointer.matches) {
        window.addEventListener('pointermove', event => {
          pointerX = (event.clientX / Math.max(width, 1) - .5) * 2;
          pointerY = (event.clientY / Math.max(height, 1) - .5) * 2;
        }, { passive: true });
      }
      raf = requestAnimationFrame(render);
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && !reduced.matches &&
            !document.body.classList.contains('network-3d-active') && !raf)
          raf = requestAnimationFrame(render);
      });
      document.addEventListener('network3dchange', () => {
        const active = document.body.classList.contains('network-3d-active');
        canvas.hidden = active;
        if (active && raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        } else if (!active && !document.hidden && !reduced.matches && !raf) {
          raf = requestAnimationFrame(render);
        }
      });
      reduced.addEventListener('change', event => {
        if (event.matches) {
          cancelAnimationFrame(raf);
          raf = 0;
          ctx.clearRect(0, 0, width, height);
          canvas.hidden = true;
        } else {
          canvas.hidden = false;
          if (!document.hidden && !raf) raf = requestAnimationFrame(render);
        }
      });
    }
  }

  // Reveal modules as they enter view, including gallery items loaded later.
  if (!reduced.matches && 'IntersectionObserver' in window) {
    const selector = '.home-work-card,.project-card,.about-card,.about-project-skill,.achievement-card,.timeline-item,.contact-link-item,.gb-entry,.drawing-item,.slipform-tile,.argo-preview-figure';
    const seen = new WeakSet();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('network-in');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: .08 });
    function observeNew(rootNode = document) {
      rootNode.querySelectorAll(selector).forEach((element, index) => {
        if (seen.has(element)) return;
        seen.add(element);
        element.style.setProperty('--enter-delay', (index % 5) * 65 + 'ms');
        element.classList.add('network-enter');
        observer.observe(element);
      });
    }
    observeNew();
    document.querySelectorAll('.drawings-grid,#gbList').forEach(container => {
      new MutationObserver(() => observeNew(container))
        .observe(container, { childList: true, subtree: true });
    });
  }

  if (!document.querySelector('.scroll-progress')) {
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.prepend(bar);
    const update = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      bar.style.transform = `scaleX(${Math.min(1, scrollY / max)})`;
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  // ---------- การเปลี่ยนหน้า: ม่านพอร์ทัล ----------
  // ม่านไล่สีกวาดเฉียงเข้ามาพร้อมชื่อหน้าปลายทาง แล้วกวาดออกที่หน้าใหม่
  // บอกชื่อหน้าปลายทางผ่าน sessionStorage เพราะหน้าใหม่ไม่รู้ว่าผู้ใช้กดมาจากลิงก์ไหน
  const VEIL_KEY = 'pt-veil-label';
  const LEAVE_MS = 540;
  let navigating = false;
  let navigateTimer = 0;
  let recoveryTimer = 0;

  function makeVeil(label, mode) {
    const veil = document.createElement('div');
    veil.className = 'pt-veil ' + mode;
    veil.setAttribute('aria-hidden', 'true');
    const text = document.createElement('div');
    text.className = 'pt-label';
    const kicker = document.createElement('small');
    kicker.textContent = 'JET KONKAMON';
    text.append(kicker, document.createTextNode(label || ''));
    veil.append(text);
    document.body.append(veil);
    return veil;
  }

  function labelFor(link, target) {
    const own = (link.dataset.ptLabel || link.textContent || '').replace(/[↗→↻]/g, '').replace(/\s+/g, ' ').trim();
    if (own && own.length <= 28) return own;
    const page = target.pathname.split('/').pop().replace(/\.html?$/, '') || 'index';
    return { index: 'หน้าแรก', about: 'เกี่ยวกับ', projects: 'โปรเจกต์', drawings: 'ภาพวาด',
      experience: 'ประสบการณ์', achievements: 'รางวัลและผลงาน', guestbook: 'สมุดเยี่ยม',
      contact: 'ติดต่อ' }[page] || 'Jet Konkamon';
  }

  // ขาเข้า: ถ้ามาจากการกดลิงก์ในเว็บ ให้ม่านกวาดออกเผยหน้าใหม่
  try {
    const arriving = sessionStorage.getItem(VEIL_KEY);
    if (arriving !== null && !reduced.matches) {
      sessionStorage.removeItem(VEIL_KEY);
      const veil = makeVeil(arriving, 'is-out');
      root.classList.remove('pt-arriving');   // ม่านจริงขึ้นแล้ว เก็บฉากปิดชั่วคราวทิ้ง
      veil.addEventListener('animationend', e => { if (e.target === veil) veil.remove(); });
      window.setTimeout(() => veil.remove(), 1400);   // กันม่านค้างถ้าแอนิเมชันไม่จบ
    }
  } catch {}

  const resetNavigation = () => {
    window.clearTimeout(navigateTimer);
    window.clearTimeout(recoveryTimer);
    navigating = false;
    document.body.classList.remove('page-is-leaving');
    document.querySelectorAll('.pt-veil.is-in').forEach(v => v.remove());
  };
  // กดย้อนกลับแล้วเบราว์เซอร์คืนหน้าจากแคช ต้องเก็บม่านทิ้ง ไม่งั้นจอมืดค้าง
  window.addEventListener('pageshow', resetNavigation);
  window.addEventListener('pagehide', resetNavigation);
  document.addEventListener('click', event => {
    if (reduced.matches || event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
        !(event.target instanceof Element)) return;
    const link = event.target.closest('a[href]');
    if (!link || link.hasAttribute('download') ||
        (link.target && link.target !== '_self') ||
        link.dataset.noTransition !== undefined) return;
    let target;
    try { target = new URL(link.href, window.location.href); } catch { return; }
    if (target.origin !== window.location.origin ||
        (target.pathname === window.location.pathname &&
         target.search === window.location.search) ||
        !/\.html?$|\/$/.test(target.pathname)) return;
    event.preventDefault();
    if (navigating) return;
    navigating = true;
    const label = labelFor(link, target);
    try { sessionStorage.setItem(VEIL_KEY, label); } catch {}
    document.body.classList.add('page-is-leaving');
    makeVeil(label, 'is-in');
    navigateTimer = window.setTimeout(() => window.location.assign(target.href), LEAVE_MS);
    // ถ้าเปลี่ยนหน้าไม่สำเร็จหรือเน็ตค้าง คืนหน้าเดิมให้ใช้ต่อได้
    recoveryTimer = window.setTimeout(() => {
      resetNavigation();
      try { sessionStorage.removeItem(VEIL_KEY); } catch {}
    }, 2600);
  });

  // ---------- โผล่ตอนเลื่อน: ไล่ทีละชิ้นในกลุ่มเดียวกัน ----------
  // ใส่ลำดับให้พี่น้องที่โผล่พร้อมกัน CSS จะหน่วงตามลำดับ ไม่ต้องใส่คลาส delay เองทุกชิ้น
  const staggerReveals = () => {
    const groups = new Map();
    document.querySelectorAll('.reveal').forEach(el => {
      if (el.style.getPropertyValue('--i') || /reveal-delay-/.test(el.className)) return;
      const parent = el.parentElement;
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent).push(el);
    });
    groups.forEach(list => {
      if (list.length < 2) return;
      list.forEach((el, i) => el.style.setProperty('--i', String(Math.min(i, 8))));
    });
  };
  staggerReveals();

  // ---------- การ์ด: แสงตามเมาส์ ----------
  if (finePointer.matches && !reduced.matches) {
    const CARDS = '.project-card, .home-work-card, .achievement-card, .slipform-tile, ' +
      '.timeline-item, .yt-channel, .about-info-card, .contact-link-item';
    const decorate = root => root.querySelectorAll(CARDS).forEach(card => {
      if (card.classList.contains('has-spot')) return;
      if (getComputedStyle(card).position === 'static') card.style.position = 'relative';
      const spot = document.createElement('span');
      spot.className = 'card-spot';
      spot.setAttribute('aria-hidden', 'true');
      card.append(spot);
      card.classList.add('has-spot');
    });
    decorate(document);
    // บางหน้าสร้างการ์ดทีหลังจากข้อมูลที่โหลดมา ต้องตามใส่ให้ด้วย
    // ตอบเฉพาะตอนมี element ใหม่เข้ามา และรวบเป็นรอบเดียวต่อเฟรม
    // ของเดิมไล่หาการ์ดทั้งหน้าทุกครั้งที่ข้อความพิมพ์ทีละตัวบนหน้าแรกเปลี่ยน ราวสิบกว่าครั้งต่อวินาที
    let pending = false;
    new MutationObserver(records => {
      if (pending || !records.some(r => [...r.addedNodes].some(n => n.nodeType === 1))) return;
      pending = true;
      requestAnimationFrame(() => { pending = false; decorate(document); });
    }).observe(document.body, { childList: true, subtree: true });

    let frame = 0, last = null;
    document.addEventListener('pointermove', e => {
      last = e;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const card = last.target instanceof Element && last.target.closest('.has-spot');
        if (!card) return;
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (last.clientX - r.left) + 'px');
        card.style.setProperty('--my', (last.clientY - r.top) + 'px');
      });
    }, { passive: true });
  }

  // ---------- หยุดของที่มองไม่เห็น ----------
  // หัวหน้าแรกมีวงแสง การ์ดพลิก และรูปลอยที่วิ่งตลอด เลื่อนลงไปแล้วก็ยังกินแรงอยู่
  if ('IntersectionObserver' in window) {
    const heavy = document.querySelectorAll('#hero, .network-3d-stage, .home-work, .page-hero');
    const io = new IntersectionObserver(entries => entries.forEach(e =>
      e.target.classList.toggle('is-offscreen', !e.isIntersecting)), { rootMargin: '120px 0px' });
    heavy.forEach(el => io.observe(el));
  }
})();
