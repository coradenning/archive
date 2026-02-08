document.addEventListener("DOMContentLoaded", () => {
    const nowFrame = document.getElementById("sky-now");
    const pastFrame = document.getElementById("sky-past");
    function show(which) {
      const isNow = which === "now";

      nowFrame.hidden = !isNow;
      pastFrame.hidden = isNow;
    }
  
    document.querySelectorAll("button[data-sky]").forEach(btn => {
      btn.addEventListener("click", () => show(btn.dataset.sky));
    });
  });
  
