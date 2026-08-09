/* ════════════════════════════════════════════════════
   AllInOne — Live Editor  (editor engine + multi-language)
   ════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const $ = id => document.getElementById(id);

  // ── Elements ──
  const workspace     = $('workspace');
  const editorsPanel  = $('editorsPanel');
  const previewPanel  = $('previewPanel');
  const frame         = $('output');
  const previewEmpty  = $('previewEmpty');
  const tabBar        = $('tabBar');
  const runBtn        = $('runBtn');
  const refreshBtn    = $('refreshBtn');
  const refreshBtn2   = $('refreshBtn2');
  const fwSel         = $('fwSelect');
  const aiToggleBtn   = $('aiToggleBtn');
  const aiState       = $('aiState');
  const downloadBtn   = $('downloadBtn');
  const dlMenu        = $('dlMenu');
  const fullBtn       = $('fullBtn');
  const fullBtn2      = $('fullBtn2');
  const clearBtn      = $('clearBtn');
  const sbLang        = $('sbLang');
  const sbCursor      = $('sbCursor');
  const sbWords       = $('sbWords');
  const sbSave        = $('sbSave');
  const toastEl       = $('toast');
  const acBox         = $('acBox');
  const aiStrip       = $('aiStrip');
  const aiStripText   = $('aiStripText');
  const codeExtEl     = $('codeExt');
  const langPick      = $('langPick');
  const langBtn       = $('langBtn');
  const langBtnLabel  = $('langBtnLabel');
  const langPop       = $('langPop');
  const langSearch    = $('langSearch');
  const langList      = $('langList');

  const STORAGE_KEY = 'allinone_editor_v1';

  // ── CodeMirror editors ──
  const BASE_CM = { lineNumbers: true, matchBrackets: true, autoCloseBrackets: true, styleActiveLine: true, indentUnit: 2, tabSize: 2, lineWrapping: true };
  const editors = {
    html: CodeMirror.fromTextArea($('html-code'), Object.assign({ mode: 'text/html', autoCloseTags: true }, BASE_CM)),
    css:  CodeMirror.fromTextArea($('css-code'),  Object.assign({ mode: 'css' }, BASE_CM)),
    js:   CodeMirror.fromTextArea($('js-code'),   Object.assign({ mode: 'javascript' }, BASE_CM)),
    code: CodeMirror.fromTextArea($('code-code'), Object.assign({ mode: 'python' }, BASE_CM)),
  };
  const WEB_ORDER = ['html', 'css', 'js'];
  const LANG_NAME = { html: 'index.html', css: 'style.css', js: 'script.js' };

  // ── Framework templates ──
  const TEMPLATES = {
    vanilla: {
      html: `<div class="card">
  <h1>Hello, World!</h1>
  <p>Edit the HTML, CSS and JavaScript files and watch the preview update live.</p>
  <button id="btn">Click me</button>
</div>`,
      css: `* { box-sizing: border-box; margin: 0; }

body {
  font-family: system-ui, sans-serif;
  display: grid;
  place-items: center;
  min-height: 100vh;
  background: #0f172a;
  color: #e2e8f0;
}

.card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 14px;
  padding: 34px;
  text-align: center;
  max-width: 420px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, .4);
}

h1 { font-size: 26px; margin-bottom: 10px; }
p  { color: #94a3b8; margin-bottom: 20px; font-size: 14px; line-height: 1.6; }

button {
  background: #6366f1;
  color: #fff;
  border: none;
  padding: 12px 22px;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  transition: transform .15s;
}
button:hover { transform: translateY(-2px); }`,
      js: `const btn = document.getElementById('btn');
let clicks = 0;

btn.addEventListener('click', () => {
  clicks++;
  btn.textContent = 'Clicked ' + clicks + ' times!';
});`,
    },

    react: {
      html: `<div id="root"></div>
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>`,
      css: `* { box-sizing: border-box; margin: 0; }

body {
  font-family: system-ui, sans-serif;
  display: grid;
  place-items: center;
  min-height: 100vh;
  background: #0f172a;
  color: #e2e8f0;
}

.card { text-align: center; }
button {
  background: #6366f1; color: #fff; border: none;
  padding: 12px 24px; border-radius: 10px; font-size: 16px; cursor: pointer;
  margin-top: 12px;
}`,
      js: `const { useState } = React;

function App() {
  const [count, setCount] = useState(0);
  return (
    <div className="card">
      <h1>React App</h1>
      <p>Counter: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);`,
    },

    vue: {
      html: `<div id="app" class="card">
  <h1>Vue 3</h1>
  <p>{{ message }}</p>
  <button @click="count++">Clicked {{ count }} times</button>
</div>
<script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>`,
      css: `* { box-sizing: border-box; margin: 0; }

body {
  font-family: system-ui, sans-serif;
  display: grid;
  place-items: center;
  min-height: 100vh;
  background: #0f172a;
  color: #e2e8f0;
}

.card { text-align: center; }
button {
  background: #22c55e; color: #fff; border: none;
  padding: 12px 24px; border-radius: 10px; font-size: 15px; cursor: pointer;
  margin-top: 14px;
}`,
      js: `const { createApp } = Vue;

createApp({
  data() {
    return { message: 'Hello from Vue 3!', count: 0 };
  }
}).mount('#app');`,
    },

    tailwind: {
      html: `<div class="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
  <div class="bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-8 text-center text-white shadow-2xl max-w-md">
    <h1 class="text-3xl font-bold mb-3">Tailwind CSS</h1>
    <p class="text-slate-300 mb-6">Style with utility classes — no hand-written CSS needed.</p>
    <button class="bg-indigo-500 hover:bg-indigo-400 text-white font-semibold px-6 py-3 rounded-xl transition shadow-lg">Hover me</button>
  </div>
</div>
<script src="https://cdn.tailwindcss.com"></script>`,
      css: `/* Styling is handled by Tailwind utility classes */`,
      js: `// Add interactivity here`,
    },
  };

  // ── Languages (Code tab) ──
  const CM_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/';
  const LANGS = {
    javascript:  { label: 'JavaScript',  mode: 'javascript', mime: 'text/javascript',   files: ['mode/javascript/javascript.min.js'],                       ext: 'js' },
    typescript:  { label: 'TypeScript',  mode: 'javascript', mime: 'text/typescript',   files: ['mode/javascript/javascript.min.js', 'mode/javascript/typescript.min.js'], ext: 'ts' },
    jsx:         { label: 'JSX / React', mode: 'jsx',        mime: 'text/jsx',           files: ['mode/javascript/javascript.min.js', 'mode/jsx/jsx.min.js'],  ext: 'jsx' },
    python:      { label: 'Python',      mode: 'python',     mime: 'text/x-python',      files: ['mode/python/python.min.js'],                                ext: 'py' },
    html:        { label: 'HTML',        mode: 'htmlmixed',  mime: 'text/html',          files: ['mode/xml/xml.min.js', 'mode/javascript/javascript.min.js', 'mode/css/css.min.js', 'mode/htmlmixed/htmlmixed.min.js'], ext: 'html' },
    css:         { label: 'CSS',         mode: 'css',        mime: 'text/css',           files: ['mode/css/css.min.js'],                                      ext: 'css' },
    json:        { label: 'JSON',        mode: 'javascript', mime: 'application/json',   files: ['mode/javascript/javascript.min.js'],                        ext: 'json' },
    xml:         { label: 'XML',         mode: 'xml',        mime: 'application/xml',    files: ['mode/xml/xml.min.js'],                                      ext: 'xml' },
    markdown:    { label: 'Markdown',    mode: 'markdown',   mime: 'text/x-markdown',    files: ['mode/markdown/markdown.min.js'],                             ext: 'md' },
    yaml:        { label: 'YAML',        mode: 'yaml',       mime: 'text/x-yaml',        files: ['mode/yaml/yaml.min.js'],                                    ext: 'yaml' },
    sql:         { label: 'SQL',         mode: 'sql',        mime: 'text/x-sql',         files: ['mode/sql/sql.min.js'],                                      ext: 'sql' },
    java:        { label: 'Java',        mode: 'clike',      mime: 'text/x-java',        files: ['mode/clike/clike.min.js'],                                  ext: 'java' },
    c:           { label: 'C',           mode: 'clike',      mime: 'text/x-csrc',        files: ['mode/clike/clike.min.js'],                                  ext: 'c' },
    cpp:         { label: 'C++',         mode: 'clike',      mime: 'text/x-c++src',      files: ['mode/clike/clike.min.js'],                                  ext: 'cpp' },
    csharp:      { label: 'C#',          mode: 'clike',      mime: 'text/x-csharp',      files: ['mode/clike/clike.min.js'],                                  ext: 'cs' },
    kotlin:      { label: 'Kotlin',      mode: 'clike',      mime: 'text/x-kotlin',      files: ['mode/clike/clike.min.js'],                                  ext: 'kt' },
    go:          { label: 'Go',          mode: 'go',         mime: 'text/x-go',          files: ['mode/go/go.min.js'],                                        ext: 'go' },
    rust:        { label: 'Rust',        mode: 'rust',       mime: 'text/x-rustsrc',     files: ['mode/rust/rust.min.js'],                                    ext: 'rs' },
    swift:       { label: 'Swift',       mode: 'swift',      mime: 'text/x-swift',       files: ['mode/swift/swift.min.js'],                                  ext: 'swift' },
    dart:        { label: 'Dart',        mode: 'dart',       mime: 'text/x-dart',        files: ['mode/dart/dart.min.js'],                                    ext: 'dart' },
    ruby:        { label: 'Ruby',        mode: 'ruby',       mime: 'text/x-ruby',        files: ['mode/ruby/ruby.min.js'],                                    ext: 'rb' },
    php:         { label: 'PHP',         mode: 'php',        mime: 'application/x-httpd-php', files: ['mode/clike/clike.min.js', 'mode/xml/xml.min.js', 'mode/javascript/javascript.min.js', 'mode/css/css.min.js', 'mode/php/php.min.js'], ext: 'php' },
    lua:         { label: 'Lua',         mode: 'lua',        mime: 'text/x-lua',         files: ['mode/lua/lua.min.js'],                                      ext: 'lua' },
    perl:        { label: 'Perl',        mode: 'perl',       mime: 'text/x-perl',        files: ['mode/perl/perl.min.js'],                                     ext: 'pl' },
    bash:        { label: 'Bash / Shell', mode: 'shell',     mime: 'text/x-sh',          files: ['mode/shell/shell.min.js'],                                   ext: 'sh' },
    powershell:  { label: 'PowerShell',  mode: 'powershell', mime: 'text/x-powershell',  files: ['mode/powershell/powershell.min.js'],                         ext: 'ps1' },
    r:           { label: 'R',           mode: 'r',          mime: 'text/x-rsrc',        files: ['mode/r/r.min.js'],                                          ext: 'r' },
    toml:        { label: 'TOML',        mode: 'toml',       mime: 'text/x-toml',        files: ['mode/toml/toml.min.js'],                                    ext: 'toml' },
    vb:          { label: 'VB.NET',      mode: 'vb',         mime: 'text/x-vb',          files: ['mode/vb/vb.min.js'],                                        ext: 'vb' },
    matlab:      { label: 'MATLAB',      mode: 'octave',     mime: 'text/x-octave',      files: ['mode/octave/octave.min.js'],                                ext: 'm' },
    haskell:     { label: 'Haskell',     mode: 'haskell',    mime: 'text/x-haskell',     files: ['mode/haskell/haskell.min.js'],                              ext: 'hs' },
    elixir:      { label: 'Elixir',      mode: 'elixir',     mime: 'text/x-elixir',      files: ['mode/elixir/elixir.min.js'],                                ext: 'ex' },
    erlang:      { label: 'Erlang',      mode: 'erlang',     mime: 'text/x-erlang',      files: ['mode/erlang/erlang.min.js'],                                ext: 'erl' },
    clojure:     { label: 'Clojure',     mode: 'clojure',    mime: 'text/x-clojure',     files: ['mode/clojure/clojure.min.js'],                              ext: 'clj' },
    ocaml:       { label: 'OCaml',       mode: 'mllike',     mime: 'text/x-ocaml',       files: ['mode/mllike/mllike.min.js'],                                ext: 'ml' },
    scala:       { label: 'Scala',       mode: 'scala',      mime: 'text/x-scala',       files: ['mode/scala/scala.min.js'],                                  ext: 'scala' },
    groovy:      { label: 'Groovy',      mode: 'groovy',     mime: 'text/x-groovy',      files: ['mode/groovy/groovy.min.js'],                                ext: 'groovy' },
    julia:       { label: 'Julia',       mode: 'julia',      mime: 'text/x-julia',       files: ['mode/julia/julia.min.js'],                                  ext: 'jl' },
    dlang:       { label: 'D',           mode: 'd',          mime: 'text/x-d',           files: ['mode/d/d.min.js'],                                          ext: 'd' },
    scheme:      { label: 'Scheme',      mode: 'scheme',     mime: 'text/x-scheme',      files: ['mode/scheme/scheme.min.js'],                                ext: 'scm' },
    smalltalk:   { label: 'Smalltalk',   mode: 'smalltalk',  mime: 'text/x-stsrc',       files: ['mode/smalltalk/smalltalk.min.js'],                           ext: 'st' },
    tcl:         { label: 'Tcl',         mode: 'tcl',        mime: 'text/x-tcl',         files: ['mode/tcl/tcl.min.js'],                                      ext: 'tcl' },
    verilog:     { label: 'Verilog',     mode: 'verilog',    mime: 'text/x-verilog',     files: ['mode/verilog/verilog.min.js'],                              ext: 'v' },
    vhdl:        { label: 'VHDL',        mode: 'vhdl',       mime: 'text/x-vhdl',        files: ['mode/vhdl/vhdl.min.js'],                                    ext: 'vhd' },
    fortran:     { label: 'Fortran',     mode: 'fortran',    mime: 'text/x-fortran',     files: ['mode/fortran/fortran.min.js'],                              ext: 'f90' },
    pascal:      { label: 'Pascal',      mode: 'pascal',     mime: 'text/x-pascal',      files: ['mode/pascal/pascal.min.js'],                                ext: 'pas' },
    objectivec:  { label: 'Objective-C', mode: 'clike',      mime: 'text/x-objectivec',  files: ['mode/clike/clike.min.js'],                                  ext: 'm' },
    coffeescript:{ label: 'CoffeeScript', mode: 'coffeescript', mime: 'text/x-coffeescript', files: ['mode/coffeescript/coffeescript.min.js'],                 ext: 'coffee' },
    stylus:      { label: 'Stylus',      mode: 'stylus',     mime: 'text/x-styl',        files: ['mode/stylus/stylus.min.js'],                                ext: 'styl' },
    dockerfile:  { label: 'Dockerfile',  mode: 'dockerfile', mime: 'text/x-dockerfile',  files: ['mode/dockerfile/dockerfile.min.js'],                        ext: 'dockerfile' },
    diff:        { label: 'Diff',        mode: 'diff',       mime: 'text/x-diff',        files: ['mode/diff/diff.min.js'],                                    ext: 'patch' },
    cmake:       { label: 'CMake',       mode: 'cmake',      mime: 'text/x-cmake',       files: ['mode/cmake/cmake.min.js'],                                  ext: 'cmake' },
    nginx:       { label: 'Nginx',       mode: 'nginx',      mime: 'text/x-nginx-conf',  files: ['mode/nginx/nginx.min.js'],                                  ext: 'conf' },
    protobuf:    { label: 'Protobuf',    mode: 'protobuf',   mime: 'text/x-protobuf',    files: ['mode/protobuf/protobuf.min.js'],                             ext: 'proto' },
    gfm:         { label: 'Markdown (GFM)', mode: 'gfm',     mime: 'text/x-gfm',         files: ['mode/markdown/markdown.min.js', 'mode/gfm/gfm.min.js'],       ext: 'md' },
    haxe:        { label: 'Haxe',        mode: 'haxe',       mime: 'text/x-haxe',        files: ['mode/haxe/haxe.min.js'],                                    ext: 'hx' },
    elm:         { label: 'Elm',         mode: 'elm',        mime: 'text/x-elm',         files: ['mode/elm/elm.min.js'],                                      ext: 'elm' },
    fsharp:      { label: 'F#',          mode: 'fsharp',     mime: 'text/x-fsharp',      files: ['mode/fsharp/fsharp.min.js'],                                ext: 'fs' },
    crystal:     { label: 'Crystal',     mode: 'crystal',    mime: 'text/x-crystal',     files: ['mode/crystal/crystal.min.js'],                              ext: 'cr' },
    django:      { label: 'Django / Jinja', mode: 'django',  mime: 'text/x-django',      files: ['mode/django/django.min.js'],                                ext: 'html' },
    twig:        { label: 'Twig',        mode: 'twig',       mime: 'text/x-twig',        files: ['mode/xml/xml.min.js', 'mode/javascript/javascript.min.js', 'mode/css/css.min.js', 'mode/twig/twig.min.js'], ext: 'twig' },
    handlebars:  { label: 'Handlebars',  mode: 'handlebars', mime: 'text/x-handlebars-template', files: ['mode/xml/xml.min.js', 'mode/javascript/javascript.min.js', 'mode/css/css.min.js', 'mode/htmlmixed/htmlmixed.min.js', 'mode/handlebars/handlebars.min.js'], ext: 'hbs' },
    ejs:         { label: 'EJS',         mode: 'ejs',        mime: 'text/x-ejs',         files: ['mode/xml/xml.min.js', 'mode/javascript/javascript.min.js', 'mode/css/css.min.js', 'mode/htmlmixed/htmlmixed.min.js', 'mode/ejs/ejs.min.js'], ext: 'ejs' },
    jsp:         { label: 'JSP',         mode: 'jsp',        mime: 'application/x-jsp',  files: ['mode/xml/xml.min.js', 'mode/javascript/javascript.min.js', 'mode/css/css.min.js', 'mode/htmlmixed/htmlmixed.min.js', 'mode/jsp/jsp.min.js'], ext: 'jsp' },
    livescript:  { label: 'LiveScript',  mode: 'livescript', mime: 'text/x-livescript',  files: ['mode/livescript/livescript.min.js'],                         ext: 'ls' },
    properties:  { label: 'Properties',  mode: 'properties', mime: 'text/x-properties',  files: ['mode/properties/properties.min.js'],                         ext: 'properties' },
    text:        { label: 'Plain Text',  mode: 'null',       mime: 'text/plain',         files: [],                                                         ext: 'txt' },
  };

  let codeLang = 'python';

  function loadModeFile(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = res;
      s.onerror = () => rej(new Error('Failed to load ' + src));
      document.head.appendChild(s);
    });
  }
  async function applyCodeMode(lang) {
    const L = LANGS[lang];
    if (!L) return;
    codeLang = lang;
    if (codeExtEl) codeExtEl.textContent = '.' + L.ext;
    if (!CodeMirror.modes[L.mode]) {
      try {
        for (const f of L.files) await loadModeFile(CM_CDN + f);
      } catch (e) {
        toast('Could not load ' + L.label + ' syntax highlighting');
      }
    }
    editors.code.setOption('mode', L.mime);
    editors.code.refresh();
    setSbLang('code');
  }

  // searchable language dropdown
  function renderLangList(filter) {
    const q = (filter || '').toLowerCase().trim();
    langList.innerHTML = '';
    const keys = Object.keys(LANGS).sort((a, b) => LANGS[a].label.localeCompare(LANGS[b].label));
    let shown = 0;
    keys.forEach(k => {
      const L = LANGS[k];
      if (q && L.label.toLowerCase().indexOf(q) === -1 && k.indexOf(q) === -1) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'lang-item' + (k === codeLang ? ' sel' : '');
      b.innerHTML = '<span>' + L.label + '</span><em>.' + L.ext + '</em>';
      b.addEventListener('click', () => selectLanguage(k));
      langList.appendChild(b);
      shown++;
    });
    if (!shown) langList.innerHTML = '<div class="lang-empty">No language matches</div>';
  }
  function selectLanguage(k) {
    if (!LANGS[k]) return;
    applyCodeMode(k);
    langBtnLabel.textContent = LANGS[k].label;
    closeLangPop();
    saveState(true);
  }
  function openLangPop() {
    langPop.hidden = false;
    renderLangList(langSearch.value);
    langSearch.focus();
  }
  function closeLangPop() { langPop.hidden = true; }
  langBtn.addEventListener('click', e => { e.stopPropagation(); langPop.hidden ? openLangPop() : closeLangPop(); });
  langSearch.addEventListener('input', () => renderLangList(langSearch.value));
  langSearch.addEventListener('keydown', e => { if (e.key === 'Escape') closeLangPop(); });
  langPop.addEventListener('click', e => e.stopPropagation());
  document.addEventListener('click', () => closeLangPop());
  renderLangList('');
  langBtnLabel.textContent = LANGS[codeLang].label;

  // ── State ──
  let currentTab = 'html';
  let activeLang = 'html';
  let aiOn = false;
  let pendingSug = null;
  let runTimer = null;
  let saveTimer = null;

  // ── Utilities ──
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }
  function debounce(fn, ms) {
    let t;
    return function () { clearTimeout(t); const a = arguments, s = this; t = setTimeout(() => fn.apply(s, a), ms); };
  }
  function nowTime() {
    return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
  }
  function countWords(cm) {
    const v = cm.getValue().trim();
    return v ? v.split(/\s+/).length : 0;
  }
  function refreshAll() {
    Object.keys(editors).forEach(l => editors[l].refresh());
  }

  // ── Build document ──
  function buildDoc() {
    const html = editors.html.getValue();
    const css = editors.css.getValue();
    const js = editors.js.getValue();
    const isReact = fwSel.value === 'react';
    const jsTag = isReact ? '<script type="text/babel">' : '<script>';
    return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>' +
      css + '</style></head><body>' + html + jsTag + js + '</' + 'script></body></html>';
  }

  function run() {
    frame.srcdoc = buildDoc();
    previewEmpty.style.display = (editors.html.getValue() || editors.css.getValue() || editors.js.getValue()) ? 'none' : 'flex';
  }

  // ── Templates ──
  function loadTemplate(fw) {
    const t = TEMPLATES[fw] || TEMPLATES.vanilla;
    editors.html.setValue(t.html);
    editors.css.setValue(t.css);
    editors.js.setValue(t.js);
    run();
    saveState(true);
  }

  // ── Storage (autosave) ──
  function saveState(silent) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        html: editors.html.getValue(),
        css: editors.css.getValue(),
        js: editors.js.getValue(),
        fw: fwSel.value,
        code: editors.code.getValue(),
        codeLang: codeLang,
      }));
    } catch (e) { /* ignore quota errors */ }
    if (!silent) {
      sbSave.textContent = 'Saved ' + nowTime();
      sbSave.classList.add('flash');
      setTimeout(() => sbSave.classList.remove('flash'), 800);
    }
  }
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveState, 600);
  }
  function restoreState() {
    let data = null;
    try { data = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) {}
    if (data && data.html !== undefined) {
      fwSel.value = data.fw || 'vanilla';
      editors.html.setValue(data.html || '');
      editors.css.setValue(data.css || '');
      editors.js.setValue(data.js || '');
      if (data.code !== undefined) editors.code.setValue(data.code || '');
      if (data.codeLang && LANGS[data.codeLang]) {
        codeLang = data.codeLang;
        langBtnLabel.textContent = LANGS[codeLang].label;
        applyCodeMode(data.codeLang);
      }
    } else {
      loadTemplate('vanilla');
      return;
    }
    run();
  }

  // ── Status bar ──
  function updateCursor(cm) {
    const c = cm.getCursor();
    sbCursor.textContent = 'Ln ' + (c.line + 1) + ', Col ' + (c.ch + 1);
  }
  function updateWords(cm) {
    sbWords.textContent = countWords(cm) + ' words';
  }
  function setSbLang(lang) {
    sbLang.textContent = lang === 'code' ? (LANGS[codeLang] ? LANGS[codeLang].label : 'Code') : LANG_NAME[lang];
  }

  // ── Tab switching (mobile) ──
  function setTab(name) {
    currentTab = name;
    tabBar.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    if (name === 'preview') {
      workspace.classList.add('show-preview');
      return;
    }
    workspace.classList.remove('show-preview');
    document.querySelectorAll('.editor-area').forEach(a => a.classList.toggle('active', a.dataset.ed === name));
    editors[name].refresh();
    setSbLang(name);
    updateCursor(editors[name]);
    updateWords(editors[name]);
  }

  // ── AI suggest ──
  async function serverSuggest(lang, before) {
    const res = await fetch('/api/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lang: lang, before: before }),
    });
    if (!res.ok) throw new Error('status ' + res.status);
    const d = await res.json();
    if (!d || !d.text) throw new Error('empty response');
    return d.text;
  }
  async function requestSuggestion(cm, lang) {
    if (!aiOn) return;
    const before = cm.getValue().slice(0, cm.indexFromPos(cm.getCursor()));
    if (!before.trim()) { toast('Type some code first'); return; }
    showStrip('Getting a suggestion…');
    try {
      const text = await serverSuggest(lang, before);
      pendingSug = { text: text, cm: cm, lang: lang };
      showAc(text, cm, cm.getCursor());
    } catch (e) {
      toast('AI unavailable — set GEMINI_API_KEY in the server env');
    } finally {
      hideStrip();
    }
  }
  function suggestLang() {
    return activeLang === 'code' ? codeLang : activeLang;
  }
  function showStrip(text) {
    aiStripText.textContent = text;
    aiStrip.hidden = false;
  }
  function hideStrip() { aiStrip.hidden = true; }
  function showAc(text, cm, pos) {
    acBox.innerHTML = '<span class="ac-label">AI Suggestion — press Tab or click to insert</span>' +
      '<div>' + text.replace(/</g, '&lt;') + '</div>' +
      '<div class="ac-hint">Esc to dismiss</div>';
    acBox.hidden = false;
    const coords = cm.cursorCoords(pos, 'page');
    let left = coords.left;
    let top = coords.bottom + 6;
    if (left + 420 > window.innerWidth) left = Math.max(8, window.innerWidth - 430);
    if (top + 190 > window.innerHeight) top = Math.max(8, coords.top - 196);
    acBox.style.left = left + 'px';
    acBox.style.top = top + 'px';
    acBox.onclick = () => insertSuggestion();
  }
  function hideAc() { acBox.hidden = true; acBox.onclick = null; }
  function insertSuggestion() {
    if (!pendingSug) return;
    pendingSug.cm.replaceSelection(pendingSug.text);
    pendingSug = null;
    hideAc();
    toast('Suggestion inserted');
    scheduleSave();
  }
  function aiTab(cm) {
    if (pendingSug && pendingSug.cm === cm) { insertSuggestion(); return; }
    requestSuggestion(cm, suggestLang());
  }
  function defaultTab(cm) {
    if (cm.somethingSelected()) cm.indentSelection('add');
    else cm.replaceSelection('  ');
  }
  function setAi(on) {
    aiOn = on;
    aiToggleBtn.classList.toggle('on', on);
    aiState.textContent = on ? 'On' : 'Off';
    const keys = on
      ? { Tab: aiTab, Esc: () => { pendingSug = null; hideAc(); } }
      : { Tab: defaultTab };
    Object.keys(editors).forEach(l => editors[l].setOption('extraKeys', keys));
    if (!on) { pendingSug = null; hideAc(); }
    toast(on ? 'AI Suggest on — press Tab for suggestions' : 'AI Suggest off');
  }

  // ── Download ──
  function saveBlob(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  }
  function download(name, content, type) {
    saveBlob(new Blob([content], { type: type }), name);
  }
  async function downloadZip() {
    if (typeof JSZip === 'undefined') { toast('Zip library not loaded'); return; }
    const zip = new JSZip();
    zip.file('index.html', buildDoc());
    zip.file('style.css', editors.css.getValue());
    zip.file('script.js', editors.js.getValue());
    const L = LANGS[codeLang];
    zip.file('code.' + (L ? L.ext : 'txt'), editors.code.getValue());
    const blob = await zip.generateAsync({ type: 'blob' });
    saveBlob(blob, 'project.zip');
    toast('Project downloaded');
  }

  // ── Fullscreen ──
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      workspace.classList.add('fs');
      const req = workspace.requestFullscreen || workspace.webkitRequestFullscreen;
      if (req) req.call(workspace).catch(() => {});
    } else {
      (document.exitFullscreen || document.webkitExitFullscreen || (() => {})).call(document);
    }
  }
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) workspace.classList.remove('fs');
  });

  // ── Resize split ──
  const handle = $('resizeHandle');
  let dragging = false;
  handle.addEventListener('mousedown', e => {
    dragging = true;
    handle.classList.add('active');
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const r = workspace.getBoundingClientRect();
    let pct = ((e.clientX - r.left) / r.width) * 100;
    pct = Math.max(22, Math.min(78, pct));
    editorsPanel.style.flex = '0 0 ' + pct + '%';
    debounce(refreshAll, 150)();
  });
  document.addEventListener('mouseup', () => {
    dragging = false;
    handle.classList.remove('active');
  });

  // ── Wire up ──
  runBtn.addEventListener('click', () => { run(); toast('Preview updated'); });
  refreshBtn.addEventListener('click', () => { run(); toast('Preview refreshed'); });
  refreshBtn2.addEventListener('click', () => { run(); toast('Preview refreshed'); });

  fwSel.addEventListener('change', () => { loadTemplate(fwSel.value); toast('Loaded ' + fwSel.value + ' template'); });

  aiToggleBtn.addEventListener('click', () => setAi(!aiOn));

  downloadBtn.addEventListener('click', e => { e.stopPropagation(); dlMenu.hidden = !dlMenu.hidden; });
  dlMenu.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    const t = b.dataset.dl;
    if (t === 'html') download('index.html', buildDoc(), 'text/html');
    else if (t === 'css') download('style.css', editors.css.getValue(), 'text/css');
    else if (t === 'js') download('script.js', editors.js.getValue(), 'text/javascript');
    else if (t === 'code') { const L = LANGS[codeLang]; download('code.' + (L ? L.ext : 'txt'), editors.code.getValue(), 'text/plain'); }
    else if (t === 'zip') downloadZip();
    dlMenu.hidden = true;
  });
  document.addEventListener('click', () => { dlMenu.hidden = true; });

  fullBtn.addEventListener('click', toggleFullscreen);
  fullBtn2.addEventListener('click', toggleFullscreen);

  clearBtn.addEventListener('click', () => {
    if (confirm('Clear all code?')) {
      WEB_ORDER.forEach(l => editors[l].setValue(''));
      editors.code.setValue('');
      run();
      saveState(true);
      toast('Editor cleared');
    }
  });

  tabBar.addEventListener('click', e => {
    const t = e.target.closest('.tab');
    if (t) setTab(t.dataset.tab);
  });

  // editor events (web editors feed the preview)
  WEB_ORDER.forEach(lang => {
    const cm = editors[lang];
    cm.on('change', () => { runTimer = debounce(run, 600); runTimer(); scheduleSave(); });
    cm.on('focus', () => { activeLang = lang; setSbLang(lang); updateCursor(cm); updateWords(cm); });
    cm.on('cursorActivity', () => { if (activeLang === lang) { updateCursor(cm); updateWords(cm); } });
  });

  // code editor (no preview, autosave only)
  editors.code.on('change', () => scheduleSave());
  editors.code.on('focus', () => { activeLang = 'code'; setSbLang('code'); updateCursor(editors.code); updateWords(editors.code); });
  editors.code.on('cursorActivity', () => { if (activeLang === 'code') { updateCursor(editors.code); updateWords(editors.code); } });

  // keyboard shortcuts
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); toast('Preview updated'); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); saveState(); toast('Saved'); }
  });

  window.addEventListener('resize', debounce(refreshAll, 250));

  // ── Boot ──
  restoreState();
  applyCodeMode(codeLang);
  setTab('html');
  setAi(false);
  setSbLang('html');
  updateWords(editors.html);
  refreshAll();
})();
