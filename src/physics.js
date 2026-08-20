import Matter from "matter-js";
import { JAR } from "./jarShape.js";

const { Engine, World, Bodies, Body, Runner, Events, Vector } = Matter;

const PALETTE = [
  { fill: ["#8fb4f5", "#5b8def"], stroke: "#3f6fd4" }, // blue
  { fill: ["#fbe08a", "#f2b632"], stroke: "#d99a1c" }, // yellow
  { fill: ["#c9b8ff", "#9a7bff"], stroke: "#7c5cff" }, // purple
  { fill: ["#ffc2d1", "#ff8fab"], stroke: "#f2648a" }, // pink
  { fill: ["#a8ecc9", "#5fd39a"], stroke: "#33b478" }, // mint
];

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

export class JarPhysics {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.engine = Engine.create({ gravity: { x: 0, y: 1, scale: 0.00085 } });
    this.world = this.engine.world;
    this.runner = Runner.create();
    this.items = []; // { body, colorIdx, eyeOffset, bornAt }
    this._buildContainer();
    this._resize();
    window.addEventListener("resize", () => this._resize());
    // Layout can still shift after construction (e.g. content mounted below
    // the jar changes the flex box height) — watch the frame directly so the
    // canvas bitmap never drifts out of sync with the on-screen jar artwork.
    this._resizeObserver = new ResizeObserver(() => this._resize());
    this._resizeObserver.observe(this.canvas.parentElement);

    Runner.run(this.runner, this.engine);
    this._raf = requestAnimationFrame(this._tick.bind(this));

    // gently retire bodies that somehow wander off (safety net)
    Events.on(this.engine, "afterUpdate", () => this._clampStray());
  }

  _buildContainer() {
    const opts = { isStatic: true, friction: 0.55, restitution: 0.15, label: "wall" };
    const t = 10; // wall thickness

    const leftWall = Bodies.rectangle(
      JAR.innerLeft - t / 2,
      (JAR.innerTop + JAR.straightBottom) / 2,
      t,
      JAR.straightBottom - JAR.innerTop,
      opts
    );
    const rightWall = Bodies.rectangle(
      JAR.innerRight + t / 2,
      (JAR.innerTop + JAR.straightBottom) / 2,
      t,
      JAR.straightBottom - JAR.innerTop,
      opts
    );
    const floor = Bodies.rectangle(
      (JAR.floorLeft + JAR.floorRight) / 2,
      JAR.floorY + t / 2,
      JAR.floorRight - JAR.floorLeft + 40,
      t,
      opts
    );

    // Diagonal chamfer segments approximating the rounded bottom corners.
    const dxL = JAR.floorLeft - JAR.innerLeft;
    const dyL = JAR.floorY - JAR.straightBottom;
    const lenL = Math.hypot(dxL, dyL);
    const angL = Math.atan2(dyL, dxL);
    const leftCorner = Bodies.rectangle(
      (JAR.innerLeft + JAR.floorLeft) / 2,
      (JAR.straightBottom + JAR.floorY) / 2,
      lenL + 14,
      t,
      { ...opts, angle: angL }
    );

    const dxR = JAR.innerRight - JAR.floorRight;
    const dyR = JAR.floorY - JAR.straightBottom;
    const lenR = Math.hypot(dxR, dyR);
    const angR = Math.atan2(dyR, -dxR);
    const rightCorner = Bodies.rectangle(
      (JAR.innerRight + JAR.floorRight) / 2,
      (JAR.straightBottom + JAR.floorY) / 2,
      lenR + 14,
      t,
      { ...opts, angle: angR }
    );

    World.add(this.world, [leftWall, rightWall, floor, leftCorner, rightCorner]);
  }

  _resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.displayW = rect.width;
    this.displayH = rect.height;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    this.scale = (rect.width / JAR.viewW) * dpr;
    this.ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
  }

  addItem(colorIdx = Math.floor(Math.random() * PALETTE.length), atX) {
    const r = 13 + Math.random() * 4;
    const spawnX = atX ?? JAR.innerLeft + 30 + Math.random() * (JAR.innerRight - JAR.innerLeft - 60);
    const spawnY = JAR.innerTop - 30 - Math.random() * 20;
    const body = Bodies.circle(spawnX, spawnY, r, {
      restitution: 0.45,
      friction: 0.35,
      frictionAir: 0.012,
      density: 0.0018,
      angle: Math.random() * Math.PI * 2,
    });
    Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.3);
    Body.setVelocity(body, { x: (Math.random() - 0.5) * 1.5, y: 0 });

    const item = {
      body,
      radius: r,
      colorIdx: colorIdx % PALETTE.length,
      eyeDx: (Math.random() - 0.5) * 0.3,
      squash: 0,
    };
    this.items.push(item);
    World.add(this.world, body);
    return item;
  }

  shake() {
    const strength = 0.018;
    for (const { body } of this.items) {
      Body.applyForce(body, body.position, {
        x: (Math.random() - 0.5) * strength,
        y: -Math.random() * strength * 1.4,
      });
    }
  }

  count() {
    return this.items.length;
  }

  reset() {
    for (const { body } of this.items) World.remove(this.world, body);
    this.items = [];
  }

  _clampStray() {
    const margin = 60;
    for (const item of this.items) {
      const p = item.body.position;
      if (p.y > JAR.viewH + margin || p.x < -margin || p.x > JAR.viewW + margin) {
        Body.setPosition(item.body, { x: JAR.viewW / 2, y: JAR.innerTop });
        Body.setVelocity(item.body, { x: 0, y: 0 });
      }
    }
  }

  _tick() {
    this._draw();
    this._raf = requestAnimationFrame(this._tick.bind(this));
  }

  _draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, JAR.viewW, JAR.viewH);

    // soft contact shadow pooling near the floor
    for (const item of this.items) {
      const { body, radius } = item;
      const depth = Math.max(0, body.position.y - JAR.straightBottom + radius);
      if (depth <= 0) continue;
      const shadowAlpha = Math.min(0.16, depth / 260);
      ctx.save();
      ctx.translate(body.position.x, JAR.floorY - 2);
      ctx.scale(1, 0.3);
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.05, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(40, 20, 70, ${shadowAlpha})`;
      ctx.fill();
      ctx.restore();
    }

    for (const item of this.items) this._drawBlob(item);
  }

  _drawBlob(item) {
    const ctx = this.ctx;
    const { body, radius, colorIdx, eyeDx } = item;
    const c = PALETTE[colorIdx];
    const { x, y } = body.position;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(body.angle);

    const grad = ctx.createRadialGradient(
      -radius * 0.35,
      -radius * 0.4,
      radius * 0.15,
      0,
      0,
      radius * 1.05
    );
    grad.addColorStop(0, c.fill[0]);
    grad.addColorStop(1, c.fill[1]);

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = c.stroke;
    ctx.stroke();

    // glossy highlight
    ctx.beginPath();
    ctx.ellipse(-radius * 0.35, -radius * 0.42, radius * 0.32, radius * 0.2, toRad(-30), 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fill();

    // cute face
    const eyeY = radius * 0.06;
    ctx.fillStyle = "rgba(35,25,55,0.75)";
    ctx.beginPath();
    ctx.arc(-radius * 0.32 + eyeDx * radius, eyeY, radius * 0.09, 0, Math.PI * 2);
    ctx.arc(radius * 0.32 + eyeDx * radius, eyeY, radius * 0.09, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(eyeDx * radius, eyeY + radius * 0.18, radius * 0.16, toRad(20), toRad(160));
    ctx.strokeStyle = "rgba(35,25,55,0.55)";
    ctx.lineWidth = radius * 0.09;
    ctx.lineCap = "round";
    ctx.stroke();

    ctx.restore();
  }

  destroy() {
    cancelAnimationFrame(this._raf);
    Runner.stop(this.runner);
    this._resizeObserver?.disconnect();
  }
}

export { PALETTE };
