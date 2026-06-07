import { readFileSync, writeFileSync } from 'node:fs';

const BASE = 'https://lltv28.github.io/kodara-d4a-lander/';
const SCOPE = '#kdr-lp';
const src = readFileSync('C:\\Users\\lucas\\AppData\\Local\\Temp\\d4a-review\\index.html', 'utf8');

/* ---- 1. extract the <style> block ---- */
const styleM = src.match(/<style>([\s\S]*?)<\/style>/);
let css = styleM[1];

/* ---- 2. extract body markup ---- */
let body = src.match(/<body>([\s\S]*?)<\/body>/)[1];

/* ---- 3. pull every <script> out of the markup (keep order) ---- */
const scripts = [];
body = body.replace(/<script[\s\S]*?<\/script>/g, (m) => { scripts.push(m); return ''; });

/* ---- 4. CSS scoping ---- */
function splitTopRules(s) {
  const rules = []; let buf = ''; let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === '{') {
      let d = 1, j = i + 1;
      while (j < s.length && d > 0) { if (s[j] === '{') d++; else if (s[j] === '}') d--; j++; }
      rules.push({ prelude: buf.trim(), body: s.slice(i + 1, j - 1) });
      buf = ''; i = j; continue;
    }
    buf += c; i++;
  }
  return rules;
}
function scopeSelector(sel) {
  sel = sel.trim();
  if (!sel) return sel;
  if (sel === ':root') return SCOPE;
  if (sel === '*') return SCOPE + ' *';
  if (sel === 'html' || sel === 'body') return SCOPE;
  if (sel === 'body::after') return SCOPE + '::after';
  if (sel.startsWith('body.menu-open')) return SCOPE + sel.slice(4);   // #kdr-lp.menu-open
  if (sel.startsWith('body.')) return SCOPE + sel.slice(4);
  if (sel.startsWith('.js ')) return SCOPE + '.js ' + sel.slice(4);    // class moved onto wrapper
  if (sel.startsWith('html ')) return SCOPE + ' ' + sel.slice(5);
  if (sel.startsWith('body ')) return SCOPE + ' ' + sel.slice(5);
  return SCOPE + ' ' + sel;
}
function scopeRuleBlock(blockCss) {
  const rules = splitTopRules(blockCss);
  let out = '';
  for (const r of rules) {
    const p = r.prelude;
    if (p.startsWith('@')) {
      const at = p.split(/[\s({]/)[0].toLowerCase();
      if (at === '@font-face' || at === '@keyframes' || at === '@-webkit-keyframes' || at === '@page') {
        out += `${p}{${r.body}}\n`;
      } else if (at === '@media' || at === '@supports') {
        out += `${p}{${scopeRuleBlock(r.body)}}\n`;
      } else {
        out += `${p}{${r.body}}\n`;
      }
    } else {
      const sels = p.split(',').map(scopeSelector).join(',');
      out += `${sels}{${r.body}}\n`;
    }
  }
  return out;
}
let scoped = scopeRuleBlock(css);
/* only fixed-position rule is the decorative grid (body::after) — make it absolute so it can't cover CF chrome */
scoped = scoped.replace(/position:\s*fixed/g, 'position:absolute');
/* absolutize font urls */
scoped = scoped.replace(/url\((fonts\/[^)]+)\)/g, (m, p) => `url(${BASE}${p})`);
/* base rule for the wrapper itself */
scoped = `${SCOPE}{position:relative;box-sizing:border-box;width:100%}\n${SCOPE} *{box-sizing:border-box}\n` + scoped;

/* ---- 5. absolutize relative src/href in markup (CTAs use #book, untouched) ---- */
body = body.replace(/\b(src|href)="(?!https?:|#|mailto:|tel:|\/\/|data:)([^"]+)"/g, (m, attr, url) => `${attr}="${BASE}${url}"`);
body = body.trim();

/* ---- 6. rebuild the JS for CF's footer/JS slot ---- */
let jsOut = scripts.map((s) => {
  if (s.includes("documentElement.classList.add('js')")) {
    // move the js class onto the wrapper, and add scoped smooth-scroll for the #book CTAs
    s = s.replace("document.documentElement.classList.add('js');",
      "var KDR=document.getElementById('kdr-lp');if(KDR)KDR.classList.add('js');");
    s = s.replace(/<\/script>\s*$/,
      `\n/* smooth-scroll the CTAs to the on-page scheduler (scoped; no global html rule needed) */\n` +
      `document.querySelectorAll('#kdr-lp a[href="#book"]').forEach(function(a){a.addEventListener('click',function(ev){ev.preventDefault();var t=document.getElementById('book');if(t)t.scrollIntoView({behavior:'smooth',block:'start'});});});\n</script>`);
  }
  return s;
}).join('\n');

/* ---- 7. write outputs ---- */
const htmlEl = `<!-- ===== Kodara d-4-a — paste into the ClickFunnels CUSTOM HTML / CODE element ===== -->\n` +
  `<!-- If CF wraps this in a padded section, set that section's padding to 0 and width to full. -->\n` +
  `<style>\n${scoped}</style>\n\n<div id="kdr-lp">\n${body}\n</div>\n`;
writeFileSync('C:\\Users\\lucas\\AppData\\Local\\Temp\\d4a-review\\cf-d4a-html.html', htmlEl);

const jsEl = `<!-- ===== Kodara d-4-a — paste into the ClickFunnels FOOTER / CUSTOM JS slot (runs after the HTML element) ===== -->\n${jsOut}\n`;
writeFileSync('C:\\Users\\lucas\\AppData\\Local\\Temp\\d4a-review\\cf-d4a-js.html', jsEl);

/* combined standalone — for local render-testing AND for CF setups that execute inline scripts */
const combined = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1.0" />\n<title>Kodara · An AI Version of You</title>\n</head>\n<body>\n<style>\n${scoped}</style>\n\n<div id="kdr-lp">\n${body}\n</div>\n\n${jsOut}\n</body>\n</html>\n`;
writeFileSync('C:\\Users\\lucas\\AppData\\Local\\Temp\\d4a-review\\cf-d4a-combined.html', combined);

console.log('scripts extracted:', scripts.length);
console.log('css rules scoped, files written: cf-d4a-html.html, cf-d4a-js.html, cf-d4a-combined.html');
