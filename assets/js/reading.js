// Reading kind pages: filter the list as you type. Without JavaScript the box stays hidden
// and the full list is shown.
(() => {
  const root = document.getElementById("reading");
  const box = document.getElementById("reading-find");
  const input = document.getElementById("reading-q");
  const empty = document.getElementById("reading-empty");
  if (!root || !box || !input) return;
  box.hidden = false;

  const rows = Array.from(root.querySelectorAll(".reading-row"));
  const groups = Array.from(root.querySelectorAll(".reading-group"));

  const apply = () => {
    const q = input.value.trim().toLowerCase();
    let total = 0;
    rows.forEach((row) => {
      const hit = q === "" || row.dataset.find.includes(q);
      row.hidden = !hit;
      if (hit) total += 1;
    });
    groups.forEach((group) => {
      group.hidden = !group.querySelector(".reading-row:not([hidden])");
    });
    empty.hidden = q === "" || total > 0;
  };
  input.addEventListener("input", apply);
})();
