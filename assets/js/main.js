(() => {
  const root = document.documentElement;
  const themeSwitch = document.getElementById("mood");
  const currentTheme = () => (root.getAttribute("data-theme") === "dark" ? "dark" : "light");

  // Keep giscus comments in sync with the site theme
  const setGiscusTheme = () => {
    const frame = document.querySelector("iframe.giscus-frame");
    if (!frame) return;
    frame.contentWindow.postMessage(
      { giscus: { setConfig: { theme: currentTheme() } } },
      "https://giscus.app"
    );
  };

  // The initial theme is set by an inline script in <head>; this handles changes.
  const applyTheme = (theme) => {
    root.setAttribute("data-theme", theme);
    if (themeSwitch) themeSwitch.setAttribute("aria-pressed", String(theme === "dark"));
    setGiscusTheme();
  };

  const storedTheme = () => {
    try {
      return localStorage.getItem("theme");
    } catch (e) {
      return null;
    }
  };

  if (themeSwitch) {
    themeSwitch.setAttribute("aria-pressed", String(currentTheme() === "dark"));
    themeSwitch.addEventListener("click", () => {
      const next = currentTheme() === "dark" ? "light" : "dark";
      applyTheme(next);
      try {
        localStorage.setItem("theme", next);
      } catch (e) {}
    });
  }

  // Until the visitor picks a theme, follow the system setting live
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    if (!storedTheme()) applyTheme(e.matches ? "dark" : "light");
  });

  // giscus loads with the light theme; apply the current one on its first message
  let giscusThemed = false;
  window.addEventListener("message", (e) => {
    if (giscusThemed || e.origin !== "https://giscus.app" || !e.data || !e.data.giscus) return;
    giscusThemed = true;
    setGiscusTheme();
  });

  // "On this page" is open in the margin on wide screens, collapsed otherwise
  const toc = document.querySelector(".toc details");
  if (toc && window.matchMedia("(min-width: 80em)").matches) toc.open = true;

  // Copy button on code blocks
  if (navigator.clipboard) {
    document.querySelectorAll("div.highlighter-rouge").forEach((block) => {
      const code = block.querySelector("pre");
      if (!code) return;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "copy-btn";
      button.textContent = "Copy";
      button.setAttribute("aria-label", "Copy code to clipboard");
      button.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(code.innerText);
          button.textContent = "Copied";
        } catch (e) {
          button.textContent = "Failed";
        }
        setTimeout(() => (button.textContent = "Copy"), 1500);
      });
      block.appendChild(button);
    });
  }

  // Search shortcuts: "/" or Ctrl/Cmd+K
  document.addEventListener("keydown", (e) => {
    const target = e.target;
    const typing =
      target instanceof HTMLElement &&
      (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
    const slash = e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey && !typing;
    const combo = e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey);
    if (!slash && !combo) return;

    e.preventDefault();
    const input = document.querySelector(".pagefind-ui__search-input");
    if (input) {
      input.focus();
    } else {
      window.location.assign("/search/");
    }
  });
})();
