import { JAR, outerJarPath, innerJarPath } from "./jarShape.js";

// Builds the jar chrome as three stacked layers so the canvas (physics
// items) can sit visually *inside* the glass:
//   1. back glass  (z-index below canvas)  – tinted rear wall + floor shadow
//   2. front glass (z-index above canvas)  – rim, outline, gloss highlight
//   3. lid         (z-index above front)   – animated open/close
export function renderJarBack(svgEl) {
  svgEl.innerHTML = `
    <defs>
      <linearGradient id="glassBack" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#efeafd" stop-opacity="0.95"/>
        <stop offset="0.6" stop-color="#d9cff5" stop-opacity="0.75"/>
        <stop offset="1" stop-color="#c2b3ec" stop-opacity="0.85"/>
      </linearGradient>
      <radialGradient id="floorShade" cx="0.5" cy="0.35" r="0.7">
        <stop offset="0" stop-color="#5a3fb0" stop-opacity="0.3"/>
        <stop offset="1" stop-color="#5a3fb0" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <path d="${outerJarPath}" fill="url(#glassBack)" stroke="#b9aee0" stroke-width="1"/>
    <ellipse cx="${(JAR.floorLeft + JAR.floorRight) / 2}" cy="${JAR.floorY - 4}" rx="${
      (JAR.floorRight - JAR.floorLeft) / 2 + 16
    }" ry="14" fill="url(#floorShade)"/>
  `;
}

export function renderJarFront(svgEl) {
  const midX = JAR.viewW / 2;
  svgEl.innerHTML = `
    <defs>
      <linearGradient id="glassEdge" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#ffffff" stop-opacity="0"/>
        <stop offset="0.1" stop-color="#ffffff" stop-opacity="0.95"/>
        <stop offset="0.22" stop-color="#ffffff" stop-opacity="0.1"/>
        <stop offset="0.85" stop-color="#ffffff" stop-opacity="0"/>
        <stop offset="1" stop-color="#ffffff" stop-opacity="0.55"/>
      </linearGradient>
      <linearGradient id="rimShade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#7c5cff" stop-opacity="0.4"/>
        <stop offset="1" stop-color="#7c5cff" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <path d="${outerJarPath}" fill="none" stroke="#a89ad9" stroke-opacity="0.9" stroke-width="2.5"/>
    <path d="${outerJarPath}" fill="url(#glassEdge)" opacity="0.7"/>
    <path d="M ${JAR.outerLeft + 6} ${JAR.outerTop + 4} L ${JAR.outerRight - 6} ${JAR.outerTop + 4}"
          stroke="url(#rimShade)" stroke-width="10" stroke-linecap="round"/>
    <ellipse cx="${midX - 46}" cy="150" rx="10" ry="78" fill="#ffffff" opacity="0.55"/>
    <path d="M ${JAR.outerLeft} ${JAR.outerStraightBottom} A ${
    JAR.outerRight - JAR.outerFloorRight
  } ${JAR.outerRight - JAR.outerFloorRight} 0 0 1 ${JAR.outerFloorLeft} ${JAR.outerFloorY} L ${
    JAR.outerFloorRight
  } ${JAR.outerFloorY} A ${JAR.outerRight - JAR.outerFloorRight} ${
    JAR.outerRight - JAR.outerFloorRight
  } 0 0 1 ${JAR.outerRight} ${JAR.outerStraightBottom} L ${JAR.outerRight} ${
    JAR.outerStraightBottom - 30
  } L ${JAR.outerLeft} ${JAR.outerStraightBottom - 30} Z"
          fill="#6d4fc9" opacity="0.06"/>
  `;
}

export function renderLid(svgEl) {
  svgEl.innerHTML = `
    <defs>
      <linearGradient id="lidBody" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fbfbff"/>
        <stop offset="0.55" stop-color="#e3e0f2"/>
        <stop offset="1" stop-color="#c7c2e6"/>
      </linearGradient>
      <linearGradient id="lidShine" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#ffffff" stop-opacity="0"/>
        <stop offset="0.35" stop-color="#ffffff" stop-opacity="0.9"/>
        <stop offset="0.55" stop-color="#ffffff" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect x="${JAR.lidX}" y="${JAR.lidTopY}" width="${JAR.lidW}" height="${JAR.lidH}" rx="${JAR.lidRx}"
          fill="url(#lidBody)" stroke="#b7aee0" stroke-width="1.5"/>
    <rect x="${JAR.lidX}" y="${JAR.lidTopY}" width="${JAR.lidW}" height="${JAR.lidH}" rx="${JAR.lidRx}"
          fill="url(#lidShine)" opacity="0.8"/>
    <rect x="${JAR.lidX + 10}" y="${JAR.lidTopY + JAR.lidH - 16}" width="${JAR.lidW - 20}" height="4"
          rx="2" fill="#9d92cf" opacity="0.55"/>
  `;
}
