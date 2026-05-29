// ============================================================
//  KidBrainBreak — All Question Type Components
// ============================================================

// ── Helpers ──────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

// ── MultipleChoice ───────────────────────────────────────────
export class MultipleChoice {
  constructor(container, q, onReady) {
    this.q         = q;
    this.selected  = null;
    const letters  = ['A','B','C','D'];
    const opts     = shuffle(q.options);

    const grid = el('div', 'kbb-mc-options');
    opts.forEach((opt, i) => {
      const btn = el('button', 'kbb-mc-option');
      btn.dataset.letter = letters[i];
      btn.dataset.value  = opt;
      btn.textContent    = opt;
      btn.addEventListener('click', () => {
        grid.querySelectorAll('.kbb-mc-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selected = opt;
        onReady(true);
      });
      grid.appendChild(btn);
    });
    container.appendChild(grid);
    this._grid = grid;
  }

  validate() {
    const correct = this.selected === this.q.answer;
    this._grid.querySelectorAll('.kbb-mc-option').forEach(btn => {
      if (btn.dataset.value === this.q.answer) btn.classList.add('correct');
      else if (btn.dataset.value === this.selected && !correct) btn.classList.add('wrong');
    });
    return correct;
  }
}

// ── TrueFalse ───────────────────────────────────────────────
export class TrueFalse {
  constructor(container, q, onReady) {
    this.q        = q;
    this.selected = null;

    const grid = el('div', 'kbb-tf-options');
    [
      { label: '✅ True',  val: true  },
      { label: '❌ False', val: false }
    ].forEach(item => {
      const btn = el('button', 'kbb-tf-option');
      btn.dataset.val = item.val;
      btn.textContent = item.label;
      btn.addEventListener('click', () => {
        grid.querySelectorAll('.kbb-tf-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selected = item.val;
        onReady(true);
      });
      grid.appendChild(btn);
    });
    container.appendChild(grid);
    this._grid = grid;
  }

  validate() {
    return this.selected === this.q.answer;
  }
}

// ── FillInTheBlanks ──────────────────────────────────────────
export class FillInTheBlanks {
  constructor(container, q, onReady) {
    this.q      = q;
    this.inputs = [];

    const wrapper = el('div', 'kbb-fib-wrap');
    // Build text with inputs injected for each blank marker
    const parts = q.prompt.split('___');
    parts.forEach((part, i) => {
      const span = el('span', 'kbb-fib-text');
      span.textContent = part;
      wrapper.appendChild(span);

      if (i < parts.length - 1) {
        const input = el('input', 'kbb-fib-input');
        input.type        = 'text';
        input.placeholder = '?';
        input.size        = Math.max(8, (q.blanks[i] || '').length + 2);
        input.addEventListener('input', () => {
          onReady(this.inputs.every(inp => inp.value.trim() !== ''));
        });
        wrapper.appendChild(input);
        this.inputs.push(input);
      }
    });
    container.appendChild(wrapper);
  }

  validate() {
    let allCorrect = true;
    this.inputs.forEach((input, i) => {
      const correct = input.value.trim().toLowerCase() === (this.q.blanks[i] || '').toLowerCase();
      input.classList.toggle('correct', correct);
      input.classList.toggle('wrong', !correct);
      if (!correct) allCorrect = false;
    });
    return allCorrect;
  }
}

// ── ConnectTerms ─────────────────────────────────────────────
export class ConnectTerms {
  constructor(container, q, onReady) {
    this.q         = q;
    this.matches   = {};
    this._selected = null;
    this._leftMap  = {};
    this._rightMap = {};

    const shuffledPairs = shuffle(q.pairs);
    const leftItems     = shuffledPairs.map(p => p.left);
    const rightItems    = shuffle(shuffledPairs.map(p => p.right));

    const grid = el('div', 'kbb-connect-grid');
    const leftCol  = el('div', 'kbb-connect-col');
    const rightCol = el('div', 'kbb-connect-col');

    leftItems.forEach(text => {
      const item = el('div', 'kbb-connect-item');
      item.textContent   = text;
      item.dataset.side  = 'left';
      item.dataset.value = text;
      leftCol.appendChild(item);
      this._leftMap[text] = item;
    });

    rightItems.forEach(text => {
      const item = el('div', 'kbb-connect-item');
      item.textContent   = text;
      item.dataset.side  = 'right';
      item.dataset.value = text;
      rightCol.appendChild(item);
      this._rightMap[text] = item;
    });

    grid.appendChild(leftCol);
    grid.appendChild(rightCol);
    container.appendChild(grid);

    grid.addEventListener('click', e => {
      const item = e.target.closest('.kbb-connect-item');
      if (!item || item.classList.contains('matched')) return;
      this._handleClick(item, onReady);
    });

    this._grid = grid;
  }

  _handleClick(item, onReady) {
    if (!this._selected) {
      // Select first item (must be left)
      if (item.dataset.side !== 'left') return;
      this._clearSelection();
      item.classList.add('selected');
      this._selected = item;
    } else {
      // If clicking a different left item, re-select
      if (item.dataset.side === 'left') {
        this._clearSelection();
        item.classList.add('selected');
        this._selected = item;
        return;
      }

      // Try to match
      const leftVal  = this._selected.dataset.value;
      const rightVal = item.dataset.value;
      const pair     = this.q.pairs.find(p => p.left === leftVal);

      if (pair && pair.right === rightVal) {
        // Correct match
        this._selected.classList.remove('selected');
        this._selected.classList.add('matched');
        item.classList.add('matched');
        this.matches[leftVal] = rightVal;
        this._selected = null;

        const total = Object.keys(this.matches).length;
        onReady(total === this.q.pairs.length);
      } else {
        // Wrong
        item.classList.add('wrong');
        this._selected.classList.add('wrong');
        setTimeout(() => {
          item.classList.remove('wrong');
          this._selected && this._selected.classList.remove('wrong', 'selected');
          this._selected = null;
        }, 600);
      }
    }
  }

  _clearSelection() {
    this._grid.querySelectorAll('.kbb-connect-item.selected').forEach(i => i.classList.remove('selected'));
  }

  validate() {
    return Object.keys(this.matches).length === this.q.pairs.length;
  }
}

// ── OrganizeTags ─────────────────────────────────────────────
export class OrganizeTags {
  constructor(container, q, onReady) {
    this.q        = q;
    this.placed   = {};
    this._onReady = onReady;

    const COLORS = ['#7b61ff','#ff61b6','#00e5ff','#ffe456','#4dffb4','#ff9d4d'];

    // Tag pool
    const poolLabel = el('div', 'kbb-bucket-label', '🏷️ Drag these tags:');
    const pool      = el('div', 'kbb-org-tags');
    pool.id         = 'kbb-tag-pool';

    const shuffledItems = shuffle(q.items);
    shuffledItems.forEach((item, i) => {
      const tag = this._makeTag(item.text, COLORS[i % COLORS.length]);
      pool.appendChild(tag);
    });

    container.appendChild(poolLabel);
    container.appendChild(pool);

    // Buckets
    q.buckets.forEach((bucket, bi) => {
      const label = el('div', 'kbb-bucket-label');
      label.innerHTML = `<span style="color:${COLORS[bi % COLORS.length]}">●</span> ${bucket}`;

      const bkt = el('div', 'kbb-bucket');
      bkt.dataset.bucket = bucket;

      // Drag events on bucket
      bkt.addEventListener('dragover', e => { e.preventDefault(); bkt.classList.add('over'); });
      bkt.addEventListener('dragleave', () => bkt.classList.remove('over'));
      bkt.addEventListener('drop', e => {
        e.preventDefault();
        bkt.classList.remove('over');
        const tagText = e.dataTransfer.getData('text/plain');
        const tagEl   = document.querySelector(`[data-tag="${tagText}"]`) ||
                        container.querySelector(`[data-tag="${tagText}"]`);
        if (tagEl) {
          bkt.appendChild(tagEl);
          this.placed[tagText] = bucket;
          this._check();
        }
      });

      container.appendChild(label);
      container.appendChild(bkt);
    });

    // Re-enable drop on pool
    pool.addEventListener('dragover', e => e.preventDefault());
    pool.addEventListener('drop', e => {
      e.preventDefault();
      const tagText = e.dataTransfer.getData('text/plain');
      const tagEl   = container.querySelector(`[data-tag="${tagText}"]`);
      if (tagEl) {
        pool.appendChild(tagEl);
        delete this.placed[tagText];
        this._check();
      }
    });

    this._container = container;
    this._q = q;
  }

  _makeTag(text, color) {
    const tag          = el('div', 'kbb-tag');
    tag.textContent    = text;
    tag.draggable      = true;
    tag.dataset.tag    = text;
    tag.style.background = `linear-gradient(135deg, ${color}99, ${color}44)`;
    tag.style.border     = `2px solid ${color}66`;
    tag.style.color      = color;

    tag.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', text);
      tag.classList.add('dragging');
    });
    tag.addEventListener('dragend', () => tag.classList.remove('dragging'));
    return tag;
  }

  _check() {
    const total = this._q.items.length;
    const done  = Object.keys(this.placed).length;
    this._onReady(done === total);
  }

  validate() {
    return this._q.items.every(item => this.placed[item.text] === item.bucket);
  }
}

// ── WordScramble ─────────────────────────────────────────────
export class WordScramble {
  constructor(container, q, onReady) {
    this.q      = q;
    this.answer = [];
    this._onReady = onReady;

    const wrap   = el('div', 'kbb-scramble-area');
    const pool   = el('div', 'kbb-scramble-letters');
    const ansRow = el('div', 'kbb-scramble-answer');

    pool.innerHTML   = '<div class="kbb-bucket-label" style="width:100%">🔀 Click tiles to build the answer:</div>';
    ansRow.innerHTML = '<div class="kbb-bucket-label" style="width:100%">✏️ Your answer:</div>';

    const shuffled = shuffle([...q.scrambled]);
    shuffled.forEach(letter => {
      const tile = this._makeTile(letter, () => {
        ansRow.appendChild(tile);
        this.answer.push(letter);
        this._checkReady();
      });
      pool.appendChild(tile);
    });

    ansRow.addEventListener('click', e => {
      const tile = e.target.closest('.kbb-scr-tile');
      if (!tile) return;
      pool.appendChild(tile);
      this.answer = this.answer.filter(l => l !== tile.dataset.letter || (this.answer.splice(this.answer.indexOf(tile.dataset.letter), 1), false));
      // Rebuild answer from tiles in ansRow
      this.answer = [...ansRow.querySelectorAll('.kbb-scr-tile')].map(t => t.dataset.letter);
      this._checkReady();
    });

    wrap.appendChild(pool);
    wrap.appendChild(ansRow);
    container.appendChild(wrap);
    this._ansRow = ansRow;
  }

  _makeTile(letter, onClick) {
    const tile = el('div', 'kbb-scr-tile');
    tile.textContent    = letter;
    tile.dataset.letter = letter;
    tile.addEventListener('click', onClick);
    return tile;
  }

  _checkReady() {
    const ans = [...this._ansRow.querySelectorAll('.kbb-scr-tile')].map(t => t.dataset.letter);
    this._onReady(ans.length === this.q.scrambled.length);
    this.answer = ans;
  }

  validate() {
    return this.answer.join('') === this.q.answer;
  }
}

// ── OddOneOut ────────────────────────────────────────────────
export class OddOneOut {
  constructor(container, q, onReady) {
    this.q        = q;
    this.selected = null;

    const grid = el('div', 'kbb-odd-grid');
    shuffle(q.options).forEach(opt => {
      const item = el('div', 'kbb-odd-item');
      item.textContent    = opt;
      item.dataset.value  = opt;
      item.addEventListener('click', () => {
        grid.querySelectorAll('.kbb-odd-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        this.selected = opt;
        onReady(true);
      });
      grid.appendChild(item);
    });
    container.appendChild(grid);
    this._grid = grid;
  }

  validate() {
    const correct = this.selected === this.q.answer;
    this._grid.querySelectorAll('.kbb-odd-item').forEach(i => {
      if (i.dataset.value === this.q.answer) i.classList.add('correct');
      else if (i.dataset.value === this.selected && !correct) i.classList.add('wrong');
    });
    return correct;
  }
}

// ── CategorizeItems ───────────────────────────────────────────
export class CategorizeItems {
  // Same logic as OrganizeTags but with category items
  constructor(container, q, onReady) {
    // Reuse OrganizeTags with normalized structure
    const normalized = {
      buckets: q.categories,
      items: q.items.map(item => ({ text: item.text, bucket: item.category }))
    };
    this._inner = new OrganizeTags(container, normalized, onReady);
  }
  validate() { return this._inner.validate(); }
}

// ── SequenceOrder ─────────────────────────────────────────────
export class SequenceOrder {
  constructor(container, q, onReady) {
    this.q        = q;
    this._onReady = onReady;
    this._dragSrc = null;

    const list = el('div', 'kbb-seq-list');
    const items = shuffle([...q.correctOrder]);

    items.forEach((text, i) => {
      const row = this._makeRow(text, i + 1);
      list.appendChild(row);
    });

    container.appendChild(list);
    this._list = list;

    // Notify immediately (they can submit in any order)
    onReady(true);
  }

  _makeRow(text, num) {
    const row = el('div', 'kbb-seq-item');
    row.draggable = true;
    row.dataset.text = text;
    row.innerHTML = `
      <span class="kbb-seq-handle">⠿</span>
      <span class="kbb-seq-num">${num}</span>
      <span>${text}</span>
    `;

    row.addEventListener('dragstart', () => {
      this._dragSrc = row;
      row.classList.add('dragging');
    });
    row.addEventListener('dragend', () => row.classList.remove('dragging'));
    row.addEventListener('dragover', e => { e.preventDefault(); row.classList.add('drag-over'); });
    row.addEventListener('dragleave', () => row.classList.remove('drag-over'));
    row.addEventListener('drop', e => {
      e.preventDefault();
      row.classList.remove('drag-over');
      if (this._dragSrc && this._dragSrc !== row) {
        const list = this._list;
        const rows = [...list.children];
        const srcI = rows.indexOf(this._dragSrc);
        const tgtI = rows.indexOf(row);
        if (srcI < tgtI) list.insertBefore(this._dragSrc, row.nextSibling);
        else             list.insertBefore(this._dragSrc, row);
        this._renumber();
      }
    });
    return row;
  }

  _renumber() {
    [...this._list.children].forEach((row, i) => {
      row.querySelector('.kbb-seq-num').textContent = i + 1;
    });
  }

  validate() {
    const current = [...this._list.children].map(r => r.dataset.text);
    return JSON.stringify(current) === JSON.stringify(this.q.correctOrder);
  }
}

// ── SpellItOut ────────────────────────────────────────────────
export class SpellItOut {
  constructor(container, q, onReady) {
    this.q        = q;
    this.typed    = [];
    this._onReady = onReady;

    const answer  = q.answer.toUpperCase();
    const letters = [...new Set([...answer, ...shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(c => !answer.includes(c))).slice(0, 6)])];

    // Display boxes
    const display = el('div', 'kbb-spell-display');
    answer.split('').forEach(() => {
      const box = el('div', 'kbb-letter-box');
      box.textContent = '';
      display.appendChild(box);
    });

    // Backspace btn
    const backBtn = el('button', 'kbb-btn kbb-btn-ghost', '⌫');
    backBtn.style.marginBottom = '10px';
    backBtn.style.fontSize = '18px';
    backBtn.addEventListener('click', () => {
      if (this.typed.length) {
        this.typed.pop();
        this._updateDisplay(display, answer);
        this._onReady(this.typed.length === answer.length);
      }
    });

    // Letter pool
    const pool = el('div', 'kbb-letter-pool');
    shuffle(letters).forEach(ch => {
      const btn = el('button', 'kbb-letter-btn');
      btn.textContent    = ch;
      btn.dataset.letter = ch;
      btn.addEventListener('click', () => {
        if (this.typed.length < answer.length) {
          this.typed.push(ch);
          this._updateDisplay(display, answer);
          this._onReady(this.typed.length === answer.length);
        }
      });
      pool.appendChild(btn);
    });

    container.appendChild(display);
    container.appendChild(backBtn);
    container.appendChild(pool);
    this._display = display;
  }

  _updateDisplay(display, answer) {
    [...display.children].forEach((box, i) => {
      if (this.typed[i]) {
        box.textContent = this.typed[i];
        box.classList.add('filled');
      } else {
        box.textContent = '';
        box.classList.remove('filled');
      }
    });
  }

  validate() {
    return this.typed.join('') === this.q.answer.toUpperCase();
  }
}

// ── ShortAnswer ───────────────────────────────────────────────
export class ShortAnswer {
  constructor(container, q, onReady) {
    this.q = q;

    const input = el('input', 'kbb-short-input');
    input.type        = 'text';
    input.placeholder = 'Type your answer here…';
    input.addEventListener('input', () => onReady(input.value.trim().length > 1));
    input.addEventListener('keydown', e => { if (e.key === 'Enter') onReady(true); });

    container.appendChild(input);
    this._input = input;
  }

  validate() {
    const val      = this._input.value.trim().toLowerCase();
    const accepted = this.q.answers.map(a => a.toLowerCase());
    // Fuzzy: check if any accepted answer is contained in the response
    return accepted.some(a => val === a || val.includes(a) || a.includes(val));
  }
}

// ── IpaTranscription ─────────────────────────────────────────
export class IpaTranscription {
  constructor(container, q, onReady, IpaKeyboardClass) {
    this.q = q;

    const keyboard = new IpaKeyboardClass(container, value => {
      onReady(value.trim().length > 0);
    });
    this._keyboard = keyboard;
  }

  validate() {
    const val      = this._keyboard.getValue().trim();
    const accepted = this.q.answers.map(a => a.trim());
    return accepted.includes(val);
  }
}
