// Reading page: filter the list as you type. Without JavaScript the box stays hidden
// and the full list is shown.
(() => {
  const root = document.getElementById("reading");
  const box = document.getElementById("reading-find");
  const input = document.getElementById("reading-q");
  const empty = document.getElementById("reading-empty");
  if (!root || !box || !input) return;
  box.hidden = false;

  const rows = Array.from(root.querySelectorAll(".reading-kind .reading-row"));
  const kinds = Array.from(root.querySelectorAll(".reading-kind"));

  const apply = () => {
    const q = input.value.trim().toLowerCase();
    root.classList.toggle("is-filtering", q !== "");
    let total = 0;
    rows.forEach((row) => {
      const hit = q === "" || row.dataset.find.includes(q);
      row.hidden = !hit;
      if (hit) total += 1;
    });
    kinds.forEach((kind) => {
      const visible = kind.querySelector(".reading-row:not([hidden])");
      kind.hidden = !visible;
      const more = kind.querySelector(".reading-more");
      if (more && q !== "") more.open = true;
    });
    empty.hidden = q === "" || total > 0;
  };
  input.addEventListener("input", apply);
})();
