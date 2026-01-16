const habitList = document.getElementById("habitList");
const habitInput = document.getElementById("habitInput");
const addHabitBtn = document.getElementById("addHabitBtn");
const exportJsonBtn = document.getElementById("exportJsonBtn");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const sortToggleBtn = document.getElementById("sortToggleBtn");
const searchInput = document.getElementById("searchInput");

const ICONS = ["🔥", "💪", "📚", "🏃", "🧘", "💻", "🎯"];

let habits = JSON.parse(localStorage.getItem("habits")) || [];
let editingId = null;
let openPanel = null;
let draggedIndex = null;

let lastDeletedHabit = null;
let undoTimeout = null;

let sortByStreak = JSON.parse(localStorage.getItem("sortByStreak")) || false;
let searchQuery = "";

let viewDate = new Date();
let viewYear = viewDate.getFullYear();
let viewMonth = viewDate.getMonth();

/* ---------- STORAGE ---------- */
function save() {
  localStorage.setItem("habits", JSON.stringify(habits));
  localStorage.setItem("sortByStreak", JSON.stringify(sortByStreak));
}

/* ---------- HELPERS ---------- */
const todayStr = () => new Date().toDateString();
const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const monthName = m => new Date(2000, m).toLocaleString("default", { month: "long" });

function closePanels() {
  openPanel = null;
  editingId = null;
}

/* ---------- ADD ---------- */
function addHabit() {
  const name = habitInput.value.trim();
  if (!name) return;

  habits.push({
    id: Date.now(),
    name,
    icon: "🔥",
    color: "#22c55e",
    count: 0,
    lastDate: null,
    history: [],
    pinned: false
  });

  habitInput.value = "";
  save();
  render();
}

addHabitBtn.onclick = addHabit;
habitInput.addEventListener("keydown", e => {
  if (e.key === "Enter") addHabit();
  if (e.key === "Escape") habitInput.value = "";
});

/* ---------- SEARCH ---------- */
searchInput.addEventListener("input", e => {
  searchQuery = e.target.value.toLowerCase();
  render();
});

/* ---------- SORT ---------- */
sortToggleBtn.textContent = sortByStreak ? "Manual Order" : "Sort by Streak";
sortToggleBtn.onclick = () => {
  sortByStreak = !sortByStreak;
  sortToggleBtn.textContent = sortByStreak ? "Manual Order" : "Sort by Streak";
  save();
  render();
};

/* ---------- STREAK ---------- */
function markDone(h) {
  const today = todayStr();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  if (h.lastDate === yesterday) h.count++;
  else if (h.lastDate !== today) h.count = 1;

  h.lastDate = today;
  if (!h.history.includes(today)) h.history.push(today);

  closePanels();
  save();
  render();
}

/* ---------- PIN ---------- */
function togglePin(h) {
  h.pinned = !h.pinned;
  save();
  render();
}

/* ---------- DELETE + UNDO ---------- */
function deleteHabit(id) {
  const h = habits.find(x => x.id === id);
  if (!confirm("Delete this habit?")) return;

  lastDeletedHabit = h;
  habits = habits.filter(x => x.id !== id);
  save();
  render();

  const bar = document.getElementById("undoBar");
  bar.style.display = "flex";

  undoTimeout = setTimeout(() => {
    lastDeletedHabit = null;
    bar.style.display = "none";
  }, 5000);
}

function undoDelete() {
  if (!lastDeletedHabit) return;
  habits.push(lastDeletedHabit);
  lastDeletedHabit = null;
  clearTimeout(undoTimeout);
  document.getElementById("undoBar").style.display = "none";
  save();
  render();
}

/* ---------- EDIT ---------- */
function startEdit(id) {
  editingId = id;
  openPanel = null;
  render();
}

function saveEdit(h, input) {
  h.name = input.value.trim();
  editingId = null;
  save();
  render();
}

function cancelEdit() {
  editingId = null;
  render();
}

/* ---------- RESET ---------- */
function resetHabit(h) {
  if (!confirm("Reset streak?")) return;
  h.count = 0;
  h.lastDate = null;
  h.history = [];
  save();
  render();
}

/* ---------- PANELS ---------- */
function togglePanel(id, panel) {
  editingId = null;
  openPanel = openPanel === `${id}-${panel}` ? null : `${id}-${panel}`;
  render();
}

/* ---------- CALENDAR ---------- */
function renderCalendar(h) {
  const wrap = document.createElement("div");
  wrap.className = "habit-extra";

  wrap.innerHTML = `
    <div class="month-nav">
      <button onclick="prevMonth()">◀</button>
      ${monthName(viewMonth)} ${viewYear}
      <button onclick="nextMonth()">▶</button>
    </div>
  `;

  const grid = document.createElement("div");
  grid.className = "calendar-grid";

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  for (let i = 0; i < firstDay; i++) grid.appendChild(document.createElement("div"));

  for (let d = 1; d <= daysInMonth(viewYear, viewMonth); d++) {
    const cell = document.createElement("div");
    const ds = new Date(viewYear, viewMonth, d).toDateString();
    cell.textContent = d;
    cell.style.background = h.history.includes(ds) ? h.color : "#1e293b";
    grid.appendChild(cell);
  }

  wrap.appendChild(grid);
  return wrap;
}

/* ---------- STATS ---------- */
function renderStats(h) {
  let m = 0, y = 0;
  h.history.forEach(d => {
    const dt = new Date(d);
    if (dt.getFullYear() === viewYear) {
      y++;
      if (dt.getMonth() === viewMonth) m++;
    }
  });

  const div = document.createElement("div");
  div.className = "habit-extra";
  div.innerHTML = `
    <strong>${monthName(viewMonth)} ${viewYear}</strong><br>
    Completed: ${m}/${daysInMonth(viewYear, viewMonth)}<br><br>
    <strong>${viewYear}</strong><br>
    Completed: ${y} days
  `;
  return div;
}

window.prevMonth = () => { viewMonth--; if (viewMonth < 0) { viewMonth = 11; viewYear--; } render(); };
window.nextMonth = () => { viewMonth++; if (viewMonth > 11) { viewMonth = 0; viewYear++; } render(); };

/* ---------- RENDER ---------- */
function render() {
  habitList.innerHTML = "";

  let list = habits;
  if (searchQuery) list = list.filter(h => h.name.toLowerCase().includes(searchQuery));

  const pinned = list.filter(h => h.pinned);
  let rest = list.filter(h => !h.pinned);
  if (sortByStreak) rest.sort((a, b) => b.count - a.count);
  list = [...pinned, ...rest];

  list.forEach(h => {
    const card = document.createElement("div");
    card.className = "habit";
    card.style.setProperty("--accent", h.color);

    const handle = document.createElement("div");
    handle.className = "drag-handle";
    handle.textContent = "⋮⋮";

    handle.draggable = !editingId && !sortByStreak && !searchQuery;
    handle.ondragstart = () => draggedIndex = habits.indexOf(h);
    card.ondragover = e => e.preventDefault();
    card.ondrop = () => {
      if (draggedIndex === null) return;
      const moved = habits.splice(draggedIndex, 1)[0];
      habits.splice(habits.indexOf(h), 0, moved);
      draggedIndex = null;
      save();
      render();
    };

    let title;
    if (editingId === h.id) {
      const box = document.createElement("div");
      const input = document.createElement("input");
      input.value = h.name;

      const icons = document.createElement("div");
      ICONS.forEach(i => {
        const b = document.createElement("button");
        b.textContent = i;
        b.onclick = () => h.icon = i;
        icons.appendChild(b);
      });

      const color = document.createElement("input");
      color.type = "color";
      color.value = h.color;
      color.oninput = e => h.color = e.target.value;

      input.onkeydown = e => {
        if (e.key === "Enter") saveEdit(h, input);
        if (e.key === "Escape") cancelEdit();
      };

      box.append(input, icons, color);
      title = box;
      requestAnimationFrame(() => input.focus());
    } else {
      title = document.createElement("div");
      title.className = "habit-name";
      title.textContent = `${h.icon} ${h.name}`;
    }

    const streak = document.createElement("div");
    streak.className = "streak";
    streak.textContent = `Streak: ${h.count}`;

    const actions = document.createElement("div");
    actions.className = "habit-actions";
    actions.append(
      btn("✓", "done-btn", () => markDone(h)),
      btn(h.pinned ? "📌" : "📍", "icon-btn", () => togglePin(h)),
      btn("📅", "icon-btn", () => togglePanel(h.id, "cal")),
      btn("📊", "icon-btn", () => togglePanel(h.id, "stats")),
      btn("✏️", "icon-btn", () => startEdit(h.id)),
      btn("♻️", "icon-btn", () => resetHabit(h)),
      btn("🗑️", "icon-btn", () => deleteHabit(h.id))
    );

    card.append(handle, title, streak, actions);
    if (openPanel === `${h.id}-cal`) card.append(renderCalendar(h));
    if (openPanel === `${h.id}-stats`) card.append(renderStats(h));

    habitList.appendChild(card);
  });
}

function btn(t, c, f) {
  const b = document.createElement("button");
  b.textContent = t;
  b.className = c;
  b.onclick = f;
  return b;
}

render();
