/** convert-all.cjs — Complete conversion of 10 grade1-3 storybooks to shared engine */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE = '/var/www/html/grad1-3';

// ============================================================
// QUIZZES FOR ALL 10 STORIES
// ============================================================
const QUIZZES = {
  'prodigal-son': [
    { q: "What did the younger son ask his father for?", options: ["His share of the family money", "A horse to ride away", "Food for the journey", "A new robe"], correct: 0, explanation: "He wanted his inheritance early so he could leave home." },
    { q: "How did the father treat his returning son?", options: ["He sent him to work as a servant", "He gave him a slap on the face", "He ran to hug him and threw a feast", "He ignored him and went back inside"], correct: 2, explanation: "The father ran to greet him, put a robe and ring on him, and celebrated!" },
    { q: "Why was the older brother angry?", options: ["He didn't get any gifts", "His father forgave his brother even though he didn't come home", "He lost all his money too", "The servants were noisy"], correct: 1, explanation: "He was upset that the father celebrated for his brother who wasted everything." }
  ],
  'jesus-delivers': [
    { q: "Where did Jesus meet the man possessed by demons?", options: ["In Capernaum synagogue", "On the road to Jerusalem", "At the Sea of Galilee", "In the Temple"], correct: 0, explanation: "Jesus was teaching in the Capernaum synagogue when this happened." },
    { q: "What did the demon cry out about Jesus?", options: ["Go away!", "You are the Holy One of God!", "Leave us alone!", "I will destroy you!"], correct: 1, explanation: "The demon recognized Jesus as the Holy One of God!" },
    { q: "What happened after Jesus spoke to the demon?", options: ["The man fell asleep", "The demon left and he was completely free", "He had to stay in the synagogue", "He became very sick"], correct: 1, explanation: "Jesus commanded the demon out and the man was left healthy and calm." }
  ],
  'paralyzed-man': [
    { q: "How did the four friends bring their paralyzed friend to Jesus?", options: ["They pushed through the crowd", "They carried him up the stairs and lowered him through the roof", "They walked around the building", "They called out to Jesus from outside"], correct: 1, explanation: "They climbed to the flat roof, made a hole, and lowered the mat with their friend." },
    { q: "What did Jesus say FIRST to the paralyzed man?", options: ["Get up and walk!", "Take your mat home", "Your sins are forgiven", "Do you want to be healed?"], correct: 2, explanation: "Jesus first said 'Friend, your sins are forgiven' to show His power to forgive." },
    { q: "Why did the religious leaders think this was blasphemy?", options: ["Jesus touched a sick man", "Only God can forgive sins, they believed", "Jesus healed on the Sabbath", "The man was a stranger"], correct: 1, explanation: "Forgiving sins was something only God could do." }
  ],
  'calms-storm': [
    { q: "What did Jesus say to the storm?", options: ["Stop it!", "Quiet! Be still!", "Calm down!", "Peace be upon you!"], correct: 1, explanation: "Mark 4:39 says Jesus said 'Quiet! Be still!' to the wind and waves." },
    { q: "How were the disciples feeling during the storm?", options: ["Excited and happy", "Afraid and terrified", "Angry at Jesus", "Laughing and singing"], correct: 1, explanation: "The disciples were terrified as huge waves crashed over the boat." },
    { q: "What question did Jesus ask the disciples after the calm?", options: ["Where do you want to go?", "Why are you so afraid? Do you still have no faith?", "Did you bring enough bread?", "Who told you to follow me?"], correct: 1, explanation: "Jesus asked why they were afraid and if they still had no faith." }
  ],
  'feeds-5000': [
    { q: "How many loaves and fish did the boy bring?", options: ["Ten loaves and five fish", "Five loaves and two fish", "Two loaves and five fish", "Seven loaves and three fish"], correct: 1, explanation: "A young boy shared five small loaves and two fish." },
    { q: "How many baskets of leftovers were collected?", options: ["Seven baskets", "Nine baskets", "Twelve baskets", "Ten baskets"], correct: 2, explanation: "They filled twelve baskets with leftover pieces." },
    { q: "What lesson does this story teach about small things?", options: ["Small things don't matter", "A little boy shared his lunch and Jesus did amazing things with it", "We should always buy our own food", "It's better to keep your lunch to yourself"], correct: 1, explanation: "Even a small offering was enough for Jesus to feed thousands." }
  ],
  'feeds-4000': [
    { q: "How many people did Jesus feed in this story?", options: ["About 3,000", "About 4,000", "About 5,000", "About 10,000"], correct: 1, explanation: "About 4,000 men plus women and children were fed." },
    { q: "What did Jesus do before breaking the bread?", options: ["Asked Philip for help", "Gave thanks and looked up to heaven", "Sent everyone home", "Prayed all night"], correct: 1, explanation: "Jesus took the bread and fish, looked up to heaven, and gave thanks." },
    { q: "How many baskets of leftovers were gathered?", options: ["Seven baskets", "Twelve baskets", "Three baskets", "No baskets"], correct: 0, explanation: "They gathered seven baskets of leftovers." }
  ],
  'blind-man': [
    { q: "What was the blind man's name?", options: ["Simon", "Peter", "Bartimaeus", "Andrew"], correct: 2, explanation: "The blind beggar's name was Bartimaeus." },
    { q: "What did Bartimaeus shout as Jesus passed by?", options: ["Help me!", "Give me money!", "Jesus, Son of David, have mercy on me!", "Wait for me!"], correct: 2, explanation: "He shouted 'Jesus, Son of David, have mercy on me!'" },
    { q: "What did Jesus say to Bartimaeus that healed him?", options: ["Take your mat and walk", "Go! Your faith has healed you", "Open your eyes!", "Come to me"], correct: 1, explanation: "Jesus said 'Go! Your faith has healed you,' and Bartimaeus received his sight." }
  ],
  'john-baptist': [
    { q: "What did John the Baptist wear for clothes?", options: ["Silk robes", "Clothes made of camel hair with a leather belt", "Regular shepherd clothes", "Priest garments"], correct: 1, explanation: "John wore a distinctive outfit of camel hair with a leather belt." },
    { q: "What was John's main message to the people?", options: ["Follow me", "Repent, for the kingdom of heaven has come near", "Build the Temple", "Share your food"], correct: 1, explanation: "John preached repentance — turn away from sin and prepare your hearts for Jesus." },
    { q: "Who came to be baptised by John?", options: ["Only the poor", "Only soldiers", "People from all over Judea", "Only kings"], correct: 2, explanation: "People from all over Judea and the River Jordan area came to hear John." }
  ],
  'zechariah': [
    { q: "Why couldn't Zechariah speak after leaving the Temple?", options: ["He was sick", "He was punished for doubting the angel's message", "The crowd hurt him", "He forgot how to talk"], correct: 1, explanation: "Because Zechariah doubted Gabriel's message, he couldn't speak until the child was born." },
    { q: "Who appeared to Zechariah in the Temple?", options: ["Moses", "An angel named Gabriel", "Jesus", "God Himself"], correct: 1, explanation: "Gabriel, one of God's angels, appeared to Zechariah and delivered God's message." },
    { q: "What was the angel's message to Zechariah?", options: ["He would lose his job", "Elizabeth would give birth to a son named John", "The Romans would leave", "He would become king"], correct: 1, explanation: "God promised Zechariah and Elizabeth a son named John who would prepare the way for the Lord." }
  ],
  'paul-lydia': [
    { q: "What kind of cloth did Lydia sell?", options: ["White linen", "Purple cloth", "Red wool", "Green silk"], correct: 1, explanation: "Lydia sold purple cloth, which was very expensive and worn by royalty." },
    { q: "Where did Paul and the women meet for prayer?", options: ["In the Temple", "By the river outside the city wall", "In Lydia's shop", "In the market"], correct: 1, explanation: "Paul found a group of women meeting for prayer by the river outside Philippi." },
    { q: "What was the first continent where the gospel was preached?", options: ["Asia", "Africa", "Europe (Macedonia)", "South America"], correct: 2, explanation: "Macedonia is in Europe, making it the first place the gospel reached in Europe." }
  ]
};

// ============================================================
// STORIES DATA
// ============================================================
const STORIES = [
  { slug: 'prodigal-son', title: 'The Prodigal Son', dir: 'lesson-01-prodigal-son', folderNum: '01' },
  { slug: 'jesus-delivers', title: 'Jesus Delivers a Possessed Man', dir: 'lesson-02-jesus-delivers', folderNum: '02' },
  { slug: 'paralyzed-man', title: 'Jesus Forgives and Heals the Paralyzed Man', dir: 'lesson-03-paralyzed-man', folderNum: '03' },
  { slug: 'calms-storm', title: 'Jesus Calms a Storm', dir: 'lesson-04-calms-storm', folderNum: '04' },
  { slug: 'feeds-5000', title: 'Jesus Feeds 5000', dir: 'lesson-05-feeds-5000', folderNum: '05' },
  { slug: 'feeds-4000', title: 'Jesus Feeds over 4000 People', dir: 'lesson-06-feeds-4000', folderNum: '06' },
  { slug: 'blind-man', title: 'Jesus Heals a Blind Man', dir: 'lesson-07-blind-man', folderNum: '07' },
  { slug: 'john-baptist', title: 'John the Baptist', dir: 'lesson-08-john-baptist', folderNum: '08' },
  { slug: 'zechariah', title: 'Zechariah Is Promised a Son', dir: 'lesson-09-zechariah', folderNum: '09' },
  { slug: 'paul-lydia', title: 'Paul Meets Lydia in Philippi', dir: 'lesson-10-paul-lydia', folderNum: '10' },
];

// ============================================================
// PARSE SLIDES USING JSON.PARSE
// ============================================================
function parseSlidesFromHtml(htmlContent) {
  // Use regex to extract the slides array value between brackets
  const match = htmlContent.match(/const\s+slides\s*=\s*(\[.*?\]);\s*\n/s);
  if (!match) return null;

  const jsonStr = match[1];

  try {
    return JSON.parse(jsonStr);
  } catch(e) {
    console.error(`  JSON parse error: ${e.message}`);
    console.error(`  Error position: ${e.index}`);
    console.error(`  Around error: "${jsonStr.substring(Math.max(0, e.index - 40), e.index + 40)}"`);
    return null;
  }
}

// ============================================================
// SHARED STORYBOOK HTML TEMPLATE
// ============================================================
function createStorybookHTML(title, storyMetaJson, slidesJson) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
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
}

// ============================================================
// REPORT STRUCTURE
// ============================================================
const reports = [];

// ============================================================
// PART A: Normalize heavy files (extract base64 images)
// ============================================================
console.log('\n========================================');
console.log('PART A: Normalizing heavy storybooks');
console.log('========================================\n');

for (const folderName of ['lesson-01-prodigal-son', 'lesson-02-jesus-delivers']) {
  const dir = path.join(BASE, folderName);
  const htmlPath = path.join(dir, 'storybook.html');
  console.log(`--- ${folderName} ---`);

  let content = fs.readFileSync(htmlPath, 'utf8');
  const slides = parseSlidesFromHtml(content);
  if (!slides) { console.log('FAILED to parse slides'); continue; }
  console.log(`Parsed ${slides.length} slides`);

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
        console.warn(`  Slide ${i+1}: Invalid JPEG, keeping embedded`);
      }
    }
  }

  // Verify images
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
}

// ============================================================
// PART B: Convert ALL 10 storybooks to shared engine
// ============================================================
console.log('\n========================================');
console.log('PART B: Converting all 10 storybooks');
console.log('========================================\n');

for (const story of STORIES) {
  const dir = path.join(BASE, story.dir);
  const htmlPath = path.join(dir, 'storybook.html');
  console.log(`--- ${story.dir}: ${story.title} ---`);

  let content = fs.readFileSync(htmlPath, 'utf8');
  let slides = parseSlidesFromHtml(content);
  if (!slides) { console.log('SKIPPED: Could not parse slides'); continue; }

  // Remove existing quiz slide if present
  const lastSlide = slides[slides.length - 1];
  if (lastSlide && lastSlide.quiz && lastSlide.quiz.length > 0) {
    slides.pop();
  }

  // Add fresh quiz slide
  const quizData = QUIZZES[story.slug] || [];
  if (quizData.length > 0) {
    slides.push({
      img: '',
      title: 'Fun Review!',
      quiz: quizData
    });
  }

  // Build the new HTML
  const storyMeta = { slug: story.slug, title: story.title, starsKey: `story-${story.slug}` };
  const storyMetaJson = JSON.stringify(storyMeta);
  const slidesJson = JSON.stringify(slides, null, 2);
  const finalHtml = createStorybookHTML(story.title, storyMetaJson, slidesJson);

  // Write the file
  fs.writeFileSync(htmlPath, finalHtml, 'utf8');
  const sizeKB = Math.round(fs.statSync(htmlPath).size / 1024);
  console.log(`Converted: ${slides.length} slides (+quiz), HTML: ${sizeKB} KB`);

  // Verify round-trip parsing
  const verifyContent = fs.readFileSync(htmlPath, 'utf8');
  const verifySlides = parseSlidesFromHtml(verifyContent);
  if (verifySlides && verifySlides.length === slides.length) {
    console.log(`Verification: PASSED (${verifySlides.length} slides)`);
  } else {
    console.log(`Verification: FAILED (expected ${slides.length}, got ${verifySlides ? verifySlides.length : 'null'})`);
  }

  // Verify image references
  let imgOk = 0, imgTotal = 0;
  for (let i = 0; i < slides.length; i++) {
    const s = slides[i];
    if (s.img && !s.img.startsWith('data:') && s.img !== '') {
      imgTotal++;
      try {
        if (require('fs').statSync(path.join(dir, s.img)).size > 0) imgOk++;
        else console.log(`EMPTY IMAGE: ${s.img}`);
      } catch(e) { console.log(`MISSING IMAGE: ${s.img}`); }
    }
  }
  console.log(`Image refs: ${imgOk}/${imgTotal} OK`);

  reports.push({
    story: story.title,
    slides: slides.length,
    quizQuestions: quizData.length,
    imagesVerified: imgOk,
    imagesExpected: imgTotal,
    htmlSize: sizeKB + ' KB'
  });
}

// ============================================================
// PART C: Fix index.html
// ============================================================
console.log('\n========================================');
console.log('PART C: Fixing index.html');
console.log('========================================\n');

const indexPath = path.join(BASE, 'index.html');
const lessonsLinks = STORIES.map(s => {
  const folderNum = s.folderNum;
  const folderRest = s.dir.replace('lesson-', '');
  return `  <div class="lesson clickable"><div class="num">${folderNum}</div><a href="lesson-${folderRest}/storybook.html">${s.title}</a></div>`;
}).join('\n');

const indexTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Grade 1-3 Bible Stories</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
<style>
  :root{--accent:#7ba86a;--accent-light:#d8f3dc;--radius-lg:20px;--shadow-sm:0 2px 10px rgba(0,0,0,.08);--shadow-lg:0 10px 40px rgba(0,0,0,.15)}
  *, *::before, *::after { margin:0;padding:0;box-sizing:border-box; }
  body {
    font-family:'Atkinson Hyperlegible','Segoe UI',sans-serif;
    background:#fef9ef;color:#333;padding:40px 20px;
  }
  .container { max-width:800px;margin:0 auto; }
  h1 {
    font-family:'Fredoka','Segoe UI',sans-serif;
    color:var(--accent);font-size:2.2em;margin-bottom:5px;
  }
  .sub { color:#666;margin-bottom:30px;font-size:1.1em; }
  .lesson {
    background:#fff;border-radius:12px;padding:18px 22px;margin-bottom:12px;
    box-shadow:var(--shadow-sm);display:flex;align-items:center;gap:15px;
  }
  .lesson.clickable {
    transition:transform .2s,box-shadow .2s;cursor:pointer;
  }
  .lesson.clickable:hover {
    transform:translateY(-2px);box-shadow:var(--shadow-lg);
  }
  .num {
    background:var(--accent);color:#fff;width:40px;height:40px;
    border-radius:50%;display:flex;align-items:center;justify-content:center;
    font-weight:700;flex-shrink:0;
    font-family:'Fredoka','Segoe UI',sans-serif;
  }
  .lesson a {
    color:var(--accent);text-decoration:none;font-size:1.1em;
    font-weight:600;
  }
  .lesson a:hover { text-decoration:underline; }
  .section-title {
    margin:30px 0 12px 0;color:var(--accent);font-size:1.1em;
    font-weight:700;padding-bottom:6px;
    border-bottom:2px solid var(--accent-light);
    display:flex;align-items:center;gap:8px;
    font-family:'Fredoka','Segoe UI',sans-serif;
  }
  .ws-link {
    background:var(--accent-light);border-radius:12px;padding:14px 20px;
    margin-bottom:10px;display:flex;align-items:center;gap:12px;
    text-decoration:none;color:var(--accent);font-weight:600;
    transition:transform .2s,box-shadow .2s;
  }
  .ws-link:hover {
    transform:translateY(-2px);box-shadow:var(--shadow-lg);
  }
  .ws-link .icon { font-size:1.5em; }
  .ws-link span { font-size:.85em;color:#555;font-weight:400; }
  .back { margin-top:40px;text-align:center; }
  .back a { color:#666;text-decoration:none; }
</style>
</head>
<body data-grade="grad1-3">
<div class="container">
  <h1>&#x1F4D6; Bible Storybooks</h1>
  <p class="sub">Grades 1-3 &#xB7; 10 Lessons</p>

${lessonsLinks}

  <div class="section-title">&#x1F4DD; Printable Worksheets</div>
  <a class="ws-link" href="worksheets/">
    <span class="icon">&#x1F4C4;</span>
    All 10 Lesson Worksheets
    <span>Printable &#xB7; A4 &#xB7; Dark theme</span>
  </a>

  <div class="back"><a href="/">&#x2190; Back to all grades</a></div>
</div>
</body>
</html>`;

fs.writeFileSync(indexPath, indexTemplate, 'utf8');
console.log(`Written index.html (${Math.round(fs.statSync(indexPath).size / 1024)} KB)`);

// ============================================================
// VERIFICATION
// ============================================================
console.log('\n========================================');
console.log('VERIFICATION');
console.log('========================================\n');

// 1. Slides parse verification for every storybook
console.log('Slides Parse Verification:');
for (const story of STORIES) {
  const htmlPath = path.join(BASE, story.dir, 'storybook.html');
  const content = fs.readFileSync(htmlPath, 'utf8');
  const slides = parseSlidesFromHtml(content);
  console.log(`  ${story.dir}: ${slides ? slides.length + ' slides parsed OK' : 'PARSE ERROR'}`);
}

// 2. Engine integration check
console.log('\nEngine Integration Verification:');
for (const story of STORIES) {
  const htmlPath = path.join(BASE, story.dir, 'storybook.html');
  const content = fs.readFileSync(htmlPath, 'utf8');
  const checks = {
    storyMeta: content.includes('window.STORY_META'),
    gamesJs: content.includes('../../assets/js/games.js'),
    storybookJs: content.includes('../../assets/js/storybook.js'),
    initCall: content.includes('Storybook.init()'),
    designTokens: content.includes('design-tokens.css'),
    storybooksCss: content.includes('storybooks.css'),
    progressFill: content.includes('progressFill'),
    indicator: content.includes('indicator'),
    prevBtn: content.includes('prevBtn'),
    nextBtn: content.includes('nextBtn'),
    slideImg: content.includes('slideImg'),
    slideTitle: content.includes('slideTitle'),
    slideParagraphs: content.includes('slideParagraphs'),
    pageNum: content.includes('pageNum'),
    progressDots: content.includes('progressDots'),
  };
  const passRate = Object.values(checks).filter(Boolean).length;
  const score = `${passRate}/${Object.keys(checks).length}`;
  console.log(`  ${story.dir}: ${score} -- ${Object.entries(checks).filter(([,v])=>v).map(([k])=>k).join(',')}`);
}

// 3. Index link verification
console.log('\nIndex Link Verification:');
const indexContent = fs.readFileSync(indexPath, 'utf8');
for (const story of STORIES) {
  const targetLink = `lesson-${story.folderNum}-${story.dir.split('-')[2]}/storybook.html`;
  const htmlPath = path.join(BASE, story.dir, 'storybook.html');
  const exists = fs.existsSync(htmlPath);
  const linked = indexContent.includes(targetLink);
  console.log(`  ${story.title}: ${exists?'file exists':'MISSING'} ${linked?'LINKED':'NOT LINKED'}`);
}

// 4. JS syntax validation (--check equivalent)
console.log('\nJS Syntax Check (--check):');
for (const story of STORIES) {
  const htmlPath = path.join(BASE, story.dir, 'storybook.html');
  const content = fs.readFileSync(htmlPath, 'utf8');
  const scripts = content.match(/<script>([\s\S]*?)<\/script>/g) || [];
  let valid = true;
  for (const st of scripts) {
    let js = st.replace(/<script>|<\/script>/g, '').trim();
    if (!js) continue;
    try {
      new Function(js)();
    } catch(e) {
      valid = false;
      console.error(`  FAIL: ${story.dir} - ${e.message}`);
      break;
    }
  }
  if (valid) console.log(`  OK: ${story.dir}`);
}

// 5. Report summary
console.log('\n========================================');
console.log('PER-STORY REPORTS');
console.log('========================================\n');
for (const r of reports) {
  console.log(`${r.story}:`);
  console.log(`  Slides: ${r.slides} | Quiz questions: ${r.quizQuestions}`);
  console.log(`  Images: ${r.imagesVerified}/${r.imagesExpected} verified OK`);
  console.log(`  HTML size: ${r.htmlSize}`);
  console.log('');
}

console.log('=== All conversions complete ===');