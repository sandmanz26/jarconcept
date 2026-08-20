// Geometry for the piggy bank: an elliptical belly (physics container +
// visual body) plus precomputed "shard" wedges used both as the crack
// overlay (stroked, while intact) and as the pieces that fly apart when
// the goal is reached (filled, once shattered).
export const PIG = {
  viewW: 300,
  viewH: 300,
  cx: 150,
  cy: 172,
  rx: 116,
  ry: 90,
  slotX: 150,
  slotY: 78,
  slotW: 50,
  slotH: 11,
};

export function ellipsePoint(angle, rxScale = 1, ryScale = 1) {
  return {
    x: PIG.cx + Math.cos(angle) * PIG.rx * rxScale,
    y: PIG.cy + Math.sin(angle) * PIG.ry * ryScale,
  };
}

// Closed polygon approximating the belly interior, used to build the
// physics walls (coins are spawned inside, so no gap/opening is needed).
export function bellyPolygon(n = 20, inset = 8) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push(ellipsePoint(a, (PIG.rx - inset) / PIG.rx, (PIG.ry - inset) / PIG.ry));
  }
  return pts;
}

// Six irregular break angles (fixed, not random per-render) used for both
// the crack lines and the shatter shards.
const BREAK_ANGLES = [-1.55, -0.75, 0.15, 0.95, 1.85, 2.7].map((a) => a);
const JAG = [1, 0.92, 1.05, 0.9, 1.08, 0.95, 1, 0.94]; // radius jitter per boundary sample

function boundarySample(angle, jagIndex) {
  const jag = JAG[jagIndex % JAG.length];
  return ellipsePoint(angle, jag, jag);
}

export function shardPolygons() {
  const shards = [];
  for (let i = 0; i < BREAK_ANGLES.length; i++) {
    const a0 = BREAK_ANGLES[i];
    const a1 = BREAK_ANGLES[(i + 1) % BREAK_ANGLES.length] + (i === BREAK_ANGLES.length - 1 ? Math.PI * 2 : 0);
    const mid1 = a0 + (a1 - a0) * 0.35;
    const mid2 = a0 + (a1 - a0) * 0.68;
    const pts = [
      { x: PIG.cx, y: PIG.cy },
      boundarySample(a0, i * 2),
      boundarySample(mid1, i * 2 + 1),
      boundarySample(mid2, i * 2 + 2),
      boundarySample(a1, i * 2 + 3),
    ];
    shards.push({ points: pts, angle: (a0 + a1) / 2 });
  }
  return shards;
}

export function pointsToPath(points) {
  return (
    points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z"
  );
}

export const CRACK_STAGE_COUNT = 4; // 0 = no cracks, 4 = about to shatter
