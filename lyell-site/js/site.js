(() => {
  const root = document.documentElement;
  const stored = localStorage.getItem("lyell-theme");
  if (stored === "light" || stored === "dark") {
    root.dataset.theme = stored;
  } else {
    root.dataset.theme = window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  }

  const toggle = document.querySelector("[data-theme-toggle]");
  if (toggle) {
    const sync = () => {
      const next = root.dataset.theme === "light" ? "dark" : "light";
      const label = next === "light" ? "Switch to light theme" : "Switch to dark theme";
      toggle.setAttribute("aria-label", label);
    };
    sync();
    toggle.addEventListener("click", () => {
      root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
      localStorage.setItem("lyell-theme", root.dataset.theme);
      sync();
    });
  }

  const year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());
})();
