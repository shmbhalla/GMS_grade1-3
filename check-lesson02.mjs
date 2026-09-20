import { readFileSync } from 'fs';
let c = readFileSync('/var/www/html/grad1-3/lesson-02-jesus-delivers/storybook.html', 'utf8');
const vm = await import('vm');
const ctx = vm.createContext({});

const searchStart = c.indexOf('const slides = [');
let depth = 0;
let endPos;
for (let idx = searchStart; idx < c.length; idx++) {
  if (c[idx] === '[') depth++;
  else if (c[idx] === ']') { depth--; if (depth === 0) { endPos = idx + 1; break; } }
}
const inner = c.substring(searchStart + 'const slides = ['.length, endPos);
const slides = vm.runInContext(inner, ctx);

console.log(`Lesson-02: ${slides.length} slides`);
for (let j = 0; j < slides.length; j++) {
  const imgT = slides[j].img ? (slides[j].img.startsWith('data:') ? 'DATA_URI('+slides[j].img.length+' bytes)' : slides[j].img) : '-empty-';
  const hasQuiz = slides[j].quiz ? '(QUIZ:'+slides[j].quiz.length+')' : '';
  console.log(`${j}: title="${slides[j].title}" img=${imgT} textCnt=${Array.isArray(slides[j].text)?slides[j].text.length:-1} ${hasQuiz}`);
}