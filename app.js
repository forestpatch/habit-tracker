const habits = [
  { id: "move", name: "Move for 30 minutes", schedule: "daily", color: "emerald", done: false },
  { id: "read", name: "Read ten pages", schedule: "daily", color: "violet", done: true },
  { id: "plan", name: "Plan tomorrow", schedule: "weekdays", color: "amber", done: false },
];

const colorMap = {
  violet: "#6d5dfc",
  emerald: "#20a779",
  amber: "#e99a32",
  rose: "#e45e7f",
  sky: "#3a9bdc",
};

const habitList = document.querySelector("#habit-list");
const dialog = document.querySelector("#habit-dialog");
const habitForm = document.querySelector("#habit-form");

document.querySelector("#today-label").textContent = new Intl.DateTimeFormat("en", {
  weekday: "long",
  month: "long",
  day: "numeric",
}).format(new Date());

document.querySelector("#new-habit-button").addEventListener("click", () => dialog.showModal());
document.querySelector("#close-dialog-button").addEventListener("click", () => dialog.close());
document.querySelector("#cancel-dialog-button").addEventListener("click", () => dialog.close());

habitForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = document.querySelector("#habit-name").value.trim();
  if (!name) return;

  habits.push({
    id: crypto.randomUUID(),
    name,
    schedule: document.querySelector("#habit-schedule").value,
    color: new FormData(habitForm).get("habit-color"),
    done: false,
  });

  habitForm.reset();
  dialog.close();
  render();
});

habitList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-complete]");
  if (!button) return;
  const habit = habits.find((item) => item.id === button.dataset.complete);
  habit.done = !habit.done;
  render();
});

function render() {
  habitList.innerHTML = habits.map((habit) => `
    <article class="habit-card ${habit.done ? "completed" : ""}" style="--habit-color: ${colorMap[habit.color]}">
      <button class="complete-button" data-complete="${habit.id}" type="button" aria-label="Toggle ${escapeHtml(habit.name)}">✓</button>
      <div class="habit-main">
        <div class="habit-title-row">
          <h3>${escapeHtml(habit.name)}</h3>
          <span class="schedule-badge">${habit.schedule}</span>
        </div>
        <div class="habit-meta"><span><strong>${habit.done ? 1 : 0}</strong> today</span><span>New habit</span></div>
      </div>
      <div class="habit-menu"><button class="more-button" type="button" aria-label="Habit options">•••</button></div>
    </article>
  `).join("");

  const completed = habits.filter((habit) => habit.done).length;
  document.querySelector("#completed-count").textContent = completed;
  document.querySelector("#habit-count").textContent = habits.length;
  renderWeek(completed);
}

function renderWeek(completed) {
  const score = habits.length ? Math.round((completed / habits.length) * 100) : 0;
  document.querySelector("#week-score").textContent = `${score}%`;
  document.querySelector("#weekly-rate").textContent = score;
  document.querySelector("#week-bars").innerHTML = [18, 42, 34, 65, 48, 28, score].map((value, index) => `
    <div class="day-column ${index === 6 ? "today" : ""}">
      <div class="day-track"><div class="day-fill" style="height: ${Math.max(5, value)}%"></div></div>
      <span>${["M", "T", "W", "T", "F", "S", "S"][index]}</span>
    </div>
  `).join("");
}

function escapeHtml(value) {
  const node = document.createElement("div");
  node.textContent = value;
  return node.innerHTML;
}

render();
