(() => {
  "use strict";

  const $ = (sel) => document.querySelector(sel);

  const input = $("#text-input");
  const progressBar = $("#progress-bar");
  const goalLabel = $("#goal-label");
  const goalNum = $("#goal-num");
  const toast = $("#toast");
  const densityChart = $("#density-chart");
  const densityEmpty = $("#density-empty");
  const densityHint = $("#density-hint");

  const statEls = {
    words: $("#stat-words"),
    chars: $("#stat-chars"),
    charsNoSpace: $("#stat-chars-no-space"),
    sentences: $("#stat-sentences"),
    paragraphs: $("#stat-paragraphs"),
    reading: $("#stat-reading"),
    speaking: $("#stat-speaking"),
    unique: $("#stat-unique"),
  };

  const subEls = {
    words: $("#sub-words"),
    chars: $("#sub-chars"),
    charsNoSpace: $("#sub-chars-no-space"),
    sentences: $("#sub-sentences"),
    paragraphs: $("#sub-paragraphs"),
    unique: $("#sub-unique"),
  };

  const STOPWORDS = new Set(
    "the,be,to,of,and,a,in,that,have,i,it,for,not,on,with,he,as,you,do,at,this,but,his,by,from,they,we,say,her,she,or,an,will,my,one,all,would,there,their,what,so,up,out,if,about,who,get,which,go,me,when,make,can,like,time,no,just,him,know,take,people,into,year,your,good,some,could,them,see,other,than,then,now,look,only,come,its,over,think,also,back,after,use,two,how,our,work,first,well,way,even,new,want,because,any,these,give,day,most,us,is,are,was,were,been,being,has,had,hadn,does,did,doing,should,could,would,may,might,must,shall,ought,am,is,are".split(",")
  );

  const GOALS = [100, 250, 500, 1000, 2000];
  let goalIndex = 2;

  // ---------- Toast ----------
  let toastTimer;
  function showToast(message, type = "") {
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  // ---------- Text analysis ----------
  function analyze(text) {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/) : [];
    const wordCount = words.length;

    const chars = text.length;
    const charsNoSpace = text.replace(/\s/g, "").length;

    const sentences = text ? text.split(/[.!?]+/).filter((s) => s.trim()).length : 0;
    const paragraphs = text ? text.split(/\n\s*\n/).filter((p) => p.trim()).length : 0;

    const unique = new Set(words.map((w) => w.toLowerCase())).size;

    const readSecs = Math.round((wordCount / 200) * 60);
    const speakSecs = Math.round((wordCount / 130) * 60);

    return { wordCount, chars, charsNoSpace, sentences, paragraphs, unique, readSecs, speakSecs };
  }

  function formatTime(totalSecs) {
    if (totalSecs === 0) return "0m";
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    if (m === 0) return `${s}s`;
    if (s === 0) return `${m}m`;
    return `${m}m ${s}s`;
  }

  // ---------- Animated counters ----------
  function animateNumber(el, value) {
    const start = Number(el.dataset.value || 0);
    if (start === value) return;
    el.dataset.value = value;
    const diff = value - start;
    const dur = 520;
    const t0 = performance.now();
    function frame(t) {
      const p = Math.min((t - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(start + diff * e).toLocaleString();
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = value.toLocaleString();
    }
    requestAnimationFrame(frame);
  }

  function formatWithUnits(n) {
    if (n >= 1000) {
      const k = n / 1000;
      return `${k.toFixed(k >= 10 ? 1 : 2)}k`;
    }
    return String(n);
  }

  // ---------- Word density ----------
  function buildDensity(words) {
    const freq = new Map();
    for (const raw of words) {
      const w = raw
        .toLowerCase()
        .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "")
        .replace(/'s$/u, "");
      if (w.length < 3 || STOPWORDS.has(w)) continue;
      freq.set(w, (freq.get(w) || 0) + 1);
    }
    return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }

  function renderDensity(words) {
    densityChart.innerHTML = "";
    const top = buildDensity(words);
    densityEmpty.hidden = top.length > 0;

    if (!top.length) {
      densityHint.textContent = "top keywords in your text";
      densityChart.appendChild(densityEmpty);
      return;
    }

    const max = top[0][1];
    const total = top.reduce((sum, [, n]) => sum + n, 0);
    densityHint.textContent = `${words.length} words analysed`;

    const frag = document.createDocumentFragment();
    top.forEach(([word, count]) => {
      const pct = Math.round((count / max) * 100);

      const row = document.createElement("div");
      row.className = "density-row";

      const w = document.createElement("span");
      w.className = "density-word";
      w.textContent = word;
      w.title = word;

      const track = document.createElement("div");
      track.className = "density-track";
      const bar = document.createElement("div");
      bar.className = "density-bar";
      bar.style.animationDelay = `${Math.random() * 0.3}s`;
      track.appendChild(bar);

      const c = document.createElement("span");
      c.className = "density-count";
      c.textContent = `${count}x · ${Math.round((count / total) * 100)}%`;

      row.append(w, track, c);
      frag.appendChild(row);

      requestAnimationFrame(() => {
        bar.style.width = `${Math.max(pct, 4)}%`;
      });
    });

    densityChart.appendChild(frag);
  }

  // ---------- Progress goal ----------
  function renderGoal(words) {
    const goal = GOALS[goalIndex];
    const pct = Math.min((words / goal) * 100, 100);
    progressBar.style.width = `${pct}%`;
    goalLabel.textContent = `Goal: ${goal} words`;
    goalNum.textContent = `${words} / ${goal}`;
    if (words >= goal && words > 0) {
      progressBar.style.background = "linear-gradient(90deg, var(--success), var(--cyan))";
    } else {
      progressBar.style.background = "linear-gradient(90deg, var(--blue-3), var(--cyan))";
    }
  }

  $("#progress-track").addEventListener("click", () => {
    goalIndex = (goalIndex + 1) % GOALS.length;
    renderGoal(countWords());
    showToast(`Goal set to ${GOALS[goalIndex]} words`, "success");
  });

  function countWords() {
    return input.value.trim() ? input.value.trim().split(/\s+/).length : 0;
  }

  // ---------- Live update ----------
  let rafId = null;
  function update() {
    const a = analyze(input.value);

    animateNumber(statEls.words, a.wordCount);
    animateNumber(statEls.chars, a.chars);
    animateNumber(statEls.charsNoSpace, a.charsNoSpace);
    animateNumber(statEls.sentences, a.sentences);
    animateNumber(statEls.paragraphs, a.paragraphs);
    animateNumber(statEls.unique, a.unique);
    statEls.reading.textContent = formatTime(a.readSecs);
    statEls.speaking.textContent = formatTime(a.speakSecs);

    subEls.words.textContent = a.wordCount ? formatWithUnits(a.wordCount) : "—";
    subEls.chars.textContent = a.chars ? formatWithUnits(a.chars) : "—";
    subEls.charsNoSpace.textContent = a.charsNoSpace ? formatWithUnits(a.charsNoSpace) : "—";
    subEls.sentences.textContent = a.sentences ? `${Math.round((a.sentences / Math.max(a.wordCount, 1)) * 100)}% of words` : "—";
    subEls.paragraphs.textContent = a.paragraphs ? `avg ${(a.wordCount / a.paragraphs).toFixed(1)} w/p` : "—";
    subEls.unique.textContent = a.unique ? `${((a.unique / Math.max(a.wordCount, 1)) * 100).toFixed(0)}% vocab` : "—";

    renderGoal(a.wordCount);
    renderDensity(input.value.trim() ? input.value.trim().split(/\s+/) : []);
  }

  input.addEventListener("input", () => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(update);
  });

  input.addEventListener("focus", () => {
    $("#editor-card").classList.add("focused");
  });

  input.addEventListener("blur", () => {
    $("#editor-card").classList.remove("focused");
  });

  // ---------- Editor buttons ----------
  async function copyText() {
    const text = input.value;
    if (!text) {
      showToast("Nothing to copy yet", "error");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } finally {
        ta.remove();
      }
    }
    showToast("Text copied to clipboard", "success");
  }

  $("#copy-btn").addEventListener("click", copyText);

  $("#download-btn").addEventListener("click", () => {
    const text = input.value;
    if (!text) {
      showToast("Nothing to download yet", "error");
      return;
    }
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wordverse-text.txt";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Text downloaded", "success");
  });

  $("#clear-btn").addEventListener("click", () => {
    if (!input.value) return;
    input.value = "";
    update();
    input.focus();
    showToast("Editor cleared", "success");
  });

  document.addEventListener("keydown", (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key === "Enter") {
      e.preventDefault();
      $("#clear-btn").click();
    }
  });

  // ---------- 3D tilt ----------
  function addTilt(el, maxDeg) {
    const track = (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateX(${(-py * maxDeg).toFixed(2)}deg) rotateY(${(px * maxDeg).toFixed(2)}deg) translateZ(0)`;
    };
    const reset = () => {
      el.style.transform = "";
    };
    el.addEventListener("mousemove", track);
    el.addEventListener("mouseleave", reset);
  }

  document.querySelectorAll(".stat-card").forEach((card) => addTilt(card, 9));

  // Editor tilts gently while the pointer is over it.
  const editor = $("#editor-card");
  editor.addEventListener("mousemove", (e) => {
    const r = editor.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    editor.style.transform = `perspective(1100px) rotateX(${(-py * 1.6).toFixed(2)}deg) rotateY(${(px * 1.6).toFixed(2)}deg)`;
  });
  editor.addEventListener("mouseleave", () => {
    editor.style.transform = "";
  });

  // ---------- Particle background ----------
  const canvas = $("#bg");
  const ctx = canvas.getContext("2d");
  let particles = [];
  const mouse = { x: -9999, y: -9999 };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initParticles();
  }

  function initParticles() {
    const count = Math.min(80, Math.floor(window.innerWidth / 16));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 2.1 + 0.6,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      c: `rgba(${Math.random() > 0.5 ? "96,165,250" : "34,211,238"},`,
      a: Math.random() * 0.5 + 0.2,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > window.innerWidth) p.vx *= -1;
      if (p.y < 0 || p.y > window.innerHeight) p.vy *= -1;

      const mdx = p.x - mouse.x;
      const mdy = p.y - mouse.y;
      const md = Math.hypot(mdx, mdy);
      if (md < 140 && md > 0.001) {
        const force = (140 - md) / 140;
        p.x += (mdx / md) * force * 1.4;
        p.y += (mdy / md) * force * 1.4;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `${p.c}${p.a})`;
      ctx.fill();
    }

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d = Math.hypot(dx, dy);
        if (d < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(59,130,246,${(1 - d / 120) * 0.16})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener("pointermove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  window.addEventListener("pointerleave", () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });
  window.addEventListener("resize", resize);

  // ---------- Init ----------
  resize();
  draw();
  update();
})();
