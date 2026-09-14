
(function () {
  "use strict";

  const LAST_USER_KEY = "cubetrain_last_user";

  function $(selector) {
    return document.querySelector(selector);
  }

  function openApp(name) {
    const cleanName = String(name || "").trim();

    if (!cleanName) {
      const input = $("#nameInput");
      if (input) {
        input.setCustomValidity("Digite seu nome para continuar.");
        input.reportValidity();
        input.focus();
      }
      return;
    }

    localStorage.setItem(LAST_USER_KEY, cleanName);

    const authScreen = $("#authScreen");
    const homeScreen = $("#homeScreen");
    const displayUser = $("#displayUser");

    if (displayUser) displayUser.textContent = cleanName;
    if (authScreen) authScreen.classList.add("hidden");
    if (homeScreen) homeScreen.classList.remove("hidden");

    // Ativa Início sem depender do app.js.
    document.querySelectorAll(".content-section").forEach((section) => {
      section.classList.toggle("active-section", section.id === "inicio");
    });
    document.querySelectorAll(".nav-btn").forEach((button) => {
      button.classList.toggle("active", button.dataset.section === "inicio");
    });
  }

  function showNameScreen() {
    const savedName = localStorage.getItem(LAST_USER_KEY) || "";
    const input = $("#nameInput");
    const authScreen = $("#authScreen");
    const homeScreen = $("#homeScreen");

    if (input) {
      input.setCustomValidity("");
      input.value = savedName;
    }

    if (homeScreen) homeScreen.classList.add("hidden");
    if (authScreen) authScreen.classList.remove("hidden");

    setTimeout(() => {
      if (input) input.focus();
    }, 0);
  }

  function initNameScreen() {
    const form = $("#nameForm");
    const input = $("#nameInput");
    const logout = $("#logoutBtn");

    if (!form || !input) {
      console.error("CubeTrain: tela de nome não encontrada.");
      return;
    }

    input.addEventListener("input", () => input.setCustomValidity(""));

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      event.stopPropagation();
      openApp(input.value);
      return false;
    });

    // Segurança extra para o clique do botão Entrar.
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.addEventListener("click", function (event) {
        event.preventDefault();
        openApp(input.value);
      });
    }

    if (logout) {
      logout.textContent = "Trocar usuário";
      logout.addEventListener("click", function (event) {
        event.preventDefault();
        showNameScreen();
      });
    }

    showNameScreen();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNameScreen, { once: true });
  } else {
    initNameScreen();
  }

  // Deixa disponível para diagnóstico no navegador, sem depender do app principal.
  window.CubeTrainName = {
    openApp,
    showNameScreen
  };
})();
