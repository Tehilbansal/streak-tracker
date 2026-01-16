const { h, render } = preact;
const { useState, useEffect } = preactHooks;

/* ---------- HELPERS ---------- */
const todayStr = () => new Date().toDateString();
const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const monthName = m => new Date(2000, m).toLocaleString("default", { month: "long" });

/* ---------- APP ---------- */
function App() {
  const [habits, setHabits] = useState(
    JSON.parse(localStorage.getItem("habits")) || []
  );

  const [editingId, setEditingId] = useState(null);
  const [openPanel, setOpenPanel] = useState(null);

  const [viewDate, setViewDate] = useState(new Date());

  useEffect(() => {
    localStorage.setItem("habits", JSON.stringify(habits));
  }, [habits]);

  /* ---------- ACTIONS ---------- */
  const addHabit = (name) => {
    if (!name) return;
    setHabits(h => [
      ...h,
      {
        id: Date.now(),
        name,
        icon: "🔥",
        color: "#22c55e",
        count: 0,
        lastDate: null,
        history: []
      }
    ]);
  };

  const markDone = (id) => {
    setHabits(h =>
      h.map(habit => {
        if (habit.id !== id) return habit;

        const today = todayStr();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        let count = habit.count;
        if (habit.lastDate === yesterday) count++;
        else if (habit.lastDate !== today) count = 1;

        return {
          ...habit,
          count,
          lastDate: today,
          history: habit.history.includes(today)
            ? habit.history
            : [...habit.history, today]
        };
      })
    );
    setOpenPanel(null);
  };

  const deleteHabit = (id) => {
    if (!confirm("Delete this habit?")) return;
    setHabits(h => h.filter(x => x.id !== id));
    setEditingId(null);
    setOpenPanel(null);
  };

  const resetHabit = (id) => {
    if (!confirm("Reset streak?")) return;
    setHabits(h =>
      h.map(x =>
        x.id === id
          ? { ...x, count: 0, lastDate: null, history: [] }
          : x
      )
    );
    setOpenPanel(null);
  };

  /* ---------- EXPORT ---------- */
  const exportJSON = () => {
    download(
      new Blob([JSON.stringify(habits, null, 2)], { type: "application/json" }),
      "habits.json"
    );
  };

  const exportCSV = () => {
    let csv = "Habit,Date\n";
    habits.forEach(h =>
      h.history.forEach(d => {
        csv += `${h.name},${new Date(d).toISOString().split("T")[0]}\n`;
      })
    );
    download(new Blob([csv], { type: "text/csv" }), "habits.csv");
  };

  return (
    <div class="app">
      <header class="header">
        <h1>🔥 Streak Tracker</h1>
        <div class="toolbar">
          <button onClick={exportJSON}>Export JSON</button>
          <button onClick={exportCSV}>Export CSV</button>
        </div>
      </header>

      <main class="habit-list">
        {habits.map(habit => (
          <HabitCard
            habit={habit}
            editingId={editingId}
            setEditingId={setEditingId}
            openPanel={openPanel}
            setOpenPanel={setOpenPanel}
            viewDate={viewDate}
            setViewDate={setViewDate}
            markDone={markDone}
            resetHabit={resetHabit}
            deleteHabit={deleteHabit}
          />
        ))}
      </main>

      <AddHabit addHabit={addHabit} />
    </div>
  );
}

/* ---------- COMPONENTS ---------- */

function AddHabit({ addHabit }) {
  const [value, setValue] = useState("");

  const submit = () => {
    addHabit(value.trim());
    setValue("");
  };

  return (
    <footer class="add-habit">
      <input
        value={value}
        placeholder="New habit name"
        onInput={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") setValue("");
        }}
      />
      <button onClick={submit}>Add Habit</button>
    </footer>
  );
}

function HabitCard({
  habit,
  editingId,
  setEditingId,
  openPanel,
  setOpenPanel,
  viewDate,
  setViewDate,
  markDone,
  resetHabit,
  deleteHabit
}) {
  const isEditing = editingId === habit.id;
  const isOpen = openPanel?.startsWith(habit.id);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  return (
    <div class="habit" style={{ "--accent": habit.color }}>
      {isEditing ? (
        <input
          value={habit.name}
          onInput={e =>
            setEditingId({
              id: habit.id,
              value: e.target.value
            })
          }
        />
      ) : (
        <div class="habit-name">{habit.icon} {habit.name}</div>
      )}

      <div class="streak">Streak: {habit.count}</div>

      <div class="habit-actions">
        <button class="done-btn" onClick={() => markDone(habit.id)}>✓ Done</button>
        <button class="icon-btn" onClick={() => setOpenPanel(`${habit.id}-cal`)}>📅</button>
        <button class="icon-btn" onClick={() => setOpenPanel(`${habit.id}-stats`)}>📊</button>
        <button class="icon-btn" onClick={() => setOpenPanel(`${habit.id}-chart`)}>📈</button>
        <button class="icon-btn" onClick={() => setEditingId(habit.id)}>✏️</button>
        <button class="icon-btn" onClick={() => resetHabit(habit.id)}>♻️</button>
        <button class="icon-btn" onClick={() => deleteHabit(habit.id)}>🗑️</button>
      </div>

      {isOpen && (
        <div class="habit-extra">
          {openPanel.endsWith("cal") && (
            <div>
              <strong>{monthName(month)} {year}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- UTIL ---------- */
function download(blob, filename) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

/* ---------- START ---------- */
render(<App />, document.getElementById("app"));
