const fs = require('fs');
let c = fs.readFileSync('/var/www/html/grad1-3/lesson-01-prodigal-son/storybook.html','utf8');

// Find slides boundaries
const searchStart = c.indexOf('const slides = [');
let depth = 0;
let endPos;
for (let idx = searchStart; idx < c.length; idx++) {
  if (c[idx] === '[') depth++;
  else if (c[idx] === ']') { depth--; if (depth === 0) { endPos = idx; break; } }
}

const inner = c.substring(searchStart + 'const slides = ['.length, endPos);

console.log('First 100 chars:');
for (let i = 0; i < Math.min(100, inner.length); i++) {
  const ch = inner[i];
  console.log(i + ': ' + JSON.stringify(ch) + ' code=' + inner.charCodeAt(i));
}