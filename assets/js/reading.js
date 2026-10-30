// Reading kind pages: filter the list by text and by topic. Without JavaScript the controls
// stay hidden and the full list is shown.
(() => {
  const root = document.getElementById("reading");
  const box = document.getElementById("reading-find");
  const input = document.getElementById("reading-q");
  const empty = document.getElementById("reading-empty");
  const topicBar = document.getElementById("reading-topics");
  if (!root || !box || !input) return;
  box.hidden = false;
  if (topicBar) topicBar.hidden = false;

  const rows = Array.from(root.querySelectorAll(".reading-row"));
  const groups = Array.from(root.querySelectorAll(".reading-group"));
  const links = topicBar ? Array.from(topicBar.querySelectorAll("a")) : [];
  let topic = "";

  const apply = () => {
    const q = input.value.trim().toLowerCase();
    let total = 0;
    rows.forEach((row) => {
      const hit = (q === "" || row.dataset.find.includes(q)) && (topic === "" || row.dataset.topic === topic);
      row.hidden = !hit;
      if (hit) total += 1;
    });
    groups.forEach((group) => {
      group.hidden = !group.querySelector(".reading-row:not([hidden])");
    });
    links.forEach((a) => a.setAttribute("aria-current", String(a.dataset.topic === topic)));
    empty.hidden = total > 0;
  };

  const fromHash = () => {
    const h = location.hash.replace("#", "");
    const match = links.find((a) => a.dataset.hash === h);
    topic = match ? match.dataset.topic : "";
    apply();
  };

  links.forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      topic = a.dataset.topic;
      history.replaceState(null, "", a.dataset.hash ? "#" + a.dataset.hash : location.pathname);
      apply();
    });
  });
  input.addEventListener("input", apply);
  window.addEventListener("hashchange", fromHash);
  fromHash();
})();
