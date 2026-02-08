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
  
      prev: document.getElementById("prev"),
      next: document.getElementById("next"),
      pageMeta: document.getElementById("pageMeta"),
    };
  
    // where your uploaded chat file lives in the repo
    const ARCHIVE_URL = "data/messages.txt";
  
    // cache key so it doesn’t re-download every time
    const CACHE_KEY = "ourJourney_archive_v2";
  
    let all = [];
    let filtered = [];
    let page = 1;
    const PAGE_SIZE = 60;
  
    // format:
    // 2024/02/10 22:15 | Sender Name: message text | reaction (optional)
    const lineRe =
      /^(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})\s+\|\s+([^:]+):\s*(.*?)\s*(?:\|\s*(.*))?$/;
  
    function setStatus(msg) {
      if (els.loadStatus) els.loadStatus.textContent = msg;
    }
  
    function parseLine(line) {
      const m = line.match(lineRe);
      if (!m) return null;
  
      const [_, y, mo, d, hh, mm, sender, message, reaction] = m;
      const iso = `${y}-${mo}-${d}T${hh}:${mm}:00`;
      const date = new Date(iso);
  
      return {
        date: date.toISOString(), // store as string for cache safety
        dayKey: `${y}-${mo}-${d}`,
        time: `${hh}:${mm}`,
        sender: sender.trim(),
        message: message.trim(),
        reaction: (reaction || "").trim(),
        raw: line,
      };
    }
  
    function parseText(text) {
      const lines = text.split(/\r?\n/);
      const out = [];
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;
        const item = parseLine(line);
        if (item) out.push(item);
      }
  
      // sort by time
      out.sort((a, b) => new Date(a.date) - new Date(b.date));
      return out;
    }
  
    function saveCache(items) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(items));
    }
  
    function loadCache() {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
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
        const dt = new Date(item.date);
  
        if (sender && item.sender !== sender) return false;
        if (start && dt < start) return false;
        if (end && dt > end) return false;
  
        if (q) {
          const hay = (item.message + " " + item.sender + " " + item.reaction).toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
  
      if (jump && els.jumpDate.value) {
        const jumpStart = new Date(els.jumpDate.value + "T00:00:00");
        const idx = filtered.findIndex(x => new Date(x.date) >= jumpStart);
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
        const dt = new Date(item.date);
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
      els.pageMeta.textContent = `page ${page} / ${totalPages}`;
      els.prev.disabled = page <= 1;
      els.next.disabled = page >= totalPages;
    }
  
    function loadItems(items, { cache = true } = {}) {
      all = items;
      filtered = items;
      fillSenderOptions(all);
      if (cache) saveCache(all);
      render();
    }
  
    async function loadFromSite({ bypassCache = false } = {}) {
      setStatus("loading archive from site…");
  
      const url = bypassCache ? `${ARCHIVE_URL}?v=${Date.now()}` : ARCHIVE_URL;
      const res = await fetch(url, { cache: "no-store" });
  
      if (!res.ok) {
        setStatus(`couldn't load ${ARCHIVE_URL} (http ${res.status}).`);
        return;
      }
  
      // show download progress-ish
      const text = await res.text();
      setStatus("parsing messages…");
  
      const items = parseText(text);
      if (items.length === 0) {
        setStatus("loaded the file, but couldn't parse any lines. check the format.");
        return;
      }
  
      loadItems(items, { cache: true });
      setStatus(`loaded ${items.length.toLocaleString()} messages`);
    }
  
    function init() {
      const cached = loadCache();
      if (cached && cached.length) {
        loadItems(cached, { cache: false });
        setStatus(`loaded ${cached.length.toLocaleString()} messages (saved on this device)`);
      } else {
        // auto-load on first visit
        loadFromSite().catch(() => setStatus("failed to load archive from site."));
      }
  
      els.reloadFromSite?.addEventListener("click", () => {
        loadFromSite({ bypassCache: true }).catch(() => setStatus("failed to load archive from site."));
      });
  
      els.clearCache?.addEventListener("click", () => {
        localStorage.removeItem(CACHE_KEY);
        setStatus("cleared saved cache. reloading from site…");
        loadFromSite({ bypassCache: true }).catch(() => setStatus("failed to load archive from site."));
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
  
      els.prev?.addEventListener("click", () => {
        page = Math.max(1, page - 1);
        render();
      });
  
      els.next?.addEventListener("click", () => {
        const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
        page = Math.min(totalPages, page + 1);
        render();
      });
    }
  
    document.addEventListener("DOMContentLoaded", init);
  })();
  