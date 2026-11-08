import fs from 'node:fs';
import path from 'node:path';

const BASE = 'C:/Users/dn322/Documents/deepseek-harness/default-workspace/maytrang-web/assets/img';
fs.mkdirSync(BASE + '/products', { recursive: true });
fs.mkdirSync(BASE + '/ingredients', { recursive: true });
fs.mkdirSync(BASE + '/hero', { recursive: true });

function shade(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(255 * percent / 100);
  const r = Math.min(255, Math.max(0, (num >> 16) + amt));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

/* ------------------------------ Ingredients ----------------------------- */
const ingredients = [
  {
    id: 'lotus', name: 'SEN HỒNG', label: 'SEN HỒNG · ĐỒNG THÁP', accent: '#D99AA6',
    bg: ['#FFF9FA', '#F7E4E8'], leaf: '#8FAF8B',
  },
  {
    id: 'centella', name: 'RAU MÁ', label: 'RAU MÁ · TRÀ VINH', accent: '#7FAE91',
    bg: ['#F8FCF9', '#E6F1EA'], leaf: '#7FAE91',
  },
  {
    id: 'tea', name: 'TRÀ XANH', label: 'TRÀ XANH · THÁI NGUYÊN', accent: '#8FAE72',
    bg: ['#F9FCF6', '#E9F1E0'], leaf: '#7E9C63',
  },
  {
    id: 'coconut', name: 'DỪA BẾN TRE', label: 'DỪA · BẾN TRE', accent: '#B79A76',
    bg: ['#FEFBF5', '#F3E8D6'], leaf: '#9FB38A',
  },
  {
    id: 'turmeric', name: 'NGHỆ HƯNG YÊN', label: 'NGHỆ · HƯNG YÊN', accent: '#D1A04F',
    bg: ['#FEFAF2', '#F5E8CF'], leaf: '#8FAF8B',
  },
];

function defs(bg, accent) {
  return `<defs>
    <linearGradient id="bg" x1="0" y1="0" x2=".7" y2="1"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${shade(bg[1], -4)}"/></linearGradient>
    <radialGradient id="halo" cx=".5" cy=".42" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <linearGradient id="petal" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${shade(accent, 8)}"/><stop offset="1" stop-color="${shade(accent, 45)}"/></linearGradient>
    <linearGradient id="leaf" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="${shade('#7FAE91', -18)}"/><stop offset="1" stop-color="${shade('#8FBFA6', 18)}"/></linearGradient>
    <filter id="soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="18"/></filter>
    <filter id="blur" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="14"/></filter>
  </defs>`;
}

function frame(accent) {
  return `<rect width="800" height="1000" fill="url(#bg)"/>
  <ellipse cx="400" cy="420" rx="360" ry="330" fill="url(#halo)"/>
  <g fill="#fff" opacity=".35" filter="url(#soft)"><ellipse cx="170" cy="210" rx="130" ry="36"/><ellipse cx="630" cy="610" rx="120" ry="34"/></g>
  <rect x="34" y="34" width="732" height="932" fill="none" stroke="${accent}" stroke-opacity=".18"/>
  <g><circle cx="400" cy="82" r="17" fill="none" stroke="${accent}" stroke-opacity=".45"/><path d="M391 89 q7 -13 19 -15 q0 13 -12 15" fill="none" stroke="${accent}" stroke-width="1.5"/><text x="400" y="124" text-anchor="middle" font-family="Arial, sans-serif" font-size="10.5" letter-spacing="4.6" fill="#2E3A44" opacity=".62">MÂY TRẮNG</text></g>
  <text x="70" y="906" font-family="Arial, sans-serif" font-size="8.5" letter-spacing="3" fill="${accent}">MÂY TRẮNG · NGUYÊN LIỆU VIỆT</text>
  <text x="70" y="934" font-family="Georgia, serif" font-size="21" fill="#2E3A44">${''}</text>`;
}

function lotusArt() {
  const petals = [];
  for (let i = 0; i < 8; i++) {
    const a = i * 45;
    petals.push(`<ellipse cx="400" cy="470" rx="58" ry="150" fill="url(#petal)" opacity=".9" transform="rotate(${a} 400 560)"/>`);
  }
  for (let i = 0; i < 5; i++) {
    const a = i * 72;
    petals.push(`<ellipse cx="400" cy="520" rx="38" ry="100" fill="#FFF6F8" opacity=".85" transform="rotate(${a} 400 570)"/>`);
  }
  return `<g>
    <ellipse cx="400" cy="800" rx="290" ry="70" fill="#6E8F6B" opacity=".18" filter="url(#blur)"/>
    <path d="M400 780 v-150" stroke="#8FAF8B" stroke-width="5" opacity=".55"/>
    <ellipse cx="400" cy="790" rx="235" ry="66" fill="#6E8F6B" opacity=".28"/>
    <ellipse cx="400" cy="786" rx="235" ry="66" fill="none" stroke="#5E7C5B" stroke-opacity=".25"/>
    <path d="M235 786 q60 -34 120 0" stroke="#5E7C5B" stroke-opacity=".25" fill="none"/>
    ${petals.join('')}
    <circle cx="400" cy="560" r="34" fill="#E7C87A" opacity=".9"/>
    <g fill="#C9A24E" opacity=".7"><circle cx="392" cy="552" r="5"/><circle cx="408" cy="552" r="5"/><circle cx="400" cy="570" r="5"/><circle cx="386" cy="566" r="4"/><circle cx="414" cy="566" r="4"/></g>
  </g>`;
}

function centellaArt() {
  const leaves = [];
  const stems = [];
  const positions = [[300, 610, -30], [360, 530, -10], [430, 500, 8], [500, 545, 25], [535, 630, 40], [260, 700, -50]];
  positions.forEach(([x, y, r], i) => {
    stems.push(`<path d="M400 790 Q${(x + 400) / 2} ${y + 90} ${x} ${y + 40}" fill="none" stroke="#7FAE91" stroke-width="3" opacity=".65"/>`);
    leaves.push(`<g transform="translate(${x} ${y}) rotate(${r})">
      <path d="M0 40 C-70 10 -70 -60 0 -85 C70 -60 70 10 0 40Z" fill="url(#leaf)" opacity=".85"/>
      <path d="M0 34 V-72" stroke="#F4FBF6" stroke-width="2" opacity=".5"/>
      <path d="M0 10 h-26 M0 -16 h-32 M0 -42 h-24" stroke="#F4FBF6" stroke-width="1.5" opacity=".4"/>
      <path d="M0 10 h26 M0 -16 h32 M0 -42 h24" stroke="#F4FBF6" stroke-width="1.5" opacity=".4"/>
    </g>`);
  });
  return `<g>${stems.join('')}<ellipse cx="400" cy="800" rx="260" ry="55" fill="#5E7C5B" opacity=".12" filter="url(#blur)"/>${leaves.join('')}</g>`;
}

function teaArt() {
  const leaves = [];
  for (let i = 0; i < 7; i++) {
    const side = i % 2 ? 1 : -1;
    const y = 700 - i * 55;
    leaves.push(`<g transform="translate(400 ${y}) rotate(${side * (38 + i * 4)})">
      <path d="M0 0 C${side * 34} -26 ${side * 78} -12 ${side * 96} 26 C${side * 70} 58 ${side * 26} 48 0 0Z" fill="url(#leaf)" opacity=".9"/>
      <path d="M0 0 L${side * 84} 24" stroke="#F4FBF6" stroke-width="1.4" opacity=".45"/>
    </g>`);
    leaves.push(`<path d="M400 ${y + 12} q${side * 30} -22 ${side * 55} -28" stroke="#7E9C63" stroke-width="3" fill="none" opacity=".55"/>`);
  }
  return `<g>
    <path d="M400 820 q-20 -130 8 -250 q22 -110 4 -210" stroke="#7E9C63" stroke-width="5" fill="none" opacity=".55"/>
    <ellipse cx="400" cy="812" rx="240" ry="50" fill="#5E7C5B" opacity=".1" filter="url(#blur)"/>
    ${leaves.join('')}
    <g opacity=".9"><circle cx="470" cy="410" r="22" fill="#FFFDF7"/><circle cx="470" cy="410" r="12" fill="#EAD8A8"/><circle cx="520" cy="440" r="16" fill="#FFFDF7"/><circle cx="520" cy="440" r="8" fill="#EAD8A8"/></g>
  </g>`;
}

function coconutArt() {
  return `<g>
    <ellipse cx="400" cy="800" rx="250" ry="55" fill="#5E4B36" opacity=".12" filter="url(#blur)"/>
    <circle cx="330" cy="610" r="150" fill="#8A6B4C"/>
    <circle cx="330" cy="610" r="150" fill="none" stroke="#6E5238" stroke-opacity=".35"/>
    <g stroke="#6E5238" stroke-opacity=".3" fill="none">
      <path d="M330 460 v300"/><path d="M180 610 h300"/><path d="M225 505 q105 105 210 0"/><path d="M225 715 q105 -105 210 0"/>
    </g>
    <circle cx="330" cy="610" r="46" fill="#5E4630" opacity=".65"/>
    <path d="M480 660 a130 130 0 0 1 0 200 z" fill="#FFFDF6" stroke="#D8C6A6"/>
    <path d="M480 660 a130 130 0 0 0 0 200 z" fill="#F3E8D2"/>
    <circle cx="520" cy="760" r="10" fill="#E6D3B4" opacity=".7"/>
    <g transform="translate(600 520) rotate(28)">
      <path d="M0 0 C40 -70 120 -90 170 -40 C110 -10 50 10 0 0Z" fill="#9FB38A" opacity=".7"/>
      <path d="M0 0 C70 20 120 80 100 140 C40 110 0 60 0 0Z" fill="#8FA47A" opacity=".6"/>
      <path d="M0 0 L150 -45" stroke="#6E7F5C" stroke-width="3" opacity=".5"/>
    </g>
  </g>`;
}

function turmericArt() {
  return `<g>
    <ellipse cx="400" cy="800" rx="250" ry="52" fill="#7A5A2E" opacity=".12" filter="url(#blur)"/>
    <g fill="#D9A23F" stroke="#B9832A" stroke-opacity=".35">
      <rect x="260" y="620" width="210" height="86" rx="43" transform="rotate(-12 365 663)"/>
      <rect x="380" y="660" width="180" height="74" rx="37" transform="rotate(18 470 697)"/>
      <rect x="300" y="700" width="160" height="64" rx="32" transform="rotate(6 380 732)"/>
    </g>
    <g stroke="#F8E3B5" stroke-opacity=".55" fill="none"><path d="M285 662 q40 -10 80 0"/><path d="M410 692 q40 8 80 0"/><path d="M330 730 q30 -6 60 0"/></g>
    <g transform="translate(560 470)">
      <path d="M0 0 C-40 -90 10 -170 70 -190 C64 -110 40 -50 0 0Z" fill="#8FAF8B" opacity=".75"/>
      <path d="M0 0 C40 -80 100 -100 150 -80 C110 -20 60 10 0 0Z" fill="#7E9C63" opacity=".65"/>
      <path d="M0 0 L100 -120" stroke="#5E7C5B" stroke-width="4" opacity=".5"/>
    </g>
  </g>`;
}

function ingredientSvg(ing) {
  const art = { lotus: lotusArt, centella: centellaArt, tea: teaArt, coconut: coconutArt, turmeric: turmericArt }[ing.id];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000" role="img" aria-label="${ing.label}">
    ${defs(ing.bg, ing.accent)}
    <rect width="800" height="1000" fill="url(#bg)"/>
    <ellipse cx="400" cy="420" rx="360" ry="330" fill="url(#halo)"/>
    <g fill="#fff" opacity=".35" filter="url(#soft)"><ellipse cx="170" cy="210" rx="130" ry="36"/><ellipse cx="630" cy="610" rx="120" ry="34"/></g>
    <rect x="34" y="34" width="732" height="932" fill="none" stroke="${ing.accent}" stroke-opacity=".18"/>
    <circle cx="400" cy="82" r="17" fill="none" stroke="${ing.accent}" stroke-opacity=".45"/>
    <path d="M391 89 q7 -13 19 -15 q0 13 -12 15" fill="none" stroke="${ing.accent}" stroke-width="1.5"/>
    <text x="400" y="124" text-anchor="middle" font-family="Arial, sans-serif" font-size="10.5" letter-spacing="4.6" fill="#2E3A44" opacity=".62">MÂY TRẮNG</text>
    ${art()}
    <text x="70" y="906" font-family="Arial, sans-serif" font-size="8.5" letter-spacing="3" fill="${ing.accent}">MÂY TRẮNG · NGUYÊN LIỆU VIỆT</text>
    <text x="70" y="934" font-family="Georgia, serif" font-size="21" fill="#2E3A44">${ing.label}</text>
    <text x="730" y="906" text-anchor="end" font-family="Arial, sans-serif" font-size="8" letter-spacing="2.5" fill="${ing.accent}">VIỆT NAM</text>
  </svg>`;
  fs.writeFileSync(path.join(BASE, 'ingredients', ing.id + '.svg'), svg, 'utf8');
}

ingredients.forEach(ingredientSvg);

/* --------------------------------- Hero --------------------------------- */
const heroProducts = [
  { id: 'hero-1', type: 'compact', short: 'PHẤN PHỦ', label: 'PHẤN PHỦ · KIỀM DẦU', tone: ['#FBF1E7', '#E9D4BF'], accent: '#C29A79', bg: ['#FDF9F4', '#F1E2D2'], scale: 1.45 },
  { id: 'hero-2', type: 'jar', short: 'SEN HỒNG', label: 'KEM DƯỠNG · SEN HỒNG', tone: ['#FEF7F8', '#F3D9DE'], accent: '#D99AA6', bg: ['#FFF8FA', '#F6DFE5'], scale: 1.55 },
  { id: 'hero-3', type: 'box', short: 'COMBO 4 MÓN', label: 'COMBO · CHĂM SÓC TOÀN DIỆN', tone: ['#F5F9FD', '#DFEAF4'], accent: '#9FBED6', bg: ['#FAFDFF', '#E6F1F8'], scale: 1.3 },
];

/* reuse product shape generators by importing the product generator's shapes is not possible;
   hero compositions are drawn directly with simple still-life primitives. */
function heroSvg(h) {
  const a = h.accent, tone = h.tone;
  let product = '';
  if (h.type === 'compact') {
    product = `<g transform="translate(450 930) scale(1.45)">
      <g transform="translate(60 -170) rotate(14)"><circle r="150" fill="#FFFDF9" stroke="${a}" stroke-opacity=".4"/><circle r="128" fill="#F7FBFD" opacity=".9"/><circle r="128" fill="none" stroke="${a}" stroke-opacity=".3"/><circle r="18" fill="none" stroke="${a}" stroke-opacity=".45"/></g>
      <ellipse cy="42" rx="200" ry="54" fill="${shade(tone[1], -12)}"/>
      <ellipse cy="8" rx="200" ry="60" fill="#FFFDF9" stroke="${a}" stroke-opacity=".4"/>
      <ellipse cy="0" rx="150" ry="42" fill="${shade(tone[1], -4)}"/>
      <ellipse cy="-2" rx="126" ry="32" fill="${a}" opacity=".28"/>
      <text x="0" y="52" text-anchor="middle" font-family="Arial" font-size="7" letter-spacing="2.2" fill="${a}">MÂY TRẮNG · 8G</text>
    </g>`;
  } else if (h.type === 'jar') {
    product = `<g transform="translate(450 930) scale(1.55)">
      <rect x="-150" y="-230" width="300" height="230" rx="40" fill="url(#pack)" stroke="${a}" stroke-opacity=".45"/>
      <rect x="-170" y="-320" width="340" height="96" rx="30" fill="url(#pack)" stroke="${a}" stroke-opacity=".45"/>
      <ellipse cx="0" cy="-320" rx="170" ry="44" fill="#FFFDF9" stroke="${a}" stroke-opacity=".3"/>
      <rect x="-86" y="-150" width="172" height="96" rx="8" fill="#FFFDF9" opacity=".9"/>
      <text x="0" y="-112" text-anchor="middle" font-family="Arial" font-size="9" letter-spacing="3" fill="${a}">MÂY TRẮNG</text>
      <text x="0" y="-88" text-anchor="middle" font-family="Georgia" font-size="17" fill="#2E3A44">SEN HỒNG</text>
      <path d="M-70 74 q70 12 140 0" stroke="${a}" stroke-opacity=".3" fill="none"/>
    </g>`;
  } else {
    product = `<g transform="translate(450 930) scale(1.3)">
      <rect x="-250" y="-250" width="500" height="250" rx="26" fill="url(#pack)" stroke="${a}" stroke-opacity=".45"/>
      <rect x="-250" y="-250" width="500" height="62" rx="26" fill="${a}" opacity=".22"/>
      <path d="M-30 -250 h60 v250 h-60z" fill="${a}" opacity=".35"/>
      <rect x="-200" y="-390" width="86" height="142" rx="14" fill="#FFFDF9" stroke="${a}" stroke-opacity=".4"/>
      <rect x="-80" y="-370" width="86" height="122" rx="14" fill="${tone[0]}" stroke="${a}" stroke-opacity=".4"/>
      <rect x="44" y="-400" width="86" height="152" rx="14" fill="#FFFDF9" stroke="${a}" stroke-opacity=".4"/>
      <circle cx="0" cy="-260" r="34" fill="none" stroke="${a}" stroke-width="8" opacity=".55"/>
      <path d="M0 -260 l-38 -30 v60z M0 -260 l38 -30 v60z" fill="${a}" opacity=".55"/>
      <text x="0" y="-80" text-anchor="middle" font-family="Georgia" font-size="27" fill="#2E3A44" opacity=".55">MÂY TRẮNG</text>
      <text x="0" y="-50" text-anchor="middle" font-family="Arial" font-size="9" letter-spacing="4" fill="${a}">GIFT SET</text>
    </g>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1125" viewBox="0 0 900 1125" role="img" aria-label="${h.label}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2=".7" y2="1"><stop offset="0" stop-color="${h.bg[0]}"/><stop offset="1" stop-color="${shade(h.bg[1], -8)}"/></linearGradient>
    <linearGradient id="pack" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".46" stop-color="${tone[0]}"/><stop offset="1" stop-color="${shade(tone[1], -12)}"/></linearGradient>
    <radialGradient id="halo" cx=".5" cy=".4" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22"/></filter>
    <filter id="soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="18"/></filter>
  </defs>
  <rect width="900" height="1125" fill="url(#bg)"/>
  <circle cx="450" cy="470" r="330" fill="url(#halo)"/>
  <circle cx="450" cy="470" r="286" fill="none" stroke="${a}" stroke-opacity=".16"/>
  <circle cx="450" cy="470" r="250" fill="none" stroke="${a}" stroke-opacity=".1"/>
  <g fill="#fff" opacity=".4" filter="url(#soft)"><ellipse cx="180" cy="210" rx="160" ry="44"/><ellipse cx="700" cy="650" rx="150" ry="40"/></g>
  <rect x="40" y="40" width="820" height="1045" fill="none" stroke="${a}" stroke-opacity=".18"/>
  <g><circle cx="450" cy="92" r="19" fill="none" stroke="${a}" stroke-opacity=".45"/><path d="M440 100 q8 -15 22 -17 q0 15 -14 17" fill="none" stroke="${a}" stroke-width="1.6"/><text x="450" y="138" text-anchor="middle" font-family="Arial" font-size="11" letter-spacing="5" fill="#2E3A44" opacity=".6">MÂY TRẮNG</text></g>
  <g opacity=".5" stroke="${a}" stroke-width="1.4" fill="none"><path d="M130 980 C180 900 230 860 320 830"/><path d="M790 560 C750 610 730 660 720 720"/></g>
  <g fill="${a}" opacity=".22"><ellipse cx="180" cy="920" rx="38" ry="12" transform="rotate(-32 180 920)"/><ellipse cx="222" cy="880" rx="32" ry="10" transform="rotate(-46 222 880)"/><ellipse cx="262" cy="850" rx="26" ry="9" transform="rotate(-56 262 850)"/><ellipse cx="738" cy="650" rx="30" ry="9" transform="rotate(60 738 650)"/></g>
  <ellipse cx="450" cy="950" rx="300" ry="48" fill="#2E3A44" opacity=".12" filter="url(#blur)"/>
  ${product}
  <text x="70" y="1062" font-family="Arial" font-size="9" letter-spacing="3" fill="${a}">MÂY TRẮNG · NATURAL BEAUTY</text>
  <text x="830" y="1062" text-anchor="end" font-family="Arial" font-size="9" letter-spacing="3" fill="${a}">VIỆT NAM</text>
  </svg>`;
  fs.writeFileSync(path.join(BASE, 'hero', h.id + '.svg'), svg, 'utf8');
}
heroProducts.forEach(heroSvg);

console.log('ingredient images:', ingredients.length);
console.log('hero images:', heroProducts.length);
