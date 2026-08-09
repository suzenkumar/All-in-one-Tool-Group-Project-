(() => {
  'use strict';

  // ── Elements ──
  const container   = document.getElementById('notesContainer');
  const createBtn   = document.getElementById('createBtn');
  const emptyState  = document.getElementById('emptyState');
  const searchInput = document.getElementById('searchInput');
  const downloadAll = document.getElementById('downloadAllBtn');
  const statCount   = document.getElementById('statCount');
  const statWords   = document.getElementById('statWords');
  const statSaved   = document.getElementById('statSaved');
  const chip        = document.getElementById('autosaveChip');
  const chipText    = document.getElementById('autosaveText');
  const toastEl     = document.getElementById('toast');

  // ── Config ──
  const STORAGE_KEY = 'onb_notes_v3';
  const OLD_KEY     = 'notesApp_v2';
  const COLORS      = ['#fffde8', '#e8f5e9', '#fce4ec', '#e3f2fd', '#f3e5f5', '#fff3e0'];
  const TAPES       = ['#d4850a', '#43a047', '#d81b60', '#1e88e5', '#8e24aa', '#f4511e'];
  const placeholders = [
    "Jot something down...",
    "What's on your mind?",
    "Ideas, thoughts, reminders...",
    "Start typing your note...",
    "Today I want to remember...",
    "A thought just landed here...",
  ];
  const FINE_POINTER = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  let notes = [];
  let colorIdx = 0;
  let saveTimer = null;
  let chipTimer = null;
  let searchTerm = '';

  // ── Helpers ──
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function formatDate() {
    return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  function formatTime() {
    return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  function stripTags(html) {
    const d = document.createElement('div');
    d.innerHTML = html || '';
    return (d.textContent || '').trim();
  }
  function countWords(html) {
    const t = stripTags(html);
    if (!t) return 0;
    return t.split(/\s+/).length;
  }
  function tapeFor(color) {
    const i = COLORS.indexOf(color);
    return i >= 0 ? TAPES[i] : TAPES[0];
  }
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }

  // ── Autosave indicator ──
  function showChip(text, state) {
    chip.classList.remove('saving', 'error');
    chipText.textContent = text;
    if (state) chip.classList.add(state);
    chip.classList.add('show');
    clearTimeout(chipTimer);
    chipTimer = setTimeout(() => chip.classList.remove('show'), 2600);
  }

  // ── Storage ──
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
      statSaved.textContent = formatTime();
      showChip('Saved', '');
    } catch (e) {
      showChip('Could not save', 'error');
    }
  }
  function scheduleSave() {
    showChip('Saving', 'saving');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 700);
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        notes = JSON.parse(raw);
        return;
      }
      // migrate old format
      const old = JSON.parse(localStorage.getItem(OLD_KEY) || '[]');
      if (Array.isArray(old)) {
        notes = old.map(o => ({
          id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
          text: typeof o.text === 'string' ? o.text : '',
          date: o.date || formatDate(),
          time: formatTime(),
          color: COLORS[(colorIdx++) % COLORS.length],
          pinned: false,
          created: Date.now(),
          updated: Date.now(),
        }));
        if (notes.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
      }
    } catch (e) {
      notes = [];
    }
  }

  // ── Note CRUD ──
  function createNote(data) {
    const note = {
      id: data.id || Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      text: data.text || '',
      date: data.date || formatDate(),
      time: data.time || formatTime(),
      color: data.color || COLORS[colorIdx % COLORS.length],
      pinned: !!data.pinned,
      created: data.created || Date.now(),
      updated: Date.now(),
    };
    colorIdx++;
    notes.unshift(note);
    render();
    save();
    const card = container.querySelector('[data-id="' + note.id + '"]');
    if (card && !data.text) {
      requestAnimationFrame(() => card.querySelector('.note-body').focus());
    }
    return note;
  }

  function updateNote(id, patch) {
    const n = notes.find(x => x.id === id);
    if (!n) return;
    Object.assign(n, patch, { updated: Date.now() });
  }

  function deleteNote(id) {
    notes = notes.filter(n => n.id !== id);
    render();
    save();
  }

  function togglePin(id) {
    const n = notes.find(x => x.id === id);
    if (!n) return;
    n.pinned = !n.pinned;
    n.updated = Date.now();
    render();
    save();
  }

  // ── 3D tilt ──
  function bindTilt(card) {
    if (!FINE_POINTER) return;
    card.classList.add('tiltable');
    card.addEventListener('mousemove', e => {
      if (card.dataset.editing === '1') return;
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty('--rx', (-py * 8).toFixed(2) + 'deg');
      card.style.setProperty('--ry', (px * 10).toFixed(2) + 'deg');
    });
    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  }

  // ── Card builder ──
  const SVG = {
    pin:    '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9 4h6v4l2 4v3H7v-3l2-4V4zM12 15v5"/></svg>',
    download:'<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14"/></svg>',
    delete: '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M6 6l12 12M18 6L6 18"/></svg>',
  };

  function buildCard(note) {
    const card = document.createElement('article');
    card.className = 'note-card';
    card.dataset.id = note.id;
    card.style.setProperty('--paper', note.color);
    card.style.setProperty('--tape-color', tapeFor(note.color));

    const dots = COLORS.map((c, i) =>
      '<button class="color-dot" title="Color" style="background:' + c + '" data-color="' + c + '"></button>'
    ).join('');

    card.innerHTML =
      '<div class="note-tape"></div>' +
      '<div class="note-top">' +
        '<span class="note-date">' + esc(note.date) + ' · ' + esc(note.time) + '</span>' +
        '<div class="note-actions">' +
          '<button class="act pin' + (note.pinned ? ' on' : '') + '" title="Pin note">' + SVG.pin + '</button>' +
          '<button class="act download" title="Download as PDF">' + SVG.download + '</button>' +
          '<button class="act delete" title="Delete note">' + SVG.delete + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="note-body" contenteditable="true" data-placeholder="' + placeholders[colorIdx % placeholders.length] + '">' + note.text + '</div>' +
      '<div class="note-footer">' +
        '<span class="word-count">' + countWords(note.text) + ' words</span>' +
        '<div class="color-dots">' + dots + '</div>' +
      '</div>';

    // body editing
    const body = card.querySelector('.note-body');
    body.addEventListener('input', () => {
      updateNote(note.id, { text: body.innerHTML });
      card.querySelector('.word-count').textContent = countWords(body.innerHTML) + ' words';
      updateStats();
      scheduleSave();
    });
    body.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.execCommand('insertLineBreak');
      }
    });
    body.addEventListener('focus', () => { card.dataset.editing = '1'; });
    body.addEventListener('blur', () => { card.dataset.editing = '0'; });

    // actions
    card.querySelector('.pin').addEventListener('click', () => togglePin(note.id));
    card.querySelector('.delete').addEventListener('click', () => {
      card.classList.add('removing');
      setTimeout(() => deleteNote(note.id), 220);
    });
    card.querySelector('.download').addEventListener('click', e => {
      e.stopPropagation();
      downloadNote(note);
    });

    // color dots
    card.querySelectorAll('.color-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        const c = dot.dataset.color;
        updateNote(note.id, { color: c });
        card.style.setProperty('--paper', c);
        card.style.setProperty('--tape-color', tapeFor(c));
        save();
      });
    });

    bindTilt(card);
    return card;
  }

  // ── Render ──
  function visibleNotes() {
    const q = searchTerm.toLowerCase();
    const filtered = q
      ? notes.filter(n =>
          (n.text || '').toLowerCase().includes(q) ||
          (n.date || '').toLowerCase().includes(q) ||
          (n.time || '').toLowerCase().includes(q))
      : notes.slice();
    return filtered.slice().sort((a, b) => (b.pinned - a.pinned) || (b.created - a.created));
  }

  function render() {
    container.innerHTML = '';
    visibleNotes().forEach(n => container.appendChild(buildCard(n)));
    updateEmpty();
    updateStats();
  }

  function updateEmpty() {
    emptyState.style.display = notes.length === 0 ? 'flex' : 'none';
  }

  function updateStats() {
    statCount.textContent = notes.length;
    statWords.textContent = notes.reduce((sum, n) => sum + countWords(n.text), 0);
  }

  // ── PDF export ──
  function pdfLibsReady() {
    return typeof window.html2canvas === 'function' && window.jspdf && window.jspdf.jsPDF;
  }

  function makeExportNode(note) {
    const el = document.createElement('div');
    el.className = 'pdf-card';
    el.style.setProperty('--paper', note.color);
    el.style.setProperty('--tape-color', tapeFor(note.color));
    el.innerHTML =
      '<div class="pdf-tape"></div>' +
      '<div class="pdf-date">' + esc(note.date) + ' · ' + esc(note.time) + '</div>' +
      '<div class="pdf-body">' + (note.text || '<i style="color:#a09080">Empty note</i>') + '</div>';
    el.style.cssText += 'position:fixed;left:-10000px;top:0;width:720px;';
    document.body.appendChild(el);
    return el;
  }

  async function renderToCanvas(node) {
    return await html2canvas(node, {
      scale: 2,
      backgroundColor: null,
      useCORS: true,
      logging: false,
    });
  }

  function safeFilename(text) {
    const clean = stripTags(text).replace(/[^\w\s-]/g, '').trim().slice(0, 40) || 'note';
    return clean.replace(/\s+/g, '-');
  }

  async function downloadNote(note) {
    if (!pdfLibsReady()) return toast('PDF library not loaded — check internet connection.');
    toast('Preparing PDF...');
    const el = makeExportNode(note);
    try {
      const canvas = await renderToCanvas(el);
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width, canvas.height] });
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, canvas.width, canvas.height);
      pdf.save(safeFilename(note.text) + '.pdf');
      toast('Note downloaded as PDF');
    } catch (e) {
      console.error(e);
      toast('PDF export failed');
    } finally {
      el.remove();
    }
  }

  async function downloadAllNotes() {
    if (!pdfLibsReady()) return toast('PDF library not loaded — check internet connection.');
    const list = visibleNotes();
    if (!list.length) return toast('No notes to download yet.');
    toast('Building notebook PDF...');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageW = 595.28, pageH = 841.89, margin = 34, availH = pageH - margin * 2;
    let first = true;
    try {
      for (const n of list) {
        const el = makeExportNode(n);
        const canvas = await renderToCanvas(el);
        el.remove();
        const img = canvas.toDataURL('image/jpeg', 0.92);
        const imgW = pageW - margin * 2;
        let imgH = canvas.height * (imgW / canvas.width);
        if (!first) pdf.addPage();
        if (imgH > availH) {
          imgH = availH;
          const w = canvas.width * (availH / canvas.height);
          pdf.addImage(img, 'JPEG', (pageW - w) / 2, margin, w, imgH);
        } else {
          pdf.addImage(img, 'JPEG', margin, margin, imgW, imgH);
        }
        first = false;
      }
      pdf.save('My-Notebook-' + formatDate().replace(/[, ]/g, '-') + '.pdf');
      toast('Notebook downloaded (' + list.length + ' notes)');
    } catch (e) {
      console.error(e);
      toast('PDF export failed');
    }
  }

  // ── Wire up ──
  createBtn.addEventListener('click', () => createNote({}));

  downloadAll.addEventListener('click', () => downloadAllNotes());

  searchInput.addEventListener('input', () => {
    searchTerm = searchInput.value.trim();
    render();
  });

  // save on page hide (safety net)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') save();
  });
  window.addEventListener('beforeunload', save);

  // ── Boot ──
  load();
  render();
})();
