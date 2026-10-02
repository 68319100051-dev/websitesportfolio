const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

test('drawing upload requires admin access and signs a tagged Cloudinary request', async () => {
  process.env.ADMIN_PASSWORD = 'test-only-password';
  process.env.CLOUDINARY_CLOUD_NAME = 'example';
  process.env.CLOUDINARY_API_KEY = 'test-key';
  process.env.CLOUDINARY_API_SECRET = 'test-secret';
  const app = require('../server');
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  const originalFetch = global.fetch;
  let cloudinaryCalls = 0;
  try {
    global.fetch = async (url, options) => {
      if (!String(url).startsWith('https://api.cloudinary.com/')) {
        return originalFetch(url, options);
      }
      cloudinaryCalls++;
      const body = options.body;
      assert.equal(body.get('tags'), 'portfolio_drawings');
      assert.equal(body.get('folder'), 'portfolio/drawings');
      assert.equal(body.get('api_key'), 'test-key');
      assert.equal(body.get('signature'), crypto.createHash('sha1').update(
        `folder=portfolio/drawings&tags=portfolio_drawings&timestamp=${body.get('timestamp')}test-secret`
      ).digest('hex'));
      return Response.json({ secure_url: 'https://res.cloudinary.com/example/image/upload/v1/drawing.jpg' });
    };
    const url = `http://127.0.0.1:${server.address().port}/api/drawings/upload`;
    const makeBody = () => {
      const body = new FormData();
      body.append('image', new Blob([Buffer.from([0xff, 0xd8, 0xff, 0xd9])], { type: 'image/jpeg' }), 'drawing.jpg');
      return body;
    };
    const denied = await originalFetch(url, { method: 'POST', body: makeBody() });
    assert.equal(denied.status, 401);
    assert.equal(cloudinaryCalls, 0);
    const accepted = await originalFetch(url, {
      method: 'POST',
      headers: { 'X-Admin-Password': 'test-only-password' },
      body: makeBody()
    });
    assert.equal(accepted.status, 200);
    assert.equal((await accepted.json()).url, 'https://res.cloudinary.com/example/image/upload/v1/drawing.jpg');
    assert.equal(cloudinaryCalls, 1);
  } finally {
    global.fetch = originalFetch;
    server.close();
  }
});

test('guestbook confirms Cloudinary storage and reads entries without writing data.json', async () => {
  process.env.CLOUDINARY_CLOUD_NAME = 'example';
  process.env.CLOUDINARY_API_KEY = 'test-key';
  process.env.CLOUDINARY_API_SECRET = 'test-secret';
  const app = require('../server');
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  const originalFetch = global.fetch;
  const originalNow = Date.now;
  const dataFile = path.join(__dirname, '..', 'portfolio', 'data.json');
  const before = fs.readFileSync(dataFile);
  let stored = null;
  let publicId = null;
  try {
    global.fetch = async (url, options) => {
      const target = String(url);
      if (target.includes('/raw/upload') && target.startsWith('https://api.cloudinary.com/')) {
        const body = options.body;
        assert.equal(body.get('tags'), 'portfolio_guestbook');
        publicId = body.get('public_id');
        stored = JSON.parse(await body.get('file').text());
        return Response.json({ secure_url: 'https://res.cloudinary.com/example/raw/upload/v1/entry.txt' });
      }
      if (target.includes('/resources/raw/tags/portfolio_guestbook')) {
        assert.match(options.headers.Authorization, /^Basic /);
        return Response.json({ resources: [{ public_id: publicId, version: 1 }] });
      }
      if (target.startsWith('https://res.cloudinary.com/example/raw/upload/')) {
        return Response.json(stored);
      }
      return originalFetch(url, options);
    };
    const url = `http://127.0.0.1:${server.address().port}/api/guestbook`;
    const posted = await originalFetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Tester', message: 'A lasting message' })
    });
    assert.equal(posted.status, 200);
    assert.equal((await posted.json()).entry.message, 'A lasting message');
    Date.now = () => originalNow() + 61000;
    const listed = await originalFetch(url);
    assert.equal(listed.status, 200);
    assert.deepEqual((await listed.json()).entries.map(entry => entry.message), ['A lasting message']);
    assert.deepEqual(fs.readFileSync(dataFile), before);
  } finally {
    Date.now = originalNow;
    global.fetch = originalFetch;
    server.close();
  }
});
