const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const temporaryDir = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-security-'));
const dataFile = path.join(temporaryDir, 'data.json');
process.env.PORTFOLIO_DATA_FILE = dataFile;
process.env.ADMIN_INITIAL_PASSWORD = 'local-test-password-only';
const app = require('../server');

test('admin security and public response boundaries', async () => {
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const request = (url, options) => fetch(base + url, options);
  const adminHeaders = { 'X-Admin-Password': process.env.ADMIN_INITIAL_PASSWORD };
  try {
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    data.content = {
      title: 'Public portfolio',
      'groq-key': 'dummy-test-value',
      'cloudinary-preset': 'dummy-test-preset'
    };
    fs.writeFileSync(dataFile, JSON.stringify(data));

    const ping = await request('/api/ping');
    assert.equal(ping.status, 200);
    assert.equal(ping.headers.get('x-powered-by'), null);
    assert.equal(ping.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(ping.headers.get('x-frame-options'), 'DENY');
    assert.match(ping.headers.get('content-security-policy'), /default-src 'self'/);
    assert.equal(ping.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');

    assert.equal((await request('/data.json')).status, 404);
    assert.equal((await request('/%64ata.json')).status, 404);

    const publicData = await (await request('/api/data')).json();
    assert.equal(publicData.data.title, 'Public portfolio');
    assert.equal('groq-key' in publicData.data, false);
    assert.equal('cloudinary-preset' in publicData.data, false);

    assert.equal((await request('/api/analytics')).status, 401);
    assert.equal((await request('/api/analytics', { headers: adminHeaders })).status, 200);
    assert.equal((await request('/api/messages?password=local-test-password-only')).status, 401);
    assert.equal((await request('/api/messages', { headers: adminHeaders })).status, 200);
    const adminData = await (await request('/api/admin/data', { headers: adminHeaders })).json();
    assert.equal(adminData.data['groq-key'], 'dummy-test-value');

    assert.equal((await request('/api/upload', { method: 'POST' })).status, 401);
    const login = await request('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: process.env.ADMIN_INITIAL_PASSWORD })
    });
    assert.equal(login.status, 200);

    const badLogin = () => request('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'wrong-password' })
    });
    for (let i = 0; i < 4; i++) assert.equal((await badLogin()).status, 401);
    const blocked = await badLogin();
    assert.equal(blocked.status, 429);
    assert.ok(Number(blocked.headers.get('retry-after')) > 0);
    assert.equal((await badLogin()).status, 429);
  } finally {
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(temporaryDir, { recursive: true, force: true });
  }
});
