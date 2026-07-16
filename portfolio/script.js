// ============================================================
// PARTICLES ANIMATION
// ============================================================
const canvas = document.getElementById('particles');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let particles = [];
  const isHero = !!document.querySelector('#hero');
  const PARTICLE_COUNT = isHero ? 100 : 60;
  const CONNECT_DISTANCE = isHero ? 180 : 150;
  let mouseX = 0, mouseY = 0;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = (Math.random() - 0.5) * 0.5;
      this.size = Math.random() * 2 + (isHero ? 1 : 0.5);
      this.opacity = Math.random() * 0.5 + (isHero ? 0.3 : 0.1);
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
      if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(192, 132, 252, ${this.opacity})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECT_DISTANCE) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(192, 132, 252, ${0.1 * (1 - dist / CONNECT_DISTANCE)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(animateParticles);
  }
  animateParticles();
}

// ============================================================
// THEME TOGGLE
// ============================================================
const html = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');

function setTheme(theme) {
  html.setAttribute('data-theme', theme);
  localStorage.setItem('portfolio-theme', theme);
  if (themeIcon) themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
}
setTheme(localStorage.getItem('portfolio-theme') || 'dark');
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    setTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });
}

// ============================================================
// MOBILE MENU
// ============================================================
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');

if (menuToggle && navLinks) {
  const navItems = navLinks.querySelectorAll('a');
  menuToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', isOpen);
  });
  navItems.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// ============================================================
// ACTIVE NAV LINK
// ============================================================
const navAllLinks = document.querySelectorAll('.nav-links a');
const currentPath = window.location.pathname.split('/').pop() || 'index.html';
navAllLinks.forEach(link => {
  const href = link.getAttribute('href');
  if (href === currentPath) link.classList.add('active');
});

// ============================================================
// SCROLL REVEAL
// ============================================================
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { rootMargin: '0px 0px -50px 0px', threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ============================================================
// NAVBAR SCROLL EFFECT
// ============================================================
window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.navbar');
  if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

// ============================================================
// CONTACT FORM
// ============================================================
const contactForm = document.getElementById('contactForm');
function i18nMsg(key, replace) {
  const lang = localStorage.getItem('portfolio-lang') || 'th';
  let msg = i18n[lang]?.[key] || key;
  if (replace) {
    Object.keys(replace).forEach(k => { msg = msg.replace('{' + k + '}', replace[k]); });
  }
  return msg;
}

if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = contactForm.querySelector('.form-submit');
    const fd = new FormData(e.target);
    const name = fd.get('name').trim();
    const email = fd.get('email').trim();
    const message = fd.get('message').trim();
    if (!name || !email || !message) { alert(i18nMsg('contact-form-required')); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { alert(i18nMsg('contact-form-invalid-email')); return; }

    submitBtn.disabled = true;
    submitBtn.textContent = '⏳...';

    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message })
    });

    if (res.ok) {
      alert(i18nMsg('contact-form-success', { name }));
      e.target.reset();
    } else {
      const err = await res.json().catch(() => ({ error: 'เกิดข้อผิดพลาด' }));
      alert(err.error || 'เกิดข้อผิดพลาด');
    }

    submitBtn.disabled = false;
    submitBtn.textContent = i18nMsg('contact-form-submit');
  });
}

// ============================================================
// PROJECT MODAL
// ============================================================
const projectData = {
  cyberhack: {
    title: 'CyberHack: Programmer vs Rogue AI',
    category: 'Game / AI',
    status: '<span class="project-status live"><span class="dot"></span> ออนไลน์</span>',
    description: 'เกมพิมพ์สัมผัสธีม Cyberpunk สุดมันส์ ผู้เล่นรับบทเป็นโปรแกรมเมอร์ที่ต้องต่อสู้กับ Rogue AI ด้วยการพิมพ์คำสั่งโค้ดให้ถูกต้องและรวดเร็ว พัฒนาด้วย Vanilla JavaScript และ Vite มีระบบต่อสู้ ตัวละครคลาส สกิล และร้านค้าอัปเกรด',
    tech: ['Vanilla JS', 'TypeScript', 'Vite 5', 'HTML5', 'CSS3', 'Vitest'],
    features: [
      'โหมดเนื้อเรื่อง (Story Mode) — เล่นได้ 10 ด่าน',
      '3 คลาสตัวละคร: Speed Hacker, Precision Coder, Brute Force',
      'ระบบสกิล: Heal, Shield, Slow Time, Dodge, Absorb, Reflect',
      'Virtual Keyboard พร้อม CRT Scanline Effects',
      'ร้านค้าอัปเกรดสถิติแบบถาวร',
      'ระบบจับเวลา WPM/Accuracy และ Combo Meter',
      'Boss Fight พพร้อม AI Dialogue Cutscenes',
      '⚡ โหมดอื่น (Classic, Custom) กำลังพัฒนา',
      '🗺️ โหมดเนื้อเรื่องจะเพิ่มแผนที่และด่านใหม่ ๆ ในอนาคต',
    ],
    live: 'https://68319100051-dev.github.io/typing-game/',
    code: 'https://github.com/JetKomon',
    note: '🎮 ตอนนี้เล่นได้เฉพาะโหมดเนื้อเรื่อง (Story Mode) — โหมดอื่นกำลังพัฒนา และจะมีแผนที่เพิ่มเติมในอนาคต'
  },
  forest: {
    title: 'Lost in the Forest',
    category: 'Game / Multiplayer / AI',
    status: '<span class="project-status live"><span class="dot"></span> ออนไลน์</span>',
    description: 'เกมกระดานเอาตัวรอดออนไลน์สำหรับผู้เล่น 4 คน ในป่าลึก 7 วัน ผู้เล่นมีบทบาทลับ ต้องหาทรัพยากร สร้างของ ต่อสู้กับสัตว์ป่า และเอาชีวิตรอด มีระบบ AI Narrator โดย Claude ที่เล่าเรื่องและสุ่มเหตุการณ์ให้ไม่ซ้ำกัน',
    tech: ['Node.js', 'Express', 'Socket.IO', 'Claude API', 'Docker'],
    features: [
      'โหมดเล่นคนเดียว (AI 3 ตัว)',
      '10+ คลาสตัวละครพร้อมบทบาทลับ',
      'ระบบเอาตัวรอด: ความหิว สุขภาพ สภาพอากาศ สัตว์ป่า',
      'ระบบคราฟต์: กองไฟ กระท่อม รั้ว จากทรัพยากรที่เก็บได้',
      'ระบบต่อสู้กับสัตว์ป่า',
      'ระบบเหตุการณ์สุ่มตามวันและสภาพอากาศ',
      'AI Narrator จาก Claude สร้างบทบรรยายไม่ซ้ำ',
    ],
    live: 'https://forest-survivalgame.onrender.com/',
    code: 'https://github.com/JetKomon',
    render: true,
    note: '🎮 โหมด Multiplayer (4 คน) กำลังพัฒนา — ตอนนี้เล่นได้เฉพาะโหมดเล่นคนเดียว (NPC 3 ตัว)'
  },
  plantfarm: {
    title: 'Plant Farm',
    category: 'Game / Simulation',
    status: '<span class="project-status live"><span class="dot"></span> ออนไลน์</span>',
    description: 'เกมปลูกผักออนไลน์แนว Simulation ผู้เล่นสามารถปลูก รดน้ำ เก็บเกี่ยวพืชผล และขยายฟาร์มของตัวเองให้เติบโต พัฒนาด้วย React + Vite พร้อม Framer Motion เพื่อความลื่นไหล',
    tech: ['React 19', 'TypeScript', 'Vite 8', 'TailwindCSS 4', 'Framer Motion 12', 'Zustand 5'],
    features: [
      'ระบบปลูกพืช: ปลูก รดน้ำ ใส่ปุ๋ย เก็บเกี่ยว',
      'ระบบเศรษฐกิจ: ขายผลผลิต ซื้อเมล็ดพันธุ์และอุปกรณ์',
      'ขยายฟาร์ม: ปลดล็อกแปลงปลูกใหม่ได้เรื่อยๆ',
      'Zustand จัดการสถานะเกม',
      'Framer Motion แอนิเมชันนุ่มนวล',
      'Responsive รองรับทั้งมือถือและเดสก์ท็อป',
      'Vercel Deploy',
    ],
    live: 'https://plant-farm-psi.vercel.app/',
    code: 'https://github.com/JetKomon',
    note: '🚧 ระบบยังมีบั๊กหลายจุด และเนื้อหายังไม่น่าตื่นเต้นเท่าที่ควร — โปรดติดตามอัปเดตในอนาคตครับ 🙏'
  },
  jetmusic: {
    title: 'Jet Music',
    category: 'Music / Web App',
    status: '<span class="project-status live"><span class="dot"></span> ออนไลน์</span>',
    description: 'แพลตฟอร์มฟังเพลงออนไลน์แบบ PWA รองรับการสตรีมจาก YouTube และ SoundCloud มีระบบจัดการเพลย์ลิสต์ แสดงเนื้อเพลง และระบบเล่นต่อเนื่องแบบ Background บน Android ผ่าน Capacitor',
    tech: ['Next.js 16', 'React 19', 'TypeScript', 'Capacitor 8', 'Supabase', 'Upstash Redis'],
    features: [
      'สตรีมเพลงจาก YouTube และ SoundCloud',
      'สร้างและจัดการเพลย์ลิสต์ส่วนตัว',
      'แสดงเนื้อเพลงแบบซิงค์',
      'PWA รองรับการใช้งานแบบ Offline',
      'Background Audio Playback บน Android',
      'Redis Cache เพื่อประสิทธิภาพ',
      'Supabase สำหรับเก็บข้อมูลผู้ใช้',
      'รองรับทั้ง Web และ Android',
    ],
    live: 'https://jet-music.vercel.app/',
    code: 'https://github.com/JetKomon',
    note: '📱 เวอร์ชันแอปมือถือ (Android) ยังไม่พร้อมใช้งาน — ตอนนี้เล่นบนเว็บเบราว์เซอร์ก่อนได้เลยครับ'
  },
  drawstudio: {
    title: 'Draw Studio',
    category: 'Creative / Web App',
    status: '<span class="project-status live"><span class="dot"></span> ออนไลน์</span>',
    description: 'เว็บวาดรูปออนไลน์ระดับมืออาชีพ รองรับหลายเลเยอร์ หลากหลายหัวแปรง เครื่องมือเรขาคณิต ระบบ Undo/Redo และการนำทางด้วย Mini-map พัฒนาด้วย React + Fabric.js',
    tech: ['React 19', 'TypeScript', 'Fabric.js 5.3', 'Zustand 5', 'Vite 8', 'localforage'],
    features: [
      'หัวแปรงหลากหลาย: ดินสอ, ปากกาดิจิตอล, มาร์กเกอร์, สีน้ำ, พู่กันลม',
      'ระบบ Layer: เพิ่ม ลบ ซ่อน ล็อก ปรับความโปร่งใส',
      'เครื่องมือเรขาคณิต: สี่เหลี่ยม วงกลม สามเหลี่ยม เส้น ลูกศร ดาว',
      'ระบบ Undo/Redo (Ctrl+Z / Ctrl+Shift+Z)',
      'Smart Guides สำหรับจัดแนวอัตโนมัติ',
      'Grid และ Snap to Grid',
      'Symmetry Mode: แนวนอน แนวตั้ง สี่ทิศทาง',
      'Mini-map เพื่อนำทางในพื้นที่วาด',
      'ไม้บรรทัดและ Eyedropper',
      'Export เป็น PNG และ SVG',
      'Auto-save ผ่าน localforage (IndexedDB)',
      'รองรับ Dark/Light Theme',
    ],
    live: 'https://drawstudio.vercel.app/',
    code: 'https://github.com/JetKomon'
  },
  fileguard: {
    title: 'File Guard',
    category: 'Utility / Web App',
    status: '<span class="project-status live"><span class="dot"></span> ออนไลน์</span>',
    description: 'โปรแกรมตรวจสอบไดรฟ์และจัดการไฟล์แบบ Real-time สามารถสแกน แยกหมวดหมู่ไฟล์ และแสดงสถานะการทำงานผ่านแดชบอร์ด พัฒนาด้วย Next.js ฝั่ง Frontend และ Python FastAPI ฝั่ง Backend',
    tech: ['Next.js 16', 'React 19', 'TypeScript', 'Python FastAPI', 'Vercel'],
    features: [
      'สแกนไดรฟ์และวิเคราะห์พื้นที่จัดเก็บ',
      'แยกหมวดหมู่ไฟล์อัตโนมัติ',
      'แสดงสถานะแบบ Real-time ผ่านแดชบอร์ด',
      'Frontend: Next.js + TypeScript',
      'Backend: Python FastAPI สำหรับประมวลผล',
      'Vercel Deploy',
      'ระบบแจ้งเตือนเมื่อพื้นที่ใกล้เต็ม',
    ],
    live: 'https://file-guard-gr2o.vercel.app/',
    code: 'https://github.com/JetKomon'
  },
  portfolio: {
    title: 'AI Developer Portfolio',
    category: 'Portfolio / AI',
    status: '<span class="project-status dev"><span class="dot"></span> กำลังพัฒนา ไม่สามารถเปิดดูได้</span>',
    description: 'เว็บไซต์พอร์ตโฟลิโอเวอร์ชันเก่า (ในโฟลเดอร์ web/) ที่มีลูกเล่นเยอะกว่าเวอร์ชันปัจจุบัน ประกอบด้วย 3D Globe แบบ Interactive ด้วย Three.js, AI Chatbot ผู้ช่วยที่ใช้ Gemini API, GitHub Contribution Heatmap และ特效ต่างๆ',
    tech: ['Vanilla JS', 'Three.js', 'Gemini AI', 'Node.js', 'HTML/CSS'],
    features: [
      '3D Globe หมุนได้พร้อมเส้น Connection Arcs',
      'AI Chatbot "Konkamon AI Assistant" (Gemini API)',
      'GitHub-style Contribution Heatmap',
      'Bento Grid Layout',
      'Animated Terminal System Log',
      'Cursor Glow Effect',
      'ระบบเปลี่ยนภาษาไทย/อังกฤษ',
      'Project Modals พร้อม Live Demo Links',
    ],
    live: null,
    code: 'https://github.com/JetKomon'
  },
  shuttle: {
    title: 'Microchip Shuttle Portal',
    category: 'Enterprise / Full-Stack',
    status: '<span class="project-status dev"><span class="dot"></span> กำลังพัฒนา ไม่สามารถเปิดดูได้</span>',
    description: 'ระบบจัดการรถ Shuttle สำหรับพนักงาน Microchip Technology มี 3 บทบาทผู้ใช้ (พนักงาน/คนขับ/ผู้ดูแล) แผนที่ Interactive ด้วย Leaflet รองรับ Export Excel และใช้งานได้ 2 ภาษา (ไทย/อังกฤษ)',
    tech: ['React 19', 'TypeScript', 'Vite 8', 'Leaflet 1.9', 'xlsx', 'react-router-dom 7'],
    features: [
      '3 บทบาท: พนักงาน, คนขับ, ผู้ดูแลระบบ',
      'แผนที่ Interactive ด้วย Leaflet + react-leaflet',
      'ระบบจัดการตารางรถ Shuttle',
      'Export รายงานเป็น Excel',
      'รองรับ 2 ภาษา (ไทย / อังกฤษ)',
      'ระบบ Routing หลายหน้า',
      'Responsive Design',
    ],
    live: null,
    code: 'https://github.com/JetKomon'
  },
  peoplecounter: {
    title: 'โปรแกรมตรวจจับคน (AI Person Counter)',
    category: 'AI / Computer Vision',
    status: '<span class="project-status dev"><span class="dot"></span> กำลังพัฒนา ไม่สามารถเปิดดูได้</span>',
    description: 'แอปพลิเคชันตรวจจับและนับจำนวนคนแบบ Real-time บนเบราว์เซอร์ ใช้ TensorFlow.js + MoveNet MultiPose Lightning ที่ทำงานบนเครื่องผู้ใช้โดยตรง ไม่ต้องส่งข้อมูลไปยังเซิร์ฟเวอร์ รองรับทั้งอัปโหลดรูปและกล้องสด',
    tech: ['TensorFlow.js 4.15', 'MoveNet MultiPose', 'Vanilla JS', 'HTML5/CSS3'],
    features: [
      'ตรวจจับแบบ Real-time ผ่านกล้องเว็บ',
      'อัปโหลดรูปภาพแบบ Drag & Drop',
      'อัลกอริทึม Head-centric สำหรับฝูงชน',
      'ปรับ Sensitivity ได้ 5-95%',
      'แสดง FPS และเวลาที่ใช้ประมวลผล',
      'ประวัติการตรวจจับพร้อมเวลา',
      'สลับกล้องหน้า/หลัง',
      'ระบบ Toast Notification',
      'Multi-language (Thai UI)',
    ],
    live: null,
    code: 'https://github.com/JetKomon'
  },
  telegrambot: {
    title: 'Enterprise Telegram AI Bot',
    category: 'Bot / AI / Automation',
    status: '<span class="project-status dev"><span class="dot"></span> กำลังพัฒนา ไม่สามารถเปิดดูได้</span>',
    description: 'บอท Telegram ขนาดใหญ่ที่มีมากกว่า 50 คำสั่ง รองรับ AI หลายตัว (Gemini, Claude, GPT-4o, Groq) มีระบบความจำแบบ RAG ด้วย ChromaDB, เชื่อมต่อ Google Workspace, วิเคราะห์ไฟล์, ดูดวง, เช็คกีฬา, และเครื่องมือจัดการชีวิตครบวงจร',
    tech: ['Python', 'python-telegram-bot', 'ChromaDB', 'SQLAlchemy', 'Google APIs', 'Multi-AI SDK'],
    features: [
      'แชทกับ AI หลายรุ่น: Gemini, Claude, GPT-4o, Groq',
      'ระบบความจำ: จำ เรียกดู ลืม ด้วย Vector Search',
      'วิเคราะห์ไฟล์: PDF, DOCX, PPTX, XLSX',
      'เชื่อมต่อ Google: Gmail, Calendar, Classroom, Sheets',
      'ค้นหาเว็บและรวบรวมข่าว',
      'เช็คกีฬาสด: พรีเมียร์ลีก ลาลีกา ไทยลีก',
      'ดูดวงและทำนายไพ่ยิปซี',
      'เครื่องมือเรียน: Flashcard, Pomodoro, แปลภาษา',
      'ระบบวางแผนชีวิต: Journal, ออกกำลังกาย, Shopping List',
      'ระบบ Morning Briefing',
      'Plugin System รองรับการขยาย',
      'ตรวจสอบระบบ: CPU/RAM/Disk',
    ],
    live: null,
    code: 'https://github.com/JetKomon'
  },
  formfiller: {
    title: 'AI Google Form Filler',
    category: 'Automation / AI',
    status: '<span class="project-status live"><span class="dot"></span> ออนไลน์</span>',
    description: 'เครื่องมือกรอก Google Form อัตโนมัติด้วย AI สามารถกำหนดจำนวนครั้งที่กรอก รองรับฟอร์มหลายรูปแบบ และใช้ AI ช่วยสร้างคำตอบที่สมจริง',
    tech: ['Python', 'Selenium', 'AI', 'Automation'],
    features: [
      'กรอก Google Form อัตโนมัติ',
      'AI สร้างคำตอบที่สมจริง',
      'กำหนดจำนวนครั้งที่กรอกได้',
      'รองรับฟอร์มหลากหลายรูปแบบ',
    ],
    live: 'https://google-form-ai-assistant.onrender.com/',
    code: 'https://github.com/JetKomon',
    render: true
  }
};

const modal = document.getElementById('projectModal');
const modalClose = document.getElementById('modalClose');
const modalTitle = document.getElementById('modalTitle');
const modalCategory = document.getElementById('modalCategory');
const modalStatus = document.getElementById('modalStatus');
const modalDescription = document.getElementById('modalDescription');
const modalTech = document.getElementById('modalTech');
const modalFeatures = document.getElementById('modalFeatures');
const modalLinks = document.getElementById('modalLinks');

function openModal(id) {
  const data = projectData[id];
  if (!data) return;

  modalTitle.textContent = data.title;
  modalCategory.textContent = data.category;
  modalStatus.innerHTML = data.status;
  modalDescription.textContent = data.description;

  // Render loading notice
  if (data.render) {
    const existing = document.getElementById('renderNotice');
    if (!existing) {
      const notice = document.createElement('div');
      notice.id = 'renderNotice';
      notice.style.cssText = 'margin-top:0.75rem;padding:0.6rem 1rem;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);border-radius:8px;font-size:0.82rem;color:#60a5fa;display:flex;align-items:flex-start;gap:0.5rem;';
      notice.innerHTML = '<span>⏳</span><span>เว็บนี้โฮสต์บน <strong>Render</strong> (ฟรี) — ถ้าไม่ได้ใช้งานไประยะหนึ่ง เซิร์ฟเวอร์จะพักและต้องใช้เวลา <strong>30-60 วินาที</strong> ในการเปิดใหม่อีกครั้ง ขอบคุณที่รอครับ 🙏</span>';
      modalDescription.parentNode.insertBefore(notice, modalDescription.nextSibling);
    }
  } else {
    const existing = document.getElementById('renderNotice');
    if (existing) existing.remove();
  }

  // Project-specific note
  const noteEl = document.getElementById('projectNote');
  if (data.note) {
    if (noteEl) {
      noteEl.innerHTML = data.note;
    } else {
      const div = document.createElement('div');
      div.id = 'projectNote';
      div.style.cssText = 'margin-top:0.75rem;padding:0.6rem 1rem;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.2);border-radius:8px;font-size:0.82rem;color:var(--accent-3);display:flex;align-items:flex-start;gap:0.5rem;';
      div.innerHTML = data.note;
      const ref = document.getElementById('renderNotice') || modalDescription;
      ref.parentNode.insertBefore(div, ref.nextSibling);
    }
  } else if (noteEl) {
    noteEl.remove();
  }

  modalTech.innerHTML = data.tech.map(t => `<span>${t}</span>`).join('');
  modalFeatures.innerHTML = data.features.map(f => `<li>${f}</li>`).join('');

  let linksHTML = '';
  if (data.live) {
    linksHTML += `<a href="#" onclick="event.preventDefault(); confirmProjectLink('${data.live}')" class="modal-link-live">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      เปิดดู
    </a>`;
  }
  linksHTML += `<a href="${data.code}" target="_blank" rel="noopener noreferrer" class="modal-link-code">
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
    ดูโค้ด
  </a>`;
  modalLinks.innerHTML = linksHTML;

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

function confirmProjectLink(url) {
  const lang = localStorage.getItem('portfolio-lang') || 'th';
  const msg = lang === 'th'
    ? '⚠️ โปรดอ่านรายละเอียดโปรเจกต์ข้างต้นให้ครบถ้วนก่อน\nโดยเฉพาะฟีเจอร์ที่แจ้งว่ากำลังพัฒนา\n\nถ้ามั่นใจแล้ว กด "ตกลง" เพื่อไปยังลิงก์'
    : '⚠️ Please read the project details above carefully,\nespecially features marked as in development.\n\nIf you are sure, click "OK" to proceed.';
  if (confirm(msg)) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

document.querySelectorAll('.project-card[data-project]').forEach(card => {
  card.addEventListener('click', (e) => {
    if (e.target.closest('a')) return;
    openModal(card.dataset.project);
  });
});

if (modalClose) modalClose.addEventListener('click', closeModal);
if (modal) {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal?.classList.contains('open')) closeModal();
});

// ============================================================
// ACHIEVEMENT MODAL
// ============================================================
const achievementData = {
  club: {
    title: 'รองประธานชมรมวิชาชีพเทคโนโลยีธุรกิจดิจิทัล',
    org: 'วิทยาลัยอาชีวศึกษาฉะเชิงเทรา',
    period: 'ปัจจุบัน',
    description: 'ปฏิบัติหน้าที่รองประธานชมรมฯ ดูแลและประสานงานกิจกรรมของชมรมวิชาชีพเทคโนโลยีธุรกิจดิจิทัล รวมถึงวางแผนและดำเนินกิจกรรมต่าง ๆ ของชมรม',
    images: ['images/activity-club-1.png', 'images/activity-club-2.png'],
    details: [
      'วางแผนและดำเนินกิจกรรมชมรม',
      'ประสานงานระหว่างสมาชิกและอาจารย์ที่ปรึกษา',
      'ดูแลการจัดกิจกรรมสัมมนาและอบรม',
      'ส่งเสริมทักษะวิชาชีพให้กับสมาชิกชมรม'
    ]
  },
  stream: {
    title: 'ควบคุมกล้องและเบื้องหลังการถ่ายทอดสด',
    org: 'การประเมินศูนย์บ่มเพาะการอาชีวศึกษาระดับชาติ',
    period: '',
    description: 'ควบคุมกล้องและเบื้องหลังการถ่ายทอดสด พร้อมทำกราฟิกการรับรางวัลในการประเมินศูนย์บ่มเพาะการอาชีวศึกษาระดับชาติ',
    images: ['images/activity-stream-1.png', 'images/activity-stream-2.png'],
    details: [
      'ควบคุมกล้องถ่ายทอดสดงานประเมินศูนย์บ่มเพาะ',
      'ออกแบบและจัดทำกราฟิกสำหรับรับรางวัล',
      'ดูแลเบื้องหลังการถ่ายทอดสดตลอดงาน'
    ]
  },
  esport: {
    title: 'หัวหน้าทีมไลฟ์สดและหัวหน้าทีมกราฟิก',
    org: 'E-Sport Games 2024',
    period: '',
    description: 'หัวหน้าทีมไลฟ์สดและหัวหน้าทีมกราฟิก เป็นเบื้องหลังและประสานงานกับทีมอื่น ๆ ในการจัดกิจกรรม การแข่งขันเกม ROV ถ่ายทอดสดการแข่งขันทักษะวิชาชีพ E-Sport Games 2024',
    images: ['images/activity-esport-1.png', 'images/activity-esport-2.png', 'images/activity-esport-3.png'],
    details: [
      'หัวหน้าทีมไลฟ์สด ควบคุมการถ่ายทอดสดการแข่งขัน',
      'หัวหน้าทีมกราฟิก ออกแบบกราฟิกสำหรับงาน',
      'ประสานงานกับทีมต่าง ๆ ในการจัดกิจกรรม',
      'ดูแลระบบการแข่งขันเกม ROV'
    ]
  },
  gencom: {
    title: 'หัวหน้าทีมกราฟิกและดำเนินงาน',
    org: 'โครงการตอบปัญหา Gen Com',
    period: '',
    description: 'รับหน้าที่หัวหน้าทีมกราฟิก และดำเนินงานให้ราบรื่นในโครงการตอบปัญหา Gen Com',
    images: ['images/activity-gencom-1.png', 'images/activity-gencom-2.png'],
    details: [
      'หัวหน้าทีมกราฟิก ออกแบบสื่อประชาสัมพันธ์และกราฟิกงาน',
      'ดำเนินงานและประสานงานให้กิจกรรมราบรื่น',
      'คณะกรรมการดำเนินงานโครงการตอบปัญหา Gen Com'
    ]
  },
  ghost: {
    title: 'ดำเนินงานเบื้องหลังและทำกราฟิกรายการ',
    org: 'โครงการเล่าเรื่องผี CVC RADIO',
    period: '',
    description: 'รับหน้าที่ดำเนินงานเบื้องหลัง ทำกราฟิกรายการ คณะกรรมการดำเนินงานโครงการเล่าเรื่องผี CVC RADIO',
    images: ['images/activity-ghost-1.png', 'images/activity-ghost-2.png'],
    details: [
      'ดำเนินงานเบื้องหลังรายการ',
      'ทำกราฟิกรายการเล่าเรื่องผี',
      'คณะกรรมการดำเนินงานโครงการ CVC RADIO'
    ]
  },
  motion: {
    title: 'รางวัลชนะเลิศ มาตรฐานระดับเหรียญทอง',
    org: 'ทักษะพัฒนาสื่อประชาสัมพันธ์ โมชั่นกราฟิก ระดับปวช. — จังหวัดฉะเชิงเทรา',
    period: 'ปีการศึกษา 2567',
    description: 'รางวัลชนะเลิศ มาตรฐานระดับเหรียญทอง ทักษะพัฒนาสื่อประชาสัมพันธ์ โมชั่นกราฟิก ระดับปวช. ระดับจังหวัดฉะเชิงเทรา ประจำปีการศึกษา 2567',
    images: ['images/award-motion-1.png', 'images/award-motion-2.png'],
    details: [
      'ชนะเลิศระดับจังหวัดฉะเชิงเทรา',
      'มาตรฐานระดับเหรียญทอง',
      'ทักษะพัฒนาสื่อประชาสัมพันธ์ โมชั่นกราฟิก ระดับ ปวช.'
    ]
  },
  motion66: {
    title: 'รางวัลชนะเลิศ มาตรฐานระดับเหรียญทอง',
    org: 'ทักษะพัฒนาสื่อประชาสัมพันธ์ โมชั่นกราฟิก ระดับปวช. — จังหวัดฉะเชิงเทรา',
    period: 'ปีการศึกษา 2566',
    description: 'รางวัลชนะเลิศ มาตรฐานระดับเหรียญทอง ทักษะพัฒนาสื่อประชาสัมพันธ์ โมชั่นกราฟิก ระดับปวช. ระดับจังหวัดฉะเชิงเทรา ประจำปีการศึกษา 2566',
    images: ['images/award-motion66-1.png', 'images/award-motion66-2.png', 'images/award-motion66-3.png'],
    details: [
      'ชนะเลิศระดับจังหวัดฉะเชิงเทรา',
      'มาตรฐานระดับเหรียญทอง',
      'ทักษะพัฒนาสื่อประชาสัมพันธ์ โมชั่นกราฟิก ระดับ ปวช.'
    ]
  },
  logo: {
    title: 'เข้าร่วมการแข่งขันออกแบบตราสัญลักษณ์ (LOGO)',
    org: 'แผนกวิชาเทคโนโลยีธุรกิจดิจิทัล วิทยาลัยอาชีวศึกษาฉะเชิงเทรา',
    period: 'ภาคเรียนที่ 2/2567',
    description: 'เข้าร่วมการแข่งขันการออกแบบตราสัญลักษณ์ (LOGO) แผนกวิชาเทคโนโลยีธุรกิจดิจิทัล วิทยาลัยอาชีวศึกษาฉะเชิงเทรา ประจำภาคเรียนที่ 2/2567',
    images: ['images/activity-logo-1.png'],
    details: [
      'เข้าร่วมการแข่งขันออกแบบ LOGO',
      'แผนกวิชาเทคโนโลยีธุรกิจดิจิทัล',
      'ออกแบบตราสัญลักษณ์ประจำแผนก'
    ]
  }
};

const achModal = document.getElementById('achModal');
const achModalClose = document.getElementById('achModalClose');
const achModalImages = document.getElementById('achModalImages');
const achModalTitle = document.getElementById('achModalTitle');
const achModalOrg = document.getElementById('achModalOrg');
const achModalPeriod = document.getElementById('achModalPeriod');
const achModalDesc = document.getElementById('achModalDesc');
const achModalDetails = document.getElementById('achModalDetails');

function openAchModal(id) {
  const d = achievementData[id];
  if (!d) return;
  achModalTitle.textContent = d.title;
  if (achModalOrg) achModalOrg.textContent = d.org;
  if (achModalPeriod) achModalPeriod.textContent = d.period;
  achModalDesc.textContent = d.description;
  achModalDetails.innerHTML = d.details.map(dd => `<li>${dd}</li>`).join('');
  if (achModalImages) {
    const imgs = d.images || [];
    if (imgs.length === 1) {
      achModalImages.style.display = 'block';
      achModalImages.style.maxHeight = '260px';
      achModalImages.innerHTML = `<img src="${imgs[0]}" alt="" loading="lazy" style="width:100%;height:260px;object-fit:cover;display:block;">`;
    } else if (imgs.length === 2) {
      achModalImages.style.display = 'grid';
      achModalImages.style.gridTemplateColumns = '1fr 1fr';
      achModalImages.style.maxHeight = '200px';
      achModalImages.innerHTML = imgs.map(src =>
        `<img src="${src}" alt="" loading="lazy" style="width:100%;height:200px;object-fit:cover;display:block;">`
      ).join('');
    } else if (imgs.length >= 3) {
      achModalImages.style.display = 'grid';
      achModalImages.style.gridTemplateColumns = '1fr 1fr 1fr';
      achModalImages.style.maxHeight = '160px';
      achModalImages.innerHTML = imgs.map(src =>
        `<img src="${src}" alt="" loading="lazy" style="width:100%;height:160px;object-fit:cover;display:block;">`
      ).join('');
    } else {
      achModalImages.style.display = 'none';
    }
  }
  achModal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeAchModal() {
  achModal.classList.remove('open');
  document.body.style.overflow = '';
}

document.querySelectorAll('.achievement-card[data-ach]').forEach(card => {
  const img = card.querySelector('img');
  if (img) {
    img.style.cursor = 'pointer';
    img.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = card.dataset.ach;
      const d = achievementData[id];
      if (d && d.images && d.images.length) openAchLightbox(d.images);
    });
  }
  card.addEventListener('click', () => openAchModal(card.dataset.ach));
});

if (achModalClose) achModalClose.addEventListener('click', closeAchModal);
if (achModal) {
  achModal.addEventListener('click', (e) => {
    if (e.target === achModal) closeAchModal();
  });
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && achModal?.classList.contains('open')) closeAchModal();
});

// Achievement Lightbox
const achLightbox = document.getElementById('achLightbox');
let achLightboxImages = [];
let achLightboxIndex = 0;

function openAchLightbox(images) {
  achLightboxImages = images;
  achLightboxIndex = 0;
  showAchImage();
  achLightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeAchLightbox() {
  achLightbox.classList.remove('open');
  document.body.style.overflow = '';
}
function showAchImage() {
  const img = document.getElementById('achLightboxImg');
  const counter = document.getElementById('achLightboxCounter');
  if (img) img.src = achLightboxImages[achLightboxIndex];
  if (counter) counter.textContent = `${achLightboxIndex + 1} / ${achLightboxImages.length}`;
}
function nextAchImage() {
  achLightboxIndex = (achLightboxIndex + 1) % achLightboxImages.length;
  showAchImage();
}
function prevAchImage() {
  achLightboxIndex = (achLightboxIndex - 1 + achLightboxImages.length) % achLightboxImages.length;
  showAchImage();
}

document.getElementById('achLightboxClose')?.addEventListener('click', closeAchLightbox);
document.getElementById('achLightboxPrev')?.addEventListener('click', prevAchImage);
document.getElementById('achLightboxNext')?.addEventListener('click', nextAchImage);
if (achLightbox) {
  achLightbox.addEventListener('click', (e) => {
    if (e.target === achLightbox) closeAchLightbox();
  });
}
document.addEventListener('keydown', (e) => {
  if (!achLightbox?.classList.contains('open')) return;
  if (e.key === 'Escape') closeAchLightbox();
  if (e.key === 'ArrowRight') nextAchImage();
  if (e.key === 'ArrowLeft') prevAchImage();
});

// ============================================================
// 3D TILT EFFECT ON CARDS
// ============================================================
const tiltCards = document.querySelectorAll('.project-card, .about-card, .achievement-card, .skill-badge');
tiltCards.forEach(card => {
  let tilting = false;
  card.addEventListener('mousemove', (e) => {
    if (!tilting) {
      tilting = true;
      card.style.transition = 'transform 0.08s ease-out';
    }
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;
    card.style.transform = card.classList.contains('project-card')
      ? `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`
      : `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });
  card.addEventListener('mouseleave', () => {
    tilting = false;
    card.style.transition = '';
    card.style.transform = '';
  });
});

// ============================================================
// DRAWINGS GALLERY
// ============================================================
(function() {
  const grid = document.getElementById('drawingsGrid');
  if (!grid) return;

  const data = loadContent();
  let images = data?.drawings;
  if (!images || !Array.isArray(images) || !images.length) {
    images = [];
    for (let i = 0; i < 36; i++) {
      images.push(`images/drawings/drawing-${i}.jpg`);
    }
  }

  grid.innerHTML = images.map((src, i) => `
    <div class="drawing-item" data-index="${i}">
      <img src="${src}" alt="ภาพวาด ${i + 1}" loading="lazy">
      <div class="drawing-overlay"><span>✏️ ภาพวาด #${i + 1}</span></div>
    </div>
  `).join('');

  // Lightbox
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');
  const lightboxCounter = document.getElementById('lightboxCounter');
  let currentIndex = 0;

  function openLightbox(index) {
    currentIndex = index;
    lightboxImg.src = images[index];
    lightboxImg.alt = `ภาพวาด ${index + 1}`;
    lightboxCounter.textContent = `${index + 1} / ${images.length}`;
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  function prevImage() {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    openLightbox(currentIndex);
  }

  function nextImage() {
    currentIndex = (currentIndex + 1) % images.length;
    openLightbox(currentIndex);
  }

  grid.addEventListener('click', (e) => {
    const item = e.target.closest('.drawing-item');
    if (item) openLightbox(parseInt(item.dataset.index));
  });

  lightboxClose.addEventListener('click', closeLightbox);
  lightboxPrev.addEventListener('click', prevImage);
  lightboxNext.addEventListener('click', nextImage);

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') prevImage();
    if (e.key === 'ArrowRight') nextImage();
  });
})();

// ============================================================
// BACK TO TOP
// ============================================================
(function() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('show', window.scrollY > 400);
  });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

// ============================================================
// SPARKLE CURSOR EFFECT
// ============================================================
(function() {
  let throttleTimer = null;
  document.addEventListener('mousemove', (e) => {
    if (throttleTimer) return;
    throttleTimer = setTimeout(() => { throttleTimer = null; }, 40);

    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle';
    const size = 3 + Math.random() * 5;
    sparkle.style.width = size + 'px';
    sparkle.style.height = size + 'px';
    sparkle.style.left = (e.clientX - size / 2) + 'px';
    sparkle.style.top = (e.clientY - size / 2) + 'px';
    const colors = ['var(--accent-light)', 'var(--accent-2)', 'var(--accent-3)'];
    sparkle.style.background = colors[Math.floor(Math.random() * colors.length)];
    document.body.appendChild(sparkle);
    setTimeout(() => sparkle.remove(), 800);
  });
})();

// ============================================================
// HERO BACKGROUND SLIDESHOW
// ============================================================
(function() {
  const imgs = document.querySelectorAll('.hero-bg .bg-cycle');
  if (!imgs.length) return;
  let current = 0;
  imgs[0].classList.add('active');
  setInterval(() => {
    imgs[current].classList.remove('active');
    current = (current + 1) % imgs.length;
    imgs[current].classList.add('active');
  }, 6000);
})();

// ============================================================
// TYPING EFFECT — Hero title typewriter
// ============================================================
(function() {
  const el = document.querySelector('.typing-text');
  if (!el) return;

  const thRoles = [
    'AI Developer',
    'Full-Stack Developer',
    'UI/UX Designer',
    'Digital Artist',
    'Tech Creator'
  ];
  const enRoles = [
    'AI Developer',
    'Full-Stack Developer',
    'UI/UX Designer',
    'Digital Artist',
    'Tech Creator'
  ];

  let roles = thRoles;
  let roleIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  function type() {
    const lang = localStorage.getItem('portfolio-lang') || 'th';
    roles = lang === 'th' ? thRoles : enRoles;
    const current = roles[roleIndex];
    if (isDeleting) {
      el.textContent = current.substring(0, charIndex--);
    } else {
      el.textContent = current.substring(0, charIndex++);
    }
    if (!isDeleting && charIndex === current.length) {
      isDeleting = true;
      setTimeout(type, 2000);
      return;
    }
    if (isDeleting && charIndex === 0) {
      isDeleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
      setTimeout(type, 300);
      return;
    }
    setTimeout(type, isDeleting ? 40 : 80);
  }
  type();
})();

// ============================================================
// SKILL BAR ANIMATION — Animate on scroll
// ============================================================
(function() {
  const bars = document.querySelectorAll('.skill-bar-fill');
  if (!bars.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const bar = entry.target;
        bar.style.width = bar.dataset.width + '%';
        observer.unobserve(bar);
      }
    });
  }, { threshold: 0.3 });

  bars.forEach(bar => observer.observe(bar));
})();

// ============================================================
// PROJECT FILTER
// ============================================================
(function() {
  const tabs = document.querySelectorAll('.project-filter-tab');
  const search = document.getElementById('projectSearch');
  const cards = document.querySelectorAll('.project-card[data-project]');
  const sections = document.querySelectorAll('.project-category-title');
  if (!tabs.length) return;

  function filterProjects(category, query) {
    query = (query || '').toLowerCase().trim();
    let visible = {};

    cards.forEach(card => {
      const cat = card.dataset.category || 'all';
      const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
      const desc = card.querySelector('p')?.textContent.toLowerCase() || '';
      const tags = card.querySelector('.project-tags')?.textContent.toLowerCase() || '';

      const matchCat = category === 'all' || cat === category;
      const matchSearch = !query || title.includes(query) || desc.includes(query) || tags.includes(query);

      const show = matchCat && matchSearch;
      card.style.display = show ? '' : 'none';
      if (show) visible[cat] = true;
    });

    // Hide/show section headers
    sections.forEach(sec => {
      const grid = sec.nextElementSibling;
      const hasVisible = grid && Array.from(grid.querySelectorAll('.project-card')).some(c => c.style.display !== 'none');
      sec.style.display = hasVisible ? '' : 'none';
    });
  }

  let activeFilter = 'all';
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeFilter = tab.dataset.filter;
      filterProjects(activeFilter, search?.value);
    });
  });

  if (search) {
    search.addEventListener('input', () => {
      filterProjects(activeFilter, search.value);
    });
  }
})();

// ============================================================
// PAGE TRANSITION — Fade effect between pages
// ============================================================
(function() {
  const overlay = document.createElement('div');
  overlay.className = 'page-transition';
  document.body.appendChild(overlay);

  // Fade in on load
  window.addEventListener('pageshow', () => {
    overlay.classList.remove('active');
  });
  requestAnimationFrame(() => overlay.classList.remove('active'));

  // Intercept internal links
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || link.hasAttribute('download') || link.target === '_blank') return;
    e.preventDefault();
    overlay.classList.add('active');
    setTimeout(() => { window.location.href = href; }, 350);
  });
})();

// ============================================================
// I18N — เปลี่ยนภาษาไทย/อังกฤษ
// ============================================================
const CURRENT_LANG = localStorage.getItem('portfolio-lang') || 'th';

function switchLang(lang) {
  localStorage.setItem('portfolio-lang', lang);
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.dataset.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const txt = i18n[lang]?.[key];
    if (txt) el.innerHTML = txt;
  });
  const btn = document.getElementById('langToggle');
  if (btn) btn.textContent = lang === 'th' ? 'EN' : 'TH';
  applyContent();
}

const i18n = {
  th: {
    'nav-home': 'หน้าแรก',
    'nav-about': 'เกี่ยวกับ',
    'nav-projects': 'โปรเจกต์',
    'nav-drawings': 'ภาพวาด',
    'nav-experience': 'ประสบการณ์',
    'nav-achievements': 'รางวัลและผลงาน',
    'nav-guestbook': 'สมุดเยี่ยม',
    'nav-contact': 'ติดต่อ',
    'nav-admin': 'ผู้ดูแลระบบ',
    'project-modal-live': 'เปิดดู',
    'project-modal-code': 'ดูโค้ด',
    'contact-form-name': 'ชื่อ',
    'contact-form-email': 'อีเมล',
    'contact-form-message': 'ข้อความ',
    'contact-form-submit': 'ส่งข้อความ',
    'contact-form-success': 'ขอบคุณครับ {name}! ได้รับข้อความแล้ว ผมจะติดต่อกลับเร็ว ๆ นี้',
    'contact-form-required': 'กรุณากรอกข้อมูลให้ครบทุกช่อง',
    'contact-form-invalid-email': 'กรุณากรอกอีเมลให้ถูกต้อง',
    'gallery-label': 'ภาพวาด',
    'back-to-top': 'กลับด้านบน',
    'drawing-prev': 'ก่อนหน้า',
    'drawing-next': 'ถัดไป',
    'drawing-close': 'ปิด',
    'admin-login-title': 'ผู้ดูแลระบบ',
    'admin-login-password': 'รหัสผ่าน',
    'admin-login-btn': 'เข้าสู่ระบบ',
    'admin-login-error': 'รหัสผ่านไม่ถูกต้อง',
    'admin-save': 'บันทึก',
    'admin-save-success': 'บันทึกสำเร็จ!',
    'admin-logout': 'ออกจากระบบ',
    'admin-new-password': 'เปลี่ยนรหัสผ่าน (6 ตัวขึ้นไป)',
    'admin-tab-th': 'ภาษาไทย',
    'admin-tab-en': 'ภาษาอังกฤษ',
    'guestbook-title': 'สมุดเยี่ยม',
    'guestbook-desc': 'ฝากข้อความถึงผม — พูดคุย ให้กำลังใจ หรือแชร์ไอเดีย ก็เขียนมาได้เลย',
    'admin-security': 'ความปลอดภัย',
    'admin-content': 'เนื้อหา',
    'footer-admin': '🔒 ผู้ดูแลระบบ',
    'about-accent': 'เกี่ยวกับ',
    'about-title': 'รู้จักผมมากขึ้น',
    'projects-accent': '02 — โปรเจกต์',
    'projects-title': 'ผลงานที่สร้าง',
    'drawings-accent': '03 — ภาพวาด',
    'drawings-title': 'ผลงานศิลปะ',
    'experience-accent': '04 — ประสบการณ์',
    'experience-title': 'เส้นทางการทำงาน',
    'achievements-accent': '05 — รางวัลและผลงาน',
    'achievements-title': 'รางวัลและผลงานที่ภาคภูมิใจ',
    'contact-accent': '06 — ติดต่อ',
    'contact-title': 'ช่องทางติดต่อ',
    'projects-disclaimer': '⚠️ ทุกโปรเจกต์ยังเป็น Demo อยู่ระหว่างการพัฒนา — ฟีเจอร์ต่าง ๆ อาจยังไม่สมบูรณ์'
  },
  en: {
    'nav-home': 'Home',
    'nav-about': 'About',
    'nav-projects': 'Projects',
    'nav-drawings': 'Drawings',
    'nav-experience': 'Experience',
    'nav-achievements': 'Achievements',
    'nav-guestbook': 'Guestbook',
    'nav-contact': 'Contact',
    'nav-admin': 'Admin',
    'project-modal-live': 'Live Demo',
    'project-modal-code': 'View Code',
    'contact-form-name': 'Name',
    'contact-form-email': 'Email',
    'contact-form-message': 'Message',
    'contact-form-submit': 'Send Message',
    'contact-form-success': 'Thank you {name}! I received your message and will get back to you soon.',
    'contact-form-required': 'Please fill in all fields',
    'contact-form-invalid-email': 'Please enter a valid email',
    'gallery-label': 'Drawing',
    'back-to-top': 'Back to top',
    'drawing-prev': 'Previous',
    'drawing-next': 'Next',
    'drawing-close': 'Close',
    'admin-login-title': 'Admin Panel',
    'admin-login-password': 'Password',
    'admin-login-btn': 'Login',
    'admin-login-error': 'Incorrect password',
    'admin-save': 'Save',
    'admin-save-success': 'Saved successfully!',
    'admin-logout': 'Logout',
    'admin-new-password': 'Change password (6+ characters)',
    'admin-tab-th': 'Thai',
    'admin-tab-en': 'English',
    'admin-security': 'Security',
    'admin-content': 'Content',
    'footer-admin': '🔒 Admin',
    'about-accent': 'About',
    'about-title': 'Get to Know Me',
    'projects-accent': '02 — Projects',
    'projects-title': 'My Work',
    'drawings-accent': '03 — Drawings',
    'drawings-title': 'Artworks',
    'experience-accent': '04 — Experience',
    'experience-title': 'Career Timeline',
    'achievements-accent': '05 — Awards & Works',
    'achievements-title': 'Awards & Achievements',
    'guestbook-title': 'Guestbook',
    'guestbook-desc': 'Leave a message — chat, encourage, or share your ideas!',
    'contact-accent': '06 — Contact',
    'contact-title': 'Contact Channels',
    'projects-disclaimer': '⚠️ All projects are Demo versions under development — features may not be complete'
  }
};

// ============================================================
// ADMIN PANEL — แก้ไขเนื้อหาทุกหน้า
// ============================================================
const IMAGE_KEYS = [
  'hero-avatar', 'hero-bg-0', 'hero-bg-1', 'hero-bg-2'
];

const CONFIG_KEYS = [
  'pdf-path', 'groq-key', 'gemini-key',
  'cloudinary-cloud', 'cloudinary-preset'
];

const ACHIEVEMENT_SHARED_KEYS = [
  'ach-motion-images', 'ach-motion-period',
  'ach-motion66-images', 'ach-motion66-period',
  'ach-logo-images', 'ach-logo-period',
  'ach-club-images', 'ach-club-period',
  'ach-stream-images', 'ach-stream-period',
  'ach-esport-images', 'ach-esport-period',
  'ach-gencom-images', 'ach-gencom-period',
  'ach-ghost-images', 'ach-ghost-period'
];

function allEditableKeys() {
  const keys = {};
  const langs = ['th', 'en'];
  const defs = {
    // หน้าแรก (index.html)
    'hero-badge': 'Badge',
    'hero-greeting': 'ข้อความทักทาย',
    'hero-name': 'ชื่อ',
    'hero-title': 'คำอธิบายใต้ชื่อ (ใช้ &lt;br&gt; ได้)',
    'stat-1-num': 'สถิติ 1 — ตัวเลข',
    'stat-1-label': 'สถิติ 1 — ป้าย',
    'stat-2-num': 'สถิติ 2 — ตัวเลข',
    'stat-2-label': 'สถิติ 2 — ป้าย',
    'stat-3-num': 'สถิติ 3 — ตัวเลข',
    'stat-3-label': 'สถิติ 3 — ป้าย',

    // เกี่ยวกับ (about.html)
    'desc-about': 'คำอธิบายหน้าเกี่ยวกับ',
    'about-p-1': 'เกี่ยวกับ — ย่อหน้า 1',
    'about-p-2': 'เกี่ยวกับ — ย่อหน้า 2',
    'about-p-3': 'เกี่ยวกับ — ย่อหน้า 3',
    'about-p-4': 'เกี่ยวกับ — ย่อหน้า 4',

    // โปรเจกต์ (projects.html)
    'desc-projects': 'คำอธิบายหน้าโปรเจกต์',

    // ภาพวาด (drawings.html)
    'desc-drawings': 'คำอธิบายหน้าภาพวาด',

    // ประสบการณ์ (experience.html)
    'desc-experience': 'คำอธิบายหน้าประสบการณ์',

    // รางวัล (achievements.html)
    'desc-achievements': 'คำอธิบายหน้ารางวัล',

    // ติดต่อ (contact.html)
    'desc-contact': 'คำอธิบายหน้าติดต่อ',
    'contact-heading': 'หัวข้อช่องทางติดต่อ',
    'contact-desc': 'คำอธิบายช่องทางติดต่อ',
    'contact-email': 'อีเมล',
    'contact-github': 'GitHub',
    'contact-linkedin': 'LinkedIn',

    // เกี่ยวกับ (about.html) — motto
    'about-motto': 'คำคม / motto ประจำตัว',

    // รางวัล (achievements.html)
    'ach-motion-title': 'Motion 2567 — ชื่อ',
    'ach-motion-org': 'Motion 2567 — หน่วยงาน',
    'ach-motion-desc': 'Motion 2567 — คำอธิบาย',
    'ach-motion-details': 'Motion 2567 — รายละเอียด',
    'ach-motion66-title': 'Motion 2566 — ชื่อ',
    'ach-motion66-org': 'Motion 2566 — หน่วยงาน',
    'ach-motion66-desc': 'Motion 2566 — คำอธิบาย',
    'ach-motion66-details': 'Motion 2566 — รายละเอียด',
    'ach-logo-title': 'LOGO — ชื่อ',
    'ach-logo-org': 'LOGO — หน่วยงาน',
    'ach-logo-desc': 'LOGO — คำอธิบาย',
    'ach-logo-details': 'LOGO — รายละเอียด',
    'ach-club-title': 'ชมรม — ชื่อ',
    'ach-club-org': 'ชมรม — หน่วยงาน',
    'ach-club-desc': 'ชมรม — คำอธิบาย',
    'ach-club-details': 'ชมรม — รายละเอียด',
    'ach-stream-title': 'ถ่ายทอดสด — ชื่อ',
    'ach-stream-org': 'ถ่ายทอดสด — หน่วยงาน',
    'ach-stream-desc': 'ถ่ายทอดสด — คำอธิบาย',
    'ach-stream-details': 'ถ่ายทอดสด — รายละเอียด',
    'ach-esport-title': 'E-Sport — ชื่อ',
    'ach-esport-org': 'E-Sport — หน่วยงาน',
    'ach-esport-desc': 'E-Sport — คำอธิบาย',
    'ach-esport-details': 'E-Sport — รายละเอียด',
    'ach-gencom-title': 'Gen Com — ชื่อ',
    'ach-gencom-org': 'Gen Com — หน่วยงาน',
    'ach-gencom-desc': 'Gen Com — คำอธิบาย',
    'ach-gencom-details': 'Gen Com — รายละเอียด',
    'ach-ghost-title': 'CVC Radio — ชื่อ',
    'ach-ghost-org': 'CVC Radio — หน่วยงาน',
    'ach-ghost-desc': 'CVC Radio — คำอธิบาย',
    'ach-ghost-details': 'CVC Radio — รายละเอียด',

    // Footer (ทุกหน้า)
    'footer-text': 'ข้อความท้ายเว็บ (ใช้ &lt;span&gt;, &lt;br&gt; ได้)'
  };
  langs.forEach(l => {
    Object.keys(defs).forEach(k => {
      keys[l + '-' + k] = '[' + l.toUpperCase() + '] ' + defs[k];
    });
  });
  return keys;
}
const EDITABLE_KEYS = allEditableKeys();

const ADMIN_STORAGE_KEY = 'portfolio-admin';
const API_BASE = window.location.origin + '/api';

function defaultContent() {
  const base = {
    'th-hero-badge': 'พร้อมรับงานใหม่',
    'en-hero-badge': 'Open for Work',
    'th-hero-greeting': '👋 สวัสดีครับ ผมชื่อ',
    'en-hero-greeting': '👋 Hi, I\'m',
    'th-hero-name': 'Jet Konkamon',
    'en-hero-name': 'Jet Konkamon',
    'th-hero-title': '<span class="highlight">AI Developer</span> & <span class="highlight">Full-Stack Developer</span><br>นักวาดเส้นสายที่สร้างเทคโนโลยีให้มีชีวิต',
    'en-hero-title': '<span class="highlight">AI Developer</span> & <span class="highlight">Full-Stack Developer</span><br>An artist who builds technology with soul',
    'th-stat-1-num': '10+', 'th-stat-1-label': 'โปรเจกต์',
    'en-stat-1-num': '10+', 'en-stat-1-label': 'Projects',
    'th-stat-2-num': '5+', 'th-stat-2-label': 'ปีประสบการณ์',
    'en-stat-2-num': '5+', 'en-stat-2-label': 'Years Exp.',
    'th-stat-3-num': 'AI', 'th-stat-3-label': 'เชี่ยวชาญ',
    'en-stat-3-num': 'AI', 'en-stat-3-label': 'Specialist',
    'th-desc-about': 'นักพัฒนา นักวาด และนักออกแบบผู้หลงใหลในการสร้างสรรค์ — ทั้งในโลกโค้ดและบนกระดาษ',
    'en-desc-about': 'A developer, artist, and designer passionate about creation — in code, design, and on paper',
    'th-about-p-1': 'ว่าไงครับ! ผม <strong>เจ็ท</strong> (Jet Konkamon) — นักพัฒนา นักวาด และคนที่ชอบอะไรเกี่ยวกับเทคโนโลยีและการสร้างสรรค์ สนุกกับการลองอะไรใหม่ ๆ และเปลี่ยนไอเดียให้เป็นของจริง',
    'en-about-p-1': 'Hey! I\'m <strong>Jet</strong> — a developer, artist, and creative who loves technology and turning ideas into reality.',
    'th-about-p-2': 'ผมเป็น <strong>AI Developer & Full-Stack Developer</strong> ที่มีประสบการณ์สร้างเว็บไซต์ เกม และระบบ AI มากมาย ชอบทดลองใช้ AI ใหม่ ๆ มาประยุกต์ใช้ในโปรเจกต์จริง ตั้งแต่ TensorFlow.js, Stable Diffusion, ไปจนถึง LLM อย่าง Gemini และ Claude',
    'en-about-p-2': 'I\'m an <strong>AI Developer & Full-Stack Developer</strong> with experience building websites, games, and AI systems — from TensorFlow.js and Stable Diffusion to LLMs like Gemini and Claude.',
    'th-about-p-3': 'นอกจากสายเทคฯ ผมยังถนัดด้าน <strong>การวาดรูป</strong> ทั้งดิจิทัลและดั้งเดิม — นำศิลปะมาผสมกับเทคโนโลยีเพื่อสร้างผลงานที่โดดเด่น รวมถึงใช้ <strong>Adobe Master Collection</strong> สำหรับงานออกแบบกราฟิก และ <strong>Microsoft Office</strong> สำหรับงานเอกสารและนำเสนอ',
    'en-about-p-3': 'Beyond tech, I\'m skilled in <strong>drawing</strong> — both digital and traditional. I also use <strong>Adobe Master Collection</strong> for graphic design and <strong>Microsoft Office</strong> for documents & presentations.',
    'th-about-p-4': 'ทุกโปรเจกต์คือการเรียนรู้ ผมเชื่อว่าเทคโนโลยีควรทำให้ชีวิตง่ายขึ้น และผมมุ่งมั่นที่จะสร้างสิ่งที่มีประโยชน์จริง',
    'en-about-p-4': 'Every project is a learning journey. I believe technology should make life easier, and I strive to build things that matter.',
    'th-about-motto': '"เทคโนโลยีคือเครื่องมือ — จินตนาการคือขีดจำกัด"',
    'en-about-motto': '"Technology is a tool — imagination is the limit"',
    'th-desc-projects': 'รวมโปรเจกต์ที่ผมสร้าง ตั้งแต่เว็บไซต์ AI ไปจนถึงเกมออนไลน์',
    'en-desc-projects': 'Projects I\'ve built, from AI websites to online games',
    'th-desc-drawings': 'รวมภาพวาดลายเส้นดินสอ — ทุกเส้นมีเรื่องราว',
    'en-desc-drawings': 'Pencil drawings — every line tells a story',
    'th-desc-experience': 'ไทม์ไลน์การทำงานและโครงการที่ผ่านมา',
    'en-desc-experience': 'Timeline of work and past projects',
    'th-desc-achievements': 'ใบรับรองและรางวัลที่ได้รับ',
    'en-desc-achievements': 'Certificates and awards received',
    'th-desc-contact': 'มีโปรเจกต์หรือไอเดีย? ส่งข้อความมาได้เลย',
    'en-desc-contact': 'Got a project or idea? Send me a message!',
    'th-contact-heading': 'ช่องทางติดต่อ',
    'en-contact-heading': 'Contact Channels',
    'th-contact-desc': 'เปิดรับทุกโอกาส ทั้งงานฟรีแลนซ์ ร่วมมือ หรือแค่พูดคุยเรื่องเทค',
    'en-contact-desc': 'Open to opportunities — freelance, collaboration, or just tech chat',
    'th-contact-email': 'konkamon4643@gmail.com',
    'en-contact-email': 'konkamon4643@gmail.com',
    'th-contact-github': 'github.com/JetKomon',
    'en-contact-github': 'github.com/JetKomon',
    'th-contact-linkedin': 'linkedin.com/in/jetkonkamon',
    'en-contact-linkedin': 'linkedin.com/in/jetkonkamon',
    'th-footer-text': 'ออกแบบและพัฒนาโดย <span>Jet Konkamon</span> &copy; 2026 สงวนลิขสิทธิ์',
    'en-footer-text': 'Designed & developed by <span>Jet Konkamon</span> &copy; 2026 All rights reserved',
    'hero-avatar': 'images/portrait.jpg',
    'hero-bg-0': 'images/bg/bg-0.jpg',
    'hero-bg-1': 'images/bg/bg-1.jpg',
    'hero-bg-2': 'images/bg/bg-2.jpg',

    // Achievement data — TH
    'th-ach-motion-title': 'รางวัลชนะเลิศ มาตรฐานระดับเหรียญทอง',
    'th-ach-motion-org': 'ทักษะพัฒนาสื่อประชาสัมพันธ์ โมชั่นกราฟิก ระดับปวช. — จังหวัดฉะเชิงเทรา',
    'th-ach-motion-desc': 'รางวัลชนะเลิศ มาตรฐานระดับเหรียญทอง ทักษะพัฒนาสื่อประชาสัมพันธ์ โมชั่นกราฟิก ระดับปวช. ระดับจังหวัดฉะเชิงเทรา ประจำปีการศึกษา 2567',
    'th-ach-motion-details': 'ชนะเลิศระดับจังหวัดฉะเชิงเทรา\nมาตรฐานระดับเหรียญทอง\nทักษะพัฒนาสื่อประชาสัมพันธ์ โมชั่นกราฟิก ระดับ ปวช.',
    'th-ach-motion66-title': 'รางวัลชนะเลิศ มาตรฐานระดับเหรียญทอง',
    'th-ach-motion66-org': 'ทักษะพัฒนาสื่อประชาสัมพันธ์ โมชั่นกราฟิก ระดับปวช. — จังหวัดฉะเชิงเทรา',
    'th-ach-motion66-desc': 'รางวัลชนะเลิศ มาตรฐานระดับเหรียญทอง ทักษะพัฒนาสื่อประชาสัมพันธ์ โมชั่นกราฟิก ระดับปวช. ระดับจังหวัดฉะเชิงเทรา ประจำปีการศึกษา 2566',
    'th-ach-motion66-details': 'ชนะเลิศระดับจังหวัดฉะเชิงเทรา\nมาตรฐานระดับเหรียญทอง\nทักษะพัฒนาสื่อประชาสัมพันธ์ โมชั่นกราฟิก ระดับ ปวช.',
    'th-ach-logo-title': 'เข้าร่วมการแข่งขันออกแบบตราสัญลักษณ์ (LOGO)',
    'th-ach-logo-org': 'แผนกวิชาเทคโนโลยีธุรกิจดิจิทัล วิทยาลัยอาชีวศึกษาฉะเชิงเทรา',
    'th-ach-logo-desc': 'เข้าร่วมการแข่งขันการออกแบบตราสัญลักษณ์ (LOGO) แผนกวิชาเทคโนโลยีธุรกิจดิจิทัล วิทยาลัยอาชีวศึกษาฉะเชิงเทรา ประจำภาคเรียนที่ 2/2567',
    'th-ach-logo-details': 'เข้าร่วมการแข่งขันออกแบบ LOGO\nแผนกวิชาเทคโนโลยีธุรกิจดิจิทัล\nออกแบบตราสัญลักษณ์ประจำแผนก',
    'th-ach-club-title': 'รองประธานชมรมวิชาชีพเทคโนโลยีธุรกิจดิจิทัล',
    'th-ach-club-org': 'วิทยาลัยอาชีวศึกษาฉะเชิงเทรา',
    'th-ach-club-desc': 'ปฏิบัติหน้าที่รองประธานชมรมฯ ดูแลและประสานงานกิจกรรมของชมรมวิชาชีพเทคโนโลยีธุรกิจดิจิทัล รวมถึงวางแผนและดำเนินกิจกรรมต่าง ๆ ของชมรม',
    'th-ach-club-details': 'วางแผนและดำเนินกิจกรรมชมรม\nประสานงานระหว่างสมาชิกและอาจารย์ที่ปรึกษา\nดูแลการจัดกิจกรรมสัมมนาและอบรม\nส่งเสริมทักษะวิชาชีพให้กับสมาชิกชมรม',
    'th-ach-stream-title': 'ควบคุมกล้องและเบื้องหลังการถ่ายทอดสด',
    'th-ach-stream-org': 'การประเมินศูนย์บ่มเพาะการอาชีวศึกษาระดับชาติ',
    'th-ach-stream-desc': 'ควบคุมกล้องและเบื้องหลังการถ่ายทอดสด พร้อมทำกราฟิกการรับรางวัลในการประเมินศูนย์บ่มเพาะการอาชีวศึกษาระดับชาติ',
    'th-ach-stream-details': 'ควบคุมกล้องถ่ายทอดสดงานประเมินศูนย์บ่มเพาะ\nออกแบบและจัดทำกราฟิกสำหรับรับรางวัล\nดูแลเบื้องหลังการถ่ายทอดสดตลอดงาน',
    'th-ach-esport-title': 'หัวหน้าทีมไลฟ์สดและหัวหน้าทีมกราฟิก',
    'th-ach-esport-org': 'E-Sport Games 2024',
    'th-ach-esport-desc': 'หัวหน้าทีมไลฟ์สดและหัวหน้าทีมกราฟิก เป็นเบื้องหลังและประสานงานกับทีมอื่น ๆ ในการจัดกิจกรรม การแข่งขันเกม ROV ถ่ายทอดสดการแข่งขันทักษะวิชาชีพ E-Sport Games 2024',
    'th-ach-esport-details': 'หัวหน้าทีมไลฟ์สด ควบคุมการถ่ายทอดสดการแข่งขัน\nหัวหน้าทีมกราฟิก ออกแบบกราฟิกสำหรับงาน\nประสานงานกับทีมต่าง ๆ ในการจัดกิจกรรม\nดูแลระบบการแข่งขันเกม ROV',
    'th-ach-gencom-title': 'หัวหน้าทีมกราฟิกและดำเนินงาน',
    'th-ach-gencom-org': 'โครงการตอบปัญหา Gen Com',
    'th-ach-gencom-desc': 'รับหน้าที่หัวหน้าทีมกราฟิก และดำเนินงานให้ราบรื่นในโครงการตอบปัญหา Gen Com',
    'th-ach-gencom-details': 'หัวหน้าทีมกราฟิก ออกแบบสื่อประชาสัมพันธ์และกราฟิกงาน\nดำเนินงานและประสานงานให้กิจกรรมราบรื่น\nคณะกรรมการดำเนินงานโครงการตอบปัญหา Gen Com',
    'th-ach-ghost-title': 'ดำเนินงานเบื้องหลังและทำกราฟิกรายการ',
    'th-ach-ghost-org': 'โครงการเล่าเรื่องผี CVC RADIO',
    'th-ach-ghost-desc': 'รับหน้าที่ดำเนินงานเบื้องหลัง ทำกราฟิกรายการ คณะกรรมการดำเนินงานโครงการเล่าเรื่องผี CVC RADIO',
    'th-ach-ghost-details': 'ดำเนินงานเบื้องหลังรายการ\nทำกราฟิกรายการเล่าเรื่องผี\nคณะกรรมการดำเนินงานโครงการ CVC RADIO',

    // Achievement data — EN
    'en-ach-motion-title': 'Gold Medal Standard — 1st Place',
    'en-ach-motion-org': 'Motion Graphics, Vocational Certificate — Chachoengsao Province',
    'en-ach-motion-desc': 'Gold Medal Standard — 1st Place in Motion Graphics, Vocational Certificate level, Chachoengsao Province, Academic Year 2025',
    'en-ach-motion-details': '1st Place in Chachoengsao Province\nGold Medal Standard\nMotion Graphics, Vocational Certificate',
    'en-ach-motion66-title': 'Gold Medal Standard — 1st Place',
    'en-ach-motion66-org': 'Motion Graphics, Vocational Certificate — Chachoengsao Province',
    'en-ach-motion66-desc': 'Gold Medal Standard — 1st Place in Motion Graphics, Vocational Certificate level, Chachoengsao Province, Academic Year 2024',
    'en-ach-motion66-details': '1st Place in Chachoengsao Province\nGold Medal Standard\nMotion Graphics, Vocational Certificate',
    'en-ach-logo-title': 'LOGO Design Competition',
    'en-ach-logo-org': 'Digital Business Technology Dept., Chachoengsao Vocational College',
    'en-ach-logo-desc': 'Participated in the LOGO Design Competition organized by the Digital Business Technology Department, Chachoengsao Vocational College, Semester 2/2025',
    'en-ach-logo-details': 'Participated in LOGO Design Competition\nDigital Business Technology Department\nDesigned the department\'s emblem',
    'en-ach-club-title': 'Vice President — Digital Business Technology Club',
    'en-ach-club-org': 'Chachoengsao Vocational College',
    'en-ach-club-desc': 'Serve as Vice President of the Digital Business Technology Professional Club, coordinating and managing club activities and events.',
    'en-ach-club-details': 'Plan and execute club activities\nCoordinate between members and advisors\nOrganize seminars and workshops\nPromote professional skills for club members',
    'en-ach-stream-title': 'Camera & Behind-the-Scenes Live Stream',
    'en-ach-stream-org': 'National Vocational Incubation Center Evaluation',
    'en-ach-stream-desc': 'Handled camera operation and behind-the-scenes live streaming, created award ceremony graphics for the national vocational incubation center evaluation.',
    'en-ach-stream-details': 'Operated cameras for live stream coverage\nDesigned graphics for award ceremony\nManaged behind-the-scenes throughout the event',
    'en-ach-esport-title': 'Live Stream & Graphics Team Lead',
    'en-ach-esport-org': 'E-Sport Games 2024',
    'en-ach-esport-desc': 'Led the live stream and graphics teams for E-Sport Games 2024, managing ROV tournament broadcasts and coordinating with other teams.',
    'en-ach-esport-details': 'Led live stream team for tournament broadcasts\nLed graphics team for event design\nCoordinated with various teams\nManaged ROV competition system',
    'en-ach-gencom-title': 'Graphics & Operations Team Lead',
    'en-ach-gencom-org': 'Gen Com Quiz Project',
    'en-ach-gencom-desc': 'Served as Graphics Team Lead and operations coordinator for the Gen Com quiz project, ensuring smooth event execution.',
    'en-ach-gencom-details': 'Led graphics team for promotional media and event graphics\nManaged operations and coordination\nCommittee member of Gen Com Quiz Project',
    'en-ach-ghost-title': 'Behind-the-Scenes & Graphics Operator',
    'en-ach-ghost-org': 'CVC RADIO Ghost Story Project',
    'en-ach-ghost-desc': 'Managed behind-the-scenes operations and created graphics for the CVC RADIO Ghost Story Project.',
    'en-ach-ghost-details': 'Managed behind-the-scenes operations\nCreated graphics for the show\nCommittee member of CVC RADIO Project',

    // Achievement shared
    'ach-motion-period': 'ปีการศึกษา 2567',
    'ach-motion-images': 'images/award-motion-1.png,images/award-motion-2.png',
    'ach-motion66-period': 'ปีการศึกษา 2566',
    'ach-motion66-images': 'images/award-motion66-1.png,images/award-motion66-2.png,images/award-motion66-3.png',
    'ach-logo-period': 'ภาคเรียนที่ 2/2567',
    'ach-logo-images': 'images/activity-logo-1.png',
    'ach-club-period': 'ปัจจุบัน',
    'ach-club-images': 'images/activity-club-1.png,images/activity-club-2.png',
    'ach-stream-images': 'images/activity-stream-1.png,images/activity-stream-2.png',
    'ach-esport-images': 'images/activity-esport-1.png,images/activity-esport-2.png,images/activity-esport-3.png',
    'ach-gencom-images': 'images/activity-gencom-1.png,images/activity-gencom-2.png',
    'ach-ghost-images': 'images/activity-ghost-1.png,images/activity-ghost-2.png',

    'cloudinary-cloud': 'mo8znakk',
    'cloudinary-preset': 'portfolio',

    'pdf-path': 'images/portfolio กรกมล.pdf'
  };
  return base;
}
function fetchAPI(endpoint, options) {
  return fetch(API_BASE + endpoint, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  }).then(r => r.ok ? r.json() : null).catch(() => null);
}

function syncFromServer() {
  fetchAPI('/data').then(res => {
    if (res?.success && res.data && Object.keys(res.data).length) {
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(res.data));
      fetchAPI('/timeline').then(tlRes => {
        if (tlRes?.success && tlRes.timeline) {
          const merged = JSON.parse(localStorage.getItem(ADMIN_STORAGE_KEY)) || {};
          merged.timeline = tlRes.timeline;
          localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(merged));
        }
        applyContent();
      }).catch(() => applyContent());
    }
  });
}

function loadContent() {
  try {
    const saved = JSON.parse(localStorage.getItem(ADMIN_STORAGE_KEY));
    if (saved && Object.keys(saved).length) return saved;
  } catch {}
  return defaultContent();
}

let _saveTimer = null;
function saveContent(data) {
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(data));
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    fetchAPI('/data', {
      method: 'POST',
      body: JSON.stringify({
        password: sessionStorage.getItem('portfolio-admin-pwd') || '',
        content: data
      })
    });
  }, 500);
}

syncFromServer();

function loadTimelineData() {
  try {
    const saved = JSON.parse(localStorage.getItem(ADMIN_STORAGE_KEY));
    if (saved?.timeline) return saved.timeline;
  } catch {}
  return {
    work: [
      { date: 'ปัจจุบัน', title: 'ฝึกงานแผนก MIS', subtitle: 'สี่พระยา', desc: 'กำลังฝึกงานในแผนก MIS (Management Information System) ดูแลระบบสารสนเทศและสนับสนุนงานด้าน IT ขององค์กร' },
      { date: '2024', title: 'ฝึกงาน — โปรแกรมเมอร์', subtitle: 'Neo International', desc: 'ฝึกงานในตำแหน่ง Programmer และหลังจากฝึกงานจบ ได้บรรจุทำงานต่ออีก 3 เดือน พัฒนาและดูแลระบบภายในองค์กร' }
    ],
    education: [
      { date: 'ปัจจุบัน', title: 'ระดับประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)', subtitle: 'วิทยาลัยอาชีวศึกษาฉะเชิงเทรา', desc: 'สาขาวิชาเทคโนโลยีธุรกิจดิจิทัล — เกรดเฉลี่ย 3.84' },
      { date: 'ปีที่ 1 — 3', title: 'ระดับประกาศนียบัตรวิชาชีพ (ปวช.)', subtitle: 'วิทยาลัยอาชีวศึกษาฉะเชิงเทรา', desc: 'เกรดเฉลี่ย 3.40' },
      { date: 'มัธยมศึกษาตอนต้น', title: 'ระดับมัธยมศึกษาตอนต้น', subtitle: 'โรงเรียนเบญจมราชรังสฤษฎิ์ 2', desc: 'เกรดเฉลี่ย 3.60' },
      { date: 'ประถมศึกษา', title: 'ระดับประถมศึกษา', subtitle: 'โรงเรียนวัดสนามจันทร์', desc: '' }
    ]
  };
}

function loadDrawingList() {
  try {
    const saved = JSON.parse(localStorage.getItem(ADMIN_STORAGE_KEY));
    if (saved?.drawings && Array.isArray(saved.drawings) && saved.drawings.length) return saved.drawings;
  } catch {}
  const images = [];
  for (let i = 0; i < 36; i++) images.push(`images/drawings/drawing-${i}.jpg`);
  return images;
}

function applyContent() {
  const data = loadContent();
  const lang = localStorage.getItem('portfolio-lang') || 'th';
  document.querySelectorAll('[data-editable]').forEach(el => {
    const key = el.dataset.editable;
    const langKey = lang + '-' + key;
    if (data[langKey]) {
      el.innerHTML = data[langKey];
    } else if (data[key]) {
      el.innerHTML = data[key];
    }
  });
  document.querySelectorAll('[data-editable-img]').forEach(el => {
    const key = el.dataset.editableImg;
    if (data[key]) {
      el.src = data[key];
    }
  });
  document.querySelectorAll('[data-editable-href]').forEach(el => {
    const key = el.dataset.editableHref;
    if (data[key]) {
      el.href = data[key];
    }
  });
  mergeAchievementData(data);
  renderTimeline(data);
  renderDrawings(data);
  renderProjects(data);
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

// ============================================================
// RENDER FUNCTIONS — รีเฟรชข้อมูลจาก data
// ============================================================

function renderTimeline(data) {
  let tl = data?.timeline || null;
  if (!tl) {
    tl = loadTimelineData();
  }
  if (!tl) return;

  // Work timeline
  const workSection = document.querySelector('#experience .timeline');
  if (workSection && tl.work) {
    workSection.innerHTML = tl.work.map(item => `
      <div class="timeline-item reveal">
        <span class="timeline-date">${item.date}</span>
        <h3>${item.title}</h3>
        <h4>${item.subtitle || ''}</h4>
        <p>${item.desc || ''}</p>
      </div>
    `).join('');
  }

  // Education timeline
  const eduSection = document.querySelector('#education .timeline');
  if (eduSection && tl.education) {
    eduSection.innerHTML = tl.education.map((item, i) => `
      <div class="timeline-item reveal">
        ${i > 0 ? '<div class="timeline-dot"></div>' : ''}
        <span class="timeline-date">${item.date}</span>
        <h3>${item.title}</h3>
        <h4>${item.subtitle || ''}</h4>
        <p>${item.desc || ''}</p>
      </div>
    `).join('');
  }
}

function renderDrawings(data) {
  const grid = document.getElementById('drawingsGrid');
  if (!grid) return;

  let drawings = data?.drawings;
  if (!drawings || !Array.isArray(drawings) || !drawings.length) {
    drawings = [];
    for (let i = 0; i < 36; i++) drawings.push(`images/drawings/drawing-${i}.jpg`);
  }

  grid.innerHTML = drawings.map((src, i) => `
    <div class="drawing-item" data-index="${i}">
      <img src="${src}" alt="ภาพวาด ${i + 1}" loading="lazy">
      <div class="drawing-overlay"><span>✏️ ภาพวาด #${i + 1}</span></div>
    </div>
  `).join('');

  // Re-init lightbox for new images
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');
    const lightboxCounter = document.getElementById('lightboxCounter');
    let currentIndex = 0;

    function openLightbox(index) {
      currentIndex = index;
      lightboxImg.src = drawings[index];
      lightboxImg.alt = `ภาพวาด ${index + 1}`;
      lightboxCounter.textContent = `${index + 1} / ${drawings.length}`;
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    }

    function prevImage() {
      currentIndex = (currentIndex - 1 + drawings.length) % drawings.length;
      openLightbox(currentIndex);
    }

    function nextImage() {
      currentIndex = (currentIndex + 1) % drawings.length;
      openLightbox(currentIndex);
    }

    grid.addEventListener('click', (e) => {
      const item = e.target.closest('.drawing-item');
      if (item) openLightbox(parseInt(item.dataset.index));
    });

    // Remove old listeners by cloning
    const newClose = lightboxClose.cloneNode(true);
    lightboxClose.parentNode.replaceChild(newClose, lightboxClose);
    const newPrev = lightboxPrev.cloneNode(true);
    lightboxPrev.parentNode.replaceChild(newPrev, lightboxPrev);
    const newNext = lightboxNext.cloneNode(true);
    lightboxNext.parentNode.replaceChild(newNext, lightboxNext);

    newClose.addEventListener('click', closeLightbox);
    newPrev.addEventListener('click', prevImage);
    newNext.addEventListener('click', nextImage);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    });
  }
}

function renderProjects(data) {
  if (!data?.projects) return;
  try {
    const projects = typeof data.projects === 'string' ? JSON.parse(data.projects) : data.projects;
    Object.keys(projects).forEach(id => {
      if (projectData[id]) {
        projectData[id] = { ...projectData[id], ...projects[id] };
      }
    });
  } catch(e) { /* ignore */ }
}

// ============================================================
// LOAD MESSAGES — สำหรับ Admin
// ============================================================
function loadMessages() {
  const list = document.getElementById('adminMessagesList');
  if (!list) return;

  const pwd = sessionStorage.getItem('portfolio-admin-pwd') || '';
  list.innerHTML = '<p style="color:var(--text-muted);">⏳ กำลังโหลด...</p>';

  fetchAPI('/messages?password=' + encodeURIComponent(pwd)).then(res => {
    if (!res?.success || !res.messages) {
      list.innerHTML = '<p style="color:#ef4444;">❌ ไม่สามารถโหลดข้อความได้</p>';
      return;
    }
    if (!res.messages.length) {
      list.innerHTML = '<p style="color:var(--text-muted);">📭 ยังไม่มีข้อความ</p>';
      return;
    }
    list.innerHTML = res.messages.map(m => `
      <div style="padding:0.75rem;margin-bottom:0.5rem;background:var(--bg-secondary);border-radius:var(--radius-sm);border-left:3px solid ${m.read ? 'var(--border-color)' : 'var(--accent)'};">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.3rem;">
          <strong style="font-size:0.9rem;">${escHtml(m.name)}</strong>
          <span style="font-size:0.75rem;color:var(--text-muted);">${new Date(m.date).toLocaleString('th-TH')}</span>
        </div>
        <div style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:0.3rem;">📧 ${escHtml(m.email)}</div>
        <div style="font-size:0.85rem;">${escHtml(m.message)}</div>
        ${m.read ? '' : `<button class="btn-outline" style="font-size:0.75rem;padding:0.25rem 0.75rem;margin-top:0.5rem;" onclick="markRead('${m.id}')">✅ อ่านแล้ว</button>`}
      </div>
    `).join('');
  }).catch(() => {
    list.innerHTML = '<p style="color:#ef4444;">❌ เกิดข้อผิดพลาดในการโหลด</p>';
  });
}

function markRead(id) {
  const pwd = sessionStorage.getItem('portfolio-admin-pwd') || '';
  fetchAPI('/messages/read', {
    method: 'POST',
    body: JSON.stringify({ password: pwd, id })
  }).then(res => {
    if (res?.success) loadMessages();
  });
}

function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ============================================================
// LOAD ANALYTICS — สำหรับ Admin
// ============================================================
function loadAnalytics() {
  const el = document.getElementById('adminAnalytics');
  if (!el) return;
  el.innerHTML = '<p style="color:var(--text-muted);">⏳ กำลังโหลด...</p>';
  fetchAPI('/analytics').then(res => {
    if (!res?.success || !res.analytics) {
      el.innerHTML = '<p style="color:#ef4444;">❌ ไม่สามารถโหลดสถิติได้</p>';
      return;
    }
    const a = res.analytics;
    const pageNames = { 'index.html': 'หน้าแรก', 'about.html': 'เกี่ยวกับ', 'projects.html': 'โปรเจกต์', 'drawings.html': 'ภาพวาด', 'experience.html': 'ประสบการณ์', 'achievements.html': 'รางวัล', 'contact.html': 'ติดต่อ' };
    let html = `<div style="font-size:1.2rem;font-weight:700;margin-bottom:0.75rem;">👁️ รวม: ${a.views || 0} ครั้ง</div>`;
    html += '<table style="width:100%;font-size:0.85rem;border-collapse:collapse;"><tr style="border-bottom:1px solid var(--border-color);"><th style="text-align:left;padding:0.4rem 0.5rem;">หน้า</th><th style="text-align:right;padding:0.4rem 0.5rem;">เข้าชม</th></tr>';
    const pages = a.pages || {};
    Object.keys(pages).sort((x,y) => (pages[y]||0) - (pages[x]||0)).forEach(page => {
      const name = pageNames[page] || page;
      html += `<tr><td style="padding:0.3rem 0.5rem;">${name}</td><td style="text-align:right;padding:0.3rem 0.5rem;">${a.pages[page]}</td></tr>`;
    });
    html += '</table>';
    el.innerHTML = html;
  }).catch(() => {
    el.innerHTML = '<p style="color:#ef4444;">❌ เกิดข้อผิดพลาด</p>';
  });
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

function getVal(id) {
  return document.getElementById(id)?.value ?? '';
}

function applyI18n() {
  const lang = localStorage.getItem('portfolio-lang') || 'th';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const txt = i18n[lang]?.[key];
    if (txt) el.innerHTML = txt;
  });
  const btn = document.getElementById('langToggle');
  if (btn) btn.textContent = lang === 'th' ? 'EN' : 'TH';
}

function doLogin() {
  const pwd = document.getElementById('adminPassword')?.value;
  if (!pwd) return;

  const localPwd = localStorage.getItem('portfolio-admin-password') || 'admin123';

  fetchAPI('/verify', {
    method: 'POST',
    body: JSON.stringify({ password: pwd })
  }).then(res => {
    if (res?.success) {
      loginSuccess(pwd);
    } else if (pwd === localPwd) {
      loginSuccess(pwd);
    } else {
      document.getElementById('adminError')?.classList.add('show');
    }
  }).catch(() => {
    if (pwd === localPwd) {
      loginSuccess(pwd);
    } else {
      document.getElementById('adminError')?.classList.add('show');
    }
  });
}

function loginSuccess(pwd) {
  sessionStorage.setItem('portfolio-admin-auth', 'true');
  sessionStorage.setItem('portfolio-admin-pwd', pwd);
  fetchAPI('/data').then(d => {
    if (d?.success && d.data) {
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(d.data));
    }
    showDashboard();
  }).catch(() => showDashboard());
}

function mergeAchievementData(data) {
  if (!data) return;
  const achIds = ['motion', 'motion66', 'logo', 'club', 'stream', 'esport', 'gencom', 'ghost'];
  const lang = localStorage.getItem('portfolio-lang') || 'th';
  achIds.forEach(id => {
    const base = achievementData[id] || {};
    const t = data[lang + '-ach-' + id + '-title'];
    const o = data[lang + '-ach-' + id + '-org'];
    const p = data['ach-' + id + '-period'];
    const d = data[lang + '-ach-' + id + '-desc'];
    const dt = data[lang + '-ach-' + id + '-details'];
    const im = data['ach-' + id + '-images'];
    if (t) base.title = t;
    if (o) base.org = o;
    if (p !== undefined) base.period = p;
    if (d) base.description = d;
    if (dt) base.details = dt.split('\n').filter(s => s.trim());
    if (im) base.images = im.split(',').map(s => s.trim()).filter(s => s);
    achievementData[id] = base;
  });
}

function showDashboard() {
  const loginSection = document.getElementById('adminLoginSection');
  const dashboard = document.getElementById('adminDashboard');
  if (loginSection) loginSection.style.display = 'none';
  if (dashboard) dashboard.style.display = 'block';

  const data = loadContent();
  Object.keys(EDITABLE_KEYS).forEach(key => setVal('admin-' + key, data[key] || ''));
  IMAGE_KEYS.forEach(key => setVal('admin-img-' + key, data[key] || ''));
  ACHIEVEMENT_SHARED_KEYS.forEach(key => setVal('admin-' + key, data[key] || ''));
  setVal('admin-gemini-key', localStorage.getItem('portfolio-gemini-key') || '');
  setVal('admin-groq-key', localStorage.getItem('portfolio-groq-key') || '');
  CONFIG_KEYS.forEach(key => setVal('admin-' + key, data[key] || ''));

  // Load projects JSON
  setVal('admin-projects-json', JSON.stringify(window.projectData || {}, null, 2));

  // Load timeline
  const savedTimeline = loadTimelineData();
  setVal('admin-timeline-json', JSON.stringify(savedTimeline, null, 2));

  // Load drawings list
  setVal('admin-drawings-list', loadDrawingList().join('\n'));

  loadUploads();
}

function tabAdmin(lang) {
  document.querySelectorAll('.admin-lang-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.admin-tab-pane').forEach(p => p.classList.remove('active'));
  const tab = document.getElementById('adminTab-' + lang);
  const pane = document.getElementById('adminPane-' + lang);
  if (tab) tab.classList.add('active');
  if (pane) pane.classList.add('active');
}

function checkAdminAuth() {
  if (sessionStorage.getItem('portfolio-admin-auth') === 'true') {
    showDashboard();
  }
}

function saveAdmin() {
  const data = loadContent();
  Object.keys(EDITABLE_KEYS).forEach(key => {
    data[key] = getVal('admin-' + key);
  });
  IMAGE_KEYS.forEach(key => {
    data[key] = getVal('admin-img-' + key);
  });
  ACHIEVEMENT_SHARED_KEYS.forEach(key => {
    data[key] = getVal('admin-' + key);
  });
  CONFIG_KEYS.forEach(key => {
    data[key] = getVal('admin-' + key);
  });

  // Save projects JSON
  try {
    const proj = JSON.parse(getVal('admin-projects-json'));
    if (proj && typeof proj === 'object') {
      Object.keys(proj).forEach(id => {
        if (projectData[id]) {
          projectData[id] = { ...projectData[id], ...proj[id] };
        } else {
          projectData[id] = proj[id];
        }
      });
      data.projects = projectData;
    }
  } catch(e) { console.warn('Invalid projects JSON:', e); }

  // Save timeline JSON
  try {
    const tl = JSON.parse(getVal('admin-timeline-json'));
    if (tl && typeof tl === 'object') {
      data.timeline = tl;
    }
  } catch(e) { console.warn('Invalid timeline JSON:', e); }

  // Save drawings list
  const drawLines = getVal('admin-drawings-list').split('\n').map(s => s.trim()).filter(s => s);
  if (drawLines.length) data.drawings = drawLines;

  saveContent(data);
  mergeAchievementData(data);
  applyContent();

  // Apply timeline
  renderTimeline(data);
  // Apply drawings
  renderDrawings(data);
  // Apply projects
  renderProjects(data);

  const newPwd = getVal('admin-new-password');
  if (newPwd && newPwd.length >= 6) {
    localStorage.setItem('portfolio-admin-password', newPwd);
    sessionStorage.setItem('portfolio-admin-pwd', newPwd);
  }

  const geminiKey = getVal('admin-gemini-key');
  if (geminiKey) {
    localStorage.setItem('portfolio-gemini-key', geminiKey);
  }

  const groqKey = getVal('admin-groq-key');
  if (groqKey) {
    localStorage.setItem('portfolio-groq-key', groqKey);
  }

  fetchAPI('/data', {
    method: 'POST',
    body: JSON.stringify({
      password: sessionStorage.getItem('portfolio-admin-pwd') || '',
      content: data,
      newPassword: (newPwd && newPwd.length >= 6) ? newPwd : undefined
    })
  });

  const success = document.getElementById('adminSuccess');
  if (success) {
    success.classList.add('show');
    setTimeout(() => success.classList.remove('show'), 3000);
  }
}

// Image upload functions
function compressImage(file, maxW, maxH, quality) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > maxW) { h = h * maxW / w; w = maxW; }
        if (h > maxH) { w = w * maxH / h; h = maxH; }
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        c.toBlob((blob) => {
          blob.name = file.name;
          resolve(blob);
        }, 'image/jpeg', quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function uploadToCloudinary(blob, fileName) {
  const data = loadContent();
  const cloudName = data['cloudinary-cloud'] || getVal('admin-cloudinary-cloud');
  const uploadPreset = data['cloudinary-preset'] || getVal('admin-cloudinary-preset');
  if (!cloudName || !uploadPreset) return null;

  const fd = new FormData();
  fd.append('file', blob, fileName);
  fd.append('upload_preset', uploadPreset);

  return fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST', body: fd
  }).then(r => r.json()).then(res => {
    return res.secure_url || null;
  }).catch(() => null);
}

function uploadImage() {
  const input = document.getElementById('adminUploadInput');
  const file = input?.files?.[0];
  if (!file) { document.getElementById('uploadStatus').textContent = '⚠️ กรุณาเลือกรูปก่อน'; return; }

  const statusEl = document.getElementById('uploadStatus');
  statusEl.textContent = '⏳ กำลังบีบอัดรูป...';

  compressImage(file, 1920, 1920, 0.75).then(compressed => {
    const fileName = file.name.replace(/\.[^.]+$/, '.jpg');
    const data = loadContent();
    const cloudName = data['cloudinary-cloud'] || getVal('admin-cloudinary-cloud');
    const uploadPreset = data['cloudinary-preset'] || getVal('admin-cloudinary-preset');
    const useCloudinary = cloudName && uploadPreset;

    if (useCloudinary) {
      statusEl.textContent = '⏳ กำลังอัปโหลดไป Cloudinary...';
      uploadToCloudinary(compressed, fileName).then(url => {
        if (url) {
          showUploadResult(url, compressed);
          input.value = '';
        } else {
          statusEl.textContent = '❌ อัปโหลด Cloudinary ล้มเหลว ตรวจสอบ Cloud Name และ Upload Preset';
        }
      });
    } else {
      statusEl.textContent = '⏳ กำลังอัปโหลด...';
      const pwd = sessionStorage.getItem('portfolio-admin-pwd') || 'admin123';
      const fd = new FormData();
      fd.append('image', compressed, fileName);
      fd.append('password', pwd);

      fetch('/api/upload', { method: 'POST', body: fd })
        .then(r => r.json())
        .then(res => {
          if (res.success) {
            showUploadResult(res.path, compressed);
            input.value = '';
            loadUploads();
          } else {
            statusEl.textContent = '❌ ' + (res.error || 'อัปโหลดล้มเหลว');
          }
        })
        .catch(() => { statusEl.textContent = '❌ การเชื่อมต่อผิดพลาด'; });
    }
  });
}

function showUploadResult(path, blob) {
  const statusEl = document.getElementById('uploadStatus');
  const preview = document.getElementById('uploadPreview');
  const isUrl = path.startsWith('http');
  const imgSrc = isUrl ? path : '/' + path + '?t=' + Date.now();
  const displayPath = isUrl ? path : path;

  statusEl.textContent = '✅ อัปโหลดสำเร็จ';
  preview.style.display = 'flex';
  preview.innerHTML = '<img src="' + imgSrc + '" alt=""><div><div class="path" style="word-break:break-all;">' + displayPath + '</div><button class="btn-outline" style="font-size:0.75rem;padding:0.3rem 0.6rem;margin-top:0.3rem;" onclick="navigator.clipboard.writeText(\'' + displayPath + '\').then(()=>this.textContent=\'✅ คัดลอกแล้ว\')">📋 คัดลอก</button><button class="btn-outline" style="font-size:0.75rem;padding:0.3rem 0.6rem;margin-top:0.3rem;margin-left:0.3rem;" onclick="addToDrawingList(\'' + displayPath.replace(/'/g, "\\'") + '\')">➕ เพิ่มในรายการรูปวาด</button></div>';

  // Auto-fill Cloudinary URL into drawing list
  if (isUrl) {
    addToDrawingList(displayPath);
  }
}

function addToDrawingList(path) {
  const ta = document.getElementById('admin-drawings-list');
  if (!ta) return;
  const existing = ta.value.split('\n').map(s => s.trim()).filter(s => s);
  if (existing.includes(path)) return;
  ta.value = path + '\n' + existing.join('\n');
}

function loadUploads() {
  fetch('/api/uploads')
    .then(r => r.json())
    .then(res => {
      const grid = document.getElementById('uploadGrid');
      if (!grid) return;
      if (!res.success || !res.files?.length) {
        grid.innerHTML = '<p style="color:var(--text-muted);font-size:0.82rem;">ยังไม่มีรูปที่อัปโหลด</p>';
        return;
      }
      const pwd = sessionStorage.getItem('portfolio-admin-pwd') || 'admin123';
      grid.innerHTML = res.files.map(f =>
        '<div class="upload-item">' +
          '<img src="/' + f.path + '?t=' + Date.now() + '" alt="" loading="lazy">' +
          '<div class="upload-info">' + f.name.slice(-20) + '</div>' +
          '<div class="upload-actions">' +
            '<button onclick="navigator.clipboard.writeText(\'' + f.path + '\').then(()=>this.textContent=\'✅\')" title="คัดลอก path">📋</button>' +
            '<button class="del" onclick="deleteUpload(\'' + f.name + '\',\'' + pwd + '\')" title="ลบ">🗑️</button>' +
          '</div>' +
        '</div>'
      ).join('');
    });
}

function deleteUpload(filename, pwd) {
  if (!confirm('ลบ ' + filename + '?')) return;
  fetch('/api/upload/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, password: pwd })
  })
    .then(r => r.json())
    .then(res => {
      if (res.success) loadUploads();
      else alert('❌ ' + (res.error || 'ลบไม่สำเร็จ'));
    });
}

function logoutAdmin() {
  sessionStorage.removeItem('portfolio-admin-auth');
  const loginSection = document.getElementById('adminLoginSection');
  const dashboard = document.getElementById('adminDashboard');
  if (loginSection) loginSection.style.display = 'flex';
  if (dashboard) dashboard.style.display = 'none';
}

applyI18n();
applyContent();

// Language toggle
const langToggle = document.getElementById('langToggle');
if (langToggle) {
  langToggle.addEventListener('click', () => {
    const next = localStorage.getItem('portfolio-lang') === 'th' ? 'en' : 'th';
    switchLang(next);
  });
}

// ============================================================
// AI ASSISTANT — Floating Chat Bubble + Chat Modal
// ============================================================
(function() {
  // ไม่ต้องแสดงบนหน้า admin
  if (window.location.pathname.includes('admin.html')) return;

  // AI ไม่ต้องใช้ localStorage key แล้ว — เรียกผ่าน backend

  const AI_SYSTEM_PROMPT_TH = `คุณคือผู้ช่วยเว็บไซต์พอร์ตโฟลิโอของ Jet Konkamon (นายกรกมล พุทธคาวี)
ข้อมูลเกี่ยวกับ Jet:
- ชื่อ: Jet Konkamon (นายกรกมล พุทธคาวี) ชื่อเล่น เจ็ท
- อายุ 19 ปี เกิด 16 ตุลาคม 2549 เชื้อชาติไทย ศาสนาพุทธ
- ตำแหน่ง: AI Developer & Full-Stack Developer และนักวาดเส้นสาย
- การศึกษา: กำลังศึกษาสาขาเทคโนโลยีธุรกิจดิจิทัล วิทยาลัยอาชีวศึกษาฉะเชิงเทรา
- สนใจและถนัดด้าน AI, Full-Stack Development, การวาดรูป, ออกแบบกราฟิก
- ทักษะ: JavaScript, TypeScript, Python, Node.js, React, Next.js, TensorFlow.js, Stable Diffusion, AI (Gemini, Claude, GPT), Adobe Master Collection (Photoshop, Illustrator, Premiere Pro, After Effects), Microsoft Office, Firebase, Docker, PostgreSQL, MongoDB
- ผลงานเด่น: Lost in the Forest (เกม Multiplayer 4 คน + AI Narrator), CyberHack (เกมพิมพ์สัมผัส), Plant Farm (เกมปลูกผัก), Jet Music (แพลตฟอร์มเพลง), Draw Studio (เว็บวาดรูป), File Guard, Enterprise Telegram AI Bot (50+ คำสั่ง), AI Google Form Filler, AI Person Counter
- รางวัล: ชนะเลิศเหรียญทองโมชั่นกราฟิก ระดับจังหวัด 2 ปีซ้อน (2566, 2567)
- กิจกรรม: รองประธานชมรมเทคโนโลยีธุรกิจดิจิทัล, ควบคุมกล้องถ่ายทอดสด, หัวหน้าทีมกราฟิกอีสปอร์ต, กรรมการดำเนินงาน Gen Com และ CVC Radio
- งานอดิเรก: วาดรูป, เขียนโปรแกรม, เล่นเกม

ตอบคำถามเกี่ยวกับ Jet และพอร์ตโฟลิโอของเขาเป็นภาษาไทย เป็นกันเอง กระชับ มีประโยชน์`;

  const AI_SYSTEM_PROMPT_EN = `You are the AI assistant for Jet Konkamon's portfolio website.
About Jet:
- Name: Jet Konkamon (Mr. Krakamon Puttakawee) Nickname: Jet
- 19 years old, born October 16, 2006, Thai, Buddhist
- Role: AI Developer & Full-Stack Developer, also a sketch artist
- Education: Studying Digital Business Technology at Chachoengsao Vocational College
- Skills: JavaScript, TypeScript, Python, Node.js, React, Next.js, TensorFlow.js, Stable Diffusion, AI (Gemini, Claude, GPT), Adobe Master Collection, Microsoft Office, Firebase, Docker, PostgreSQL, MongoDB
- Key projects: Lost in the Forest (Multiplayer game + AI Narrator), CyberHack (typing game), Plant Farm, Jet Music, Draw Studio, File Guard, Enterprise Telegram AI Bot, AI Google Form Filler, AI Person Counter
- Awards: Gold medal Motion Graphics, provincial level, 2 consecutive years (2024, 2025)
- Activities: Vice President of Digital Business Tech Club, Live stream camera operator, E-Sport Graphics Team Lead, Gen Com & CVC Radio committee
- Hobbies: Drawing, programming, gaming

Answer questions about Jet and his portfolio in English. Be friendly, concise, and helpful.`;

  const lang = localStorage.getItem('portfolio-lang') || 'th';
  const greetingText = lang === 'th'
    ? '👋 สวัสดีครับ ผม Jet ผู้ช่วย AI ของเว็บนี้ มีอะไรให้ช่วยถามเกี่ยวกับผมหรือผลงานไหมครับ?'
    : '👋 Hi! I\'m Jet\'s AI assistant. Ask me anything about him or his work!';

  // Page-specific summaries
  const pageName = window.location.pathname.split('/').pop() || 'index.html';
  const pageSummaries = {
    'th': {
      'index.html': '🏠 หน้านี้คือหน้าแรกของ Jet Konkamon — AI Developer & Full-Stack Developer มีโปรเจกต์เด่นและสถิติต่าง ๆ ให้ดูครับ',
      'about.html': '👤 หน้านี้แนะนำตัว Jet — ประวัติส่วนตัว ทักษะ ความสามารถ และเครื่องมือที่ถนัด',
      'projects.html': '💻 หน้ารวมผลงานโปรเจกต์ของ Jet — ทั้งเกม, เว็บแอป, AI, และระบบต่าง ๆ',
      'drawings.html': '✏️ แกลเลอรีภาพวาดลายเส้นดินสอของ Jet — ดูทุกภาพได้ที่นี่',
      'experience.html': '📅 ไทม์ไลน์ประสบการณ์การทำงานและการศึกษาของ Jet — ตั้งแต่เริ่มต้นถึงปัจจุบัน',
      'achievements.html': '🏆 รางวัล เกียรติประวัติ และกิจกรรมที่ Jet เคยทำ — ทั้งการแข่งขันโมชั่นกราฟิก กิจกรรมชมรม และอีสปอร์ต',
      'contact.html': '📞 ช่องทางติดต่อ Jet — ส่งข้อความถึงเขาได้ที่นี่'
    },
    'en': {
      'index.html': '🏠 This is Jet Konkamon\'s homepage — AI Developer & Full-Stack Developer with featured projects and stats.',
      'about.html': '👤 About Jet — personal info, skills, and tools he works with.',
      'projects.html': '💻 Jet\'s project portfolio — games, web apps, AI systems, and more.',
      'drawings.html': '✏️ Jet\'s pencil drawing gallery — browse all artworks here.',
      'experience.html': '📅 Jet\'s experience and education timeline — from start to present.',
      'achievements.html': '🏆 Awards, honors, and activities Jet has participated in.',
      'contact.html': '📞 Contact Jet — send him a message here.'
    }
  };
  const pageSummary = pageSummaries[lang]?.[pageName] || '';

  // Inject bubble + greeting
  const bubble = document.createElement('div');
  bubble.className = 'ai-bubble';
  bubble.innerHTML = '<img src="images/ai-avatar.png" alt="AI Assistant" style="width:42px;height:42px;object-fit:contain;">';
  bubble.setAttribute('aria-label', 'เปิดแชทกับผู้ช่วย AI');
  bubble.setAttribute('role', 'button');
  bubble.setAttribute('tabindex', '0');

  const greet = document.createElement('div');
  greet.className = 'ai-greeting';
  greet.textContent = pageSummary || greetingText;

  document.body.appendChild(greet);
  document.body.appendChild(bubble);

  // Show greeting after delay — use page summary first time, then default on re-show
  let greetTimer = setTimeout(() => {
    greet.classList.add('show');
    setTimeout(() => greet.classList.remove('show'), 10000);
  }, 2000);

  // Inject chat modal
  const chatHTML = `
  <div class="ai-chat-overlay" id="aiChatOverlay">
    <div class="ai-chat">
      <div class="ai-chat-header">
        <span style="display:flex;align-items:center;gap:0.5rem;"><img src="images/ai-avatar.png" alt="" style="width:32px;height:32px;object-fit:contain;border-radius:50%;"> Jet's AI Assistant</span>
        <button class="ai-chat-close" id="aiChatClose" aria-label="ปิดแชท">✕</button>
      </div>
      <div class="ai-chat-msgs" id="aiChatMsgs">
        <div class="ai-msg ai-msg-bot">
          <div class="ai-msg-avatar"><img src="images/ai-avatar.png" alt="" style="width:32px;height:32px;object-fit:contain;"></div>
          <div class="ai-msg-content">${greetingText}</div>
        </div>
      </div>
      <div class="ai-chat-input-area">
        <input type="text" class="ai-chat-input" id="aiChatInput" placeholder="พิมพ์ข้อความ..." autocomplete="off">
        <button class="ai-chat-send" id="aiChatSend" aria-label="ส่ง">➤</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', chatHTML);

  const overlay = document.getElementById('aiChatOverlay');
  const closeBtn = document.getElementById('aiChatClose');
  const msgs = document.getElementById('aiChatMsgs');
  const input = document.getElementById('aiChatInput');
  const sendBtn = document.getElementById('aiChatSend');

  function openChat() {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    input.focus();
    greet.classList.remove('show');
    clearTimeout(greetTimer);
  }

  function closeChat() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  bubble.addEventListener('click', openChat);
  bubble.addEventListener('keydown', (e) => { if (e.key === 'Enter') openChat(); });
  closeBtn.addEventListener('click', closeChat);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeChat(); });

  function addMsg(text, isUser) {
    const div = document.createElement('div');
    div.className = 'ai-msg ' + (isUser ? 'ai-msg-user' : 'ai-msg-bot');
    div.innerHTML = isUser
      ? `<div class="ai-msg-content">${text}</div>`
      : `<div class="ai-msg-avatar"><img src="images/ai-avatar.png" alt="" style="width:24px;height:24px;object-fit:contain;"></div><div class="ai-msg-content">${text}</div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function addTyping() {
    const div = document.createElement('div');
    div.className = 'ai-msg ai-msg-bot ai-typing';
    div.id = 'aiTyping';
    div.innerHTML = '<div class="ai-msg-avatar"><img src="images/ai-avatar.png" alt="" style="width:32px;height:32px;object-fit:contain;"></div><div class="ai-msg-content"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>';
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function removeTyping() {
    const el = document.getElementById('aiTyping');
    if (el) el.remove();
  }

  async function sendMessage(text) {
    if (!text.trim()) return;
    input.value = '';
    addMsg(text, true);
    addTyping();
    const lang = localStorage.getItem('portfolio-lang') || 'th';
    const sysPrompt = lang === 'th' ? AI_SYSTEM_PROMPT_TH : AI_SYSTEM_PROMPT_EN;
    const userMsg = lang === 'th' ? 'ผู้ใช้ถาม: ' : 'User asks: ';

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: sysPrompt },
            { role: 'user', content: userMsg + text }
          ]
        })
      });
      const data = await res.json();
      if (data.success && data.text) {
        removeTyping(); addMsg(data.text, false); return;
      }
      // Fallback to Gemini
      const res2 = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'gemini',
          messages: [
            { role: 'system', content: sysPrompt },
            { role: 'user', content: userMsg + text }
          ]
        })
      });
      const data2 = await res2.json();
      if (data2.success && data2.text) {
        removeTyping(); addMsg(data2.text, false); return;
      }
    } catch {}
    removeTyping();
    addMsg('ขอโทษครับ ตอบไม่ได้ในตอนนี้ — ลองใหม่ภายหลังครับ', false);
  }

  function handleSend() {
    const text = input.value.trim();
    if (text) sendMessage(text);
  }

  sendBtn.addEventListener('click', handleSend);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSend(); });

  // Update greeting on language change
  const origSwitch = window.switchLang;
  const origApply = window.applyContent;
  const origApplyI18n = window.applyI18n;
})();

// ============================================================
// ANIMATED COUNTERS — Hero stats number count-up
// ============================================================
(function() {
  const stats = document.querySelectorAll('.hero-stat .number');
  if (!stats.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const text = el.textContent.trim();
        const match = text.match(/^([\d.]+)(.*)$/);
        if (!match) return;
        const target = parseFloat(match[1]);
        const suffix = match[2];
        const duration = 1500;
        const start = performance.now();

        function animate(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = Math.round(eased * target);
          el.textContent = current + suffix;
          if (progress < 1) requestAnimationFrame(animate);
        }
        requestAnimationFrame(animate);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  stats.forEach(el => observer.observe(el));
})();

// ============================================================
// SCROLL PROGRESS BAR
// ============================================================
(function() {
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.prepend(bar);

  window.addEventListener('scroll', () => {
    const h = document.documentElement;
    const scrollTop = h.scrollTop || document.body.scrollTop;
    const scrollHeight = h.scrollHeight - h.clientHeight;
    const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    bar.style.width = pct + '%';
  });
})();

// ============================================================
// ANALYTICS — นับคนดูแต่ละหน้า
// ============================================================
(function() {
  if (window.location.pathname.includes('admin.html')) return;
  const page = window.location.pathname.split('/').pop() || 'index.html';
  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ page })
  }).catch(() => {});
})();

// ============================================================
// ANTI-DEVTOOLS
// ============================================================
(function() {
  if (window.location.pathname.includes('admin.html')) return;
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('keydown', e => {
    if (e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.key === 'U') ||
        (e.ctrlKey && e.key === 'S')) {
      e.preventDefault();
      return false;
    }
  });
})();

