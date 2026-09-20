const fs = require('fs');
let c = fs.readFileSync('/var/www/html/grad1-3/lesson-01-prodigal-son/storybook.html', 'utf8');
const s = c.indexOf('const slides = [');

// Find actual opening bracket position
const openBracketPos = c.indexOf('[', s);
console.log('Open bracket at:', openBracketPos);

let d = 0;
let endIdx;
for (let k = openBracketPos; k < c.length; k++) {
  if (c[k] === '[') d++;
  else if (c[k] === ']') { d--; if (d === 0) { endIdx = k + 1; break; } }
}
console.log('Matched close at:', endIdx);

// Inner = EXACTLY between [ and ]
const properInner = c.substring(openBracketPos + 1, endIdx - 1);
console.log('Inner length:', properInner.length / 1024, 'KB');
console.log('First 50:', JSON.stringify(properInner.slice(0, 50)));
console.log('Last 50:', JSON.stringify(properInner.slice(-50)));

// Count quotes
let qCount = 0;
for (let i = 0; i < properInner.length; i++) { if (properInner[i] === '"') qCount++; }
console.log('Quotes:', qCount, '(odd='+(qCount%2===1)+')');

// Remove comments
const nc = properInner.replace(/\/\/[^\n]*/g, '');
let qCount2 = 0;
for (let i = 0; i < nc.length; i++) { if (nc[i] === '"') qCount2++; }
console.log('After comment removal quotes:', qCount2, '(odd='+(qCount2%2===1)+')');

// Try Function constructor on cleaned version
try {
  const fn = new Function('return (' + nc + ')');
  const r = fn();
  console.log('\nSUCCESS via Function (noComments):', r.length, 'slides');
  for (let j = 0; j < Math.min(r.length, 3); j++) {
    console.log(j + ': "' + r[j].title + '" imgType=' + (r[j].img ? (r[j].img.startsWith("data:")?"DATA":"PATH"):"EMPTY"));
  }
} catch(e) {
  console.error('\nFunction failed:', e.message);

  // Debug remaining key patterns
  let vp = 0, vinS = false, badCount = 0;
  while (vp < nc.length) {
    const vc = nc[vp];
    if (vc === '"') { vinS = !vinS; vp++; continue; }
    if (vinS) { vp++; continue; }
    if (/^[a-zA-Z_]/.test(vc)) {
      let mj = vp;
      while (mj < nc.length && /^[a-zA-Z0-9_]/.test(nc[mj])) mj++;
      let mk = mj;
      while (mk < nc.length && /\s/.test(nc[mk])) mk++;
      if (mk < nc.length && nc[mk] === ':') {
        let mp = vp - 1;
        while (mp >= 0 && /\s/.test(nc[mp])) mp--;
        if (mp < 0 || (nc[mp] !== '{' && nc[mp] !== ',')) {
          badCount++;
          if (badCount <= 5) {
            const mid = nc.substring(vp, mj);
            console.error('Bad key: "' + mid + '" at pos ' + vp);
            console.error('  prev char code=' + nc.charCodeAt(mp) + ' context="' + nc.substring(Math.max(0,mp-10),vp+mid.length+20).replace(/[\r\n]/g,'.') + '"');
          }
        }
      }
      vp = mj;
    } else vp++;
  }
  console.log('Total unquoted-key violations:', badCount);

  // Try wrapping as array literal
  try {
    const wrapped = '[' + nc + ']';
    const fn2 = new Function('return (' + wrapped + ')');
    const r2 = fn2();
    console.log('Wrapped function SUCCESS:', r2.length, 'slides');
  } catch(e2) {
    console.error('Wrapped also failed:', e2.message);
    fs.writeFileSync('/tmp/bad-inner.txt', nc.slice(0, 10000));
    console.log('Saved debug to /tmp/bad-inner.txt');
  }
}