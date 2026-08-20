import Matter from "matter-js";
import { PIG, bellyPolygon } from "./pigShape.js";

const { Engine, World, Bodies, Body, Runner, Events } = Matter;

const COINS = [
  { value: 10000, label: "10rb", radius: 12, fill: ["#e8b98a", "#c98a4d"], stroke: "#a3652b" },
  { value: 20000, label: "20rb", radius: 13.5, fill: ["#dde3ea", "#aab4c2"], stroke: "#7c8896" },
  { value: 50000, label: "50rb", radius: 15.5, fill: ["#ffe396", "#f0b93d"], stroke: "#c98a12" },
  { value: 100000, label: "100rb", radius: 17.5, fill: ["#c9f0d8", "#6fce9a"], stroke: "#379966" },
];

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

export class PigPhysics {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.engine = Engine.create({ gravity: { x: 0, y: 1, scale: 0.00085 } });
    this.world = this.engine.world;
    this.runner = Runner.create();
    this.items = [];
    this._buildContainer();
    this._resize();
    window.addEventListener("resize", () => this._resize());
    this._resizeObserver = new ResizeObserver(() => this._resize());
    this._resizeObserver.observe(this.canvas.parentElement);

    Runner.run(this.runner, this.engine);
    this._raf = requestAnimationFrame(this._tick.bind(this));
    Events.on(this.engine, "afterUpdate", () => this._clampStray());
  }

  _buildContainer() {
    const pts = bellyPolygon(20, 8);
    const opts = { isStatic: true, friction: 0.5, restitution: 0.2, label: "pig-wall" };
    const bodies = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      bodies.push(
        Bodies.rectangle((a.x + b.x) / 2, (a.y + b.y) / 2, len + 6, 8, { ...opts, angle })
      );
    }
    World.add(this.world, bodies);
  }

  _resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    this.scale = (rect.width / PIG.viewW) * dpr;
    this.ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
  }

  addCoin(tierIdx) {
    const tier = COINS[tierIdx];
    // Spawn well inside the closed belly polygon (the coin slot is purely
    // decorative — the container has no real opening for a body to fall
    // through), otherwise the coin rests on the outside of the shape.
    const spawnX = PIG.cx + (Math.random() - 0.5) * PIG.rx * 0.5;
    const spawnY = PIG.cy - PIG.ry * 0.55;
    const body = Bodies.circle(spawnX, spawnY, tier.radius, {
      restitution: 0.3,
      friction: 0.45,
      frictionAir: 0.014,
      density: 0.0026,
      angle: Math.random() * Math.PI * 2,
    });
    Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.25);
    Body.setVelocity(body, { x: (Math.random() - 0.5) * 0.8, y: 0.5 });
    const item = { body, tier, radius: tier.radius };
    this.items.push(item);
    World.add(this.world, body);
    return item;
  }

  shake() {
    const strength = 0.02;
    for (const { body } of this.items) {
      Body.applyForce(body, body.position, {
        x: (Math.random() - 0.5) * strength,
        y: -Math.random() * strength * 1.2,
      });
    }
  }

  total() {
    return this.items.reduce((sum, i) => sum + i.tier.value, 0);
  }

  count() {
    return this.items.length;
  }

  reset() {
    for (const { body } of this.items) World.remove(this.world, body);
    this.items = [];
  }

  _clampStray() {
    const margin = 80;
    for (const item of this.items) {
      const p = item.body.position;
      if (p.y > PIG.viewH + margin || p.x < -margin || p.x > PIG.viewW + margin) {
        Body.setPosition(item.body, { x: PIG.cx, y: PIG.cy - PIG.ry * 0.4 });
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
    ctx.clearRect(0, 0, PIG.viewW, PIG.viewH);
    for (const item of this.items) this._drawCoin(item);
  }

  _drawCoin(item) {
    const ctx = this.ctx;
    const { body, radius, tier } = item;
    const { x, y } = body.position;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(body.angle);

    const grad = ctx.createRadialGradient(-radius * 0.3, -radius * 0.35, radius * 0.1, 0, 0, radius);
    grad.addColorStop(0, tier.fill[0]);
    grad.addColorStop(1, tier.fill[1]);

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = tier.stroke;
    ctx.stroke();

    // ridged edge ticks
    ctx.strokeStyle = "rgba(0,0,0,0.12)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * radius * 0.86, Math.sin(a) * radius * 0.86);
      ctx.lineTo(Math.cos(a) * radius * 0.98, Math.sin(a) * radius * 0.98);
      ctx.stroke();
    }

    // inner ring + gloss
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.68, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(-radius * 0.32, -radius * 0.38, radius * 0.28, radius * 0.16, toRad(-30), 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fill();

    ctx.restore();
  }

  destroy() {
    cancelAnimationFrame(this._raf);
    Runner.stop(this.runner);
    this._resizeObserver?.disconnect();
  }
}

export { COINS };
