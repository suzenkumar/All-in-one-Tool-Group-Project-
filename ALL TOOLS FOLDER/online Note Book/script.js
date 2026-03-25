  const container = document.getElementById('notesContainer');
  const createBtn = document.getElementById('createBtn');
  const emptyState = document.getElementById('emptyState');

  const placeholders = [
    "Jot something down...",
    "What's on your mind?",
    "Ideas, thoughts, reminders...",
    "Start typing your note...",
    "Today I want to remember...",
  ];

  // ── Storage (uses innerHTML serialization) ──
  function save() {
    // Gather notes as array of objects
    const notes = [...container.querySelectorAll('.note-card')].map(card => ({
      text: card.querySelector('.note-body').innerHTML,
      date: card.querySelector('.note-date').textContent,
    }));
    localStorage.setItem('notesApp_v2', JSON.stringify(notes));
  }

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem('notesApp_v2') || '[]');
      saved.forEach(n => createNote(n.text, n.date));
    } catch (e) { /* fresh start */ }
  }

  function updateEmpty() {
    const hasNotes = container.querySelectorAll('.note-card').length > 0;
    emptyState.style.display = hasNotes ? 'none' : 'flex';
  }

  function formatDate() {
    return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function createNote(text = '', date = '') {
    const card = document.createElement('div');
    card.className = 'note-card lined';

    const tape = document.createElement('div');
    tape.className = 'note-tape';

    const body = document.createElement('div');
    body.className = 'note-body';
    body.contentEditable = 'true';
    body.dataset.placeholder = placeholders[Math.floor(Math.random() * placeholders.length)];
    if (text) body.innerHTML = text;

    const footer = document.createElement('div');
    footer.className = 'note-footer';

    const dateEl = document.createElement('span');
    dateEl.className = 'note-date';
    dateEl.textContent = date || formatDate();

    const delBtn = document.createElement('button');
    delBtn.className = 'btn-delete';
    delBtn.innerHTML = '✕';
    delBtn.title = 'Delete note';
    delBtn.addEventListener('click', () => {
      card.style.transition = 'opacity 0.2s, transform 0.2s';
      card.style.opacity = '0';
      card.style.transform = 'scale(0.85)';
      setTimeout(() => { card.remove(); save(); updateEmpty(); }, 200);
    });

    footer.append(dateEl, delBtn);
    card.append(tape, body, footer);
    container.appendChild(card);

    body.addEventListener('input', save);
    body.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        document.execCommand('insertLineBreak');
        e.preventDefault();
      }
    });

    // Focus new empty notes
    if (!text) {
      requestAnimationFrame(() => body.focus());
    }

    updateEmpty();
    save();
    return card;
  }

  createBtn.addEventListener('click', () => createNote());
  load();
  updateEmpty();