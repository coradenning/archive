(() => {
    const els = {
      loadStatus: document.getElementById("loadStatus"),
      reloadFromSite: document.getElementById("reloadFromSite"),
      clearCache: document.getElementById("clearCache"),
  
      q: document.getElementById("q"),
      sender: document.getElementById("sender"),
      startDate: document.getElementById("startDate"),
      endDate: document.getElementById("endDate"),
      jumpDate: document.getElementById("jumpDate"),
  
      apply: document.getElementById("apply"),
      reset: document.getElementById("reset"),
  
      resultMeta: document.getElementById("resultMeta"),
      results: document.getElementById("results"),

      statusPanel: document.getElementById("statusPanel"),
      toggleStatus: document.getElementById("toggleStatus"),

      prevButtons: Array.from(document.querySelectorAll('button[data-page="prev"]')),
      nextButtons: Array.from(document.querySelectorAll('button[data-page="next"]')),
      pageMetas: Array.from(document.querySelectorAll(".page-meta")),
    };
  
    // robust path for github pages (root or /repo-name/)
    const ARCHIVE_URL = new URL("./data/messages.txt", window.location.href).toString();
  
    let all = [];
    let filtered = [];
    let page = 1;
    const PAGE_SIZE = 50;
  
    // strict “new message starts here” detector
    const startRe = /^\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}\s+\|\s+[^:]+:\s*/;
  
    // full record parser (reaction optional)
    // 2024/02/10 22:15 | Sender: message text | reaction
    const lineRe =
      /^(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})\s+\|\s+([^:]+):\s*([\s\S]*?)(?:\s+\|\s*(.*))?$/;
  
    function setStatus(msg) {
      if (els.loadStatus) els.loadStatus.textContent = msg;
    }
  
    function escapeHtml(s) {
      return s.replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c]));
    }
  
    function highlight(text, query) {
      if (!query) return escapeHtml(text);
      const safe = escapeHtml(text);
      const q = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(q, "ig");
      return safe.replace(re, m => `<mark>${m}</mark>`);
    }
  
    // ---- key change: stitch multiline messages into single records ----
    function coalesceRecords(text) {
      const lines = text.split(/\r?\n/);
      const records = [];
      let buf = "";
  
      for (const raw of lines) {
        // preserve empty lines INSIDE a message, but ignore leading empties
        const line = raw.replace(/\r/g, "");
  
        if (startRe.test(line.trim())) {
          if (buf.trim()) records.push(buf);
          buf = line.trim();
        } else {
          // continuation of previous message: keep the newline
          if (!buf) {
            // stray lines before the first timestamp, ignore
            continue;
          }
          buf += "\n" + line;
        }
      }
  
      if (buf.trim()) records.push(buf);
      return records;
    }
  
    function parseRecord(recordText) {
      const m = recordText.match(lineRe);
      if (!m) return null;
  
      const [_, y, mo, d, hh, mm, sender, messageRaw, reactionRaw] = m;
  
      // messageRaw may include internal newlines; keep them
      const message = (messageRaw || "").trimEnd();
      const reaction = (reactionRaw || "").trim();
  
      // interpret as local time; if you need exact timezone handling, we can add it
      const iso = `${y}-${mo}-${d}T${hh}:${mm}:00`;
      const date = new Date(iso);
  
      return {
        date,
        dayKey: `${y}-${mo}-${d}`,
        time: `${hh}:${mm}`,
        sender: sender.trim(),
        message,
        reaction,
        raw: recordText,
      };
    }
  
    function parseText(text) {
      const records = coalesceRecords(text);
      const out = [];
  
      for (const rec of records) {
        const item = parseRecord(rec);
        if (item) out.push(item);
      }
  
      out.sort((a, b) => a.date - b.date);
      return out;
    }
  
    function fillSenderOptions(items) {
      const names = Array.from(new Set(items.map(x => x.sender)))
        .sort((a, b) => a.localeCompare(b));
  
      els.sender.innerHTML =
        `<option value="">any</option>` +
        names.map(n => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join("");
    }
  
    function applyFilters({ jump = false } = {}) {
      const q = els.q.value.trim().toLowerCase();
      const sender = els.sender.value.trim();
  
      const start = els.startDate.value ? new Date(els.startDate.value + "T00:00:00") : null;
      const end = els.endDate.value ? new Date(els.endDate.value + "T23:59:59") : null;
  
      filtered = all.filter(item => {
        if (sender && item.sender !== sender) return false;
        if (start && item.date < start) return false;
        if (end && item.date > end) return false;
  
        if (q) {
          const hay = (item.message + " " + item.sender + " " + item.reaction).toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
  
      if (jump && els.jumpDate.value) {
        const jumpStart = new Date(els.jumpDate.value + "T00:00:00");
        const idx = filtered.findIndex(x => x.date >= jumpStart);
        page = idx === -1 ? 1 : Math.floor(idx / PAGE_SIZE) + 1;
      } else {
        page = 1;
      }
  
      render();
    }
  
    function render() {
      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      page = Math.min(page, totalPages);
  
      const startIdx = (page - 1) * PAGE_SIZE;
      const slice = filtered.slice(startIdx, startIdx + PAGE_SIZE);
      const q = els.q.value.trim();
  
      els.results.innerHTML = slice.map(item => {
        const dateStr = `${escapeHtml(item.dayKey)} ${escapeHtml(item.time)}`;
        const senderBadge = `<span class="badge">${escapeHtml(item.sender)}</span>`;
        const msg = highlight(item.message, q);
        const reaction = item.reaction
          ? `<div class="reaction">reaction: ${escapeHtml(item.reaction)}</div>`
          : "";
  
        return `
          <li class="msg">
            <div class="msg-top">
              <span class="muted">${dateStr}</span>
              ${senderBadge}
            </div>
            <div class="text">${msg}</div>
            ${reaction}
          </li>
        `;
      }).join("");
  
      els.resultMeta.textContent = `${total.toLocaleString()} messages matched`;
      els.pageMetas.forEach(el => {
        el.textContent = `page ${page} / ${totalPages}`;
      });
      els.prevButtons.forEach(btn => {
        btn.disabled = page <= 1;
      });
      els.nextButtons.forEach(btn => {
        btn.disabled = page >= totalPages;
      });
    }
  
    function loadItems(items) {
      all = items;
      filtered = items;
      fillSenderOptions(all);
      render();
    }
  
    async function loadFromSite({ bypassCache = false } = {}) {
      setStatus("downloading archive…");
  
      const url = bypassCache ? `${ARCHIVE_URL}?v=${Date.now()}` : ARCHIVE_URL;
      const res = await fetch(url, { cache: "no-store" });
  
      if (!res.ok) {
        setStatus(`couldn't load archive (http ${res.status}).`);
        return;
      }
  
      const text = await res.text();
      setStatus("parsing messages…");
  
      const items = parseText(text);
  
      if (items.length === 0) {
        setStatus("loaded the file, but couldn't parse any messages. format mismatch.");
        return;
      }
  
      loadItems(items);
      setStatus(`loaded ${items.length.toLocaleString()} messages`);
    }
  
    function init() {
      loadFromSite().catch(err => {
        console.error(err);
        setStatus("failed to load archive from site.");
      });
  
      els.reloadFromSite?.addEventListener("click", () => {
        loadFromSite({ bypassCache: true }).catch(err => {
          console.error(err);
          setStatus("failed to load archive from site.");
        });
      });
  
      els.clearCache?.addEventListener("click", () => {
        setStatus("reloading fresh…");
        loadFromSite({ bypassCache: true }).catch(err => {
          console.error(err);
          setStatus("failed to load archive from site.");
        });
      });
  
      els.apply?.addEventListener("click", () => applyFilters());
      els.reset?.addEventListener("click", () => {
        els.q.value = "";
        els.sender.value = "";
        els.startDate.value = "";
        els.endDate.value = "";
        els.jumpDate.value = "";
        filtered = all;
        page = 1;
        render();
      });
  
      els.jumpDate?.addEventListener("change", () => applyFilters({ jump: true }));

      if (els.toggleStatus && els.statusPanel) {
        els.toggleStatus.addEventListener("click", () => {
          const isHidden = els.statusPanel.classList.toggle("is-hidden");
          els.toggleStatus.textContent = isHidden ? "show status" : "hide status";
          els.toggleStatus.setAttribute("aria-expanded", String(!isHidden));
        });
      }

      els.prevButtons.forEach(btn => {
        btn.addEventListener("click", () => {
          page = Math.max(1, page - 1);
          render();
        });
      });

      els.nextButtons.forEach(btn => {
        btn.addEventListener("click", () => {
          const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
          page = Math.min(totalPages, page + 1);
          render();
        });
      });
    }
  
    document.addEventListener("DOMContentLoaded", init);
  })();
  
