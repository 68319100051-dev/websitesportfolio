/* A short first-visit scene: four cursors assemble a miniature version of the home page. */
(() => {
  'use strict';
  const overlay = document.getElementById('buildIntro');
  const root = document.documentElement;
  if (!overlay) return;

  const seenKey = 'jet-build-intro-seen-v1';
  let seen = false;
  try { seen = sessionStorage.getItem(seenKey) === '1'; } catch {}
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (seen || reduced || document.visibilityState === 'hidden') {
    root.classList.remove('intro-pending');
    return;
  }

  try { sessionStorage.setItem(seenKey, '1'); } catch {}
  overlay.hidden = false;
  overlay.classList.add('is-running');
  overlay.querySelector('#buildIntroSkip')?.focus({ preventScroll: true });
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  let finished = false;
  const timers = new Set();
  const later = (fn, ms) => {
    const timer = window.setTimeout(() => { timers.delete(timer); fn(); }, ms);
    timers.add(timer);
    return timer;
  };
  const pause = ms => new Promise(resolve => later(resolve, ms));

  function finish() {
    if (finished) return;
    finished = true;
    timers.forEach(window.clearTimeout);
    timers.clear();
    root.classList.remove('intro-pending');
    document.body.style.overflow = previousOverflow;
    overlay.classList.add('is-finishing');
    window.setTimeout(() => overlay.remove(), 650);
    window.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  }
  function onKeyDown(event) { if (event.key === 'Escape') finish(); }
  function onVisibilityChange() { if (document.hidden) finish(); }
  overlay.querySelector('#buildIntroSkip')?.addEventListener('click', finish);
  window.addEventListener('keydown', onKeyDown);
  document.addEventListener('visibilitychange', onVisibilityChange);
  later(finish, 4200); // Never leave a visitor behind the intro if an animation fails.

  const cursors = [...overlay.querySelectorAll('[data-cursor]')];
  const startPositions = [
    [window.innerWidth * .04, window.innerHeight * .17],
    [window.innerWidth * .13, window.innerHeight * .78],
    [window.innerWidth * .90, window.innerHeight * .20],
    [window.innerWidth * .85, window.innerHeight * .86]
  ];
  const positions = cursors.map((cursor, index) => {
    const [x, y] = startPositions[index];
    cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    return { x, y };
  });

  async function place(cursorIndex, name, duration) {
    if (finished) return;
    const piece = overlay.querySelector(`[data-build="${name}"]`);
    const cursor = cursors[cursorIndex];
    if (!piece || !cursor) return;
    const rect = piece.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) {
      piece.classList.add('is-built');
      return;
    }
    const to = {
      x: Math.min(window.innerWidth - 40, Math.max(12, rect.left + Math.min(rect.width * .42, 120))),
      y: Math.min(window.innerHeight - 50, Math.max(12, rect.top + Math.min(rect.height * .36, 75)))
    };
    const from = positions[cursorIndex];
    const animation = cursor.animate([
      { transform: `translate3d(${from.x}px, ${from.y}px, 0) rotate(-9deg)` },
      { transform: `translate3d(${to.x}px, ${to.y}px, 0) rotate(0deg)` }
    ], { duration, easing: 'cubic-bezier(.22,.78,.25,1)', fill: 'forwards' });
    try { await animation.finished; } catch { return; }
    if (finished) return;
    cursor.style.transform = `translate3d(${to.x}px, ${to.y}px, 0)`;
    animation.cancel();
    positions[cursorIndex] = to;
    piece.classList.add('is-built', 'is-clicked');
    later(() => piece.classList.remove('is-clicked'), 330);
  }

  async function crew(index, delay, steps) {
    await pause(delay);
    for (const [piece, duration] of steps) {
      if (finished) return;
      await place(index, piece, duration);
      await pause(80);
    }
  }

  Promise.allSettled([
    crew(0, 80, [['brand', 380], ['nav', 460], ['card1', 480]]),
    crew(1, 210, [['eyebrow', 380], ['heading', 560], ['subtitle', 330], ['button', 350]]),
    crew(2, 300, [['preview', 710], ['card2', 480]]),
    crew(3, 580, [['card3', 630]])
  ]).then(async () => {
    if (finished) return;
    const status = document.getElementById('buildIntroStatus');
    if (status) status.textContent = 'พร้อมแล้ว — ยินดีต้อนรับ';
    await pause(280);
    finish();
  });
})();
