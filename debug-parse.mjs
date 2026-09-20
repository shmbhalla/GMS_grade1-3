import { readFileSync } from 'fs';

let c = readFileSync('/var/www/html/grad1-3/lesson-01-prodigal-son/storybook.html', 'utf8');

const searchStart = c.indexOf('const slides = [');
console.log('Found "const slides" at index:', searchStart);

let depth = 0;
let endIdx;
for (let i = searchStart; i < c.length; i++) {
  if (c[i] === '[') depth++;
  else if (c[i] === ']') { depth--; if (depth === 0) { endIdx = i + 1; break; } }
}
console.log('Bracket match ends at index:', endIdx);

const raw = c.substring(searchStart + 'const slides = ['.length, endIdx);
console.log('Array length:', raw.length);
console.log('First 50 chars:', JSON.stringify(raw.substring(0, 50)));
console.log('Last 50 chars:', JSON.stringify(raw.substring(raw.length - 50)));

// Remove comments
let cleaned = raw.replace(/\/\/[^\n]*/g, '');

// Replace unquoted keys with quoted keys
cleaned = cleaned.replace(
  /([{,])\s*([a-zA-Z_]\w*)\s*:\s*/g,
  function(match, openBracket, keyName) {
    return JSON.parse('"'+openBracket+'"') + '"' + keyName + '":';
  }
);

console.log('Cleaned first 400 chars:');
console.log(cleaned.substring(0, 400));

try {
  const fn = new Function('return (' + cleaned + ')');
  const result = fn();
  console.log('\nSUCCESS! Parsed', result.length, 'slides');
  for (let j = 0; j < Math.min(result.length, 3); j++) {
    const s = result[j];
    console.log(j, JSON.stringify({t:s.title, imgType: s.img && s.img.startsWith('data:') ? 'DATA' : '-', textArr: Array.isArray(s.text) ? s.text.length : 0}));
  }
} catch(e) {
  console.log('\nError:', e.message);
}