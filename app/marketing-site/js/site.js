(function () {
  var hero = document.querySelector("[data-hero]");
  var bar = document.querySelector("[data-sticky-start]");
  if (hero && bar && "IntersectionObserver" in window) {
    var watch = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        bar.hidden = entry.isIntersecting;
      });
    });
    watch.observe(hero);
  }

  document.querySelectorAll("[data-room-toggle]").forEach(function (group) {
    var root = group.closest(".screen");
    if (!root) return;
    var buttons = group.querySelectorAll("[data-room]");
    var panels = root.querySelectorAll("[data-room-panel]");
    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        var room = button.getAttribute("data-room");
        buttons.forEach(function (item) {
          item.setAttribute("aria-pressed", item === button ? "true" : "false");
        });
        panels.forEach(function (panel) {
          panel.hidden = panel.getAttribute("data-room-panel") !== room;
        });
      });
    });
  });
})();
