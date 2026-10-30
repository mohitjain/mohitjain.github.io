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
})();
