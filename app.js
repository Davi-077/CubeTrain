
const CONFIG = window.CUBETRAIN_CONFIG || {};
const CLERK_PUBLISHABLE_KEY = CONFIG.CLERK_PUBLISHABLE_KEY || "";

const authScreen = document.querySelector("#authScreen");
const homeScreen = document.querySelector("#homeScreen");
const mount = document.querySelector("#clerkMount");
const setupWarning = document.querySelector("#setupWarning");
const showSignIn = document.querySelector("#showSignIn");
const showSignUp = document.querySelector("#showSignUp");
const displayUser = document.querySelector("#displayUser");

let clerk = null;
let authMode = "signin";

function hasRealKey() {
  return CLERK_PUBLISHABLE_KEY.startsWith("pk_") &&
    CLERK_PUBLISHABLE_KEY !== "COLE_SUA_PUBLISHABLE_KEY_AQUI";
}

function appearance() {
  return {
    variables: {
      colorPrimary: "#168cff",
      colorBackground: "#0d1721",
      colorText: "#f7fbff",
      colorInputBackground: "#071019",
      colorInputText: "#f7fbff",
      borderRadius: "12px"
    }
  };
}

function setAuthTab(mode) {
  authMode = mode;
  showSignIn.classList.toggle("active", mode === "signin");
  showSignUp.classList.toggle("active", mode === "signup");

  if (!clerk || !hasRealKey()) return;

  mount.innerHTML = "";
  if (mode === "signin") {
    clerk.mountSignIn(mount, {
      routing: "hash",
      appearance: appearance()
    });
  } else {
    clerk.mountSignUp(mount, {
      routing: "hash",
      appearance: appearance()
    });
  }
}

showSignIn.addEventListener("click", () => setAuthTab("signin"));
showSignUp.addEventListener("click", () => setAuthTab("signup"));

async function loadScript(src, attrs = {}) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.crossOrigin = "anonymous";
    Object.entries(attrs).forEach(([key, value]) => script.setAttribute(key, value));
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
    document.head.appendChild(script);
  });
}

async function initClerk() {
  if (!hasRealKey()) {
    mount.innerHTML = "";
    setupWarning.classList.remove("hidden");
    return;
  }

  try {
    const parts = CLERK_PUBLISHABLE_KEY.split("_");
    const encodedDomain = parts[2];
    const clerkDomain = atob(encodedDomain).slice(0, -1);

    await loadScript(`https://${clerkDomain}/npm/@clerk/ui@1/dist/ui.browser.js`);
    await loadScript(
      `https://${clerkDomain}/npm/@clerk/clerk-js@6/dist/clerk.browser.js`,
      { "data-clerk-publishable-key": CLERK_PUBLISHABLE_KEY }
    );

    clerk = window.Clerk;
    await clerk.load({
      ui: { ClerkUI: window.__internal_ClerkUICtor }
    });

    setupWarning.classList.add("hidden");

    if (clerk.isSignedIn) {
      enterApp(getUserName());
    } else {
      setAuthTab("signin");
    }

    clerk.addListener(({ user }) => {
      if (user) enterApp(getUserName(user));
      else leaveApp();
    });
  } catch (error) {
    console.error(error);
    mount.innerHTML = "";
    setupWarning.classList.remove("hidden");
    setupWarning.textContent =
      "Não foi possível carregar o login online. Verifique a Publishable Key e as configurações do Clerk.";
  }
}

function getUserName(user = clerk?.user) {
  if (!user) return "Usuário";
  return user.fullName || user.username || user.firstName || "Usuário";
}

function enterApp(name) {
  displayUser.textContent = name;
  authScreen.classList.add("hidden");
  homeScreen.classList.remove("hidden");
  showSection("inicio");
}

function leaveApp() {
  homeScreen.classList.add("hidden");
  authScreen.classList.remove("hidden");
  if (clerk && hasRealKey()) setAuthTab("signin");
}

document.querySelector("#logoutBtn").addEventListener("click", async () => {
  if (clerk?.isSignedIn) await clerk.signOut();
});

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
initClerk();
