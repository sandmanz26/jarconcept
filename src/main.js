import "./style.css";
import { JarPhysics, PALETTE } from "./physics.js";
import { renderJarBack, renderJarFront, renderLid } from "./jarSvg.js";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TODAY_INDEX = 2; // Tue, matches the reference screenshot

const HABITS = [
  { id: "read", title: "Read 20 pages", icon: "\u{1F4D8}", tint: "#e7edff", colorIdx: 0, done: true },
  { id: "stretch", title: "Morning stretch", icon: "\u{1F9D8}", tint: "#fff2d9", colorIdx: 1, done: false },
  { id: "water", title: "Drink 2L water", icon: "\u{1F4A7}", tint: "#e9e2ff", colorIdx: 2, done: false },
  { id: "journal", title: "Evening journal", icon: "\u{1F4DD}", tint: "#ffe3ea", colorIdx: 3, done: false },
  { id: "walk", title: "10 min walk", icon: "\u{1F6B6}", tint: "#e0f9ec", colorIdx: 4, done: false },
];

const $ = (sel) => document.querySelector(sel);

function buildWeekStrip() {
  const list = $("#week");
  list.innerHTML = WEEK_DAYS.map((label, i) => {
    const isDone = i < TODAY_INDEX; // days before today already checked in
    const cls = [isDone && "done", i === TODAY_INDEX && "today"].filter(Boolean).join(" ");
    return `
      <li class="${cls}">
        <span class="day-pill">${isDone ? checkIcon() : label[0]}</span>
        <span class="label">${label}</span>
      </li>`;
  }).join("");
}

function checkIcon() {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function buildHabitList(onToggle) {
  const list = $("#habitList");
  list.innerHTML = HABITS.map(
    (h) => `
      <li class="habit-card ${h.done ? "done" : ""}" data-id="${h.id}">
        <div class="habit-icon" style="background:${h.tint}">${h.icon}</div>
        <div class="habit-info">
          <div class="title">${h.title}</div>
          <div class="sub">${h.done ? "Done today" : "Tap + to log it"}</div>
        </div>
        <button class="habit-add ${h.done ? "done" : ""}" type="button" aria-label="Log ${h.title}">
          ${h.done ? "✓" : "+"}
        </button>
      </li>`
  ).join("");

  list.querySelectorAll(".habit-add").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const card = btn.closest(".habit-card");
      const habit = HABITS.find((h) => h.id === card.dataset.id);
      if (habit.done) return; // already logged today
      habit.done = true;
      card.classList.add("done");
      card.querySelector(".sub").textContent = "Done today";
      btn.classList.add("done");
      btn.textContent = "✓";
      onToggle(habit);
    });
  });
}

function main() {
  buildWeekStrip();

  const jarWrap = $("#jarWrap");
  const canvas = $("#physicsCanvas");
  const jarCountEl = $("#jarCount");
  const jarHint = $("#jarHint");
  const streakBtn = $("#streakBtn");

  renderJarBack($("#jarBackSvg"));
  renderJarFront($("#jarFrontSvg"));
  renderLid($("#jarLidSvg"));

  const physics = new JarPhysics(canvas);

  let lidTimer = null;
  function openLid() {
    jarWrap.classList.add("filling");
    if (lidTimer) clearTimeout(lidTimer);
  }
  function scheduleClose(delay) {
    if (lidTimer) clearTimeout(lidTimer);
    lidTimer = setTimeout(() => jarWrap.classList.remove("filling"), delay);
  }

  function updateCount() {
    const n = physics.count();
    jarCountEl.textContent = `${n} item${n === 1 ? "" : "s"}`;
    jarCountEl.classList.toggle("visible", n > 0);
  }

  function dropOne(colorIdx) {
    openLid();
    physics.addItem(colorIdx);
    updateCount();
    scheduleClose(900);
  }

  function fillJar() {
    const pending = HABITS.filter((h) => !h.done);
    const batch = pending.length ? pending : HABITS; // demo: refill with everything if all done
    openLid();
    batch.forEach((h, i) => {
      setTimeout(() => {
        physics.addItem(h.colorIdx);
        updateCount();
        if (!h.done) {
          h.done = true;
          const card = document.querySelector(`.habit-card[data-id="${h.id}"]`);
          if (card) {
            card.classList.add("done");
            card.querySelector(".sub").textContent = "Done today";
            const btn = card.querySelector(".habit-add");
            btn.classList.add("done");
            btn.textContent = "✓";
          }
        }
      }, i * 140);
    });
    scheduleClose(batch.length * 140 + 900);
  }

  buildHabitList((habit) => dropOne(habit.colorIdx));

  jarWrap.addEventListener("click", () => {
    jarWrap.classList.remove("show-hint");
    fillJar();
  });

  streakBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    physics.shake();
    streakBtn.animate(
      [
        { transform: "rotate(0deg)" },
        { transform: "rotate(-6deg)" },
        { transform: "rotate(5deg)" },
        { transform: "rotate(0deg)" },
      ],
      { duration: 320, easing: "ease-in-out" }
    );
  });

  // seed the jar with today's already-completed habit + a friendly nudge
  setTimeout(() => {
    physics.addItem(HABITS[0].colorIdx, 150);
    updateCount();
    jarWrap.classList.add("show-hint");
  }, 500);
}

main();
