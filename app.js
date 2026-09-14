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


// =========================
// CFOP - biblioteca e treino
// =========================
const CFOP = window.CFOP_DATA || { F2L: [], OLL: [], PLL: [] };
let activeSet = "F2L";
let activeCase = null;
let trainingAttempts = [];
let caseRunning = false;
let caseStartedAt = 0;
let caseElapsed = 0;
let caseAnimationId = null;
let caseSpaceHeld = false;
let caseReady = false;
let caseHoldTimer = null;
let awaitingJudgement = false;

const learnHome = document.querySelector("#learnHome");
const cfopHome = document.querySelector("#cfopHome");
const caseLibrary = document.querySelector("#caseLibrary");
const caseTrainer = document.querySelector("#caseTrainer");
const caseGrid = document.querySelector("#caseGrid");
const caseTimer = document.querySelector("#caseTimer");
const caseTimerButton = document.querySelector("#caseTimerButton");
const judgeButtons = document.querySelector("#judgeButtons");
const correctAttempt = document.querySelector("#correctAttempt");
const wrongAttempt = document.querySelector("#wrongAttempt");
const attemptDots = document.querySelector("#attemptDots");
const trainingAverage = document.querySelector("#trainingAverage");
const trainingResult = document.querySelector("#trainingResult");
const restartTraining = document.querySelector("#restartTraining");

function currentUserName() {
  return (localStorage.getItem(LAST_USER_KEY) || "usuario").trim();
}
function progressKey() {
  return "cubetrain_cfop_progress_" + currentUserName().toLowerCase().replace(/[^a-z0-9à-ÿ]+/gi,"_");
}
function loadCfopProgress() {
  try { return JSON.parse(localStorage.getItem(progressKey()) || "{}"); }
  catch { return {}; }
}
function saveCfopProgress(progress) {
  localStorage.setItem(progressKey(), JSON.stringify(progress));
}
function learnedIds() {
  return loadCfopProgress();
}
function markLearned(id, avg) {
  const p = loadCfopProgress();
  p[id] = { learned: true, average: avg, date: new Date().toISOString() };
  saveCfopProgress(p);
  
// =========================
// Velocidade: finger tricks e metrônomo
// =========================
const fingerTricksPanel = document.querySelector("#fingerTricksPanel");
const metronomePanel = document.querySelector("#metronomePanel");
const bpmSlider = document.querySelector("#bpmSlider");
const bpmValue = document.querySelector("#bpmValue");
const toggleMetronome = document.querySelector("#toggleMetronome");
const beatLight = document.querySelector("#beatLight");
let metronomeRunning = false;
let metronomeTimer = null;
let audioCtx = null;

document.querySelector("#openFingerTricks").addEventListener("click", () => {
  showLearnPanel(fingerTricksPanel);
});
document.querySelector("#openMetronome").addEventListener("click", () => {
  showLearnPanel(metronomePanel);
});
document.querySelector("#backFromFingerTricks").addEventListener("click", () => {
  showLearnPanel(cfopHome);
});
document.querySelector("#backFromMetronome").addEventListener("click", () => {
  stopMetronome();
  showLearnPanel(cfopHome);
});

document.querySelectorAll(".finger-drill").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelector("#fingerDrillText").textContent = btn.dataset.drill;
    document.querySelector("#fingerDrillBox").classList.remove("hidden");
  });
});

function setBpm(value) {
  const bpm = Math.max(30, Math.min(240, Number(value)));
  bpmSlider.value = bpm;
  bpmValue.textContent = bpm;
  if (metronomeRunning) {
    stopMetronome();
    startMetronome();
  }
}
bpmSlider.addEventListener("input", () => setBpm(bpmSlider.value));
document.querySelector("#minusBpm").addEventListener("click", () => setBpm(Number(bpmSlider.value)-5));
document.querySelector("#plusBpm").addEventListener("click", () => setBpm(Number(bpmSlider.value)+5));

function metronomeClick() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.055);

  beatLight.classList.add("hit");
  setTimeout(() => beatLight.classList.remove("hit"), 90);
}

function scheduleMetronome() {
  if (!metronomeRunning) return;
  metronomeClick();
  const delay = 60000 / Number(bpmSlider.value);
  metronomeTimer = setTimeout(scheduleMetronome, delay);
}
function startMetronome() {
  if (metronomeRunning) return;
  metronomeRunning = true;
  toggleMetronome.textContent = "Parar";
  scheduleMetronome();
}
function stopMetronome() {
  metronomeRunning = false;
  clearTimeout(metronomeTimer);
  toggleMetronome.textContent = "Começar";
  beatLight.classList.remove("hit");
}
toggleMetronome.addEventListener("click", () => {
  if (metronomeRunning) stopMetronome();
  else startMetronome();
});

updateCfopProgress();
}
function countLearned(setName) {
  const p = learnedIds();
  return CFOP[setName].filter(c => p[c.id]?.learned).length;
}
function updateCfopProgress() {
  const f = countLearned("F2L"), o = countLearned("OLL"), p = countLearned("PLL");
  document.querySelector("#f2lProgressBar").value = f;
  document.querySelector("#ollProgressBar").value = o;
  document.querySelector("#pllProgressBar").value = p;
  document.querySelector("#f2lProgressText").textContent = `${f}/41`;
  document.querySelector("#ollProgressText").textContent = `${o}/57`;
  document.querySelector("#pllProgressText").textContent = `${p}/21`;
  const total = f + o + p;
  const pct = Math.round(total / 119 * 100);
  document.querySelector("#threeProgress").textContent = `${pct}%`;
}
function showLearnPanel(panel) {
  [learnHome, cfopHome, caseLibrary, caseTrainer].forEach(x => x.classList.add("hidden"));
  panel.classList.remove("hidden");
}
function open3x3() {
  showSection("aprender");
  showLearnPanel(cfopHome);
  updateCfopProgress();
}
document.querySelector("#open3x3").addEventListener("click", open3x3);
document.querySelector("#home3x3").addEventListener("click", open3x3);
document.querySelector("#backToPuzzles").addEventListener("click", () => showLearnPanel(learnHome));
document.querySelector("#backToCfop").addEventListener("click", () => showLearnPanel(cfopHome));
document.querySelector("#backToLibrary").addEventListener("click", () => {
  stopCaseTimer(false);
  renderCaseLibrary(activeSet);
});

document.querySelectorAll(".cfop-choice").forEach(btn => {
  btn.addEventListener("click", () => renderCaseLibrary(btn.dataset.set));
});

function renderCaseLibrary(setName) {
  activeSet = setName;
  showLearnPanel(caseLibrary);
  document.querySelector("#libraryEyebrow").textContent = `3×3 • CFOP • ${setName}`;
  const titles = {
    F2L: ["F2L", "41 casos padrão para treinar as primeiras duas camadas."],
    OLL: ["OLL completo", "Todas as 57 OLLs."],
    PLL: ["PLL completo", "Todas as 21 PLLs."]
  };
  document.querySelector("#libraryTitle").textContent = titles[setName][0];
  document.querySelector("#librarySubtitle").textContent = titles[setName][1];
  document.querySelector("#libraryDone").textContent = `${countLearned(setName)}/${CFOP[setName].length}`;

  const p = learnedIds();
  caseGrid.innerHTML = "";
  CFOP[setName].forEach(item => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "case-card" + (p[item.id]?.learned ? " learned" : "");
    btn.innerHTML = `<strong>${item.name}</strong><span>${p[item.id]?.learned ? `✓ Dominado • média ${Number(p[item.id].average).toFixed(2)} s` : "Ainda não dominado"}</span>`;
    btn.addEventListener("click", () => openTrainer(item));
    caseGrid.appendChild(btn);
  });
}

function openTrainer(item) {
  activeCase = item;
  trainingAttempts = [];
  resetCaseTimer();
  showLearnPanel(caseTrainer);
  document.querySelector("#trainerGroup").textContent = `3×3 • ${item.group}`;
  document.querySelector("#trainerCaseName").textContent = item.name;
  document.querySelector("#caseBigLabel").textContent = item.name;
  document.querySelector("#caseReference").href = item.ref;
  restartTraining.classList.add("hidden");
  renderAttempts();
}

function formatCaseTime(ms) {
  return (ms / 1000).toFixed(2);
}
function drawCaseTimer() {
  const current = caseRunning ? performance.now() - caseStartedAt : caseElapsed;
  caseTimer.textContent = formatCaseTime(current);
  caseTimer.classList.remove("ready","holding");
  if (caseRunning) caseAnimationId = requestAnimationFrame(drawCaseTimer);
}
function beginCaseTimer() {
  if (trainingAttempts.length >= 5 || awaitingJudgement) return;
  caseRunning = true;
  caseElapsed = 0;
  caseStartedAt = performance.now();
  caseTimerButton.textContent = "Parar";
  caseAnimationId = requestAnimationFrame(drawCaseTimer);
}
function stopCaseTimer(showJudge=true) {
  if (!caseRunning) return;
  caseElapsed = performance.now() - caseStartedAt;
  caseRunning = false;
  cancelAnimationFrame(caseAnimationId);
  caseTimerButton.textContent = "Iniciar tentativa";
  drawCaseTimer();
  if (showJudge) {
    awaitingJudgement = true;
    judgeButtons.classList.remove("hidden");
  }
}
function resetCaseTimer() {
  caseRunning = false;
  cancelAnimationFrame(caseAnimationId);
  clearTimeout(caseHoldTimer);
  caseSpaceHeld = false;
  caseReady = false;
  awaitingJudgement = false;
  caseElapsed = 0;
  caseTimer.textContent = "0.00";
  caseTimer.classList.remove("ready","holding");
  caseTimerButton.textContent = "Iniciar tentativa";
  judgeButtons.classList.add("hidden");
}
function commitAttempt(correct) {
  if (!awaitingJudgement) return;
  trainingAttempts.push({ time: caseElapsed, correct });
  awaitingJudgement = false;
  judgeButtons.classList.add("hidden");
  caseElapsed = 0;
  caseTimer.textContent = "0.00";
  renderAttempts();
  if (trainingAttempts.length < 5) {
    caseTimerButton.disabled = false;
  } else {
    finishTraining();
  }
}
correctAttempt.addEventListener("click", () => commitAttempt(true));
wrongAttempt.addEventListener("click", () => commitAttempt(false));
caseTimerButton.addEventListener("click", () => {
  if (awaitingJudgement || trainingAttempts.length >= 5) return;
  if (caseRunning) stopCaseTimer(true);
  else beginCaseTimer();
});
function renderAttempts() {
  attemptDots.innerHTML = "";
  for (let i=0;i<5;i++) {
    const dot = document.createElement("span");
    dot.className = "attempt-dot";
    if (trainingAttempts[i]) dot.classList.add(trainingAttempts[i].correct ? "correct" : "wrong");
    attemptDots.appendChild(dot);
  }
  if (trainingAttempts.length) {
    const avg = trainingAttempts.reduce((s,a)=>s+a.time,0)/trainingAttempts.length/1000;
    trainingAverage.textContent = `${avg.toFixed(2)} s`;
  } else trainingAverage.textContent = "—";
  trainingResult.textContent = `${trainingAttempts.length}/5 tentativas`;
}
function finishTraining() {
  const allCorrect = trainingAttempts.every(a => a.correct);
  const avg = trainingAttempts.reduce((s,a)=>s+a.time,0)/5/1000;
  trainingAverage.textContent = `${avg.toFixed(2)} s`;
  caseTimerButton.disabled = true;
  restartTraining.classList.remove("hidden");
  if (allCorrect && avg <= 10) {
    trainingResult.innerHTML = `<span class="mastered-banner">✓ DOMINADO!</span>`;
    markLearned(activeCase.id, avg);
  } else {
    const reason = !allCorrect ? "É preciso acertar as 5." : "A média precisa ser 10,00 s ou menos.";
    trainingResult.innerHTML = `<span class="failed-banner">Ainda não. ${reason}</span>`;
  }
}
restartTraining.addEventListener("click", () => {
  trainingAttempts = [];
  caseTimerButton.disabled = false;
  restartTraining.classList.add("hidden");
  resetCaseTimer();
  renderAttempts();
});

// Espaço no treinador de casos
document.addEventListener("keydown", event => {
  const visible = !caseTrainer.classList.contains("hidden");
  const editable = ["INPUT","TEXTAREA"].includes(event.target.tagName);
  if (!visible || editable || event.code !== "Space") return;
  event.preventDefault();
  event.stopImmediatePropagation();
  if (event.repeat) return;
  if (awaitingJudgement || trainingAttempts.length >= 5) return;

  if (caseRunning) {
    stopCaseTimer(true);
    return;
  }
  if (caseSpaceHeld) return;
  caseSpaceHeld = true;
  caseReady = false;
  caseTimer.textContent = "SEGURE...";
  caseTimer.classList.add("holding");
  caseHoldTimer = setTimeout(() => {
    if (!caseSpaceHeld || caseRunning) return;
    caseReady = true;
    caseTimer.textContent = "OK";
    caseTimer.classList.remove("holding");
    caseTimer.classList.add("ready");
  }, 450);
}, true);

document.addEventListener("keyup", event => {
  const visible = !caseTrainer.classList.contains("hidden");
  const editable = ["INPUT","TEXTAREA"].includes(event.target.tagName);
  if (!visible || editable || event.code !== "Space") return;
  event.preventDefault();
  event.stopImmediatePropagation();
  if (!caseSpaceHeld) return;
  caseSpaceHeld = false;
  clearTimeout(caseHoldTimer);
  if (caseReady && !caseRunning) {
    caseReady = false;
    beginCaseTimer();
  } else if (!caseRunning) {
    caseTimer.textContent = "0.00";
    caseTimer.classList.remove("ready","holding");
  }
}, true);

updateCfopProgress();

drawTimer();
