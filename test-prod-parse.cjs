const fs = require('fs');
let c = fs.readFileSync('/var/www/html/grad1-3/lesson-01-prodigal-son/storybook.html', 'utf8');

// Find slides boundaries
const searchStart = c.indexOf('const slides = [');
let depth = 0;
let endPos;
for (let idx = searchStart; idx < c.length; idx++) {
  if (c[idx] === '[') depth++;
  else if (c[idx] === ']') { depth--; if (depth === 0) { endPos = idx + 1; break; } }
}

const inner = c.substring(searchStart + 'const slides = ['.length, endPos - searchStart - 'const slides = ['.length);

console.log('First char code:', inner.charCodeAt(0), '(' + JSON.stringify(inner[0]) + ')');

// Try different wrapper approaches
try {
  // Method 1: Array literal wrapper
  const wrapped1 = '[' + inner + ']';
  const fn1 = new Function('return (' + wrapped1 + ')');
  const r1 = fn1();
  console.log('Array wrapper: SUCCESS:', r1.length, 'slides');
} catch(e) {
  console.error('Array wrapper failed:', e.message);

  // Method 2: Function call wrapper
  try {
    const wrapped2 = 'JSON.parse(JSON.stringify(' + inner + '))';
    console.log('This would require JSON parsing which the raw content is NOT');
  } catch(e2) {}

  // Method 3: Direct eval via vm
  try {
    const vmModule = require('vm');
    const ctx = vmModule.createContext({});
    const arrContent = '[' + inner + ']';
    const result = vmModule.runInContext(arrContent, ctx);
    console.log('VM array wrapper: SUCCESS:', result.length, 'slides');
    for (let si = 0; si < Math.min(result.length, 3); si++) {
      console.log(si + ': "' + result[si].title + '" img=' + (result[si].img ? (result[si].img.startsWith("data:")?"DATA":"PATH"):"EMPTY"));
    }
  } catch(e3) {
    console.error('VM also failed:', e3.message);

    // Debug: save first 500 chars to file
    fs.writeFileSync('/tmp/debug-inner.txt', inner.slice(0, 5000));
    console.log('Saved debug to /tmp/debug-inner.txt');

    // Check if issue is stack size from huge nested function calls
    console.log('Inner length in bytes:', Buffer.byteLength(inner, 'utf8') / 1024 / 1024, 'MB');
    console.log('Buffer byte count:', Buffer.byteLength(inner, 'utf8'));

    // Try loading into external file then using node --require eval
    // For now just accept this limitation and write the HTML manually
  }
}