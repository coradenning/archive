(() => {
    const form = document.querySelector(".wish-form");
    const status = document.getElementById("wishStatus");
  
    if (!form) return;
  
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (status) status.textContent = "sending…";
  
      try {
        const data = new FormData(form);
        const res = await fetch(form.action, {
          method: "POST",
          body: data,
          headers: { "Accept": "application/json" }
        });
  
        if (res.ok) {
          form.reset();
          if (status) status.textContent = "wish received. i’m holding it close.";
        } else {
          if (status) status.textContent = "hmm, something failed. try again?";
        }
      } catch {
        if (status) status.textContent = "network issue. try again in a sec.";
      }
    });
  })();
  