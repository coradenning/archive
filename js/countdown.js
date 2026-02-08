(() => {
  const countdownEl = document.getElementById("countdown-text");

  if (!countdownEl) return;

  const target = new Date("2026-07-06T08:25:00+05:00");

  if (Number.isNaN(target.getTime())) {
    countdownEl.textContent = "(invalid meet time)";
    return;
  }

  function addMonths(date, months) {
    const d = new Date(date);
    const day = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + months);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, lastDay));
    return d;
  }

  function diffParts(from, to) {
    if (to <= from) return null;

    let months = 0;
    let cursor = new Date(from);

    while (true) {
      const next = addMonths(cursor, 1);
      if (next <= to) {
        months += 1;
        cursor = next;
      } else {
        break;
      }
    }

    let remainingMs = to - cursor;
    const totalSeconds = Math.floor(remainingMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return { months, days, hours, minutes, seconds };
  }

  function render() {
    const now = new Date();
    const parts = diffParts(now, target);

    if (!parts) {
      countdownEl.textContent = "we made it";
      return;
    }

    const { months, days, hours, minutes, seconds } = parts;
    countdownEl.textContent =
      `${months}mo ${days}d ${hours}h ${minutes}m ${seconds}s`;
  }

  render();
  setInterval(render, 1000);
})();
