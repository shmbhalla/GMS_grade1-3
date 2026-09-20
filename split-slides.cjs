const fs = require('fs');
let c = fs.readFileSync('/var/www/html/grad1-3/lesson-01-prodigal-son/storybook.html', 'utf8');

// Find slides boundaries via bracket counting
const searchStart = c.indexOf('const slides = [');
let depth = 0;
let endPos;
for (let idx = searchStart; idx < c.length; idx++) {
  if (c[idx] === '[') depth++;
  else if (c[idx] === ']') { depth--; if (depth === 0) { endPos = idx + 1; break; } }
}

const rawArray = c.substring(searchStart + 'const slides = ['.length, endPos - searchStart - 'const slides = ['.length);

// KEY INSIGHT: Split on "// slide-" comment markers BEFORE removing them
// Each slide starts with "// slide-N" or is preceded by "},\r\n  {"
// Using // slide- as delimiter keeps the slide objects intact
let pieces = rawArray.split(/^\s*\/\/\s*slide-\d+/m).filter(p => p.trim().length > 0);
console.log('Split into', pieces.length, 'pieces');

// Function to add quotes around unquoted known keys
const KNOWN = ['img','title','text','verse','quiz','q','options','correct','explanation'];

function quoteKeys(text) {
  let result = '';
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '\\' && i+1 < text.length) { result += ch+text[i+1]; i+=2; continue; }
    if (ch === '"') {
      result += '"'; i++;
      while (i < text.length) {
        if (text[i] === '\\' && i+1 < text.length) { result += text[i]+text[i+1]; i+=2; continue; }
        if (text[i] === '"') { result += '"'; i++; break; }
        result += text[i]; i++;
      }
      continue;
    }
    if (/^[a-zA-Z_$]/.test(ch)) {
      let j = i;
      while (j < text.length && /^[a-zA-Z0-9_$]/.test(text[j])) j++;
      const word = text.substring(i, j);
      let k = j;
      while (k < text.length && /\s/.test(text[k])) k++;
      if (k < text.length && text[k] === ':') {
        let p = i - 1;
        while (p >= 0 && /\s/.test(text[p])) p--;
        if ((text[p] === '{' || text[p] === ',') && KNOWN.includes(word)) {
          result += '"' + word + '":';
          i = k + 1;
          continue;
        }
      }
    }
    result += ch;
    i++;
  }
  return result;
}

let allSlides = [];
let failedAt = -1;

for (let pi = 0; pi < pieces.length; pi++) {
  let piece = pieces[pi].trim();

  // First piece may have leading whitespace or extra [{ characters
  // Just wrap everything as an object literal
  let obj = '{' + piece + '}';

  // Quote keys
  const quoted = quoteKeys(obj);

  // Check for remaining violations
  let badCount = 0;
  let vip = 0, vinStr = false;
  while (vip < quoted.length) {
    const vc = quoted[vip];
    if (vc === '\\') { vip += 2; continue; }
    if (vc === '"') { vinStr = !vinStr; vip++; continue; }
    if (vinStr) { vip++; continue; }
    if (/^[a-zA-Z_]/.test(vc)) {
      let mj = vip;
      while (mj < quoted.length && /^[a-zA-Z0-9_]/.test(quoted[mj])) mj++;
      let mk = mj;
      while (mk < quoted.length && /\s/.test(quoted[mk])) mk++;
      if (mk < quoted.length && quoted[mk] === ':') {
        let mp = vip - 1;
        while (mp >= 0 && /\s/.test(quoted[mp])) mp--;
        if (mp < 0 || (quoted[mp] !== '{' && quoted[mp] !== ',')) {
          badCount++;
          if (badCount <= 3) {
            console.error(`Piece ${pi}: Unquoted "${quoted.substring(vip,mj)}" at pos ${vip}`);
            console.error(`  prev="${quoted[mp]}" code=${quoted.charCodeAt(mp)}`);
          }
        }
      }
      vip = mj;
    } else vip++;
  }

  if (badCount > 0) {
    console.error(`Piece ${pi}: ${badCount} violations`);
    console.error(`  Preview: ${quoted.substring(0,200).replace(/[^\x20-\x7E]/g,'?')}`);
    failedAt = pi;
    break;
  }

  try {
    const fn = new Function('return (' + quoted + ')');
    const slide = fn();
    allSlides.push(slide);
  } catch(e) {
    console.error(`Piece ${pi}: eval failed - ${e.message}`);
    console.error(`  Preview: ${quoted.substring(0,200).replace(/[^\x20-\x7E]/g,'?')}`);
    failedAt = pi;
    break;
  }
}

console.log(`\nParsed ${allSlides.length}/${pieces.length} slides`);
if (failedAt >= 0) {
  console.log(`Failed at piece ${failedAt}`);
  fs.writeFileSync('/tmp/bad-piece.json', pieces[failedAt]);
} else {
  console.log('\nFirst 3 titles:');
  for (let si = 0; si < Math.min(allSlides.length, 3); si++) {
    console.log(si + ': "' + allSlides[si].title + '" img=' + (allSlides[si].img ? (allSlides[si].img.startsWith("data:")?"DATA":"PATH"):"EMPTY"));
  }
  console.log('\nLast title:', allSlides[allSlides.length-1]?.title);
  console.log('Total slides:', allSlides.length);
}