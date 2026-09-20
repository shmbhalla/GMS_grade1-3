/** extract-slides.mjs — Parse JS-style slides arrays from storybook HTML files */
import { readFileSync, writeFileSync, mkdirSync, statSync } from 'fs';
import { resolve } from 'path';

const BASE = '/var/www/html/grad1-3';

function parseSlidesArray(rawText) {
  // Step 1: Remove all // comments
  let s = rawText.replace(/\/\/[^\n]*/g, '');

  // Step 2: Quote unquoted property keys
  // Replace word-key: patterns with "word-key":
  s = s.replace(
    /([{,])\s*([a-zA-Z_]\w*)\s*:\s*/g,
    function(match, openKey, keyName) {
      return openKey + '"' + keyName + '":';
    }
  );

  // Step 3: Evaluate as JS array literal
  const fn = new Function('return (' + s + ')');
  return fn();
}

function extractAndSave(folder, title) {
  const dir = resolve(BASE, folder);
  const htmlPath = resolve(dir, 'storybook.html');
  console.log(`\n=== ${folder}: ${title} ===`);

  let content = readFileSync(htmlPath, 'utf8');

  // Find slides array boundaries by bracket matching
  const idx = content.indexOf('const slides = [');
  if (idx === -1) { console.error('No slides found'); return; }
  let depth = 0;
  let endIdx = -1;
  for (let i = idx; i < content.length; i++) {
    if (content[i] === '[') depth++;
    else if (content[i] === ']') { depth--; if (depth === 0) { endIdx = i + 1; break; } }
  }
  const rawStr = content.substring(idx + 'const slides = ['.length, endIdx);

  try {
    const slides = parseSlidesArray(rawStr);
    console.log(`Parsed ${slides.length} slides`);

    // Verify images directory
    const imagesDir = resolve(dir, 'images');
    mkdirSync(imagesDir, { recursive: true });

    let extractedCount = 0;
    let emptyCount = 0;
    let keptEmbedded = 0;

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const imgVal = slide.img || '';

      if (imgVal.startsWith('data:image/jpeg;base64,') || imgVal.startsWith('data:image/jpg;base64,')) {
        const commaPos = imgVal.indexOf(',');
        const b64Data = imgVal.substring(commaPos + 1);
        const buffer = Buffer.from(b64Data, 'base64');

        if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
          const fname = `slide-${String(i + 1).padStart(2, '0')}.jpg`;
          writeFileSync(resolve(imagesDir, fname), buffer);
          slide.img = `images/${fname}`;
          const kb = Math.round(buffer.length / 1024);
          console.log(`  Slide ${i + 1}: "${slide.title}" -> ${fname} (${kb}KB)`);
          extractedCount++;
        } else {
          console.warn(`  Slide ${i + 1}: Invalid JPEG, keeping embedded (${buffer.length} bytes)`);
          keptEmbedded++;
        }
      } else if (!imgVal) {
        emptyCount++;
      }
    }

    console.log(`Summary: ${extractedCount} extracted, ${emptyCount} empty, ${keptEmbedded} kept embedded`);

    // Build new slides JSON
    const jsonStr = JSON.stringify(slides, null, 2);

    // Replace in HTML content
    content = content.replace(
      /const\s+slides\s*=\s*\[.*?\];\s*\n/s,
      `const slides = ${jsonStr};\n`
    );

    writeFileSync(htmlPath, content, 'utf8');
    const sizeKB = Math.round(statSync(htmlPath).size / 1024);
    console.log(`Rewritten: ${sizeKB} KB`);

    // Verify image files exist and have content
    for (let i = 0; i < slides.length; i++) {
      if (slides[i].img && !slides[i].img.startsWith('data:')) {
        const fpath = resolve(dir, slides[i].img);
        try {
          const st = statSync(fpath);
          if (st.size === 0) console.error(`  EMPTY: ${fpath}`);
        } catch(e) {
          console.error(`  MISSING: ${fpath}`);
        }
      }
    }

  } catch(e) {
    console.error(`PARSE ERROR: ${e.message}`);
    // Save diagnostic
    const diag = e.stack.split('\n')[1] || '';
    console.log(`Diagnostic line: ${diag.trim()}`);
  }
}

// Process lesson-01 first, then lesson-02 (already done but rerun for safety)
extractAndSave('lesson-01-prodigal-son', 'The Prodigal Son');
extractAndSave('lesson-02-jesus-delivers', 'Jesus Delivers a Possessed Man');

console.log('\n=== Done ===');