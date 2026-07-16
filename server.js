const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'portfolio', 'data.json');
const DEFAULT_PASSWORD = 'admin123';
let adminPassword = DEFAULT_PASSWORD;

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
app.use(express.static(path.join(__dirname, 'portfolio')));

function hash(pwd) {
  return crypto.createHash('sha256').update(pwd).digest('hex');
}

function initDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    const initial = {
      password: hash(DEFAULT_PASSWORD),
      content: {},
      messages: [],
      analytics: { views: 0, pages: {} }
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf-8');
  }
  try {
    const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    adminPassword = raw.password || hash(DEFAULT_PASSWORD);
  } catch { /* use default */ }
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
  const content = readData();
  res.json({ success: true, data: content });
});

app.post('/api/data', (req, res) => {
  const { password, content, newPassword } = req.body;
  if (!password || hash(password) !== adminPassword) {
    return res.status(401).json({ success: false, error: 'รหัสผ่านไม่ถูกต้อง' });
  }
  if (!content) {
    return res.status(400).json({ success: false, error: 'ไม่มีข้อมูล' });
  }
  writeData(content, newPassword || null);
  res.json({ success: true });
});

app.post('/api/verify', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ success: false });
  res.json({ success: hash(password) === adminPassword });
});

// Analytics
app.get('/api/analytics', (req, res) => {
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
  const { password } = req.query;
  if (!password || hash(password) !== adminPassword) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
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
  if (!password || hash(password) !== adminPassword) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
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
  if (!password || hash(password) !== adminPassword) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
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
  if (!password || hash(password) !== adminPassword) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
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
  if (!password || hash(password) !== adminPassword) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
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
    const key = content['gemini-key'] || '';
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
  const key = content['groq-key'] || '';
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
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, error: 'ไฟล์ใหญ่เกิน 10MB' });
    }
    if (err) return res.status(400).json({ success: false, error: 'Upload failed: ' + err.message });
    const pwd = req.body?.password || req.query?.password || '';
    if (!pwd || hash(pwd) !== adminPassword) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
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
  if (!pwd || hash(pwd) !== adminPassword) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  const filename = req.body?.filename;
  if (!filename) return res.status(400).json({ success: false, error: 'No filename' });
  const filePath = path.join(UPLOAD_DIR, path.basename(filename));
  fs.unlink(filePath, (err) => {
    if (err) return res.status(404).json({ success: false, error: 'File not found' });
    res.json({ success: true });
  });
});

app.get('*', (req, res) => {
  const filePath = path.join(__dirname, 'portfolio', req.path === '/' ? 'index.html' : req.path);
  const ext = path.extname(req.path);
  // ถ้าเป็น path API หรือไม่มีนามสกุลไฟล์ — ส่ง index.html (SPA fallback)
  if (req.path.startsWith('/api/') || !ext) {
    return res.sendFile(path.join(__dirname, 'portfolio', 'index.html'));
  }
  // ถ้าไฟล์ไม่มีอยู่จริง — 404
  if (!fs.existsSync(filePath)) {
    return res.status(404).sendFile(path.join(__dirname, 'portfolio', '404.html'));
  }
  res.sendFile(filePath);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
