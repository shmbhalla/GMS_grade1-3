import { readFileSync } from 'fs';

let c = readFileSync('/var/www/html/grad1-3/lesson-01-prodigal-son/storybook.html', 'utf8');
const searchStart = c.indexOf('const slides = [');
let depth = 0;
for (let idx = searchStart; idx < c.length; idx++) {
  if (c[idx] === '[') depth++;
  else if (c[idx] === ']') { depth--; if (depth === 0) break; }
}
const inner = c.substring(searchStart + 'const slides = ['.length);

// Count quotes and look for odd consecutive runs
let qCount = 0;
let badPositions = [];
for (let i = 0; i < Math.min(inner.length, 500000); i++) {
  if (inner[i] === '"') {
    let ci = i;
    while (ci < inner.length && inner[ci] === '"') ci++;
    const count = ci - i;
    if (count % 2 !== 0) {
      badPositions.push({pos: i, len: count});
    }
    qCount += count;
    i = ci - 1;
  }
}
console.log('Quotes in first 500KB:', qCount, 'odd='+(qCount%2===1));
console.log('Odd-consecutive-quote groups:', badPositions.length);
badPositions.slice(0,5).forEach(p => {
  console.log('  Position', p.pos, ':', JSON.stringify(inner.substring(Math.max(0,p.pos-20),p.pos+p.len+20)));
});

// Check for literal newlines within quoted strings
let inStr = false;
let esc = false;
let newlinesInStrings = [];
for (let i = 0; i < Math.min(inner.length, 500000); i++) {
  const ch = inner[i];
  if (esc) { esc = false; continue; }
  if (ch === '\\') { esc = true; continue; }
  if (ch === '"') { inStr = !inStr; continue; }
  if (!inStr) continue;
  if (ch === '\n' || ch === '\r') {
    newlinesInStrings.push(i);
  }
}
console.log('Newlines in quoted strings:', newlinesInStrings.length);
if (newlinesInStrings.length > 0) {
  console.log('Sample positions:', newlinesInStrings.slice(0, 3));
}

// Now check what the actual content at the very end of inner looks like
console.log('\nLast 100 chars:', JSON.stringify(inner.slice(-100)));