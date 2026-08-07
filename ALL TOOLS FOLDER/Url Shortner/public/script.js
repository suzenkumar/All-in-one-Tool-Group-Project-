(() => {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const form = $("#shrink-form");
  const input = $("#url-input");
  const clearBtn = $("#clear-btn");
  const shrinkBtn = $("#shrink-btn");
  const inputWrap = $("#input-wrap");
  const hint = $("#url-hint");
  const resultEl = $("#result");
  const shortLink = $("#short-link");
  const originalUrl = $("#original-url");
  const copyBtn = $("#copy-btn");
  const copyLabel = $("#copy-label");
  const openBtn = $("#open-btn");
  const qrBtn = $("#qr-btn");
  const qrEl = $("#qr");
  const providerBadge = $("#provider-badge");
  const historyList = $("#history-list");
  const historySection = $("#history-section");
  const statsEl = $("#stats");
  const toast = $("#toast");

  const HISTORY_KEY = "linkshrink_history";

  // ---------- Particle background ----------
  const canvas = $("#bg");
  const ctx = canvas.getContext("2d");
  let particles = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function initParticles() {
    const count = Math.min(70, Math.floor(window.innerWidth / 18));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2.2 + 0.6,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      c: Math.random() > 0.5 ? "124,58,237" : "0,212,255",
      a: Math.random() * 0.5 + 0.2,
    }));
  }

  function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.c},${p.a})`;
      ctx.fill();
    }
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d = Math.hypot(dx, dy);
        if (d < 110) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(124,58,237,${(1 - d / 110) * 0.18})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(drawParticles);
  }

  resize();
  initParticles();
  drawParticles();
  window.addEventListener("resize", () => {
    resize();
    initParticles();
  });

  // ---------- Toast ----------
  let toastTimer;
  function showToast(message, type = "") {
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  // ---------- History & stats ----------
  function getHistory() {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveHistory(items) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
  }

  function renderHistory() {
    const items = getHistory();
    historySection.hidden = items.length === 0;
    historyList.innerHTML = "";
    const now = Date.now();
    const day = 86400000;
    const today = getHistory().filter((i) => now - i.time < day).length;

    if (items.length) {
      statsEl.hidden = false;
      $("#stat-total").textContent = items.length;
      $("#stat-today").textContent = today;
    }

    const frag = document.createDocumentFragment();
    items.slice(0, 8).forEach((item) => {
      const li = document.createElement("li");
      li.className = "history-item";

      const a = document.createElement("a");
      a.className = "h-short";
      a.href = item.shortUrl;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = item.shortUrl;

      const orig = document.createElement("span");
      orig.className = "h-orig";
      orig.textContent = item.longUrl;
      orig.title = item.longUrl;

      const time = document.createElement("span");
      time.className = "h-time";
      const mins = Math.floor((now - item.time) / 60000);
      time.textContent =
        mins < 1 ? "just now" : mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`;

      const copy = document.createElement("button");
      copy.className = "mini-btn";
      copy.title = "Copy";
      copy.textContent = "📋";
      copy.addEventListener("click", () => copyToClipboard(item.shortUrl));

      const del = document.createElement("button");
      del.className = "mini-btn";
      del.title = "Remove";
      del.textContent = "🗑";
      del.addEventListener("click", () => {
        saveHistory(getHistory().filter((h) => h.id !== item.id));
        renderHistory();
        showToast("Removed from history", "success");
      });

      li.append(a, orig, time, copy, del);
      frag.appendChild(li);
    });
    historyList.appendChild(frag);
  }

  function addToHistory(shortUrl, longUrl) {
    const items = getHistory();
    items.unshift({ id: crypto.randomUUID(), shortUrl, longUrl, time: Date.now() });
    saveHistory(items.slice(0, 20));
    renderHistory();
  }

  $("#clear-history").addEventListener("click", () => {
    saveHistory([]);
    renderHistory();
    statsEl.hidden = true;
    showToast("History cleared", "success");
  });

  // ---------- Copy ----------
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        return true;
      } finally {
        ta.remove();
      }
    }
  }

  // ---------- Input interactions ----------
  input.addEventListener("input", () => {
    clearBtn.classList.toggle("visible", input.value.length > 0);
    inputWrap.classList.remove("error");
    hint.style.color = "";
  });

  clearBtn.addEventListener("click", () => {
    input.value = "";
    clearBtn.classList.remove("visible");
    input.focus();
    resultEl.hidden = true;
  });

  // ---------- Shrink ----------
  function setLoading(loading) {
    shrinkBtn.disabled = loading;
    shrinkBtn.classList.toggle("loading", loading);
  }

  function showError(message) {
    inputWrap.classList.add("error");
    hint.textContent = message;
    hint.style.color = "#f87171";
    showToast(message, "error");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const url = input.value.trim();
    if (!url) {
      showError("Please enter a URL first.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Something went wrong. Try again.");
      }
      showResult(data);
    } catch (err) {
      showError(err.message || "Network error. Is the server running?");
    } finally {
      setLoading(false);
    }
  });

  function showResult(data) {
    resultEl.hidden = false;
    shortLink.textContent = data.shortUrl;
    shortLink.title = data.shortUrl;
    originalUrl.textContent = data.longUrl;
    originalUrl.title = data.longUrl;
    providerBadge.textContent = `via ${data.provider}`;
    openBtn.href = data.shortUrl;
    qrEl.hidden = true;
    copyBtn.classList.remove("copied");
    copyLabel.textContent = "Copy";
    addToHistory(data.shortUrl, data.longUrl);
    showToast("Link shrunk successfully!", "success");
  }

  copyBtn.addEventListener("click", async () => {
    const url = shortLink.textContent;
    if (!url) return;
    const ok = await copyToClipboard(url);
    if (ok) {
      copyBtn.classList.add("copied");
      copyLabel.textContent = "Copied!";
      showToast("Copied to clipboard", "success");
      setTimeout(() => {
        copyBtn.classList.remove("copied");
        copyLabel.textContent = "Copy";
      }, 1600);
    }
  });

  qrBtn.addEventListener("click", () => {
    const url = shortLink.textContent;
    if (!url) return;
    if (!qrEl.hidden) {
      qrEl.hidden = true;
      return;
    }
    const img = document.createElement("img");
    img.alt = "QR code";
    img.width = 150;
    img.height = 150;
    img.src =
      "https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=6&data=" +
      encodeURIComponent(url);
    qrEl.innerHTML = "";
    qrEl.appendChild(img);
    qrEl.hidden = false;
  });

  // ---------- Provider ----------
  async function loadProvider() {
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      $("#footer-provider").textContent = data.provider;
      if (data.provider) {
        $("#stat-provider").textContent = data.provider.split(".")[0];
      }
    } catch {
      $("#footer-provider").textContent = "offline";
    }
  }

  renderHistory();
  loadProvider();
})();
