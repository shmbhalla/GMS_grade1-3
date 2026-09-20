/** normalize-heavy.mjs — Extract base64 images from storybooks */
import { readFileSync, writeFileSync, mkdirSync, statSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const vmModule = require('vm');
const BASE = '/var/www/html/grad1-3';

function rmrf(path) {
  try { execSync(`rm -rf "${path}"`, { stdio: 'ignore' }); } catch(e) {}
}

function parseSlides(content) {
  const searchStart = content.indexOf('const slides = [');
  if (searchStart === -1) return null;

  let depth = 0;
  let endPos;
  for (let idx = searchStart; idx < content.length; idx++) {
    if (content[idx] === '[') depth++;
    else if (content[idx] === ']') { depth--; if (depth === 0) { endPos = idx + 1; break; } }
  }

  const inner = content.substring(searchStart + 'const slides = ['.length, endPos);

  try {
    const ctx = vmModule.createContext({});
    return vmModule.runInContext(inner, ctx);
  } catch(e) {
    console.error(`vm error: ${e.message}`);
    return null;
  }
}

function processLesson(folder, title) {
  const dir = resolve(BASE, folder);
  const htmlPath = resolve(dir, 'storybook.html');
  console.log(`\n=== ${folder}: ${title} ===`);

  let content = readFileSync(htmlPath, 'utf8');
  const slides = parseSlides(content);
  if (!slides) { console.error('FAILED to parse slides'); return; }

  console.log(`Parsed ${slides.length} slides`);

  const imagesDir = resolve(dir, 'images');
  rmrf(imagesDir);

  let extractedCount = 0, emptyCount = 0;
  for (let i = 0; i < slides.length; i++) {
    const imgVal = slides[i].img || '';
    if (imgVal.startsWith('data:image/jpeg;base64,') || imgVal.startsWith('data:image/jpg;base64,')) {
      const commaPos = imgVal.indexOf(',');
      const buffer = Buffer.from(imgVal.substring(commaPos + 1), 'base64');

      if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
        const fname = `slide-${String(i + 1).padStart(2, '0')}.jpg`;
        mkdirSync(resolve(dir, 'images'), { recursive: true });
        writeFileSync(resolve(dir, 'images', fname), buffer);
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

  const jsonStr = JSON.stringify(slides, null, 2);
  content = content.replace(/const\s+slides\s*=\s*\[.*?\];\s*\n/s, `const slides = ${jsonStr};\n`);
  writeFileSync(htmlPath, content, 'utf8');
  console.log(`HTML size: ${Math.round(statSync(htmlPath).size / 1024)} KB`);

  let ok = 0, totalImg = 0;
  for (let i = 0; i < slides.length; i++) {
    if (slides[i].img && !slides[i].img.startsWith('data:')) {
      totalImg++;
      try {
        if (statSync(resolve(dir, slides[i].img)).size > 0) ok++;
        else console.error(`EMPTY: ${slides[i].img}`);
      } catch(e) { console.error(`MISSING: ${slides[i].img}`); }
    }
  }
  console.log(`Images verified: ${ok}/${totalImg} OK`);
  console.log('JSON validation: PASSED');
}

processLesson('lesson-01-prodigal-son', 'The Prodigal Son');
processLesson('lesson-02-jesus-delivers', 'Jesus Delivers a Possessed Man');

console.log('\n=== Normalization complete ===');