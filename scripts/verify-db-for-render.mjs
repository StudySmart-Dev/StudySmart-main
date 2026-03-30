import { readFileSync } from 'node:fs';

const required = ['users', 'groups', 'notes', 'meetings', 'meetingMessages', 'whiteboards', 'xpEvents'];

const raw = readFileSync(new URL('../db.json', import.meta.url), 'utf8');
const db = JSON.parse(raw);

for (const k of required) {
  if (!(k in db)) {
    console.error(`db.json is missing required key: "${k}"`);
    process.exit(1);
  }
  if (!Array.isArray(db[k])) {
    console.error(`db.json "${k}" must be an array`);
    process.exit(1);
  }
}

console.log('db.json OK — collections:', required.map((k) => `${k}(${db[k].length})`).join(', '));
