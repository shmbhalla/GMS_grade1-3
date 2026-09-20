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

console.log('Array length:', raw.length);
console.log('First 300 chars:');
console.log(raw.substring(0, 300));

// Count comments in this range
const comments = (raw.match(/\/\/\s*slide-/g) || []);
console.log('\nSlide comment markers:', comments.length);

// Count braces
const openBraces = (raw.match(/\{/g) || []).length;
const closeBraces = (raw.match(/\}/g) || []).length;
console.log(`Braces: { ${openBraces} } ${closeBraces}`);

// Remove comments and find all key occurrences
let noComments = raw.replace(/\/\/[^\n]*/g, '');
console.log('\nAfter comment removal, first 300:');
console.log(noComments.substring(0, 300));

// Now look at the EXACT pattern that fails
// After removing "// slide-02 — Title" the line becomes just "{ " which starts the object
// The next line is "    img: \"data:...\"
// But wait - after the closing brace of one slide object `}`, there should be a comma

// Let's check around slide boundaries
// Find positions where "}," appears
const separators = [];
let pos = 0;
while ((pos = noComments.indexOf('"},\r\n  {', pos)) !== -1) {
  separators.push(pos);
  pos += 7;
}
console.log('\nExact "}},{" patterns found:', separators.length);

// If none, try variations
if (separators.length === 0) {
  // Check for "}\n{" patterns
  const simpleSep = (noComments.match(/\}\s*,?\s*\{/g) || []);
  console.log('Simple }\s*,\s*{ count:', simpleSep.length);

  // Also show a snippet around a slide transition
  const idx2 = noComments.indexOf('verse: "Luke 15');
  if (idx2 >= 0) {
    console.log('\nAround verse: field:');
    console.log(JSON.stringify(noComments.substring(idx2, idx2 + 200)));
  }
}