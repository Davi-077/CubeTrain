
// CubeTrain v1
// 1) Cole sua Publishable Key do Clerk abaixo.
// 2) No Clerk, ative Username + Password.
// 3) Enquanto a chave não estiver configurada, a tela usa um modo de prévia local.

const CLERK_PUBLISHABLE_KEY = "COLE_SUA_PUBLISHABLE_KEY_AQUI";

const authScreen = document.querySelector("#authScreen");
const homeScreen = document.querySelector("#homeScreen");
const mount = document.querySelector("#clerkMount");
const demoAuth = document.querySelector("#demoAuth");
const authStatus = document.querySelector("#authStatus");
const showSignIn = document.querySelector("#showSignIn");
const showSignUp = document.querySelector("#showSignUp");
const displayUser = document.querySelector("#displayUser");

let clerk = null;
let authMode = "signin";

function hasRealKey() {
  return CLERK_PUBLISHABLE_KEY &&
    CLERK_PUBLISHABLE_KEY !== "COLE_SUA_PUBLISHABLE_KEY_AQUI" &&
    CLERK_PUBLISHABLE_KEY.startsWith("pk_");
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
      appearance: {
        variables: {
          colorPrimary: "#168cff",
          colorBackground: "#0d1721",
          colorText: "#f7fbff",
          colorInputBackground: "#071019",
          colorInputText: "#f7fbff"
        }
      }
    });
  } else {
    clerk.mountSignUp(mount, {
      routing: "hash",
      appearance: {
        variables: {
          colorPrimary: "#168cff",
          colorBackground: "#0d1721",
          colorText: "#f7fbff",
          colorInputBackground: "#071019",
          colorInputText: "#f7fbff"
        }
      }
    });
  }
}

showSignIn.addEventListener("click", () => setAuthTab("signin"));
showSignUp.addEventListener("click", () => setAuthTab("signup"));

async function initClerk() {
  if (!hasRealKey()) {
    authStatus.innerHTML = 'Modo de prévia. Para ativar contas online entre aparelhos, cole sua <b>Publishable Key</b> no arquivo <b>app.js</b>.';
    return;
  }

  try {
    const encodedDomain = CLERK_PUBLISHABLE_KEY.split("_")[2];
    const clerkDomain = atob(encodedDomain).slice(0, -1);

    await loadScript(`https://${clerkDomain}/npm/@clerk/ui@1/dist/ui.browser.js`);
    await loadScript(`https://${clerkDomain}/npm/@clerk/clerk-js@6/dist/clerk.browser.js`, {
      "data-clerk-publishable-key": CLERK_PUBLISHABLE_KEY
    });

    clerk = window.Clerk;
    await clerk.load({
      ui: { ClerkUI: window.__internal_ClerkUICtor }
    });

    demoAuth.classList.add("hidden");
    authStatus.classList.add("hidden");

    if (clerk.isSignedIn) {
      enterApp(realUserName());
    } else {
      setAuthTab("signin");
    }

    clerk.addListener(({ user }) => {
      if (user) {
        enterApp(realUserName(user));
      } else {
        leaveApp();
      }
    });
  } catch (error) {
    console.error(error);
    authStatus.textContent = "Não foi possível carregar o login online. Verifique a chave e a configuração do Clerk.";
  }
}

function loadScript(src, attrs = {}) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.crossOrigin = "anonymous";
    Object.entries(attrs).forEach(([key, value]) => s.setAttribute(key, value));
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function realUserName(user = clerk?.user) {
  if (!user) return "Usuário";
  return user.fullName || user.username || user.firstName || "Usuário";
}

function enterApp(name) {
  displayUser.textContent = name || "Usuário";
  authScreen.classList.add("hidden");
  homeScreen.classList.remove("hidden");
  showSection("inicio");
}

function leaveApp() {
  homeScreen.classList.add("hidden");
  authScreen.classList.remove("hidden");
  if (clerk && hasRealKey()) setAuthTab("signin");
}

document.querySelector("#demoEnter").addEventListener("click", () => {
  const name = document.querySelector("#demoName").value.trim();
  const password = document.querySelector("#demoPassword").value;
  if (!name || !password) {
    showToast("Digite o nome e a senha.");
    return;
  }
  enterApp(name);
});

document.querySelector("#logoutBtn").addEventListener("click", async () => {
  if (clerk?.isSignedIn) {
    await clerk.signOut();
  } else {
    leaveApp();
  }
});

const navButtons = [...document.querySelectorAll(".nav-btn")];
const sections = [...document.querySelectorAll(".content-section")];

function showSection(id) {
  sections.forEach(section => section.classList.toggle("active-section", section.id === id));
  navButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.section === id));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

navButtons.forEach(btn => btn.addEventListener("click", () => showSection(btn.dataset.section)));
document.querySelectorAll(".jump").forEach(btn => btn.addEventListener("click", () => showSection(btn.dataset.go)));

document.querySelectorAll(".coming").forEach(btn => {
  btn.addEventListener("click", () => showToast(`${btn.textContent.trim()} será uma das próximas partes.`));
});

// Timer
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

function format(ms) {
  return (ms / 1000).toFixed(2);
}

function drawTimer() {
  const current = running ? elapsed + performance.now() - startedAt : elapsed;
  const value = format(current);
  timerDisplay.textContent = value;
  miniTimer.textContent = value;
  if (running) animationId = requestAnimationFrame(drawTimer);
}

function startPauseTimer() {
  if (!running) {
    running = true;
    startedAt = performance.now();
    startTimerBtn.textContent = "Parar";
    saveTimeBtn.disabled = true;
    animationId = requestAnimationFrame(drawTimer);
  } else {
    elapsed += performance.now() - startedAt;
    running = false;
    cancelAnimationFrame(animationId);
    startTimerBtn.textContent = "Continuar";
    saveTimeBtn.disabled = elapsed <= 0;
    drawTimer();
  }
}

function resetTimer() {
  running = false;
  cancelAnimationFrame(animationId);
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
  const avg = times.reduce((a,b) => a+b,0) / times.length;
  bestTime.textContent = `${format(best)} s`;
  avgTime.textContent = `${format(avg)} s`;
}

startTimerBtn.addEventListener("click", startPauseTimer);
resetTimerBtn.addEventListener("click", resetTimer);
saveTimeBtn.addEventListener("click", saveCurrentTime);

document.querySelector("#timer").addEventListener("keydown", (event) => {
  if (event.code === "Space" && event.target.tagName !== "INPUT") {
    event.preventDefault();
    startPauseTimer();
  }
});

document.addEventListener("keydown", (event) => {
  const timerVisible = document.querySelector("#timer").classList.contains("active-section");
  if (timerVisible && event.code === "Space" && !["INPUT","TEXTAREA"].includes(event.target.tagName)) {
    event.preventDefault();
    startPauseTimer();
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
