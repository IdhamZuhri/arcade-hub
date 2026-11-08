import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scaffold } from './lib/scaffold.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [owner, name] = process.argv.slice(2);

if (!owner || !name) {
  console.error('Usage: npm run new-game -- <owner> <name>');
  process.exit(1);
}

try {
  scaffold({ root, owner, name });
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
console.log(`Created games/${owner}/${name}`);
console.log('Next steps:');
console.log('  npm install');
console.log(`  npm run dev -w games/${owner}/${name}`);
