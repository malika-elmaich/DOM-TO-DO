"use strict";

/* =========================
   Helpers صغيرة
   ========================= */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const el = (tag, classes = "", attrs = {}) => {
  const n = document.createElement(tag);
  if (classes) n.className = classes;
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "text") n.textContent = v;
    else if (k === "html") n.innerHTML = v;
    else n.setAttribute(k, v);
  }
  return n;
};
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/* =========================
   Theme (Light/Dark)
   ========================= */
const THEME_KEY = "todo_theme_v4";
function applyTheme(theme) {
  const root = document.documentElement;
  const isDark = theme === "dark";
  root.classList.toggle("dark", isDark);
  localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
  // تحديث زرّ الثيم لو كان مخلوق
  const label = $("#themeLabel");
  if (label) label.textContent = isDark ? "Light" : "Dark";
  const icon = $("#themeIcon");
  if (icon) icon.innerHTML = isDark ? sunSvg : moonSvg;
}
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark" || saved === "light") {
    applyTheme(saved);
  } else {
    // نحترم تفضيل النظام أول مرة
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(prefersDark ? "dark" : "light");
  }
}
function toggleTheme() {
  const isDark = document.documentElement.classList.contains("dark");
  applyTheme(isDark ? "light" : "dark");
}

/* أيقونات بسيطة (SVG) */
const moonSvg =
  `<svg viewBox="0 0 24 24" class="w-5 h-5"><path fill="currentColor" d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 1 0 9.79 9.79Z"/></svg>`;
const sunSvg =
  `<svg viewBox="0 0 24 24" class="w-5 h-5"><path fill="currentColor" d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm0 4a1 1 0 0 1-1-1v-1a1 1 0 1 1 2 0v1a1 1 0 0 1-1 1Zm0-18a1 1 0 0 1-1-1V2a1 1 0 1 1 2 0v1a1 1 0 0 1-1 1Zm10 7h-1a1 1 0 1 1 0-2h1a1 1 0 1 1 0 2ZM3 12H2a1 1 0 1 1 0-2h1a1 1 0 1 1 0 2Zm14.95 7.536a1 1 0 0 1-1.414 0l-.707-.707a1 1 0 1 1 1.414-1.415l.707.708a1 1 0 0 1 0 1.414Zm-9.778-9.778a1 1 0 0 1-1.414 0l-.707-.707A1 1 0 0 1 6.386 7.9l.707.707a1 1 0 0 1 0 1.414Zm9.778-3.536a1 1 0 0 1 0-1.414l.707-.707A1 1 0 1 1 19.95 5.95l-.707.707a1 1 0 0 1-1.414 0ZM5.05 19.95a1 1 0 0 1 0-1.414l.707-.708a1 1 0 0 1 1.414 1.415l-.707.707a1 1 0 0 1-1.414 0Z"/></svg>`;

/* =========================
   App State
   ========================= */
const LS_KEY = "todo_dom_v4";
let state = {
  tasks: [], // {id, text, completed, createdAt}
  filter: "all" // "all" | "active" | "completed"
};

/* Persistence */
const save = () => localStorage.setItem(LS_KEY, JSON.stringify(state));
const load = () => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.tasks)) state = { ...state, ...parsed };
  } catch { /* ignore */ }
};

/* =========================
   Build UI (DOM فقط)
   ========================= */
const app = $("#app");

// الغلاف العام (كارت)
const card = el(
  "div",
  "max-w-2xl mx-auto mt-10 p-6 md:p-8 rounded-2xl shadow " +
  "bg-white text-slate-800 dark:bg-neutral-900 dark:text-neutral-100 transition-colors"
);

// هيدر: عنوان + زرّ الثيم
const header = el("div", "flex items-center justify-between mb-6");
const title = el("h1", "font-sans text-2xl md:text-3xl font-semibold tracking-tight", { text: "DOM To‑Do" });

const themeBtn = el(
  "button",
  "inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 " +
  "hover:bg-slate-50 dark:hover:bg-neutral-800 transition focus:outline-none focus-visible:ring-2 ring-offset-2 " +
  "ring-indigo-600 dark:ring-indigo-500",
  { id: "themeToggle", type: "button", "aria-label": "Toggle theme" }
);
const themeIcon = el("span", "inline-flex", { id: "themeIcon", html: moonSvg });
const themeLabel = el("span", "text-sm", { id: "themeLabel", text: "Dark" });
themeBtn.append(themeIcon, themeLabel);
themeBtn.addEventListener("click", toggleTheme);

header.append(title, themeBtn);

// صفّ الإدخال + زر إضافة
const row = el("div", "flex flex-col sm:flex-row sm:items-center gap-3 mb-4");
const input = el("input",
  "flex-1 border border-slate-300 dark:border-neutral-700 rounded-xl px-4 py-2 outline-none " +
  "focus-visible:ring-2 ring-indigo-600 dark:ring-indigo-500 bg-white dark:bg-neutral-800 " +
  "placeholder-slate-400 dark:placeholder-neutral-400",
  { type: "text", placeholder: "Add a new task…" }
);
const addBtn = el(
  "button",
  "px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 active:scale-[.99] transition " +
  "focus:outline-none focus-visible:ring-2 ring-offset-2 ring-indigo-600",
  { text: "Add Task", "aria-label": "Add task", type: "button" }
);
row.append(input, addBtn);

// شريط التحكم: فلترة + عدّاد + مسح المكتملة
const controls = el("div", "flex flex-col md:flex-row md:items-center gap-3 md:justify-between mb-4");

// الفلاتر
const filters = el("div", "inline-flex rounded-lg border border-slate-200 dark:border-neutral-700 overflow-hidden");
const mkFilterBtn = (name, label) => {
  const b = el("button",
    "px-3 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-neutral-800 transition",
    { "data-filter": name, text: label, type: "button" }
  );
  b.addEventListener("click", () => { state.filter = name; render(); });
  return b;
};
const allBtn = mkFilterBtn("all", "All");
const activeBtn = mkFilterBtn("active", "Active");
const doneBtn = mkFilterBtn("completed", "Completed");
filters.append(allBtn, activeBtn, doneBtn);

// عدّاد + “Clear completed”
const stats = el("div", "text-sm text-slate-600 dark:text-neutral-300");
const clearCompleted = el(
  "button",
  "text-sm px-3 py-1.5 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition " +
  "focus:outline-none focus-visible:ring-2 ring-offset-2 ring-rose-500",
  { text: "Clear completed", type: "button" }
);
clearCompleted.addEventListener("click", () => {
  state.tasks = state.tasks.filter(t => !t.completed);
  save(); render();
});

controls.append(filters, stats, clearCompleted);

// شريط التقدّم
const progressWrap = el("div", "mb-4");
const progressBar = el("div", "h-2 w-full rounded-full bg-slate-200 dark:bg-neutral-800 overflow-hidden");
const progressFill = el("div", "h-2 bg-indigo-600 dark:bg-indigo-500 transition-all", { style: "width:0%" });
progressBar.append(progressFill);
progressWrap.append(progressBar);

// اللائحة
const list = el("ul", "space-y-2");

// تجميع الكل
card.append(header, row, controls, progressWrap, list);
app.append(card);

/* =========================
   سلوك التطبيق
   ========================= */
function addTaskFromInput() {
  const text = input.value.trim();
  if (!text) { alert("Please enter a task."); return; } // شرط التمرين
  state.tasks.unshift({ id: uid(), text, completed: false, createdAt: Date.now() });
  input.value = "";
  save(); render(); input.focus();
}
addBtn.addEventListener("click", addTaskFromInput);
input.addEventListener("keydown", e => { if (e.key === "Enter") addTaskFromInput(); });

function setFilterUI() {
  [allBtn, activeBtn, doneBtn].forEach(b => {
    b.classList.remove("bg-indigo-600","text-white");
  });
  const current = [allBtn, activeBtn, doneBtn].find(b => b.dataset.filter === state.filter);
  current.classList.add("bg-indigo-600","text-white");
}

function updateStatsUI() {
  const total = state.tasks.length;
  const done = state.tasks.filter(t => t.completed).length;
  const active = total - done;
  stats.textContent = `${total} task${total === 1 ? "" : "s"} — ${active} active, ${done} completed`;
  const pct = total ? Math.round((done / total) * 100) : 0;
  progressFill.style.width = pct + "%";
}

function toggleTask(id) {
  const t = state.tasks.find(t => t.id === id);
  if (!t) return;
  t.completed = !t.completed; save(); render();
}

function removeTask(id) {
  state.tasks = state.tasks.filter(t => t.id !== id);
  save(); render();
}

function editTask(id, newText) {
  const t = state.tasks.find(t => t.id === id);
  if (!t) return;
  t.text = newText.trim() || t.text;
  save(); render();
}

/* Drag & Drop لإعادة الترتيب */
let dragId = null;
function handleDragStart(id, li) {
  dragId = id;
  li.classList.add("opacity-70");
}
function handleDragOver(e, li) {
  e.preventDefault();
  li.classList.add("ring-2","ring-indigo-500","dark:ring-indigo-400");
}
function handleDragLeave(li) {
  li.classList.remove("ring-2","ring-indigo-500","dark:ring-indigo-400");
}
function handleDrop(e, targetId, li) {
  e.preventDefault();
  li.classList.remove("ring-2","ring-indigo-500","dark:ring-indigo-400");
  if (!dragId || dragId === targetId) return;
  const from = state.tasks.findIndex(t => t.id === dragId);
  const to = state.tasks.findIndex(t => t.id === targetId);
  const [moved] = state.tasks.splice(from, 1);
  state.tasks.splice(to, 0, moved);
  dragId = null; save(); render();
}
function handleDragEnd(li) {
  dragId = null;
  li.classList.remove("opacity-70");
}

/* عنصر المهمة */
function makeTaskItem(task) {
  const li = el(
    "li",
    "group flex items-center justify-between gap-3 px-4 py-2 rounded-xl border " +
    "border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/60 " +
    "hover:shadow-sm transition cursor-default",
    { draggable: "true", "data-id": task.id, title: "Click to toggle completed • Double‑click text to edit" }
  );

  // يسار: Checkbox + نص
  const left = el("div", "flex items-center gap-3");
  const cb = el("input", "shrink-0", { type: "checkbox", "aria-label": "Toggle completed" });
  cb.checked = task.completed;
  cb.addEventListener("click", e => { e.stopPropagation(); toggleTask(task.id); });

  const text = el("span", "select-none", { text: task.text });
  text.classList.add("text-slate-800","dark:text-neutral-100");
  if (task.completed) text.classList.add("line-through","opacity-60");

  // تعديل بالنقر المزدوج
  text.addEventListener("dblclick", e => {
    e.stopPropagation();
    const edit = el("input",
      "w-full bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded px-2 py-1 " +
      "outline-none focus-visible:ring-2 ring-indigo-600 dark:ring-indigo-500",
      { type: "text", value: task.text }
    );
    // استبدال مؤقت
    left.replaceChild(edit, text);
    edit.focus(); edit.select();

    const commit = () => {
      const val = edit.value.trim();
      left.replaceChild(text, edit);
      if (val && val !== task.text) { editTask(task.id, val); }
    };
    const cancel = () => left.replaceChild(text, edit);

    edit.addEventListener("keydown", ev => {
      if (ev.key === "Enter") commit();
      else if (ev.key === "Escape") cancel();
      ev.stopPropagation();
    });
    edit.addEventListener("blur", commit);
  });

  left.append(cb, text);

  // يمين: أزرار (حذف + مقبض سحب)
  const right = el("div", "flex items-center gap-2 opacity-0 group-hover:opacity-100 transition");
  const rm = el("button",
    "text-xs px-2 py-1 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition " +
    "focus:outline-none focus-visible:ring-2 ring-offset-2 ring-rose-500",
    { text: "Remove", "aria-label": "Remove task", type: "button" }
  );
  rm.addEventListener("click", e => { e.stopPropagation(); removeTask(task.id); });

  const handle = el("div", "cursor-grab active:cursor-grabbing text-slate-400 dark:text-neutral-400", { html: "☰" });

  right.append(rm, handle);

  li.append(left, right);

  // Toggle بالنقر على السطر
  li.addEventListener("click", () => toggleTask(task.id));

  // Drag & Drop
  li.addEventListener("dragstart", () => handleDragStart(task.id, li));
  li.addEventListener("dragover", (e) => handleDragOver(e, li));
  li.addEventListener("dragleave", () => handleDragLeave(li));
  li.addEventListener("drop", (e) => handleDrop(e, task.id, li));
  li.addEventListener("dragend", () => handleDragEnd(li));

  return li;
}

function renderList() {
  list.innerHTML = "";
  const tasks = state.tasks.filter(t => {
    if (state.filter === "active") return !t.completed;
    if (state.filter === "completed") return t.completed;
    return true;
  });

  if (!tasks.length) {
    const empty = el("li",
      "px-4 py-8 text-center text-slate-500 dark:text-neutral-400 border border-dashed " +
      "border-slate-300 dark:border-neutral-700 rounded-xl",
      { text: "No tasks — add one above!" }
    );
    list.append(empty);
    return;
  }
  tasks.forEach(t => list.append(makeTaskItem(t)));
}

function render() {
  setFilterUI();
  updateStatsUI();
  renderList();
}

/* =========================
   Init
   ========================= */
initTheme();
load();
render();

