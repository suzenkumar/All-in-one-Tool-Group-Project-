const API_URL = 'https://api.languagetool.org/v2/check';
let lastMatches = [], lastText = '', fixedText = '';

const inputEl = document.getElementById('inputText');
inputEl.addEventListener('input', () => {
  const w = inputEl.value.trim().split(/\s+/).filter(Boolean).length;
  document.getElementById('wcLabel').textContent = w + ' word' + (w !== 1 ? 's' : '');
});

document.getElementById('checkBtn').addEventListener('click', checkGrammar);
inputEl.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') checkGrammar();
});

async function checkGrammar() {
  const text = inputEl.value.trim();
  if (!text) { toast('⚠️ Please enter some text first'); return; }
  const btn = document.getElementById('checkBtn');
  btn.disabled = true;
  btn.classList.add('checking');
  document.getElementById('errBanner').style.display = 'none';
  const lang = document.getElementById('langSelect').value;
  try {
    const body = new URLSearchParams();
    body.append('text', text);
    body.append('language', lang);
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      body: body.toString()
    });
    if (!resp.ok) throw new Error('API returned ' + resp.status);
    const data = await resp.json();
    lastMatches = data.matches || [];
    lastText = text;
    renderResults(text, lastMatches);
  } catch (e) {
    const banner = document.getElementById('errBanner');
    banner.textContent = '❌ Could not reach LanguageTool API. Please check your internet connection and try again. Error: ' + e.message;
    banner.style.display = 'block';
    toast('❌ API error — check connection');
  }
  btn.disabled = false;
  btn.classList.remove('checking');
}

function renderResults(text, matches) {
  const ob = document.getElementById('outputBox');
  ob.className = 'active';
  if (matches.length === 0) {
    ob.textContent = text;
    toast('✅ Perfect! No issues found.');
  } else {
    ob.innerHTML = buildHighlighted(text, matches);
    toast(`Found ${matches.length} issue${matches.length !== 1 ? 's' : ''}`);
  }
  document.getElementById('copyBtn').style.display = 'flex';
  fixedText = applyFixes(text, matches);

  let errors = 0, warnings = 0, style = 0;
  matches.forEach(m => {
    const cat = (m.rule.issueType || '').toLowerCase();
    if (cat === 'misspelling' || cat === 'grammar' || cat === 'typographical') errors++;
    else if (cat === 'style' || cat === 'locale-violation') style++;
    else warnings++;
  });
  const score = Math.max(0, Math.min(100, Math.round(100 - errors*7 - warnings*4 - style*2)));
  document.getElementById('sv1').textContent = errors;
  document.getElementById('sv2').textContent = warnings;
  document.getElementById('sv3').textContent = style;
  document.getElementById('sv4').textContent = score + '%';
  document.getElementById('statsGrid').style.display = 'grid';
  document.getElementById('actionBar').style.display = 'flex';

  const list = document.getElementById('issuesList');
  list.innerHTML = '';
  document.getElementById('issuesBadge').textContent = matches.length;
  document.getElementById('issuesCard').style.display = matches.length ? 'block' : 'none';

  matches.forEach((m, i) => {
    const issueType = (m.rule.issueType || '').toLowerCase();
    let dotCls, icon;
    if (issueType === 'misspelling' || issueType === 'grammar' || issueType === 'typographical') {
      dotCls = 'dot-red'; icon = '✕';
    } else if (issueType === 'style') {
      dotCls = 'dot-blue'; icon = '✦';
    } else {
      dotCls = 'dot-yellow'; icon = '!';
    }
    const original = text.substring(m.offset, m.offset + m.length);
    const suggestions = (m.replacements || []).slice(0, 3).map(r => r.value).join(', ');
    const row = document.createElement('div');
    row.className = 'issue-row';
    row.style.animationDelay = (i * 0.04) + 's';
    row.innerHTML = `
      <div class="issue-dot ${dotCls}">${icon}</div>
      <div class="issue-content">
        <strong>${escHtml(m.message)}</strong>
        <div class="issue-original">"${escHtml(original)}"</div>
        ${suggestions ? `<div class="issue-suggestion">→ ${escHtml(suggestions)}</div>` : ''}
      </div>`;
    list.appendChild(row);
  });
}

function buildHighlighted(text, matches) {
  let result = '', cursor = 0;
  const sorted = [...matches].sort((a,b) => a.offset - b.offset);
  sorted.forEach(m => {
    if (m.offset < cursor) return;
    result += escHtml(text.slice(cursor, m.offset));
    const word = text.substring(m.offset, m.offset + m.length);
    const issueType = (m.rule.issueType || '').toLowerCase();
    let cls = 'err-yellow';
    if (issueType === 'misspelling' || issueType === 'grammar' || issueType === 'typographical') cls = 'err-red';
    else if (issueType === 'style') cls = 'err-blue';
    result += `<mark class="${cls}" title="${escAttr(m.message)}">${escHtml(word)}</mark>`;
    cursor = m.offset + m.length;
  });
  result += escHtml(text.slice(cursor));
  return result;
}

function applyFixes(text, matches) {
  const sorted = [...matches].sort((a,b) => b.offset - a.offset);
  let result = text;
  sorted.forEach(m => {
    if (m.replacements && m.replacements.length > 0) {
      result = result.slice(0, m.offset) + m.replacements[0].value + result.slice(m.offset + m.length);
    }
  });
  return result;
}

document.getElementById('applyBtn').addEventListener('click', () => {
  if (fixedText) {
    inputEl.value = fixedText;
    const w = fixedText.trim().split(/\s+/).filter(Boolean).length;
    document.getElementById('wcLabel').textContent = w + ' word' + (w !== 1 ? 's' : '');
    document.getElementById('outputBox').textContent = fixedText;
    document.getElementById('issuesCard').style.display = 'none';
    document.getElementById('statsGrid').style.display = 'none';
    document.getElementById('actionBar').style.display = 'none';
    toast('✅ All fixes applied!');
  }
});

document.getElementById('clearBtn').addEventListener('click', () => {
  inputEl.value = '';
  document.getElementById('wcLabel').textContent = '0 words';
  document.getElementById('outputBox').className = '';
  document.getElementById('outputBox').innerHTML = `<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg><span>Results will appear here after checking</span></div>`;
  document.getElementById('statsGrid').style.display = 'none';
  document.getElementById('issuesCard').style.display = 'none';
  document.getElementById('actionBar').style.display = 'none';
  document.getElementById('copyBtn').style.display = 'none';
  document.getElementById('errBanner').style.display = 'none';
  lastMatches = []; fixedText = '';
  toast('Cleared!');
});

document.getElementById('copyBtn').addEventListener('click', function() {
  const txt = fixedText || document.getElementById('outputBox').textContent;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(txt).then(() => {
      this.classList.add('ok');
      this.innerHTML = '✓ Copied!';
      setTimeout(() => {
        this.classList.remove('ok');
        this.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>Copy Fixed`;
      }, 2000);
    });
  }
});

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}
function escHtml(s='') {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function escAttr(s='') {
  return s.replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}