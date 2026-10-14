const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;
const DATA_FILE = process.env.PORTFOLIO_DATA_FILE || path.join(__dirname, 'portfolio', 'data.json');
const INITIAL_PASSWORD = process.env.ADMIN_INITIAL_PASSWORD || process.env.ADMIN_PASSWORD;
let adminPassword;

const UPLOAD_DIR = path.join(__dirname, 'portfolio', 'images', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i;
    cb(null, allowed.test(path.extname(file.originalname)));
  }
});

app.use(express.json({ limit: '5mb' }));

const CONTENT_SECRET_KEYS = /(?:^|[-_])(key|secret|token|password|preset)(?:$|[-_])/i;
const AUTH_WINDOW_MS = 15 * 60 * 1000;
const AUTH_LOCK_MS = 15 * 60 * 1000;
const AUTH_MAX_FAILURES = 5;
const authFailures = new Map();

function requireAdmin(req, res, password) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  let state = authFailures.get(ip);
  if (state?.blockedUntil > now) {
    res.set('Retry-After', String(Math.ceil((state.blockedUntil - now) / 1000)));
    res.status(429).json({ success: false, error: 'Too many attempts. Please try again later.' });
    return false;
  }
  if (state && now - state.firstFailure >= AUTH_WINDOW_MS) {
    authFailures.delete(ip);
    state = null;
  }
  const supplied = typeof password === 'string' && password.length <= 1024
    ? Buffer.from(hash(password), 'hex') : null;
  const expected = Buffer.from(adminPassword, 'hex');
  if (supplied && supplied.length === expected.length &&
      crypto.timingSafeEqual(supplied, expected)) {
    authFailures.delete(ip);
    return true;
  }
  if (!state) state = { firstFailure: now, failures: 0, blockedUntil: 0 };
  state.failures += 1;
  if (state.failures >= AUTH_MAX_FAILURES) state.blockedUntil = now + AUTH_LOCK_MS;
  authFailures.set(ip, state);
  if (authFailures.size > 5000) {
    for (const [key, value] of authFailures) {
      if (key !== ip && now - value.firstFailure >= AUTH_WINDOW_MS && value.blockedUntil <= now) {
        authFailures.delete(key);
      }
    }
  }
  if (state.blockedUntil) {
    res.set('Retry-After', String(Math.ceil(AUTH_LOCK_MS / 1000)));
    res.status(429).json({ success: false, error: 'Too many attempts. Please try again later.' });
  } else {
    res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  return false;
}

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "connect-src 'self' https://api.cloudinary.com",
  "upgrade-insecure-requests"
].join('; ');

app.use((req, res, next) => {
  res.set({
    'Strict-Transport-Security': 'max-age=31536000',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': CONTENT_SECURITY_POLICY,
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  });
  if (req.path.startsWith('/api/')) res.set('Cache-Control', 'no-store');
  let decodedPath = req.path;
  try {
    for (let i = 0; i < 3; i++) {
      const nextPath = decodeURIComponent(decodedPath);
      if (nextPath === decodedPath) break;
      decodedPath = nextPath;
    }
  } catch { return res.sendStatus(400); }
  if (/\.json(?:$|[/?])/i.test(decodedPath.replace(/\\/g, '/'))) return res.sendStatus(404);
  next();
});
app.use(express.static(path.join(__dirname, 'portfolio'), { dotfiles: 'deny' }));

function hash(pwd) {
  return crypto.createHash('sha256').update(pwd).digest('hex');
}

function initDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    if (!INITIAL_PASSWORD) throw new Error('ADMIN_INITIAL_PASSWORD is required when data.json is missing');
    const initial = {
      password: hash(INITIAL_PASSWORD),
      content: {},
      messages: [],
      analytics: { views: 0, pages: {} }
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf-8');
  }
  try {
    const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    if (typeof raw.password !== 'string' || !/^[a-f0-9]{64}$/i.test(raw.password)) {
      throw new Error('data.json has no valid administrator password hash');
    }
    adminPassword = process.env.ADMIN_PASSWORD ? hash(process.env.ADMIN_PASSWORD) : raw.password;
  } catch (err) {
    throw new Error('Cannot load administrator credentials: ' + err.message);
  }
}

initDataFile();

function readFullData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch { return { content: {}, messages: [], analytics: { views: 0, pages: {} } }; }
}

function readData() {
  return readFullData().content || {};
}

function writeData(content, newPassword) {
  const full = readFullData();
  full.content = content;
  if (newPassword) {
    full.password = hash(newPassword);
    adminPassword = full.password;
  } else {
    full.password = adminPassword;
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(full, null, 2), 'utf-8');
}

function writeFull(full) {
  full.password = full.password || adminPassword;
  fs.writeFileSync(DATA_FILE, JSON.stringify(full, null, 2), 'utf-8');
}

app.get('/api/data', (req, res) => {
  const content = Object.fromEntries(
    Object.entries(readData()).filter(([key]) => !CONTENT_SECRET_KEYS.test(key))
  );
  res.json({ success: true, data: content });
});

app.get('/api/admin/data', (req, res) => {
  if (!requireAdmin(req, res, req.get('X-Admin-Password'))) return;
  res.json({ success: true, data: readData() });
});

app.post('/api/data', (req, res) => {
  const { password, content, newPassword } = req.body;
  if (!requireAdmin(req, res, password)) return;
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    return res.status(400).json({ success: false, error: 'ไม่มีข้อมูล' });
  }
  if (newPassword && (process.env.ADMIN_PASSWORD || typeof newPassword !== 'string' || newPassword.length < 12)) {
    return res.status(400).json({ success: false, error: 'Password change requires at least 12 characters and is disabled when ADMIN_PASSWORD is configured' });
  }
  writeData(content, newPassword || null);
  res.json({ success: true });
});

app.post('/api/verify', (req, res) => {
  if (requireAdmin(req, res, req.body?.password)) res.json({ success: true });
});

// Analytics
app.get('/api/analytics', (req, res) => {
  if (!requireAdmin(req, res, req.get('X-Admin-Password'))) return;
  const full = readFullData();
  res.json({ success: true, analytics: full.analytics || { views: 0, pages: {} } });
});

app.post('/api/analytics', (req, res) => {
  const full = readFullData();
  const page = req.body?.page || 'unknown';
  if (!full.analytics) full.analytics = { views: 0, pages: {} };
  full.analytics.views = (full.analytics.views || 0) + 1;
  full.analytics.pages[page] = (full.analytics.pages[page] || 0) + 1;
  writeFull(full);
  res.json({ success: true });
});

// Contact messages
app.get('/api/messages', (req, res) => {
  const password = req.get('X-Admin-Password');
  if (!requireAdmin(req, res, password)) return;
  const full = readFullData();
  res.json({ success: true, messages: full.messages || [] });
});

app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, error: 'กรุณากรอกข้อมูลให้ครบ' });
  }
  const full = readFullData();
  if (!full.messages) full.messages = [];
  full.messages.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name, email, message,
    date: new Date().toISOString(),
    read: false
  });
  writeFull(full);
  res.json({ success: true });
});

app.post('/api/messages/read', (req, res) => {
  const { password, id } = req.body;
  if (!requireAdmin(req, res, password)) return;
  const full = readFullData();
  const msg = (full.messages || []).find(m => m.id === id);
  if (msg) msg.read = true;
  writeFull(full);
  res.json({ success: true });
});

// Admin: get/update projects, timeline, drawings
app.get('/api/projects', (req, res) => {
  const full = readFullData();
  res.json({ success: true, projects: full.projects || [] });
});

app.post('/api/projects', (req, res) => {
  const { password, projects } = req.body;
  if (!requireAdmin(req, res, password)) return;
  const full = readFullData();
  full.projects = projects || [];
  writeFull(full);
  res.json({ success: true });
});

app.get('/api/timeline', (req, res) => {
  const full = readFullData();
  res.json({ success: true, timeline: full.timeline || { work: [], education: [] } });
});

app.post('/api/timeline', (req, res) => {
  const { password, timeline } = req.body;
  if (!requireAdmin(req, res, password)) return;
  const full = readFullData();
  full.timeline = timeline || { work: [], education: [] };
  writeFull(full);
  res.json({ success: true });
});

app.get('/api/drawings', (req, res) => {
  const full = readFullData();
  res.json({ success: true, drawings: full.drawings || [] });
});

app.post('/api/drawings', (req, res) => {
  const { password, drawings } = req.body;
  if (!requireAdmin(req, res, password)) return;
  const full = readFullData();
  full.drawings = drawings || [];
  writeFull(full);
  res.json({ success: true });
});

// Guestbook
app.get('/api/guestbook', (req, res) => {
  const full = readFullData();
  const entries = full.guestbook || full.content?.guestbook || [];
  res.json({ success: true, entries });
});

app.post('/api/guestbook', (req, res) => {
  const { name, message } = req.body;
  if (!name || !message) {
    return res.status(400).json({ success: false, error: 'กรุณากรอกชื่อและข้อความ' });
  }
  const full = readFullData();
  if (!full.guestbook) full.guestbook = [];
  full.guestbook.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: name.trim(),
    message: message.trim(),
    date: new Date().toISOString()
  });
  writeFull(full);
  res.json({ success: true });
});

// AI Chat Proxy — ซ่อน API Key ไม่ให้โผล่ใน client-side
app.head('/api/ping', (req, res) => res.status(200).end());
app.get('/api/ping', (req, res) => res.json({ ok: true }));

app.post('/api/ai/chat', async (req, res) => {
  const { messages, provider } = req.body;
  if (!messages || !messages.length) {
    return res.status(400).json({ success: false, error: 'No messages' });
  }
  const full = readFullData();
  const content = full.content || {};

  if (provider === 'gemini') {
    const key = process.env.GEMINI_API_KEY || content['gemini-key'] || '';
    if (!key) return res.status(400).json({ success: false, error: 'No Gemini key configured' });
    const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-lite'];
    for (const model of models) {
      try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
          body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: messages.map(m => m.role + ': ' + m.content).join('\n') }] }] })
        });
        const data = await r.json();
        if (r.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          return res.json({ success: true, text: data.candidates[0].content.parts[0].text });
        }
        const err = data?.error?.message || '';
        if (err.includes('not found') || err.includes('not supported')) continue;
        if (err) return res.status(502).json({ success: false, error: err });
      } catch { continue; }
    }
    return res.status(502).json({ success: false, error: 'All models failed' });
  }

  // Default: Groq
  const key = process.env.GROQ_API_KEY || content['groq-key'] || '';
  if (!key) return res.status(400).json({ success: false, error: 'No Groq API key configured' });
  const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it'];
  for (const model of models) {
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
        body: JSON.stringify({ model, messages })
      });
      const data = await r.json();
      if (r.ok && data?.choices?.[0]?.message?.content) {
        return res.json({ success: true, text: data.choices[0].message.content });
      }
      const err = data?.error?.message || '';
      if (err.includes('not found') || err.includes('not supported')) continue;
      if (err.includes('quota') || err.includes('rate') || err.includes('limit')) {
        return res.status(429).json({ success: false, error: err });
      }
      if (err) return res.status(502).json({ success: false, error: err });
    } catch { continue; }
  }
  return res.status(502).json({ success: false, error: 'All models failed' });
});

// Image upload
app.post('/api/upload', (req, res) => {
  if (!requireAdmin(req, res, req.get('X-Admin-Password'))) return;
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, error: 'ไฟล์ใหญ่เกิน 10MB' });
    }
    if (err) return res.status(400).json({ success: false, error: 'Upload failed' });
    if (!req.file) return res.status(400).json({ success: false, error: 'ไม่มีไฟล์รูป' });
    const urlPath = 'images/uploads/' + req.file.filename;
    res.json({ success: true, path: urlPath, filename: req.file.filename });
  });
});

// List uploaded images
app.get('/api/uploads', (req, res) => {
  fs.readdir(UPLOAD_DIR, (err, files) => {
    if (err) return res.json({ success: true, files: [] });
    const images = files
      .filter(f => /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(f))
      .map(f => ({ name: f, path: 'images/uploads/' + f, url: '/images/uploads/' + f }));
    res.json({ success: true, files: images });
  });
});

// Delete uploaded image
app.post('/api/upload/delete', (req, res) => {
  const pwd = req.body?.password || req.query?.password || '';
  if (!requireAdmin(req, res, pwd)) return;
  const filename = req.body?.filename;
  if (!filename) return res.status(400).json({ success: false, error: 'No filename' });
  const filePath = path.join(UPLOAD_DIR, path.basename(filename));
  fs.unlink(filePath, (err) => {
    if (err) return res.status(404).json({ success: false, error: 'File not found' });
    res.json({ success: true });
  });
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ success: false, error: 'Not found' });
  if (!path.extname(req.path)) {
    return res.sendFile(path.join(__dirname, 'portfolio', 'index.html'));
  }
  res.status(404).sendFile(path.join(__dirname, 'portfolio', '404.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
