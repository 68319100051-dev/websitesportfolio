/* Portfolio network motion — one small canvas, shared across public pages. */
(() => {
  'use strict';
  if (!document.body.classList.contains('portfolio-v2')) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const root = document.documentElement;

  // A projected 3D node field gives the page a connected, code-driven backdrop.
  if (!reduced.matches) {
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
        if (document.hidden) { raf = 0; return; }
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
        if (!document.hidden && !reduced.matches && !raf) raf = requestAnimationFrame(render);
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

  // Card tilt uses CSS variables so transforms stay owned by the new theme.
  if (finePointer.matches && !reduced.matches) {
    const tiltSelector = '.home-work-card,.project-card,.about-project-skill,.about-card,.skill-badge,.achievement-card,.timeline-item,.contact-link-item,.gb-entry,.slipform-tile,.argo-preview-figure,.drawing-item';
    document.querySelectorAll(tiltSelector).forEach(card => {
      let scheduled = false;
      let clientX = 0, clientY = 0;
      card.addEventListener('pointermove', event => {
        clientX = event.clientX;
        clientY = event.clientY;
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
          scheduled = false;
          const rect = card.getBoundingClientRect();
          const x = (clientX - rect.left) / Math.max(rect.width, 1) - .5;
          const y = (clientY - rect.top) / Math.max(rect.height, 1) - .5;
          card.style.setProperty('--tilt-x', (-y * 5).toFixed(2) + 'deg');
          card.style.setProperty('--tilt-y', (x * 5).toFixed(2) + 'deg');
        });
      }, { passive: true });
      card.addEventListener('pointerleave', () => {
        card.style.removeProperty('--tilt-x');
        card.style.removeProperty('--tilt-y');
      }, { passive: true });
    });
  }

  // Intercept only ordinary links between public pages on the same origin.
  const overlay = document.createElement('div');
  overlay.className = 'page-transition';
  overlay.setAttribute('aria-hidden', 'true');
  document.body.appendChild(overlay);
  let navigating = false;
  window.addEventListener('pageshow', () => {
    navigating = false;
    overlay.classList.remove('active');
  });
  document.addEventListener('click', event => {
    if (reduced.matches || event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
        !(event.target instanceof Element)) return;
    const link = event.target.closest('a[href]');
    if (!link || link.hasAttribute('download') || link.target && link.target !== '_self' ||
        link.dataset.noTransition !== undefined) return;
    let target;
    try { target = new URL(link.href, window.location.href); } catch { return; }
    if (target.origin !== window.location.origin ||
        target.pathname === window.location.pathname &&
        target.search === window.location.search &&
        target.hash) return;
    if (!/\.html?$|\/$/.test(target.pathname)) return;
    if (navigating) { event.preventDefault(); return; }
    navigating = true;
    event.preventDefault();
    overlay.classList.add('active');
    window.setTimeout(() => { window.location.assign(target.href); }, 420);
  });
})();