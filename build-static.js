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

// The server is already awake when it can serve index.html. A second polling
// screen only delays the page and can leave it covered indefinitely on errors.
const homeFile = path.join(output, 'index.html');
let home = fs.readFileSync(homeFile, 'utf8');
const splashStart = home.indexOf('  <div id="renderSplash"');
const scriptTag = home.indexOf('  <script src="script.js"></script>', splashStart);
if (splashStart < 0 || scriptTag < 0) throw new Error('Splash markup changed; review the build script.');
home = home.slice(0, splashStart) + home.slice(scriptTag);
const pollStart = home.search(/  <script>\r?\n    \(function\(\) \{\r?\n      const splash = document\.getElementById\('renderSplash'\);/);
const pollEnd = home.indexOf('  </script>', pollStart);
if (pollStart < 0 || pollEnd < 0) throw new Error('Splash script changed; review the build script.');
home = home.slice(0, pollStart) + home.slice(pollEnd + '  </script>'.length);
fs.writeFileSync(homeFile, home);

// The admin stays on the existing Web Service, where its API is hosted.
for (const entry of fs.readdirSync(output)) {
  if (!entry.endsWith('.html')) continue;
  const file = path.join(output, entry);
  let html = fs.readFileSync(file, 'utf8');
  html = html.replaceAll('href="admin.html"', 'href="https://konkamon-portfolio.onrender.com/admin.html"');
  fs.writeFileSync(file, html);
}

console.log('Static site ready in dist/.');

