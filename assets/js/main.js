(() => {
  // Theme switch
  const root = document.body;
  const themeSwitch = document.getElementById("mood");
  const themeData = root.getAttribute("data-theme");

  if (themeSwitch) {
    initTheme(localStorage.getItem("theme"));
    themeSwitch.addEventListener("click", () =>
      toggleTheme(localStorage.getItem("theme"))
    );

    function toggleTheme(state) {
      if (state === "dark") {
        localStorage.setItem("theme", "light");
        root.removeAttribute("data-theme");
      } else if (state === "light") {
        localStorage.setItem("theme", "dark");
        document.body.setAttribute("data-theme", "dark");
      } else {
        initTheme(state);
      }
    }

    function initTheme(state) {
      if (state === "dark") {
        document.body.setAttribute("data-theme", "dark");
      } else if (state === "light") {
        root.removeAttribute("data-theme");
      } else {
        localStorage.setItem("theme", themeData);
      }
    }
  }

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

  // Keep giscus comments in sync with the site theme
  const giscusTheme = () =>
    document.body.getAttribute("data-theme") === "dark" ? "dark" : "light";

  const setGiscusTheme = () => {
    const frame = document.querySelector("iframe.giscus-frame");
    if (!frame) return;
    frame.contentWindow.postMessage(
      { giscus: { setConfig: { theme: giscusTheme() } } },
      "https://giscus.app"
    );
  };

  if (themeSwitch) themeSwitch.addEventListener("click", setGiscusTheme);
  // giscus loads with the light theme; apply the saved one on its first message
  let giscusThemed = false;
  window.addEventListener("message", (e) => {
    if (giscusThemed || e.origin !== "https://giscus.app" || !e.data || !e.data.giscus) return;
    giscusThemed = true;
    setGiscusTheme();
  });
})();
