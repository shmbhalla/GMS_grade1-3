import { readFileSync } from 'fs';

let c = readFileSync('/var/www/html/grad1-3/lesson-01-prodigal-son/storybook.html', 'utf8');
const searchStart = c.indexOf('const slides = [');

let depth = 0;
let endIdx;
for (let idx = searchStart; idx < c.length; idx++) {
  if (c[idx] === '[') depth++;
  else if (c[idx] === ']') { depth--; if (depth === 0) { endIdx = idx; break; } }
}

// Inner = exactly between [ and ]
const inner = c.substring(searchStart + 'const slides = ['.length, endIdx);

// Try wrapping as array literal for Function constructor
const wrapped = '(' + inner + ')';
try {
  const fn = new Function('return ' + wrapped);
  const result = fn();
  console.log('SUCCESS via Function:', result.length, 'slides');
  for (let i = 0; i < Math.min(result.length, 5); i++) {
    console.log(i + ': "' + result[i].title + '" imgType=' + (result[i].img ? (result[i].img.startsWith("data:")?"DATA":"PATH"):"EMPTY"));
  }
} catch(e) {
  console.error('Function error:', e.message);

  // Debug: save problematic area around first "title" that appears after an unquoted key
  // Find position of first remaining "word:" outside strings
  let vp = 0, vinS = false;
  while (vp < wrapped.length) {
    const vc = wrapped[vp];
    if (vc === '"') { vinS = !vinS; vp++; continue; }
    if (vinS) { vp++; continue; }
    if (/^[a-zA-Z_$]/.test(vc)) {
      let mj = vp;
      while (mj < wrapped.length && /^[a-zA-Z0-9_$]/.test(wrapped[mj])) mj++;
      const mid = wrapped.substring(vp, mj);
      let mk = mj;
      while (mk < wrapped.length && /\s/.test(wrapped[mk])) mk++;
      if (mk < wrapped.length && wrapped[mk] === ':') {
        let mp = vp - 1;
        while (mp >= 0 && /\s/.test(wrapped[mp])) mp--;
        if (mp < 0 || (wrapped[mp] !== '{' && wrapped[mp] !== ',')) {
          console.error('Bad key at pos ' + vp + ': "' + mid + '", prev="' + wrapped[mp] + '" code=' + wrapped.charCodeAt(mp));
          console.error('Context: "' + wrapped.substring(Math.max(0,mp-5), vp+mid.length+20).replace(/[\r\n]/g,'.') + '"');
          break;
        }
      }
      vp = mj;
    } else vp++;
  }
}