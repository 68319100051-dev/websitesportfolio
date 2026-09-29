// Two-sided portrait reveal plus subtle pointer depth on devices with a mouse.
(() => {
  const hero = document.querySelector('#hero');
  const card = hero?.querySelector('#heroGachaCard');
  const rotor = card?.querySelector('.hero-gacha-rotor');
  if (!card || !rotor) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let showingCreative = false;
  let spin = 0;
  let spinning = false;
  let spinTimeout = 0;

  function finishSpin() {
    if (!spinning) return;
    spinning = false;
    window.clearTimeout(spinTimeout);
    card.classList.remove('is-spinning');
    card.setAttribute('aria-pressed', String(showingCreative));
    card.setAttribute('aria-label', showingCreative
      ? 'การ์ดงานออกแบบ: UI/UX และ Creative Code กดเพื่อกลับด้านนักพัฒนา'
      : 'การ์ดนักพัฒนา: AI Systems และ Web Apps กดเพื่อดูอีกด้าน');
  }

  card.addEventListener('click', () => {
    if (spinning) return;
    showingCreative = !showingCreative;
    spinning = true;
    card.classList.toggle('is-creative', showingCreative);
    card.classList.add('is-spinning');
    card.style.removeProperty('--hero-tilt-x');
    card.style.removeProperty('--hero-tilt-y');

    spin += reducedMotion.matches ? 180 : 900;
    rotor.style.setProperty('--gacha-spin', `${spin}deg`);
    if (reducedMotion.matches) finishSpin();
    else spinTimeout = window.setTimeout(finishSpin, 1200);
  });

  rotor.addEventListener('transitionend', (event) => {
    if (event.target === rotor && event.propertyName === 'transform') finishSpin();
  });

  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

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
    if (event.pointerType !== 'mouse' || reducedMotion.matches || spinning) return;
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
