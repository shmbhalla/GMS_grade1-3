import { readFileSync } from 'fs';

let c = readFileSync('/var/www/html/grad1-3/lesson-01-prodigal-son/storybook.html', 'utf8');

// Count quotes in entire file
let qCount = 0;
for (let i = 0; i < c.length; i++) { if (c[i] === '"') qCount++; }
console.log(`Total quotes in file: ${qCount} (${qCount%2===0?'even':'ODD'})`);

// Check if there's a " inside the base64 data area
// The base64 string opens at first " after "img:" and closes at the NEXT "
// Let's find the first img:" and the matching closing "

// Find all "data:image" occurrences
let positions = [];
let searchPos = 0;
while ((searchPos = c.indexOf('data:image', searchPos)) !== -1) {
  // Walk back to find the opening quote
  let qp = searchPos - 1;
  while (qp >= 0 && c[qp] === ' ') qp--;
  if (qp >= 0 && c[qp] === '"') {
    positions.push({ pos: qp });
  }
  searchPos++;
}
console.log(`Found ${positions.length} data:image references`);

if (positions.length > 0) {
  // For each, find the matching closing quote
  for (let pi = 0; pi < Math.min(positions.length, 3); pi++) {
    const closeQuote = positions[pi].pos + 1; // Next char should be 'd' of data
    // Find closing " (skipping nothing since base64 has no ")
    let cp = closeQuote + 1;
    let braceDepth = 0;
    let arrayDepth = 0;
    let closed = false;
    while (cp < c.length && cp - closeQuote < 100000) {
      const ch = c[cp];
      if (ch === '(') braceDepth++;
      if (ch === ')') braceDepth--;
      if (ch === '[') arrayDepth++;
      if (ch === ']') arrayDepth--;
      if (ch === '"') {
        // Could be closing the data URI or opening another string
        // Check: what follows?
        let after = cp + 1;
        while (after < c.length && /\s/.test(c[after])) after++;

        if (arrayDepth <= 0 && braceDepth <= 0) {
          // Outside arrays/objects - this is likely closing the data URI
          console.log(`\nSlide ${pi}: img value ends at pos ${cp}`);
          console.log(`Value length: ${cp - closeQuote - 1} chars (~${((cp-closeQuote-1)*0.75/1024).toFixed(1)}KB)`);
          console.log(`After: "${c.substring(after, Math.min(after+40, c.length))}"`);
          closed = true;
          break;
        }
        cp++;
      }
      cp++;
    }
    if (!closed) {
      console.log(`\nSlide ${pi}: Could not find closing quote within 100KB scan`);
    }
  }
}

// Also try a simple regex to find complete img:value patterns
console.log('\n\nTrying regex extraction:');
const regexPattern = /"data:image\/(jpeg|jpg);base64,[^"]{50,}"/g;
let rm;
let regMatchCount = 0;
while ((rm = regexPattern.exec(c)) !== null) {
  regMatchCount++;
  if (regMatchCount <= 3) {
    const len = rm[0].length;
    console.log(`RegMatch ${regMatchCount}: ${len} chars`);
  }
}
console.log(`Total regex matches: ${regMatchCount}`);

// Another approach: just use the browser's native JS parsing
// Extract the full script tag content and eval it
const scriptMatch = c.match(/<script>([\s\S]*?)<\/script>/);
if (scriptMatch) {
  console.log(`\nScript tag content: ${(scriptMatch[1].length / 1024).toFixed(1)}KB`);
}

// Best approach: extract just the slides section and eval
const slidesLineIdx = c.indexOf('const slides = [');
if (slidesLineIdx >= 0) {
  // Build a self-contained module
  // First find the ending of the slides array
  let depth = 0;
  let endPos;
  for (let i = slidesLineIdx; i < c.length; i++) {
    if (c[i] === '[') depth++;
    else if (c[i] === ']') { depth--; if (depth === 0) { endPos = i + 1; break; } }
  }

  const arrayContent = c.substring(slidesLineIdx, endPos);
  console.log(`\nSlides array content: ${(arrayContent.length / 1024 / 1024).toFixed(2)}MB`);

  // Try to eval directly - the original format should work in JS
  // The issue might be that there's a literal newline INSIDE a double-quoted string
  // which is invalid JS syntax

  // Check for such cases
  let inStr2 = false, esc2 = false;
  for (let i = 0; i < arrayContent.length; i++) {
    const ch = arrayContent[i];
    if (esc2) { esc2 = false; continue; }
    if (ch === '\\') { esc2 = true; continue; }
    if (ch === '"') { inStr2 = !inStr2; continue; }
    if (!inStr2) continue;
    if (ch === '\n' || ch === '\r') {
      console.log(`PROBLEM: Newline at position ${i} inside quoted string!`);
      console.log(`Context: "...${arrayContent.substring(Math.max(0,i-30), i+10)}..."`);
      break;
    }
  }
}