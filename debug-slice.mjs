import { readFileSync } from 'fs';
let c = readFileSync('/var/www/html/grad1-3/lesson-01-prodigal-son/storybook.html', 'utf8');
const searchStart = c.indexOf('const slides = [');

let depth = 0;
let endIdx;
for (let i = searchStart; i < c.length; i++) {
  if (c[i] === '[') depth++;
  else if (c[i] === ']') { depth--; if (depth === 0) { endIdx = i + 1; break; } }
}
const raw = c.substring(searchStart + 'const slides = ['.length, endIdx);

// Split by // slide-N markers to isolate individual slide objects
// Each comment marks the START of a new slide object
const parts = raw.split(/\/\/\s*slide-/);
console.log('Parts after split:', parts.length);

// First part is before any comment (should be empty or whitespace + first slide)
for (let pi = 0; pi < Math.min(parts.length, 5); pi++) {
  const part = parts[pi];
  console.log(`\n--- Part ${pi}, length: ${part.length} ---`);
  console.log(part.substring(0, 300));
}