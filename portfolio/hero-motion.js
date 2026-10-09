// Extruded portrait card: rotate a real six-plane CSS prism with layered UI.
(() => {
  const hero = document.querySelector('#hero');
  const card = hero?.querySelector('#heroGachaCard');
  const rotor = card?.querySelector('.hero-gacha-rotor');
  if (!card || !rotor) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  let showingCreative = false;
  let spin = 0;
  let spinning = false;
  let spinTimeout = 0;
  let activeAnimation = null;

  function finishSpin() {
    if (!spinning) return;
    rotor.style.setProperty('--gacha-spin', `${spin}deg`);
    if (activeAnimation) {
      activeAnimation.cancel();
      activeAnimation = null;
    }
    window.clearTimeout(spinTimeout);
    rotor.style.removeProperty('transition');
    card.classList.remove('is-spinning');
    card.setAttribute('aria-pressed', String(showingCreative));
    card.setAttribute('aria-label', showingCreative
      ? 'การ์ดงานออกแบบ: UI/UX และ Creative Code กดเพื่อกลับด้านนักพัฒนา'
      : 'การ์ดนักพัฒนา: AI Systems และ Web Apps กดเพื่อดูอีกด้าน');
    spinning = false;
  }

  card.addEventListener('click', () => {
    if (spinning) return;
    const start = spin;
    showingCreative = !showingCreative;
    spin += 900;
    spinning = true;
    card.classList.toggle('is-creative', showingCreative);
    card.classList.add('is-spinning');
    card.style.removeProperty('--hero-tilt-x');
    card.style.removeProperty('--hero-tilt-y');

    if (reducedMotion.matches) {
      finishSpin();
      return;
    }

    if (typeof rotor.animate === 'function') {
      activeAnimation = rotor.animate([
        { transform: `translateZ(0) rotateX(0deg) rotateY(${start}deg) rotateZ(0deg)`, offset: 0 },
        { transform: `translateZ(58px) rotateX(-12deg) rotateY(${start + 170}deg) rotateZ(-4deg)`, offset: .22 },
        { transform: `translateZ(95px) rotateX(13deg) rotateY(${start + 500}deg) rotateZ(4deg)`, offset: .55 },
        { transform: `translateZ(42px) rotateX(-5deg) rotateY(${start + 760}deg) rotateZ(-2deg)`, offset: .82 },
        { transform: `translateZ(0) rotateX(0deg) rotateY(${spin}deg) rotateZ(0deg)`, offset: 1 }
      ], { duration: 1180, easing: 'cubic-bezier(.16,.78,.18,1)', fill: 'forwards' });
      activeAnimation.finished.then(finishSpin).catch(() => {});
    } else {
      rotor.style.transition = 'transform 1180ms cubic-bezier(.16,.78,.18,1)';
      rotor.style.setProperty('--gacha-spin', `${spin}deg`);
      spinTimeout = window.setTimeout(finishSpin, 1200);
    }
  });

  if (!finePointer.matches) return;
  let frame = 0;
  let pointerX = 0;
  let pointerY = 0;

  function update() {
    frame = 0;
    if (spinning) return;
    const rect = card.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, (pointerX - rect.left - rect.width / 2) / (rect.width / 2)));
    const y = Math.max(-1, Math.min(1, (pointerY - rect.top - rect.height / 2) / (rect.height / 2)));
    card.style.setProperty('--hero-tilt-x', `${(-y * 8).toFixed(2)}deg`);
    card.style.setProperty('--hero-tilt-y', `${(x * 9).toFixed(2)}deg`);
    card.style.setProperty('--hero-light-x', `${((x + 1) * 50).toFixed(0)}%`);
    card.style.setProperty('--hero-light-y', `${((y + 1) * 50).toFixed(0)}%`);
  }

  hero.addEventListener('pointermove', event => {
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
