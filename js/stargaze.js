document.addEventListener("DOMContentLoaded", () => {
    const nowFrame = document.getElementById("sky-now");
    const pastFrame = document.getElementById("sky-past");
    const buttons = document.querySelectorAll("button[data-sky]");
    function show(which) {
      const isNow = which === "now";

      nowFrame.hidden = !isNow;
      pastFrame.hidden = isNow;
      buttons.forEach((btn) => {
        const active = btn.dataset.sky === which;
        btn.classList.toggle("active", active);
        btn.setAttribute("aria-pressed", String(active));
      });
    }

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => show(btn.dataset.sky));
    });

    show("now");
  });
  
