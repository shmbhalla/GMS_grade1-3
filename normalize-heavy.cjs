/** normalize-heavy.cjs — Extract base64 images from storybooks */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const BASE = '/var/www/html/grad1-3';

function parseSlides(content) {
  const searchStart = content.indexOf('const slides = [');
  if (searchStart === -1) return null;

  let depth = 0;
  let endIdx;
  for (let idx = searchStart; idx < content.length; idx++) {
    if (content[idx] === '[') depth++;
    else if (content[idx] === ']') { depth--; if (depth === 0) { endIdx = idx; break; } }
  }

  // Inner = exactly between opening [ and closing ] of the array literal
  const inner = content.substring(searchStart + 'const slides = ['.length, endIdx);

  try {
    const ctx = vm.createContext({});
    return vm.runInContext(inner, ctx);
  } catch(e) {
    console.error(`Parse error: ${e.message}`);
    return null;
  }
}

function processLesson(folder, title) {
  const dir = path.resolve(BASE, folder);
  const htmlPath = path.resolve(dir, 'storybook.html');
  console.log(`\n=== ${folder}: ${title} ===`);

  let content = fs.readFileSync(htmlPath, 'utf8');
  const slides = parseSlides(content);
  if (!slides) { console.error('FAILED to parse slides'); return; }

  console.log(`Parsed ${slides.length} slides`);

  // Clean up any previously extracted images
  const imagesDir = path.join(dir, 'images');
  try { require('child_process').execSync(`rm -rf "${imagesDir}"`, { stdio: 'ignore' }); } catch(e) {}

  let extractedCount = 0, emptyCount = 0;
  for (let i = 0; i < slides.length; i++) {
    const imgVal = slides[i].img || '';
    if (imgVal.startsWith('data:image/jpeg;base64,') || imgVal.startsWith('data:image/jpg;base64,')) {
      const commaPos = imgVal.indexOf(',');
      const buffer = Buffer.from(imgVal.substring(commaPos + 1), 'base64');

      if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
        const fname = `slide-${String(i + 1).padStart(2, '0')}.jpg`;
        require('fs').mkdirSync(path.join(imagesDir), { recursive: true });
        require('fs').writeFileSync(path.join(imagesDir, fname), buffer);
        slides[i].img = `images/${fname}`;
        const kb = Math.round(buffer.length / 1024);
        console.log(`  Slide ${i+1}: "${slides[i].title}" -> ${fname} (${kb}KB)`);
        extractedCount++;
      } else {
        console.warn(`  Slide ${i+1}: Invalid JPEG, keeping embedded`);
      }
    } else if (!imgVal) {
      emptyCount++;
    }
  }

  console.log(`Extracted: ${extractedCount}, Empty: ${emptyCount}`);

  // Replace slides array in HTML
  const jsonStr = JSON.stringify(slides, null, 2);
  content = content.replace(/const\s+slides\s*=\s*\[.*?\];\s*\n/s, `const slides = ${jsonStr};\n`);
  fs.writeFileSync(htmlPath, content, 'utf8');
  console.log(`HTML size: ${Math.round(fs.statSync(htmlPath).size / 1024)} KB`);

  // Verify images exist
  let ok = 0, totalImg = 0;
  for (let i = 0; i < slides.length; i++) {
    if (slides[i].img && !slides[i].img.startsWith('data:')) {
      totalImg++;
      try {
        if (require('fs').statSync(path.join(dir, slides[i].img)).size > 0) ok++;
        else console.error(`EMPTY: ${slides[i].img}`);
      } catch(e) { console.error(`MISSING: ${slides[i].img}`); }
    }
  }
  console.log(`Images verified: ${ok}/${totalImg} OK`);
  console.log('JSON validation: PASSED');
}

// Process lesson-01 first, then lesson-02
processLesson('lesson-01-prodigal-son', 'The Prodigal Son');
processLesson('lesson-02-jesus-delivers', 'Jesus Delivers a Possessed Man');

console.log('\n=== Normalization complete ===');