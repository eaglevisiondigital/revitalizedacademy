const fs = require('node:fs');
const path = require('node:path');
const { resolve } = require('../js/environment.js');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'production-dist');
const files = require('../config/production-public-files.json');
const config = resolve(require('../config/production.json'));

if (config.environment !== 'production' || config.projectRef !== 'voalfpxiyznnqfcqcymd' || config.appOrigin !== 'https://revitalizedacademy.com') {
  throw new Error('Production public configuration mismatch');
}

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
for (const file of files) {
  if (file.includes('..') || file.startsWith('/') || !/^[a-zA-Z0-9._/-]+$/.test(file)) throw new Error(`Unsafe public path: ${file}`);
  const source = path.join(root, file);
  const target = path.join(output, file);
  if (!fs.existsSync(source) || fs.lstatSync(source).isSymbolicLink()) throw new Error(`Invalid public source: ${file}`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  let bytes = fs.readFileSync(source);
  if (file === 'consult.html' || file === 'portal/index.html') {
    bytes = Buffer.from(bytes.toString().replace(/<head([^>]*)>/i, '<head$1>\n<script src="/runtime-config.js"></script>\n<script src="/js/environment.js"></script>'));
  }
  fs.writeFileSync(target, bytes);
}
fs.writeFileSync(path.join(output, 'runtime-config.js'), `window.RVA_PUBLIC_CONFIG = ${JSON.stringify(config)};\n`);
console.log(JSON.stringify({ files: files.length + 1, environment: config.environment, projectRef: config.projectRef }));
