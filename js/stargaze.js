document.addEventListener("DOMContentLoaded", () => {
    const nowFrame = document.getElementById("sky-now");
    const pastFrame = document.getElementById("sky-past");
    const caption = document.getElementById("sky-caption");
  
    function show(which) {
      const isNow = which === "now";
  
      nowFrame.hidden = !isNow;
      pastFrame.hidden = isNow;
  
      if (caption) caption.textContent = "showing: " + (isNow ? "right now" : "the night we met");
    }
  
    document.querySelectorAll("button[data-sky]").forEach(btn => {
      btn.addEventListener("click", () => show(btn.dataset.sky));
    });
  });
  