// ============================================================
//  KidBrainBreak — IPA Keyboard Component
// ============================================================

const IPA_SECTIONS = [
  {
    label: 'Consonants',
    keys: [
      'p','b','t','d','k','g',
      'f','v','θ','ð','s','z',
      'ʃ','ʒ','h','m','n','ŋ',
      'tʃ','dʒ','l','r','j','w',
      'ʔ','x','ɣ'
    ]
  },
  {
    label: 'Vowels — Short',
    keys: ['ɪ','ʊ','e','ə','æ','ʌ','ɒ','ɛ','ɔ','ɑ']
  },
  {
    label: 'Vowels — Long',
    keys: ['iː','uː','ɑː','ɔː','ɜː']
  },
  {
    label: 'Diphthongs',
    keys: ['eɪ','aɪ','ɔɪ','aʊ','əʊ','ɪə','eə','ʊə']
  },
  {
    label: 'Stress & Notation',
    keys: ['ˈ','ˌ','.','|','‖']
  }
];

export class IpaKeyboard {
  constructor(container, onChange) {
    this.container = container;
    this.onChange  = onChange;
    this.value     = '';
    this._build();
  }

  getValue() { return this.value; }

  _append(symbol) {
    this.value += symbol;
    this._updateDisplay();
    if (this.onChange) this.onChange(this.value);
  }

  _backspace() {
    // Handle multi-char symbols (e.g. 'tʃ', 'dʒ', 'eɪ')
    if (!this.value) return;
    // Try removing the last 2 chars if it's a known ligature
    const twoChar = this.value.slice(-2);
    const knownTwo = IPA_SECTIONS.flatMap(s => s.keys).filter(k => k.length === 2);
    if (knownTwo.includes(twoChar)) {
      this.value = this.value.slice(0, -2);
    } else {
      this.value = [...this.value].slice(0, -1).join('');
    }
    this._updateDisplay();
    if (this.onChange) this.onChange(this.value);
  }

  _updateDisplay() {
    const display = this.container.querySelector('.kbb-ipa-input-display');
    if (display) {
      display.innerHTML = this.value
        ? `<span>${this.value}</span><span class="kbb-ipa-cursor"></span>`
        : `<span class="kbb-ipa-cursor"></span>`;
    }
  }

  _build() {
    const wrap = document.createElement('div');
    wrap.className = 'kbb-ipa-wrap';

    // Input display
    const display = document.createElement('div');
    display.className = 'kbb-ipa-input-display';
    display.innerHTML = '<span class="kbb-ipa-cursor"></span>';
    wrap.appendChild(display);

    // Brackets row
    const bracketRow = document.createElement('div');
    bracketRow.className = 'kbb-ipa-row';
    ['[', ']', '/', '/'].forEach((ch, i) => {
      const btn = document.createElement('button');
      btn.className = 'kbb-ipa-key slash';
      btn.textContent = ch;
      btn.title = i < 2 ? 'Phonetic brackets' : 'Phonemic slashes';
      btn.addEventListener('click', () => this._append(ch));
      bracketRow.appendChild(btn);
    });

    // Space key
    const spaceBtn = document.createElement('button');
    spaceBtn.className = 'kbb-ipa-key space';
    spaceBtn.textContent = 'SPACE';
    spaceBtn.addEventListener('click', () => this._append(' '));
    bracketRow.appendChild(spaceBtn);

    // Backspace key
    const backBtn = document.createElement('button');
    backBtn.className = 'kbb-ipa-key backspace';
    backBtn.textContent = '⌫ Delete';
    backBtn.addEventListener('click', () => this._backspace());
    bracketRow.appendChild(backBtn);
    wrap.appendChild(bracketRow);

    // IPA sections
    IPA_SECTIONS.forEach(section => {
      const label = document.createElement('div');
      label.className = 'kbb-ipa-section-label';
      label.textContent = section.label;
      wrap.appendChild(label);

      const row = document.createElement('div');
      row.className = 'kbb-ipa-row';

      section.keys.forEach(symbol => {
        const btn = document.createElement('button');
        btn.className = 'kbb-ipa-key';
        btn.textContent = symbol;
        btn.title = symbol;
        btn.addEventListener('click', () => this._append(symbol));
        row.appendChild(btn);
      });
      wrap.appendChild(row);
    });

    this.container.appendChild(wrap);
  }
}
