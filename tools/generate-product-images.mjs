import fs from 'node:fs';
import path from 'node:path';

const OUT = 'C:/Users/dn322/Documents/deepseek-harness/default-workspace/maytrang-web/assets/img/products';
fs.mkdirSync(OUT, { recursive: true });

const products = [
  { id: 'sp-001', type: 'compact', short: 'PHẤN PHỦ', label: 'PHẤN PHỦ · KIỀM DẦU', tone: ['#FBF1E7', '#E9D4BF'], accent: '#C29A79', bg: ['#FDF9F4', '#F3E6D8'] },
  { id: 'sp-002', type: 'jar', short: 'SEN HỒNG', label: 'KEM DƯỠNG · SEN HỒNG', tone: ['#FEF7F8', '#F3D9DE'], accent: '#D99AA6', bg: ['#FFF9FA', '#F8E5E9'] },
  { id: 'sp-003', type: 'bottle', short: 'KEM NỀN', label: 'KEM NỀN · DƯỠNG DA', tone: ['#F9F1E6', '#E9D5BD'], accent: '#C7A98E', bg: ['#FDF9F3', '#F4E8D9'] },
  { id: 'sp-004', type: 'tube', short: 'CHỐNG NẮNG', label: 'CHỐNG NẮNG · SPF 50+', tone: ['#F5FBFE', '#DAEBF5'], accent: '#8FB6CF', bg: ['#F8FCFE', '#E7F2F8'] },
  { id: 'sp-005', type: 'tube', short: 'RAU MÁ', label: 'RỬA MẶT · RAU MÁ', tone: ['#F4F9F5', '#DCEDE3'], accent: '#8FBFA6', bg: ['#F8FCF9', '#E8F3EC'] },
  { id: 'sp-006', type: 'bottle', short: 'HOA HỒNG', label: 'TẨY TRANG · HOA HỒNG', tone: ['#F8F3FA', '#E8DDF1'], accent: '#B9A3D0', bg: ['#FBF8FC', '#EEE6F6'] },
  { id: 'sp-007', type: 'dropper', short: 'VITAMIN C', label: 'SERUM · VITAMIN C', tone: ['#F5F9F3', '#DDEAD8'], accent: '#9BB98F', bg: ['#F9FCF7', '#EAF2E5'] },
  { id: 'sp-008', type: 'jar', short: 'TRÀ XANH', label: 'MẶT NẠ · TRÀ XANH', tone: ['#F2F4ED', '#DFE6D4'], accent: '#A9B79B', bg: ['#F9FAF5', '#EBEFE2'] },
  { id: 'sp-009', type: 'spray', short: 'HOA SEN', label: 'XỊT KHOÁNG · HOA SEN', tone: ['#FEF6F7', '#F3DEE3'], accent: '#DFA9B6', bg: ['#FFFAFB', '#F9EAEE'] },
  { id: 'sp-010', type: 'lip', short: 'DẦU DỪA', label: 'SON DƯỠNG · DẦU DỪA', tone: ['#FCF1E8', '#EFD9C5'], accent: '#D3A37F', bg: ['#FDF9F3', '#F6E8DA'] },
  { id: 'sp-011', type: 'box', short: 'COMBO 4 MÓN', label: 'COMBO · CHĂM SÓC TOÀN DIỆN', tone: ['#F5F9FD', '#DFEAF4'], accent: '#A9C7DD', bg: ['#FAFDFF', '#EBF4FA'] },
  { id: 'sp-012', type: 'pouch', short: 'COMBO 3 MÓN', label: 'COMBO · TÂN KHÁCH HÀNG', tone: ['#FCF4F6', '#F0DEE4'], accent: '#D99AA6', bg: ['#FEF9FB', '#F7E8ED'] },
  { id: 'sp-013', type: 'pouch', short: 'MINI SET', label: 'BỘ MINI · TRẢI NGHIỆM', tone: ['#F7F5FC', '#E6E0F3'], accent: '#B7A8D6', bg: ['#FBF9FE', '#EFEAF8'] },
  { id: 'sp-014', type: 'bodyJar', short: 'DỪA BẾN TRE', label: 'DƯỠNG THỂ · DỪA BẾN TRE', tone: ['#FDF7ED', '#EFE0C9'], accent: '#D3B98F', bg: ['#FEFBF5', '#F5EBDA'] },
];

function shade(hex, percent) {
  const n = hex.replace('#', '');
  const num = parseInt(n, 16);
  const amt = Math.round(255 * percent / 100);
  const r = Math.min(255, Math.max(0, (num >> 16) + amt));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

function labelBlock(p, x, y, w) {
  return `<g>
    <rect x="${x - w / 2}" y="${y - 26}" width="${w}" height="66" rx="6" fill="#FFFDF9" opacity=".92"/>
    <text x="${x}" y="${y - 7}" text-anchor="middle" font-family="Arial, sans-serif" font-size="7.5" letter-spacing="2.4" fill="${p.accent}">MÂY TRẮNG</text>
    <text x="${x}" y="${y + 12}" text-anchor="middle" font-family="Georgia, serif" font-size="12" fill="#2E3A44">${p.short}</text>
    <line x1="${x - 22}" y1="${y + 20}" x2="${x + 22}" y2="${y + 20}" stroke="${p.accent}" stroke-opacity=".45"/>
  </g>`;
}

function shadow() {
  return `<ellipse cx="400" cy="782" rx="225" ry="36" fill="#2E3A44" opacity=".14" filter="url(#blur)"/>`;
}

function botanical(p) {
  return `<g opacity=".5" stroke="${p.accent}" stroke-width="1.3" fill="none" stroke-linecap="round">
    <path d="M92 872 C126 808 160 770 224 738"/>
    <path d="M700 470 C668 520 650 560 642 610"/>
  </g>
  <g fill="${p.accent}" opacity=".22">
    <ellipse cx="126" cy="818" rx="31" ry="10" transform="rotate(-32 126 818)"/>
    <ellipse cx="158" cy="786" rx="27" ry="9" transform="rotate(-48 158 786)"/>
    <ellipse cx="196" cy="758" rx="23" ry="8" transform="rotate(-58 196 758)"/>
    <ellipse cx="665" cy="535" rx="26" ry="8" transform="rotate(58 665 535)"/>
    <ellipse cx="684" cy="575" rx="22" ry="7" transform="rotate(78 684 575)"/>
  </g>`;
}

const shapes = {
  jar(p) {
    return `<g transform="translate(400 770)">
      <rect x="-134" y="-196" width="268" height="196" rx="34" fill="url(#pack)" stroke="${p.accent}" stroke-opacity=".38"/>
      <ellipse cx="0" cy="-196" rx="134" ry="37" fill="#FFFFFF" opacity=".55"/>
      <rect x="-152" y="-274" width="304" height="84" rx="28" fill="url(#pack)" stroke="${p.accent}" stroke-opacity=".42"/>
      <ellipse cx="0" cy="-274" rx="152" ry="40" fill="#FFFFFF" opacity=".85"/>
      <ellipse cx="0" cy="-274" rx="152" ry="40" fill="none" stroke="${p.accent}" stroke-opacity=".25"/>
      <ellipse cx="0" cy="-146" rx="110" ry="26" fill="#FFFFFF" opacity=".28"/>
      ${labelBlock(p, 0, -92, 158)}
    </g>`;
  },
  bodyJar(p) {
    return `<g transform="translate(400 770)">
      <rect x="-172" y="-164" width="344" height="164" rx="38" fill="url(#pack)" stroke="${p.accent}" stroke-opacity=".38"/>
      <ellipse cx="0" cy="-164" rx="172" ry="42" fill="#FFFFFF" opacity=".55"/>
      <rect x="-190" y="-236" width="380" height="78" rx="28" fill="url(#pack)" stroke="${p.accent}" stroke-opacity=".42"/>
      <ellipse cx="0" cy="-236" rx="190" ry="44" fill="#FFFFFF" opacity=".85"/>
      <ellipse cx="0" cy="-236" rx="190" ry="44" fill="none" stroke="${p.accent}" stroke-opacity=".24"/>
      ${labelBlock(p, 0, -110, 190)}
    </g>`;
  },
  bottle(p) {
    return `<g transform="translate(400 782)">
      <rect x="-96" y="-330" width="192" height="330" rx="34" fill="url(#pack)" stroke="${p.accent}" stroke-opacity=".38"/>
      <rect x="-96" y="-330" width="192" height="96" rx="34" fill="#FFFFFF" opacity=".35"/>
      <rect x="-40" y="-404" width="80" height="82" rx="14" fill="url(#pack)" stroke="${p.accent}" stroke-opacity=".35"/>
      <rect x="-18" y="-446" width="36" height="48" rx="8" fill="${p.accent}" opacity=".8"/>
      <ellipse cx="0" cy="-330" rx="96" ry="18" fill="#FFFFFF" opacity=".28"/>
      ${labelBlock(p, 0, -228, 148)}
    </g>`;
  },
  dropper(p) {
    return `<g transform="translate(400 782)">
      <rect x="-88" y="-318" width="176" height="318" rx="32" fill="url(#pack)" stroke="${p.accent}" stroke-opacity=".38"/>
      <rect x="-34" y="-390" width="68" height="80" rx="12" fill="url(#pack)" stroke="${p.accent}" stroke-opacity=".35"/>
      <ellipse cx="0" cy="-430" rx="30" ry="40" fill="${p.accent}" opacity=".8"/>
      <rect x="-7" y="-392" width="14" height="60" fill="${p.accent}" opacity=".45"/>
      <rect x="-62" y="-238" width="124" height="150" rx="6" fill="#FFFDF9" opacity=".7"/>
      ${labelBlock(p, 0, -212, 132)}
      <ellipse cx="0" cy="-120" rx="88" ry="18" fill="#FFFFFF" opacity=".2"/>
    </g>`;
  },
  tube(p) {
    return `<g transform="translate(400 706)">
      <rect x="-82" y="-330" width="164" height="330" rx="36" fill="url(#pack)" stroke="${p.accent}" stroke-opacity=".38"/>
      <rect x="-82" y="-330" width="164" height="54" rx="30" fill="#FFFFFF" opacity=".35"/>
      <rect x="-49" y="0" width="98" height="74" rx="16" fill="${p.accent}" opacity=".78"/>
      <rect x="-49" y="-6" width="98" height="14" fill="#2E3A44" opacity=".07"/>
      <rect x="-66" y="-258" width="132" height="156" rx="8" fill="#FFFDF9" opacity=".92"/>
      ${labelBlock(p, 0, -222, 140)}
      <path d="M-60 74 q60 10 120 0" stroke="${p.accent}" stroke-opacity=".3" fill="none"/>
    </g>`;
  },
  spray(p) {
    return `<g transform="translate(400 784)">
      <rect x="-64" y="-318" width="128" height="318" rx="28" fill="url(#pack)" stroke="${p.accent}" stroke-opacity=".4"/>
      <rect x="-30" y="-388" width="60" height="74" rx="10" fill="${p.accent}" opacity=".78"/>
      <path d="M30 -370 h42 v16 h-26" fill="${p.accent}" opacity=".55"/>
      <rect x="-46" y="-236" width="92" height="146" rx="5" fill="#FFFDF9" opacity=".9"/>
      ${labelBlock(p, 0, -208, 108)}
      <g fill="${p.accent}" opacity=".28">
        <circle cx="92" cy="-388" r="5"/><circle cx="112" cy="-370" r="3.5"/>
        <circle cx="82" cy="-356" r="3"/><circle cx="122" cy="-392" r="2.5"/>
      </g>
      <ellipse cx="0" cy="-318" rx="64" ry="14" fill="#FFFFFF" opacity=".3"/>
    </g>`;
  },
  lip(p) {
    return `<g transform="translate(400 766) rotate(11)">
      <rect x="-44" y="-246" width="88" height="246" rx="24" fill="url(#pack)" stroke="${p.accent}" stroke-opacity=".4"/>
      <rect x="-44" y="-322" width="88" height="82" rx="20" fill="${p.accent}" opacity=".82"/>
      <rect x="-44" y="-192" width="88" height="46" fill="${p.accent}" opacity=".18"/>
      <rect x="-30" y="-150" width="60" height="104" rx="5" fill="#FFFDF9" opacity=".9"/>
      <text x="0" y="-128" text-anchor="middle" font-family="Arial" font-size="6.5" letter-spacing="1.8" fill="${p.accent}">MÂY TRẮNG</text>
      <text x="0" y="-114" text-anchor="middle" font-family="Georgia,serif" font-size="9.5" fill="#2E3A44">DẦU DỪA</text>
      <ellipse cx="0" cy="-246" rx="44" ry="12" fill="#FFFFFF" opacity=".35"/>
    </g>`;
  },
  compact(p) {
    return `<g transform="translate(400 748)">
      <g transform="translate(44 -158) rotate(15)">
        <circle r="152" fill="url(#pack)" stroke="${p.accent}" stroke-opacity=".38"/>
        <circle r="128" fill="#F6FBFD" opacity=".82"/>
        <circle r="128" fill="none" stroke="${p.accent}" stroke-opacity=".32"/>
        <circle r="16" fill="none" stroke="${p.accent}" stroke-opacity=".5"/>
        <path d="M-8 4 q8 -12 18 -14 q-1 12 -12 14" fill="none" stroke="${p.accent}" stroke-width="1.6"/>
      </g>
      <ellipse cx="0" cy="44" rx="205" ry="54" fill="${p.tone[1]}"/>
      <ellipse cx="0" cy="10" rx="205" ry="60" fill="url(#pack)" stroke="${p.accent}" stroke-opacity=".4"/>
      <ellipse cx="0" cy="2" rx="156" ry="43" fill="${p.tone[1]}"/>
      <ellipse cx="0" cy="0" rx="134" ry="35" fill="${p.accent}" opacity=".3"/>
      <ellipse cx="0" cy="-2" rx="110" ry="27" fill="${p.tone[0]}" opacity=".85"/>
      <text x="0" y="54" text-anchor="middle" font-family="Arial" font-size="7" letter-spacing="2.2" fill="${p.accent}">MÂY TRẮNG · 8G</text>
    </g>`;
  },
  box(p) {
    return `<g transform="translate(400 790)">
      <rect x="-212" y="-212" width="424" height="212" rx="24" fill="url(#pack)" stroke="${p.accent}" stroke-opacity=".4"/>
      <rect x="-212" y="-212" width="424" height="54" rx="24" fill="${p.accent}" opacity=".22"/>
      <path d="M-28 -212 h56 v212 h-56z" fill="${p.accent}" opacity=".35"/>
      <rect x="-162" y="-332" width="72" height="122" rx="12" fill="#FFFDF9" stroke="${p.accent}" stroke-opacity=".35"/>
      <rect x="-54" y="-312" width="72" height="102" rx="12" fill="${p.tone[0]}" stroke="${p.accent}" stroke-opacity=".35"/>
      <rect x="54" y="-344" width="72" height="134" rx="12" fill="#FFFDF9" stroke="${p.accent}" stroke-opacity=".35"/>
      <circle cx="0" cy="-222" r="30" fill="none" stroke="${p.accent}" stroke-width="7" opacity=".55"/>
      <path d="M0 -222 l-34 -26 v52z M0 -222 l34 -26 v52z" fill="${p.accent}" opacity=".55"/>
      <text x="0" y="-60" text-anchor="middle" font-family="Georgia,serif" font-size="24" fill="#2E3A44" opacity=".55">MÂY TRẮNG</text>
      <text x="0" y="-34" text-anchor="middle" font-family="Arial" font-size="8" letter-spacing="3" fill="${p.accent}">GIFT SET</text>
    </g>`;
  },
  pouch(p) {
    return `<g transform="translate(400 790)">
      <path d="M-156 -18 C-184 -92 -176 -196 -122 -228 L122 -228 C176 -196 184 -92 156 -18 L142 0 H-142 Z" fill="url(#pack)" stroke="${p.accent}" stroke-opacity=".42"/>
      <path d="M-122 -228 Q0 -256 122 -228" fill="none" stroke="${p.accent}" stroke-width="2" opacity=".5"/>
      <circle cx="0" cy="-240" r="9" fill="${p.accent}" opacity=".6"/>
      <rect x="-120" y="-356" width="64" height="136" rx="12" fill="#FFFDF9" stroke="${p.accent}" stroke-opacity=".35"/>
      <rect x="-40" y="-338" width="64" height="118" rx="12" fill="${p.tone[0]}" stroke="${p.accent}" stroke-opacity=".35"/>
      <rect x="42" y="-352" width="64" height="132" rx="12" fill="#FFFDF9" stroke="${p.accent}" stroke-opacity=".35"/>
      <text x="0" y="-120" text-anchor="middle" font-family="Arial" font-size="8" letter-spacing="3" fill="${p.accent}">MÂY TRẮNG</text>
      <text x="0" y="-96" text-anchor="middle" font-family="Georgia,serif" font-size="16" fill="#2E3A44">${p.short}</text>
      <line x1="-30" y1="-82" x2="30" y2="-82" stroke="${p.accent}" stroke-opacity=".4"/>
    </g>`;
  },
};

function build(p, variant) {
  const v = variant || 'a';
  const viewBox = v === 'b' ? '150 300 500 625' : '0 0 800 1000';
  const scales = { jar: 1.36, bodyJar: 1.3, bottle: 1.16, dropper: 1.14, tube: 1.24, spray: 1.18, lip: 1.38, compact: 1.34, box: 1.16, pouch: 1.26 };
  const scale = scales[p.type] || 1.15;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="${viewBox}" role="img" aria-label="Mây Trắng – ${p.label}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.7" y2="1">
      <stop offset="0" stop-color="${p.bg[0]}"/><stop offset="1" stop-color="${shade(p.bg[1], -5)}"/>
    </linearGradient>
    <linearGradient id="pack" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFFFFF"/><stop offset=".46" stop-color="${p.tone[0]}"/><stop offset="1" stop-color="${shade(p.tone[1], -16)}"/>
    </linearGradient>
    <radialGradient id="glow" cx=".5" cy=".35" r=".65">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity=".85"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <filter id="blur" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="20"/></filter>
    <filter id="soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="16"/></filter>
    <filter id="prodShadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="12" stdDeviation="9" flood-color="#2E3A44" flood-opacity=".16"/></filter>
  </defs>
  <rect width="800" height="1000" fill="url(#bg)"/>
  <ellipse cx="400" cy="330" rx="380" ry="300" fill="url(#glow)"/>
  <g fill="#FFFFFF" opacity=".42" filter="url(#soft)">
    <ellipse cx="185" cy="205" rx="145" ry="40"/>
    <ellipse cx="262" cy="184" rx="88" ry="30"/>
    <ellipse cx="648" cy="512" rx="120" ry="34"/>
    <ellipse cx="690" cy="548" rx="70" ry="22"/>
  </g>
  <rect x="34" y="34" width="732" height="932" fill="none" stroke="${p.accent}" stroke-opacity=".18"/>
  <g>
    <circle cx="400" cy="82" r="17" fill="none" stroke="${p.accent}" stroke-opacity=".45"/>
    <path d="M391 89 q7 -13 19 -15 q0 13 -12 15" fill="none" stroke="${p.accent}" stroke-width="1.5"/>
    <text x="400" y="124" text-anchor="middle" font-family="Arial, sans-serif" font-size="10.5" letter-spacing="4.6" fill="#2E3A44" opacity=".62">MÂY TRẮNG</text>
  </g>
  ${botanical(p)}
  ${shadow()}
  <g transform="translate(400 782) scale(${scale}) translate(-400 -782)" filter="url(#prodShadow)">
    ${shapes[p.type](p)}
  </g>
  <g>
    <text x="70" y="906" font-family="Arial, sans-serif" font-size="8.5" letter-spacing="3" fill="#6E9BB8">MÂY TRẮNG · NATURAL BEAUTY</text>
    <text x="70" y="934" font-family="Georgia, serif" font-size="23" fill="#2E3A44">${p.label}</text>
    <text x="730" y="906" text-anchor="end" font-family="Arial, sans-serif" font-size="8" letter-spacing="2.5" fill="${p.accent}">VIỆT NAM</text>
  </g>
</svg>`;
}

for (const p of products) {
  fs.writeFileSync(path.join(OUT, p.id + '-a.svg'), build(p, 'a'), 'utf8');
  fs.writeFileSync(path.join(OUT, p.id + '-b.svg'), build(p, 'b'), 'utf8');
}

console.log('generated', products.length * 2, 'svg files in', OUT);
