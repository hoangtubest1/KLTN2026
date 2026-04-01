/**
 * Copy CRA output (client/build) into server/public for Railway / single-process deploy.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(root, 'client', 'build');
const dest = path.join(root, 'server', 'public');

if (!fs.existsSync(src)) {
  console.error('Missing client/build. Run: cd client && npm run build');
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });
fs.cpSync(src, dest, { recursive: true });
console.log('Synced client/build -> server/public');
