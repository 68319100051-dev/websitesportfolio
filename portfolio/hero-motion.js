// Subtle depth for the home portrait. Keep touch and reduced-motion layouts still.
(() => {
  const hero = document.querySelector('#hero');
  const card = hero?.querySelector('.hero-profile');
  if (!card || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  let frame = 0;
  let pointerX = 0;
  let pointerY = 0;

  function update() {
    frame = 0;
    const rect = card.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, (pointerX - rect.left - rect.width / 2) / (rect.width / 2)));
    const y = Math.max(-1, Math.min(1, (pointerY - rect.top - rect.height / 2) / (rect.height / 2)));
    card.style.setProperty('--hero-tilt-x', `${(-y * 5).toFixed(2)}deg`);
    card.style.setProperty('--hero-tilt-y', `${(x * 6).toFixed(2)}deg`);
    card.style.setProperty('--hero-light-x', `${((x + 1) * 50).toFixed(0)}%`);
    card.style.setProperty('--hero-light-y', `${((y + 1) * 50).toFixed(0)}%`);
  }

  hero.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (!frame) frame = requestAnimationFrame(update);
  }, { passive: true });

  hero.addEventListener('pointerleave', () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    card.style.removeProperty('--hero-tilt-x');
    card.style.removeProperty('--hero-tilt-y');
    card.style.removeProperty('--hero-light-x');
    card.style.removeProperty('--hero-light-y');
  });
})();
