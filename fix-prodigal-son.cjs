/** fix-prodigal-son.cjs — Extract images and convert lesson-01 (prodigal son) */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execSync } = require('child_process');

const BASE = '/var/www/html/grad1-3';
const dir = path.join(BASE, 'lesson-01-prodigal-son');
const htmlPath = path.join(dir, 'storybook.html');

console.log('--- Processing lesson-01-prodigal-son ---');

// The prodigal son file uses UNQUOTED JS keys like: img: "value", title: "value"
// This is NOT valid JSON but IS valid JS. We need vm.runInContext to parse it.

let content = fs.readFileSync(htmlPath, 'utf8');

// Find the const slides = [ array boundaries
const searchStart = content.indexOf('const slides = [');
if (searchStart === -1) { console.log('ERROR: No slides found'); process.exit(1); }

let depth = 0;
let endIdx;
for (let idx = searchStart; idx < content.length; idx++) {
  if (content[idx] === '[') depth++;
  else if (content[idx] === ']') { depth--; if (depth === 0) { endIdx = idx + 1; break; } }
}

// Extract just the array literal (between [ and ])
const inner = content.substring(searchStart + 'const slides = ['.length, endIdx - searchStart - 'const slides = ['.length);

// Try vm.runInContext first (works for the prodigal-son format)
let slides;
try {
  const ctx = vm.createContext({});
  slides = vm.runInContext(inner, ctx);
  console.log('Parsed via vm.runInContext:', slides.length, 'slides');
} catch(e) {
  console.error(`vm failed: ${e.message}`);
  // Fallback: try Function constructor with the array wrapped in parentheses
  try {
    const fn = new Function('return (' + inner + ')');
    slides = fn();
    console.log('Parsed via Function:', slides.length, 'slides');
  } catch(e2) {
    console.error(`Function also failed: ${e2.message}`);
    process.exit(1);
  }
}

// Clean old images directory
try { execSync(`rm -rf "${path.join(dir, 'images')}"`, { stdio: 'ignore' }); } catch(e) {}

// Extract base64 images
let extractedCount = 0;
for (let i = 0; i < slides.length; i++) {
  const imgVal = slides[i].img || '';
  const commaPos = imgVal.indexOf(',');
  if (commaPos > 0 && imgVal.startsWith('data:image/')) {
    const buffer = Buffer.from(imgVal.substring(commaPos + 1), 'base64');
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
      const fname = `slide-${String(i + 1).padStart(2, '0')}.jpg`;
      require('fs').mkdirSync(path.join(dir, 'images'), { recursive: true });
      require('fs').writeFileSync(path.join(dir, 'images', fname), buffer);
      slides[i].img = `images/${fname}`;
      const kb = Math.round(buffer.length / 1024);
      console.log(`  Slide ${i+1}: ${fname} (${kb}KB)`);
      extractedCount++;
    } else {
      console.warn(`  Slide ${i+1}: Invalid JPEG bytes, keeping embedded`);
    }
  }
}

// Verify images exist
let okImages = 0, totalImgs = 0;
for (let i = 0; i < slides.length; i++) {
  if (slides[i].img && !slides[i].img.startsWith('data:')) {
    totalImgs++;
    try {
      if (require('fs').statSync(path.join(dir, slides[i].img)).size > 0) okImages++;
      else console.error(`EMPTY: ${slides[i].img}`);
    } catch(e) { console.error(`MISSING: ${slides[i].img}`); }
  }
}
console.log(`Extracted: ${extractedCount}, Images verified: ${okImages}/${totalImgs} OK`);

// Remove any existing quiz slide before adding fresh one
const lastSlide = slides[slides.length - 1];
if (lastSlide && lastSlide.quiz && lastSlide.quiz.length > 0) {
  slides.pop();
}

// Add quiz slide
const QUIZ_DATA = [
  { q: "What did the younger son ask his father for?", options: ["His share of the family money", "A horse to ride away", "Food for the journey", "A new robe"], correct: 0, explanation: "He wanted his inheritance early so he could leave home." },
  { q: "How did the father treat his returning son?", options: ["He sent him to work as a servant", "He gave him a slap on the face", "He ran to hug him and threw a feast", "He ignored him and went back inside"], correct: 2, explanation: "The father ran to greet him, put a robe and ring on him, and celebrated!" },
  { q: "Why was the older brother angry?", options: ["He didn't get any gifts", "His father forgave his brother even though he didn't come home", "He lost all his money too", "The servants were noisy"], correct: 1, explanation: "He was upset that the father celebrated for his brother who wasted everything." }
];
slides.push({ img: '', title: 'Fun Review!', quiz: QUIZ_DATA });

// Build shared engine HTML template
const storyMetaJson = JSON.stringify({ slug: 'prodigal-son', title: 'The Prodigal Son', starsKey: 'story-prodigal-son' });
const slidesJson = JSON.stringify(slides, null, 2);

const finalHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>The Prodigal Son — Storybook</title>
<style>:root{--accent:#7ba86a;--accent-light:#d8f3dc}</style>
<link rel="stylesheet" href="../../assets/css/design-tokens.css">
<link rel="stylesheet" href="../../assets/css/storybooks.css">
</head>
<body data-grade="grad1-3">
<div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>
<div class="book" id="book">
  <div class="nav-hint left">&#8592;</div>
  <div class="nav-hint right">&#8594;</div>
  <div class="book-inner" id="bookInner">
    <div class="page-image" id="pageImage">
      <img id="slideImg" src="" alt="Story illustration">
    </div>
    <div class="page-text" id="pageText">
      <div class="page-number" id="pageNum"></div>
      <h2 id="slideTitle"></h2>
      <div id="slideParagraphs"></div>
    </div>
  </div>
</div>
<div class="controls">
  <button id="prevBtn" disabled>&larr; Back</button>
  <span class="page-indicator" id="indicator">1 / N</span>
  <button id="nextBtn">Next &rarr;</button>
</div>
<div class="progress-dots" id="progressDots"></div>
<div class="keyboard-hint">Click anywhere on the book or use arrow keys to turn pages</div>
<script>
window.STORY_META = ${storyMetaJson};
const slides = ${slidesJson};
</script>
<script src="../../assets/js/games.js"></script>
<script src="../../assets/js/storybook.js"></script>
<script>Storybook.init();</script>
</body>
</html>`;

fs.writeFileSync(htmlPath, finalHtml, 'utf8');
const sizeKB = Math.round(fs.statSync(htmlPath).size / 1024);
console.log(`Converted: ${slides.length} slides (+quiz), HTML: ${sizeKB} KB`);

// Verify round-trip
const verifyContent = fs.readFileSync(htmlPath, 'utf8');
const m2 = verifyContent.match(/const\s+slides\s*=\s*(\[.*?\]);\s*\n/s);
if (m2) {
  try {
    const verifySlides = JSON.parse(m2[1]);
    console.log(`Verification: PASSED (${verifySlides.length} slides round-trips OK)`);
  } catch(e) {
    console.log(`Verification FAILED: ${e.message}`);
  }
}

// Verify image refs
let imgOk = 0, imgTotal = 0;
for (let i = 0; i < slides.length; i++) {
  if (slides[i].img && !slides[i].img.startsWith('data:') && slides[i].img !== '') {
    imgTotal++;
    try {
      if (require('fs').statSync(path.join(dir, slides[i].img)).size > 0) imgOk++;
    } catch(e) { console.error(`MISSING IMAGE: ${slides[i].img}`); }
  }
}
console.log(`Image refs: ${imgOk}/${imgTotal} OK`);
console.log('=== lesson-01 complete ===');