// Generates public/og.png (1200×630) — the social share card.
// Built from an SVG: espresso ground + teal glow + the vector wordmark
// (no font dependency for the logo) + headline. Rasterised with sharp.
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dir = dirname(fileURLToPath(import.meta.url));
const out = resolve(__dir, "../public/og.png");

const W = 1200;
const H = 630;

// Wordmark in its native 1148×262 space, scaled + centred near the top.
const wmScale = 0.4;
const wmW = 1148 * wmScale;
const wmX = (W - wmW) / 2;
const wmY = 150;

const wordmark = `
  <g transform="translate(${wmX} ${wmY}) scale(${wmScale})">
    <g stroke="#F4F1EE" stroke-width="50" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M25 237L25 56M25 157C25 123.667 41.6667 107 75 107C108.333 107 125 123.667 125 157V237"/>
      <path d="M263 237C298.899 237 328 207.899 328 172C328 136.101 298.899 107 263 107C227.101 107 198 136.101 198 172C198 207.899 227.101 237 263 237Z"/>
      <path d="M401 237V157C401 123.667 417.667 107 451 107C484.333 107 501 123.667 501 157M501 157V237M501 157C501 123.667 517.667 107 551 107C584.333 107 601 123.667 601 157V237"/>
      <path d="M674 117V187C674 220.333 708.667 237 778 237C847.333 237 882 220.333 882 187V117"/>
      <path d="M955 237V157C955 123.667 971.667 107 1005 107C1038.33 107 1055 123.667 1055 157V237"/>
    </g>
    <path d="M778 26C794.569 26 808 39.4315 808 56C808 72.5685 794.569 86 778 86C761.431 86 748 72.5685 748 56C748 39.4315 761.431 26 778 26Z" fill="#157A6E"/>
  </g>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="glow" cx="50%" cy="2%" r="62%">
      <stop offset="0%" stop-color="#67efd5" stop-opacity="0.30"/>
      <stop offset="55%" stop-color="#20a991" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#67efd5" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="ink" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#bcd3cd"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="#050807"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <!-- hairline frame -->
  <rect x="24" y="24" width="${W - 48}" height="${H - 48}" rx="22" fill="none"
        stroke="#f4f1ee" stroke-opacity="0.10"/>

  ${wordmark}

  <text x="${W / 2}" y="380" text-anchor="middle"
        font-family="Inter, 'Helvetica Neue', Arial, sans-serif" font-size="54"
        font-weight="600" letter-spacing="-2" fill="url(#ink)">Your work. Your models. Your system.</text>

  <text x="${W / 2}" y="455" text-anchor="middle"
        font-family="'SF Mono', ui-monospace, Menlo, monospace" font-size="24"
        letter-spacing="2" fill="#9fada9">CLOUD · OPEN SOURCE · LOCAL</text>

  <g transform="translate(${W / 2 - 4} 520)">
    <circle cx="0" cy="0" r="5" fill="#50dfc5"/>
  </g>
  <text x="${W / 2 + 16}" y="527" text-anchor="start"
        font-family="'SF Mono', ui-monospace, Menlo, monospace" font-size="22"
        fill="#6c7975">homun.app</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(out);
console.log("✓ wrote", out);
