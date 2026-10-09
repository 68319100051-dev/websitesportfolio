// Run from the repository root: node build-static.js
// Publish the resulting dist directory as a Render Static Site.
const fs = require('node:fs');
const path = require('node:path');

const source = path.resolve('portfolio');
const output = path.resolve('dist');
if (!fs.existsSync(path.join(source, 'index.html'))) {
  throw new Error('Run this script from the websitesportfolio repository root.');
}

fs.rmSync(output, { recursive: true, force: true });
fs.cpSync(source, output, {
  recursive: true,
  filter: file => {
    const relative = path.relative(source, file).replaceAll('\\', '/');
    return ![
      'data.json',
      'admin.html',
      'images/uploads'
    ].some(blocked => relative === blocked || relative.startsWith(blocked + '/'));
  }
});

// The admin stays on the existing Web Service, where its API is hosted.
for (const entry of fs.readdirSync(output)) {
  if (!entry.endsWith('.html')) continue;
  const file = path.join(output, entry);
  let html = fs.readFileSync(file, 'utf8');
  html = html.replaceAll('href="admin.html"', 'href="https://konkamon-portfolio.onrender.com/admin.html"');
  fs.writeFileSync(file, html);
}

console.log('Static site ready in dist/.');

