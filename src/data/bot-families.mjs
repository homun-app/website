// Body paths from sandbot/src/renderer/src/bot/Bot.tsx.
const JELLY = [
  "M50 12 C74 10 90 28 88 52 C86 76 70 90 48 88 C26 86 10 72 12 50 C14 28 28 14 50 12Z",
  "M52 14 C78 14 88 32 86 54 C84 78 66 88 46 86 C22 84 12 68 14 46 C16 26 30 14 52 14Z",
  "M48 10 C70 12 92 26 88 50 C84 74 72 92 50 90 C28 88 12 76 10 52 C10 30 28 10 48 10Z"
]

const CREATURE = [
  "M50 28 C72 28 84 44 82 62 C80 80 66 88 50 88 C34 88 20 80 18 62 C16 44 28 28 50 28Z",
  "M50 24 C70 26 80 44 80 62 C80 82 64 88 50 88 C36 88 20 82 20 62 C20 44 30 26 50 24Z",
  "M50 32 C76 32 88 46 86 64 C84 80 68 88 50 88 C32 88 16 80 14 64 C12 46 24 32 50 32Z"
]
const ROBO = [
  "M50 22 C70 22 80 32 80 50 C80 70 70 80 50 80 C30 80 20 70 20 50 C20 32 30 22 50 22Z",
  "M50 20 C68 20 78 32 78 50 C78 72 68 82 50 82 C32 82 22 72 22 50 C22 32 32 20 50 20Z",
  "M50 24 C72 24 82 34 82 50 C82 68 72 78 50 78 C28 78 18 68 18 50 C18 34 28 24 50 24Z"
]
const DEVICE = [
  "M50 16 C78 16 86 20 86 46 C86 76 78 84 50 84 C22 84 14 76 14 46 C14 20 22 16 50 16Z",
  "M50 13 C76 14 84 20 84 46 C84 78 76 85 50 85 C24 85 16 78 16 46 C16 20 24 14 50 13Z",
  "M50 19 C80 18 89 22 88 48 C88 75 80 83 50 83 C20 83 12 75 12 48 C11 22 20 18 50 19Z"
]

export const FAMILIES = Object.freeze({
  creature: Object.freeze(CREATURE),
  robo: Object.freeze(ROBO),
  device: Object.freeze(DEVICE),
  jelly: Object.freeze(JELLY),
});

function eyes(positions, ink, state, mini, shape = "pill") {
  const blink = mini ? "" : ' class="blink"';
  const gaze = state === "thinking" ? ' transform="translate(3 -4)"' : "";
  const pair = positions.map(([x, y]) => {
    if (state === "happy") {
      return `<path d="M${x - 5} ${y + 2} Q${x} ${y - 6} ${x + 5} ${y + 2}" stroke="${ink}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
    }
    if (shape === "dot") {
      return `<circle${blink} cx="${x}" cy="${y}" r="4" fill="${ink}"/>`;
    }
    return `<rect${blink} x="${x - 3.5}" y="${y - 7}" width="7" height="14" rx="3.5" fill="${ink}"/>`;
  });
  return `<g${gaze}>${pair.join("")}</g>`;
}

function mouth(state, y, ink) {
  switch (state) {
    case "speaking":
      return `<ellipse cx="50" cy="${y}" rx="5" ry="3" fill="${ink}"/>`;
    case "happy":
      return `<path d="M44 ${y - 1} Q50 ${y + 6} 56 ${y - 1}" fill="${ink}"/>`;
    case "thinking":
      return `<path d="M46 ${y} L54 ${y - 1}" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/>`;
    default:
      return "";
  }
}

const PERIODS = { creature: 3.6, robo: 3.2, device: 3.8, jelly: 4 };
const STATES = new Set(["idle", "listening", "thinking", "speaking", "waiting", "happy"]);

export function botSvg({ family, color, state = "idle", mini = false }) {
  if (!Object.hasOwn(FAMILIES, family)) throw new Error(`Unknown bot family: ${family}`);
  if (!STATES.has(state)) throw new Error(`Unknown bot state: ${state}`);
  if (!/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(color)) throw new Error("Expected a hex bot color");

  const ink = "var(--ink)";
  const paths = FAMILIES[family];
  const period = state === "speaking" && family === "creature" ? 0.8
    : state === "speaking" && family === "jelly" ? 0.9
    : PERIODS[family];
  const morph = mini ? "" : `<animate attributeName="d" begin="indefinite" dur="${period}s" repeatCount="indefinite" values="${[...paths, paths[0]].join(";")}" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1;.45 0 .55 1"/>`;
  const body = `<path fill="${color}" d="${paths[0]}">${morph}</path>`;
  let drawing;
  switch (family) {
    case "creature":
      drawing = `
        <path d="M32 34 C26 20 28 10 34 8 C40 10 42 22 40 32Z" fill="${color}"/>
        <path d="M68 34 C74 20 72 10 66 8 C60 10 58 22 60 32Z" fill="${color}"/>
        ${body}
        <ellipse cx="38" cy="40" rx="8" ry="4" fill="#fff" opacity=".25" transform="rotate(-25 38 40)"/>
        <circle cx="34" cy="66" r="4" fill="var(--blush)" opacity=".55"/>
        <circle cx="66" cy="66" r="4" fill="var(--blush)" opacity=".55"/>
        ${eyes([[42, 56], [58, 56]], ink, state, mini)}
        ${mouth(state, 70, ink)}`;
      break;
    case "robo":
      drawing = `
        <path d="M50 22 Q46 14 50 8" stroke="${ink}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <circle cx="50" cy="8" r="4.5" fill="${color}"/>
        ${body}
        <rect x="28" y="34" width="44" height="26" rx="13" fill="var(--screen)"/>
        ${eyes([[41, 47], [59, 47]], color, state, mini)}
        ${mouth(state, 70, ink)}
        <circle cx="12" cy="60" r="7" fill="${color}"/>
        <circle cx="88" cy="60" r="7" fill="${color}"/>`;
      break;
    case "device":
      drawing = `
        ${body}
        <rect x="24" y="26" width="52" height="38" rx="12" fill="var(--screen)"/>
        ${eyes([[40, 43], [60, 43]], color, state, mini, "dot")}
        ${mouth(state, 55, color)}
        <ellipse cx="36" cy="90" rx="7" ry="4" fill="${color}"/>
        <ellipse cx="64" cy="90" rx="7" ry="4" fill="${color}"/>`;
      break;
    case "jelly":
      drawing = `
        ${body}
        <ellipse cx="36" cy="30" rx="10" ry="5" fill="#fff" opacity=".25" transform="rotate(-25 36 30)"/>
        ${eyes([[42, 46], [58, 46]], ink, state, mini)}
        ${mouth(state, 62, ink)}`;
      break;
  }
  const dots = state === "thinking" ? `<g class="dot3" fill="var(--a-mfg)" opacity=".7">
    <circle cx="78" cy="14" r="2"/>
    <circle cx="84" cy="14" r="2" style="animation-delay:.15s"/>
    <circle cx="90" cy="14" r="2" style="animation-delay:.3s"/>
  </g>` : "";

  return `<svg viewBox="0 0 100 100" width="100%" height="100%" overflow="visible" aria-hidden="true" focusable="false">
    <g class="mb">${drawing}</g>${dots}
  </svg>`;
}
