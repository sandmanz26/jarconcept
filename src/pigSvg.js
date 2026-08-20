import { PIG, shardPolygons, pointsToPath } from "./pigShape.js";

export function renderPigBack(svgEl) {
  svgEl.innerHTML = `
    <defs>
      <radialGradient id="pigBelly" cx="0.4" cy="0.35" r="0.75">
        <stop offset="0" stop-color="#ffd7e6"/>
        <stop offset="0.65" stop-color="#ff9dbd"/>
        <stop offset="1" stop-color="#f57aa3"/>
      </radialGradient>
      <radialGradient id="pigFloorShade" cx="0.5" cy="0.4" r="0.7">
        <stop offset="0" stop-color="#8a2c53" stop-opacity="0.35"/>
        <stop offset="1" stop-color="#8a2c53" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <ellipse cx="${PIG.cx}" cy="${PIG.cy}" rx="${PIG.rx}" ry="${PIG.ry}" fill="url(#pigBelly)"/>
    <ellipse cx="${PIG.cx}" cy="${PIG.cy + PIG.ry * 0.55}" rx="${PIG.rx * 0.72}" ry="${PIG.ry * 0.3}" fill="url(#pigFloorShade)"/>
  `;
}

export function renderPigFront(svgEl) {
  const { cx, cy, rx, ry, slotX, slotY, slotW, slotH } = PIG;
  svgEl.innerHTML = `
    <defs>
      <linearGradient id="pigLegGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#f987ac"/>
        <stop offset="1" stop-color="#f2678f"/>
      </linearGradient>
      <linearGradient id="pigEarGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffb8d1"/>
        <stop offset="1" stop-color="#f2678f"/>
      </linearGradient>
      <radialGradient id="pigGloss" cx="0.3" cy="0.25" r="0.5">
        <stop offset="0" stop-color="#ffffff" stop-opacity="0.75"/>
        <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>
    </defs>

    <!-- legs -->
    ${[-0.55, -0.2, 0.2, 0.55]
      .map((f) => {
        const lx = cx + rx * f;
        const ly = cy + ry * 0.86;
        return `<rect x="${lx - 10}" y="${ly}" width="20" height="26" rx="9" fill="url(#pigLegGrad)"/>`;
      })
      .join("")}

    <!-- tail -->
    <path d="M ${cx + rx * 0.92} ${cy - ry * 0.15}
             q 18 -4 14 -20 q -3 -12 -16 -8"
          fill="none" stroke="#f2678f" stroke-width="7" stroke-linecap="round"/>

    <!-- ears -->
    <path d="M ${cx - rx * 0.5} ${cy - ry * 0.86} l -20 -30 l 34 10 Z" fill="url(#pigEarGrad)" stroke="#e85586" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M ${cx - rx * 0.12} ${cy - ry * 0.98} l -6 -34 l 32 18 Z" fill="url(#pigEarGrad)" stroke="#e85586" stroke-width="1.5" stroke-linejoin="round"/>

    <!-- body outline + gloss -->
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="#e85586" stroke-width="2.5"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#pigGloss)"/>

    <!-- snout -->
    <ellipse cx="${cx + rx * 0.74}" cy="${cy + ry * 0.08}" rx="30" ry="22" fill="#ff9dbd" stroke="#e85586" stroke-width="2"/>
    <ellipse cx="${cx + rx * 0.67}" cy="${cy + ry * 0.08}" rx="4.5" ry="6.5" fill="#c94b74"/>
    <ellipse cx="${cx + rx * 0.85}" cy="${cy + ry * 0.08}" rx="4.5" ry="6.5" fill="#c94b74"/>

    <!-- eye -->
    <circle cx="${cx + rx * 0.32}" cy="${cy - ry * 0.28}" r="6" fill="#3a2130"/>
    <circle cx="${cx + rx * 0.32 - 2}" cy="${cy - ry * 0.28 - 2}" r="2" fill="#fff"/>

    <!-- coin slot -->
    <g transform="rotate(-6 ${slotX} ${slotY})">
      <rect x="${slotX - slotW / 2}" y="${slotY - slotH / 2}" width="${slotW}" height="${slotH}" rx="${slotH / 2}"
            fill="#7a1f3f"/>
      <rect x="${slotX - slotW / 2 + 3}" y="${slotY - slotH / 2 + 2}" width="${slotW - 6}" height="2.4" rx="1.2"
            fill="#4d1128"/>
    </g>
  `;
}

// Crack overlay: each break line fades in once the fill percentage passes
// its stage threshold (see updateCracks in pigPage.js).
export function renderCracks(svgEl) {
  const shards = shardPolygons();
  const lines = shards
    .map((s, i) => {
      // Hand-paced reveal: stage 1 shows a single hairline crack, later
      // stages add more so the piggy looks progressively more damaged
      // right up until it shatters, instead of cracking "all at once".
      const stageOrder = [1, 2, 3, 3, 4, 4];
      const stage = stageOrder[i % stageOrder.length];
      const mid = s.points[2] ?? s.points[1];
      const end = s.points[s.points.length - 1];
      const jagPath = `M ${mid.x.toFixed(1)} ${mid.y.toFixed(1)} L ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
      return `
        <path data-stage="${stage}" class="crack-line" d="M ${PIG.cx} ${PIG.cy} L ${mid.x.toFixed(1)} ${mid.y.toFixed(1)}"
              stroke="#7a1f3f" stroke-width="1.4" stroke-linecap="round" opacity="0"/>
        <path data-stage="${stage}" class="crack-line" d="${jagPath}"
              fill="none" stroke="#7a1f3f" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>
      `;
    })
    .join("");
  svgEl.innerHTML = lines;
}

// Shatter shards: same wedge geometry, filled to match the body so the
// intact assembly reads seamlessly, then animated apart via CSS classes
// applied in pigPage.js.
export function renderShards(svgEl) {
  const shards = shardPolygons();
  svgEl.innerHTML = `
    <defs>
      <radialGradient id="shardGrad" cx="0.4" cy="0.3" r="0.9">
        <stop offset="0" stop-color="#ffb8d1"/>
        <stop offset="1" stop-color="#f2678f"/>
      </radialGradient>
    </defs>
    ${shards
      .map((s, i) => {
        const dx = Math.cos(s.angle);
        const dy = Math.sin(s.angle);
        return `<path class="shard" style="--dx:${dx.toFixed(3)};--dy:${dy.toFixed(3)};--sd:${i * 35}ms"
              d="${pointsToPath(s.points)}" fill="url(#shardGrad)" stroke="#e85586" stroke-width="1.5"/>`;
      })
      .join("")}
  `;
}
