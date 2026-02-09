(() => {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");

  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const isOpen = document.body.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
})();
