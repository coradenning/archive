(() => {
    const form = document.querySelector(".wish-form");
    const status = document.getElementById("wishStatus");
    const error = document.getElementById("wishError");
    const textarea = document.getElementById("wishText");
  
    if (!form) return;
  
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (error) error.textContent = "";

      if (textarea && textarea.value.trim() === "") {
        if (error) error.textContent = "please write a wish before sending.";
        textarea?.focus();
        return;
      }

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
          if (error) error.textContent = "";
          if (status) status.textContent = "wish received. i’m holding it close.";
        } else {
          if (status) status.textContent = "hmm, something failed. try again?";
        }
      } catch {
        if (status) status.textContent = "network issue. try again in a sec.";
      }
    });

    if (textarea && error) {
      textarea.addEventListener("input", () => {
        if (textarea.value.trim() !== "") {
          error.textContent = "";
        }
      });
    }
  })();
  
