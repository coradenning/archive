document.addEventListener("DOMContentLoaded", () => {
  const timeEl = document.querySelector("time[datetime]");
  const headingDateEl = document.getElementById("daily-note-date");
  const noteTextEl = document.getElementById("daily-note-text");
  const noteList = document.getElementById("note-list");

  if (!timeEl) return;

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  timeEl.dateTime = `${yyyy}-${mm}-${dd}`;
  timeEl.textContent = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (headingDateEl) {
    headingDateEl.textContent = `${dd}/${mm}:`;
  }

  if (!noteTextEl || !noteList) return;

  const notes = Array.from(noteList.querySelectorAll("li"))
    .map(li => li.textContent.trim())
    .filter(Boolean);

  if (!notes.length) return;

  const startDateStr = noteList.dataset.start || "";
  const startDate = startDateStr ? new Date(`${startDateStr}T00:00:00`) : now;
  const today = new Date(yyyy, now.getMonth(), now.getDate());
  const start = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate()
  );

  const msPerDay = 24 * 60 * 60 * 1000;
  const dayIndex = Math.floor((today - start) / msPerDay);
  const safeIndex = Math.min(Math.max(dayIndex, 0), notes.length - 1);

  noteTextEl.textContent = notes[safeIndex];
});
