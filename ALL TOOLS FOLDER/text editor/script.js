 // ══════════════════════════════════════
  //  ELEMENTS
  // ══════════════════════════════════════
  const htmlTA       = document.getElementById('html-code');
  const cssTA        = document.getElementById('css-code');
  const jsTA         = document.getElementById('js-code');
  const output       = document.getElementById('output');
  const frameWrap    = document.getElementById('frameWrap');
  const previewEmpty = document.getElementById('previewEmpty');

  let runTimeout;

  // ══════════════════════════════════════
  //  CORE RUN
  // ══════════════════════════════════════
  function run() {
    const html = htmlTA.value;
    const css  = cssTA.value;
    const js   = jsTA.value;

    if (html.trim() || css.trim() || js.trim()) {
      previewEmpty.classList.add('hidden');
    } else {
      previewEmpty.classList.remove('hidden');
    }

    frameWrap.classList.add('flash');
    setTimeout(() => frameWrap.classList.remove('flash'), 120);

    const doc = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<style>${css}</style>
</head>
<body>
${html}
<script>
window.onerror = function(msg,src,line,col,err) {
  document.body.style.outline = '3px solid #ff4545';
  console.error(msg, 'line:'+line);
  return false;
};
${js}
<\/script>
</body>
</html>`;

    output.srcdoc = doc;
  }

  function scheduleRun() {
    clearTimeout(runTimeout);
    runTimeout = setTimeout(run, 320);
  }

  htmlTA.addEventListener('input', scheduleRun);
  cssTA.addEventListener('input',  scheduleRun);
  jsTA.addEventListener('input',   scheduleRun);

  // ── Toolbar buttons ───────────────────
  document.getElementById('runBtn').addEventListener('click', () => { run(); toast('▶ Running'); });
  document.getElementById('refreshBtn').addEventListener('click', () => { run(); toast('↺ Refreshed'); });
  document.getElementById('refreshBtn2').addEventListener('click', () => { run(); toast('↺ Refreshed'); });

  function goFullscreen() {
    if (output.requestFullscreen) output.requestFullscreen();
    else if (output.webkitRequestFullscreen) output.webkitRequestFullscreen();
  }
  document.getElementById('fullBtn').addEventListener('click', goFullscreen);
  document.getElementById('fullBtn2').addEventListener('click', goFullscreen);

  document.getElementById('clearBtn').addEventListener('click', () => {
    if (!confirm('Clear all editors?')) return;
    htmlTA.value = '';
    cssTA.value  = '';
    jsTA.value   = '';
    output.srcdoc = '';
    previewEmpty.classList.remove('hidden');
    updateAllLineNumbers();
    toast('✕ Cleared');
  });

  // ── Tab key ───────────────────────────
  [htmlTA, cssTA, jsTA].forEach(ta => {
    ta.addEventListener('keydown', e => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const s = ta.selectionStart, end = ta.selectionEnd;
        ta.value = ta.value.substring(0, s) + '  ' + ta.value.substring(end);
        ta.selectionStart = ta.selectionEnd = s + 2;
        scheduleRun();
        updateAllLineNumbers();
      }
    });
  });

  // ── Line numbers ──────────────────────
  function updateLineNumbers(ta, lnEl, countEl1, countEl2) {
    const lines = ta.value.split('\n');
    const count = lines.length;
    lnEl.textContent = Array.from({length: count}, (_, i) => i + 1).join('\n');
    const txt = count + ' line' + (count !== 1 ? 's' : '');
    if (countEl1) countEl1.textContent = txt;
    if (countEl2) countEl2.textContent = txt;
    lnEl.scrollTop = ta.scrollTop;
  }

  function updateAllLineNumbers() {
    updateLineNumbers(htmlTA, document.getElementById('html-ln'), document.getElementById('html-lines'), document.getElementById('html-lines-label'));
    updateLineNumbers(cssTA,  document.getElementById('css-ln'),  document.getElementById('css-lines'),  document.getElementById('css-lines-label'));
    updateLineNumbers(jsTA,   document.getElementById('js-ln'),   document.getElementById('js-lines'),   document.getElementById('js-lines-label'));
  }

  htmlTA.addEventListener('input',  updateAllLineNumbers);
  cssTA.addEventListener('input',   updateAllLineNumbers);
  jsTA.addEventListener('input',    updateAllLineNumbers);

  htmlTA.addEventListener('scroll', () => { document.getElementById('html-ln').scrollTop = htmlTA.scrollTop; });
  cssTA.addEventListener('scroll',  () => { document.getElementById('css-ln').scrollTop  = cssTA.scrollTop; });
  jsTA.addEventListener('scroll',   () => { document.getElementById('js-ln').scrollTop   = jsTA.scrollTop; });

  // ── Tab switching (small screen) ──────
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const id = tab.dataset.tab;
      document.querySelectorAll('.tab').forEach(t => {
        t.className = 'tab';
      });
      tab.classList.add('tab', 'active', 'active-' + id);

      document.querySelectorAll('.editor-section').forEach(s => s.classList.remove('active'));
      document.getElementById('sec-' + id).classList.add('active');
    });
  });

  // ── Drag resize ───────────────────────
  const handle    = document.getElementById('resizeHandle');
  const edPanel   = document.getElementById('editorsPanel');
  const workspace = document.getElementById('workspace');

  let isDragging = false;
  handle.addEventListener('mousedown', e => {
    isDragging = true;
    handle.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const wRect = workspace.getBoundingClientRect();
    const pct = ((e.clientX - wRect.left) / wRect.width) * 100;
    edPanel.style.width = Math.max(20, Math.min(80, pct)) + '%';
  });
  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    handle.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  });

  // ── Toast ──────────────────────────────
  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2200);
  }

  // ── Starter code ──────────────────────
  function loadStarter() {
  

    updateAllLineNumbers();
    run();
  }

  loadStarter();