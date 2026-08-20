import { PigPhysics, COINS } from "./pigPhysics.js";
import { renderPigBack, renderPigFront, renderCracks, renderShards } from "./pigSvg.js";
import { CRACK_STAGE_COUNT } from "./pigShape.js";

const GOAL = 500000;
const CRACK_THRESHOLDS = [30, 55, 78, 93]; // % of goal -> reveal stage 1..4 (damage accelerates near the goal)

const $ = (sel) => document.querySelector(sel);

function formatRupiah(n) {
  return `Rp${n.toLocaleString("id-ID")}`;
}

export function initSavingsPage() {
  const pigWrap = $("#pigWrap");
  const pigFrame = $("#pigFrame");
  const canvas = $("#pigCanvas");
  const savingsSub = $("#savingsSub");
  const pigPercent = $("#pigPercent");
  const progressFill = $("#progressFill");
  const goalBanner = $("#goalBanner");
  const pigHint = $("#pigHint");
  const chipsEl = $("#coinChips");
  const shakeBtn = $("#pigShakeBtn");
  const resetBtn = $("#pigResetBtn");

  renderPigBack($("#pigBackSvg"));
  renderPigFront($("#pigFrontSvg"));
  renderCracks($("#pigCracksSvg"));
  renderShards($("#pigShardsSvg"));

  const physics = new PigPhysics(canvas);
  let shattered = false;

  function currentStage(percent) {
    return CRACK_THRESHOLDS.filter((t) => percent >= t).length;
  }

  function updateCracks(percent) {
    const stage = shattered ? CRACK_STAGE_COUNT : currentStage(percent);
    document.querySelectorAll(".crack-line").forEach((line) => {
      const lineStage = Number(line.dataset.stage);
      line.style.opacity = lineStage <= stage ? "1" : "0";
    });
  }

  function shatter() {
    shattered = true;
    pigFrame.classList.add("shattered");
    goalBanner.classList.add("visible");
    pigHint.textContent = "Piggy pecah! Tap Reset untuk mulai lagi";
    shakeBtn.disabled = true;
  }

  function updateProgress() {
    const total = physics.total();
    const percent = Math.min(100, Math.round((total / GOAL) * 100));
    savingsSub.textContent = `${formatRupiah(total)} dari ${formatRupiah(GOAL)}`;
    pigPercent.textContent = `${percent}%`;
    progressFill.style.width = `${percent}%`;
    updateCracks(percent);
    if (percent >= 100 && !shattered) shatter();
  }

  function addCoin(tierIdx) {
    if (shattered) return; // goal already met for this run; reset to save again
    physics.addCoin(tierIdx);
    updateProgress();
  }

  chipsEl.innerHTML = COINS.map(
    (c, i) => `
      <button class="coin-chip" type="button" data-idx="${i}">
        <span class="coin-dot" style="background:linear-gradient(160deg, ${c.fill[0]}, ${c.fill[1]})"></span>
        +${c.label}
      </button>`
  ).join("");
  chipsEl.querySelectorAll(".coin-chip").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      addCoin(Number(btn.dataset.idx));
    });
  });

  pigWrap.addEventListener("click", () => {
    pigWrap.classList.remove("show-hint");
    if (shattered) return;
    // tap-to-add favors smaller, more frequent coins
    const weights = [5, 3, 2, 1];
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    let idx = 0;
    for (; idx < weights.length; idx++) {
      if (r < weights[idx]) break;
      r -= weights[idx];
    }
    addCoin(idx);
  });

  shakeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (shattered) return;
    physics.shake();
    pigWrap.classList.add("shaking");
    setTimeout(() => pigWrap.classList.remove("shaking"), 340);
  });

  resetBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    physics.reset();
    shattered = false;
    pigFrame.classList.remove("shattered");
    goalBanner.classList.remove("visible");
    pigHint.textContent = "Tap the piggy to add a coin";
    shakeBtn.disabled = false;
    updateProgress();
  });

  updateProgress();
  setTimeout(() => pigWrap.classList.add("show-hint"), 400);

  return { resize: () => physics._resize() };
}
