const authScreen = document.querySelector("#authScreen");
const homeScreen = document.querySelector("#homeScreen");
const displayUser = document.querySelector("#displayUser");
const nameForm = document.querySelector("#nameForm");
const nameInput = document.querySelector("#nameInput");

const LAST_USER_KEY = "cubetrain_last_user";

function openApp(name) {
  const cleanName = name.trim();
  if (!cleanName) return;
  localStorage.setItem(LAST_USER_KEY, cleanName);
  displayUser.textContent = cleanName;
  authScreen.classList.add("hidden");
  homeScreen.classList.remove("hidden");
  showSection("inicio");
}

function showNameScreen() {
  const savedName = localStorage.getItem(LAST_USER_KEY) || "";
  nameInput.value = savedName;
  homeScreen.classList.add("hidden");
  authScreen.classList.remove("hidden");
  setTimeout(() => nameInput.focus(), 0);
}

nameForm.addEventListener("submit", (event) => {
  event.preventDefault();
  openApp(nameInput.value);
});

document.querySelector("#logoutBtn").textContent = "Trocar usuário";
document.querySelector("#logoutBtn").addEventListener("click", showNameScreen);

// Sempre mostra a tela de nome ao abrir, mas já preenche com a última pessoa.
showNameScreen();

// Navegação
const navButtons = [...document.querySelectorAll(".nav-btn")];
const sections = [...document.querySelectorAll(".content-section")];

function showSection(id) {
  sections.forEach(section =>
    section.classList.toggle("active-section", section.id === id)
  );
  navButtons.forEach(btn =>
    btn.classList.toggle("active", btn.dataset.section === id)
  );
  window.scrollTo({ top: 0, behavior: "smooth" });
}

navButtons.forEach(btn =>
  btn.addEventListener("click", () => showSection(btn.dataset.section))
);

document.querySelectorAll(".jump").forEach(btn =>
  btn.addEventListener("click", () => showSection(btn.dataset.go))
);

document.querySelectorAll(".coming").forEach(btn => {
  btn.addEventListener("click", () =>
    showToast(`${btn.textContent.trim()} será uma das próximas partes.`)
  );
});

// Cronômetro
const timerDisplay = document.querySelector("#timerDisplay");
const miniTimer = document.querySelector("#miniTimer");
const startTimerBtn = document.querySelector("#startTimer");
const saveTimeBtn = document.querySelector("#saveTime");
const resetTimerBtn = document.querySelector("#resetTimer");
const bestTime = document.querySelector("#bestTime");
const avgTime = document.querySelector("#avgTime");
const timeList = document.querySelector("#timeList");

let running = false;
let startedAt = 0;
let elapsed = 0;
let animationId = null;
let times = [];
let spaceHeld = false;
let readyToStart = false;
let holdTimer = null;
const HOLD_TO_READY_MS = 450;

function format(ms) {
  return (ms / 1000).toFixed(2);
}

function setTimerStateText(text, className = "") {
  timerDisplay.classList.remove("ready", "holding");
  miniTimer.classList.remove("ready", "holding");
  if (className) {
    timerDisplay.classList.add(className);
    miniTimer.classList.add(className);
  }
  timerDisplay.textContent = text;
  miniTimer.textContent = text;
}

function drawTimer() {
  const current = running ? elapsed + performance.now() - startedAt : elapsed;
  const value = format(current);
  timerDisplay.textContent = value;
  miniTimer.textContent = value;
  timerDisplay.classList.remove("ready", "holding");
  miniTimer.classList.remove("ready", "holding");
  if (running) animationId = requestAnimationFrame(drawTimer);
}

function beginTimer() {
  running = true;
  elapsed = 0;
  startedAt = performance.now();
  startTimerBtn.textContent = "Parar";
  saveTimeBtn.disabled = true;
  animationId = requestAnimationFrame(drawTimer);
}

function stopTimer() {
  if (!running) return;
  elapsed += performance.now() - startedAt;
  running = false;
  cancelAnimationFrame(animationId);
  startTimerBtn.textContent = "Iniciar";
  saveTimeBtn.disabled = elapsed <= 0;
  drawTimer();
}

function resetTimer() {
  running = false;
  cancelAnimationFrame(animationId);
  clearTimeout(holdTimer);
  spaceHeld = false;
  readyToStart = false;
  elapsed = 0;
  startTimerBtn.textContent = "Iniciar";
  saveTimeBtn.disabled = true;
  drawTimer();
}

function saveCurrentTime() {
  if (running || elapsed <= 0) return;
  times.unshift(elapsed);
  if (times.length > 10) times = times.slice(0, 10);
  renderTimes();
  resetTimer();
}

function renderTimes() {
  timeList.innerHTML = "";
  times.forEach((ms, index) => {
    const li = document.createElement("li");
    li.textContent = `Tentativa ${times.length - index}: ${format(ms)} s`;
    timeList.appendChild(li);
  });

  if (!times.length) {
    bestTime.textContent = "—";
    avgTime.textContent = "—";
    return;
  }

  const best = Math.min(...times);
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  bestTime.textContent = `${format(best)} s`;
  avgTime.textContent = `${format(avg)} s`;
}

startTimerBtn.addEventListener("click", () => {
  if (running) stopTimer();
  else beginTimer();
});
resetTimerBtn.addEventListener("click", resetTimer);
saveTimeBtn.addEventListener("click", saveCurrentTime);

document.addEventListener("keydown", event => {
  const timerVisible =
    document.querySelector("#timer").classList.contains("active-section");
  const editable = ["INPUT", "TEXTAREA"].includes(event.target.tagName);

  if (!timerVisible || editable || event.code !== "Space") return;
  event.preventDefault();
  if (event.repeat) return;

  if (running) {
    stopTimer();
    return;
  }

  if (spaceHeld) return;
  spaceHeld = true;
  readyToStart = false;
  setTimerStateText("SEGURE...", "holding");

  holdTimer = setTimeout(() => {
    if (!spaceHeld || running) return;
    readyToStart = true;
    setTimerStateText("OK", "ready");
  }, HOLD_TO_READY_MS);
});

document.addEventListener("keyup", event => {
  const timerVisible =
    document.querySelector("#timer").classList.contains("active-section");
  const editable = ["INPUT", "TEXTAREA"].includes(event.target.tagName);

  if (!timerVisible || editable || event.code !== "Space") return;
  event.preventDefault();
  if (!spaceHeld) return;

  spaceHeld = false;
  clearTimeout(holdTimer);

  if (readyToStart && !running) {
    readyToStart = false;
    beginTimer();
  } else if (!running) {
    readyToStart = false;
    drawTimer();
  }
});

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.t);
  showToast.t = setTimeout(() => toast.classList.remove("show"), 2200);
}

drawTimer();
