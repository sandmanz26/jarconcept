// Single source of truth for the jar silhouette. Both the SVG artwork and the
// Matter.js collision walls are derived from these numbers so the physics
// bodies always line up with what's drawn on screen.
export const JAR = {
  viewW: 300,
  viewH: 340,

  // Glass interior (where physics bodies actually live)
  innerLeft: 70,
  innerRight: 230,
  innerTop: 58, // items become visible below this line (under the rim)
  straightBottom: 256, // vertical walls run from innerTop to here
  floorY: 300,
  floorLeft: 108,
  floorRight: 192,

  // Outer glass silhouette (a few px proud of the interior, for the wall thickness look)
  outerLeft: 60,
  outerRight: 240,
  outerTop: 46,
  outerStraightBottom: 258,
  outerFloorY: 312,
  outerFloorLeft: 96,
  outerFloorRight: 204,
  cornerR: 46,

  // Lid
  lidX: 44,
  lidW: 212,
  lidTopY: 6,
  lidH: 56,
  lidRx: 26,
};

function roundedJarPath({ left, right, top, straightBottom, floorY, floorLeft, floorRight }) {
  const rR = right - floorRight; // corner radius on the right
  const rL = floorLeft - left; // corner radius on the left
  return [
    `M ${left} ${top}`,
    `L ${right} ${top}`,
    `L ${right} ${straightBottom}`,
    `A ${rR} ${rR} 0 0 1 ${floorRight} ${floorY}`,
    `L ${floorLeft} ${floorY}`,
    `A ${rL} ${rL} 0 0 1 ${left} ${straightBottom}`,
    `Z`,
  ].join(" ");
}

export const outerJarPath = roundedJarPath({
  left: JAR.outerLeft,
  right: JAR.outerRight,
  top: JAR.outerTop,
  straightBottom: JAR.outerStraightBottom,
  floorY: JAR.outerFloorY,
  floorLeft: JAR.outerFloorLeft,
  floorRight: JAR.outerFloorRight,
});

export const innerJarPath = roundedJarPath({
  left: JAR.innerLeft,
  right: JAR.innerRight,
  top: JAR.innerTop,
  straightBottom: JAR.straightBottom,
  floorY: JAR.floorY,
  floorLeft: JAR.floorLeft,
  floorRight: JAR.floorRight,
});
