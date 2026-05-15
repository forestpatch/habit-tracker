const STORAGE_KEY = "habit-garden:v1";
const THEME_KEY = "habit-garden:theme";
const colorMap = {
  violet: "#6d5dfc",
  emerald: "#20a779",
  amber: "#e99a32",
  rose: "#e45e7f",
  sky: "#3a9bdc",
};

const scheduleLabels = {
  daily: "Every day",
  weekdays: "Weekdays",
  weekends: "Weekends",
};

const elements = {
  habitList: document.querySelector("#habit-list"),
  emptyState: document.querySelector("#empty-state"),
  dialog: document.querySelector("#habit-dialog"),
  dialogTitle: document.querySelector("#dialog-title"),
  habitForm: document.querySelector("#habit-form"),
  habitId: document.querySelector("#habit-id"),
  habitName: document.querySelector("#habit-name"),
  habitSchedule: document.querySelector("#habit-schedule"),
  importInput: document.querySelector("#import-input"),
  completedCount: document.querySelector("#completed-count"),
  habitCount: document.querySelector("#habit-count"),
  bestStreak: document.querySelector("#best-streak"),
  weeklyRate: document.querySelector("#weekly-rate"),
  weekScore: document.querySelector("#week-score"),
  weekBars: document.querySelector("#week-bars"),
  weekInsight: document.querySelector("#week-insight"),
  toast: document.querySelector("#toast"),
};

const state = {
  habits: loadHabits(),
  filter: "all",
};

if (!localStorage.getItem(STORAGE_KEY)) saveHabits();

applyTheme(loadTheme());

document.querySelector("#today-label").textContent = new Intl.DateTimeFormat("en", {
  weekday: "long",
  month: "long",
  day: "numeric",
}).format(new Date());

document.querySelector("#new-habit-button").addEventListener("click", () => openHabitDialog());
document.querySelector("#close-dialog-button").addEventListener("click", closeHabitDialog);
document.querySelector("#cancel-dialog-button").addEventListener("click", closeHabitDialog);
document.querySelector("#clear-data-button").addEventListener("click", resetData);
document.querySelector("#theme-toggle").addEventListener("click", toggleTheme);
document.querySelector("#export-button").addEventListener("click", exportData);
document.querySelector("#import-button").addEventListener("click", () => elements.importInput.click());
elements.importInput.addEventListener("change", importData);

document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    state.filter = button.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("active", item === button));
    render();
  });
});

elements.habitForm.addEventListener("submit", saveHabitFromForm);
elements.habitList.addEventListener("click", handleHabitAction);

function loadHabits() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(stored)) return stored;
  } catch (error) {
    console.warn("Habit data could not be loaded.", error);
  }
  return createStarterHabits();
}

function createStarterHabits() {
  const dates = getPastDates(8).map(toDateKey);
  return [
    {
      id: createId(),
      name: "Move for 30 minutes",
      schedule: "daily",
      color: "emerald",
      createdAt: dates[7],
      history: Object.fromEntries([dates[1], dates[2], dates[3], dates[4], dates[5]].map((date) => [date, true])),
    },
    {
      id: createId(),
      name: "Read ten pages",
      schedule: "daily",
      color: "violet",
      createdAt: dates[7],
      history: Object.fromEntries([dates[0], dates[2], dates[3], dates[5], dates[6]].map((date) => [date, true])),
    },
    {
      id: createId(),
      name: "Plan tomorrow",
      schedule: "weekdays",
      color: "amber",
      createdAt: dates[7],
      history: Object.fromEntries([dates[2], dates[3], dates[4]].map((date) => [date, true])),
    },
  ];
}

function saveHabits() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.habits));
}

function handleHabitAction(event) {
  const actionButton = event.target.closest("button[data-action]");
  if (!actionButton) return;

  const habit = state.habits.find((item) => item.id === actionButton.dataset.id);
  if (!habit) return;

  if (actionButton.dataset.action === "toggle") toggleHabit(habit);
  if (actionButton.dataset.action === "edit") openHabitDialog(habit);
  if (actionButton.dataset.action === "delete") deleteHabit(habit);
}

function toggleHabit(habit) {
  const today = toDateKey(new Date());
  if (habit.history[today]) {
    delete habit.history[today];
    showToast("Completion removed");
  } else {
    habit.history[today] = true;
    showToast("Nice work — habit completed!");
  }
  saveHabits();
  render();
}

function openHabitDialog(habit = null) {
  elements.habitForm.reset();
  elements.habitId.value = habit?.id ?? "";
  elements.dialogTitle.textContent = habit ? "Edit habit" : "Add a new habit";

  if (habit) {
    elements.habitName.value = habit.name;
    elements.habitSchedule.value = habit.schedule;
    const colorInput = elements.habitForm.querySelector(`[name="habit-color"][value="${habit.color}"]`);
    if (colorInput) colorInput.checked = true;
  }

  elements.dialog.showModal();
  requestAnimationFrame(() => elements.habitName.focus());
}

function closeHabitDialog() {
  elements.dialog.close();
  elements.habitForm.reset();
}

function saveHabitFromForm(event) {
  event.preventDefault();
  const name = elements.habitName.value.trim();
  if (!name) return;

  const id = elements.habitId.value;
  const existingHabit = state.habits.find((habit) => habit.id === id);
  const details = {
    name,
    schedule: elements.habitSchedule.value,
    color: new FormData(elements.habitForm).get("habit-color"),
  };

  if (existingHabit) {
    Object.assign(existingHabit, details);
    showToast("Habit updated");
  } else {
    state.habits.push({
      id: createId(),
      ...details,
      createdAt: toDateKey(new Date()),
      history: {},
    });
    showToast("New habit added");
  }

  saveHabits();
  closeHabitDialog();
  render();
}

function deleteHabit(habit) {
  if (!window.confirm(`Delete “${habit.name}” and its history?`)) return;
  state.habits = state.habits.filter((item) => item.id !== habit.id);
  saveHabits();
  showToast("Habit deleted");
  render();
}

function resetData() {
  if (!window.confirm("Reset every habit and completion? This cannot be undone.")) return;
  state.habits = [];
  saveHabits();
  showToast("Habit data reset");
  render();
}

function loadTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function toggleTheme() {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem(THEME_KEY, nextTheme);
  applyTheme(nextTheme);
}

function applyTheme(theme) {
  const toggle = document.querySelector("#theme-toggle");
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  toggle.textContent = theme === "dark" ? "☀" : "☾";
  toggle.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} theme`);
}

function exportData() {
  const exportPayload = {
    application: "Habit Garden",
    version: 1,
    exportedAt: new Date().toISOString(),
    habits: state.habits,
  };
  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `habit-garden-${toDateKey(new Date())}.json`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  showToast("Habit data exported");
}

async function importData(event) {
  const [file] = event.target.files;
  if (!file) return;

  try {
    const payload = JSON.parse(await file.text());
    const importedHabits = normalizeImportedHabits(payload?.habits);
    if (!window.confirm(`Replace current data with ${importedHabits.length} imported habits?`)) return;
    state.habits = importedHabits;
    saveHabits();
    render();
    showToast("Habit data imported");
  } catch (error) {
    console.warn("Habit data could not be imported.", error);
    showToast("That backup file is not valid");
  } finally {
    event.target.value = "";
  }
}

function normalizeImportedHabits(habits) {
  if (!Array.isArray(habits)) throw new TypeError("The backup does not contain a habits array.");

  return habits.map((habit) => {
    const name = typeof habit?.name === "string" ? habit.name.trim().slice(0, 48) : "";
    if (!name) throw new TypeError("Every imported habit needs a name.");

    const schedule = Object.hasOwn(scheduleLabels, habit.schedule) ? habit.schedule : "daily";
    const color = Object.hasOwn(colorMap, habit.color) ? habit.color : "violet";
    const history = Object.fromEntries(
      Object.entries(habit.history ?? {}).filter(([date, complete]) => /^\d{4}-\d{2}-\d{2}$/.test(date) && complete === true),
    );

    return {
      id: typeof habit.id === "string" && habit.id ? habit.id : createId(),
      name,
      schedule,
      color,
      createdAt: /^\d{4}-\d{2}-\d{2}$/.test(habit.createdAt ?? "") ? habit.createdAt : toDateKey(new Date()),
      history,
    };
  });
}

function render() {
  const today = new Date();
  const todayKey = toDateKey(today);
  const scheduledHabits = state.habits.filter((habit) => isScheduled(habit, today));
  const visibleHabits = scheduledHabits.filter((habit) => {
    const complete = Boolean(habit.history[todayKey]);
    if (state.filter === "pending") return !complete;
    if (state.filter === "done") return complete;
    return true;
  });

  elements.habitList.innerHTML = visibleHabits.map((habit) => habitCardTemplate(habit, todayKey)).join("");
  elements.emptyState.hidden = visibleHabits.length > 0;

  const completed = scheduledHabits.filter((habit) => habit.history[todayKey]).length;
  elements.completedCount.textContent = completed;
  elements.habitCount.textContent = scheduledHabits.length;
  elements.bestStreak.textContent = Math.max(0, ...state.habits.map(calculateStreak));

  renderWeeklyProgress();
}

function habitCardTemplate(habit, todayKey) {
  const complete = Boolean(habit.history[todayKey]);
  const streak = calculateStreak(habit);
  const total = Object.keys(habit.history).length;
  return `
    <article class="habit-card ${complete ? "completed" : ""}" style="--habit-color: ${colorMap[habit.color]}">
      <button class="complete-button" data-action="toggle" data-id="${habit.id}" type="button" aria-label="${complete ? "Mark incomplete" : "Mark complete"}: ${escapeHtml(habit.name)}">✓</button>
      <div class="habit-main">
        <div class="habit-title-row">
          <h3>${escapeHtml(habit.name)}</h3>
          <span class="schedule-badge">${scheduleLabels[habit.schedule]}</span>
        </div>
        <div class="habit-meta">
          <span><strong>${streak}</strong> day streak</span>
          <span><strong>${total}</strong> completions</span>
        </div>
      </div>
      <details class="habit-menu">
        <summary class="more-button" aria-label="Options for ${escapeHtml(habit.name)}">•••</summary>
        <div class="menu-popover">
          <button data-action="edit" data-id="${habit.id}" type="button">Edit</button>
          <button class="danger-action" data-action="delete" data-id="${habit.id}" type="button">Delete</button>
        </div>
      </details>
    </article>
  `;
}

function renderWeeklyProgress() {
  const weekDates = getCurrentWeekDates();
  const today = toDateKey(new Date());
  const elapsedWeekDates = weekDates.filter((date) => toDateKey(date) <= today);
  const dayRates = weekDates.map((date) => {
    const scheduled = state.habits.filter((habit) => isScheduled(habit, date));
    const complete = scheduled.filter((habit) => habit.history[toDateKey(date)]).length;
    return scheduled.length ? Math.round((complete / scheduled.length) * 100) : 0;
  });

  const opportunities = elapsedWeekDates.reduce((total, date) => total + state.habits.filter((habit) => isScheduled(habit, date)).length, 0);
  const completions = elapsedWeekDates.reduce((total, date) => {
    const dateKey = toDateKey(date);
    return total + state.habits.filter((habit) => isScheduled(habit, date) && habit.history[dateKey]).length;
  }, 0);
  const rate = opportunities ? Math.round((completions / opportunities) * 100) : 0;

  elements.weeklyRate.textContent = rate;
  elements.weekScore.textContent = `${rate}%`;
  elements.weekBars.innerHTML = weekDates.map((date, index) => `
    <div class="day-column ${toDateKey(date) === toDateKey(new Date()) ? "today" : ""}" title="${dayRates[index]}% complete">
      <div class="day-track"><div class="day-fill" style="height: ${Math.max(5, dayRates[index])}%"></div></div>
      <span>${new Intl.DateTimeFormat("en", { weekday: "narrow" }).format(date)}</span>
    </div>
  `).join("");

  const insight = rate >= 80
    ? "Excellent rhythm — you are on track for a strong week."
    : rate >= 50
      ? "Good momentum. One more completion will keep the week moving."
      : "Start small today. A single completion is still progress.";
  elements.weekInsight.innerHTML = `<span aria-hidden="true">◎</span><p>${insight}</p>`;
}

function calculateStreak(habit) {
  let cursor = startOfDay(new Date());
  if (!habit.history[toDateKey(cursor)]) cursor = addDays(cursor, -1);
  let streak = 0;
  let guard = 0;

  while (guard < 730) {
    guard += 1;
    if (!isScheduled(habit, cursor)) {
      cursor = addDays(cursor, -1);
      continue;
    }
    if (!habit.history[toDateKey(cursor)]) break;
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function isScheduled(habit, date) {
  const day = date.getDay();
  if (habit.schedule === "weekdays") return day >= 1 && day <= 5;
  if (habit.schedule === "weekends") return day === 0 || day === 6;
  return true;
}

function getCurrentWeekDates() {
  const today = startOfDay(new Date());
  const mondayOffset = today.getDay() === 0 ? -6 : 1 - today.getDay();
  const monday = addDays(today, mondayOffset);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

function getPastDates(count) {
  const today = startOfDay(new Date());
  return Array.from({ length: count }, (_, index) => addDays(today, -index));
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, amount) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `habit-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
  const node = document.createElement("div");
  node.textContent = value;
  return node.innerHTML;
}

let toastTimer;
function showToast(message) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  toastTimer = setTimeout(() => elements.toast.classList.remove("show"), 2200);
}

render();
