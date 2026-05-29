// ============================================================
//  KidBrainBreak — Popup Controller (dist — all modules inlined)
//  Loaded as <script type="module"> from the page context.
//  Accesses Shadow DOM via window.__kbbShadowRoot
// ============================================================

// ════════════════════════════════════════════════════════════
//  INLINED: components/CanvasWheel.js
// ════════════════════════════════════════════════════════════
class CanvasWheel {
  constructor(canvas) {
    this.canvas   = canvas;
    this.ctx      = canvas.getContext('2d');
    this.size     = canvas.width;
    this.cx       = this.size / 2;
    this.cy       = this.size / 2;
    this.radius   = this.size / 2 - 6;
    this.segments = [
      { label: '👤 You Pick!',    color: '#7b61ff', bg: '#2a1f5c' },
      { label: '🎲 System Picks', color: '#ff61b6', bg: '#4a1535' },
      { label: '👤 You Pick!',    color: '#00e5ff', bg: '#003d4d' },
      { label: '🎲 System Picks', color: '#ffe456', bg: '#3d3400' },
      { label: '👤 You Pick!',    color: '#4dffb4', bg: '#003d2a' },
      { label: '🎲 System Picks', color: '#ff9d4d', bg: '#3d2000' },
    ];
    this.angle    = 0;
    this.velocity = 0;
    this.friction = 0.985;
    this.spinning = false;
    this.onFinish = null;
    this._draw();
  }

  spin(onFinish) {
    if (this.spinning) return;
    this.onFinish = onFinish;
    this.spinning = true;
    this.velocity = 0.25 + Math.random() * 0.2;
    this._loop();
  }

  _loop() {
    this.angle    += this.velocity;
    this.velocity *= this.friction;
    this._draw();
    if (this.velocity > 0.002) {
      requestAnimationFrame(() => this._loop());
    } else {
      this.spinning = false;
      this._draw();
      if (this.onFinish) this.onFinish(this._getResult());
    }
  }

  _getResult() {
    const sliceAngle = (2 * Math.PI) / this.segments.length;
    const normalised = ((-this.angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    return this.segments[Math.floor(normalised / sliceAngle) % this.segments.length];
  }

  _draw() {
    const { ctx, cx, cy, radius, angle, segments, size } = this;
    ctx.clearRect(0, 0, size, size);
    const sliceAngle = (2 * Math.PI) / segments.length;

    segments.forEach((seg, i) => {
      const start = angle + i * sliceAngle;
      const end   = start + sliceAngle;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, start, end); ctx.closePath();
      ctx.fillStyle = seg.bg; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(start + sliceAngle / 2);
      ctx.shadowColor = seg.color; ctx.shadowBlur = 10;
      ctx.font = 'bold 13px Nunito,sans-serif'; ctx.textAlign = 'center';
      ctx.textBaseline = 'middle'; ctx.fillStyle = seg.color;
      ctx.fillText(seg.label, radius * 0.62, 0); ctx.restore();
    });

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 32);
    grad.addColorStop(0, '#2a2a5a'); grad.addColorStop(1, '#13132b');
    ctx.beginPath(); ctx.arc(cx, cy, 32, 0, 2 * Math.PI);
    ctx.fillStyle = grad; ctx.fill();
    ctx.strokeStyle = 'rgba(123,97,255,0.6)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.font = '22px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff'; ctx.shadowBlur = 0;
    ctx.fillText('🧠', cx, cy);
  }
}

// ════════════════════════════════════════════════════════════
//  INLINED: components/Confetti.js
// ════════════════════════════════════════════════════════════
class Confetti {
  constructor(canvas) {
    this.canvas   = canvas;
    this.ctx      = canvas.getContext('2d');
    this.pieces   = [];
    this._running = false;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }
  resize() { this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; }
  burst(count = 120) {
    const colors = ['#7b61ff','#ff61b6','#00e5ff','#ffe456','#4dffb4','#ff9d4d','#ff5252'];
    const shapes = ['circle','square','strip'];
    for (let i = 0; i < count; i++) {
      this.pieces.push({
        x: this.canvas.width * (0.3 + Math.random() * 0.4), y: this.canvas.height * 0.4,
        vx: (Math.random() - 0.5) * 12, vy: -(4 + Math.random() * 8),
        rotation: Math.random() * 360, rotSpeed: (Math.random() - 0.5) * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        size: 5 + Math.random() * 10, alpha: 1, gravity: 0.3 + Math.random() * 0.2
      });
    }
    if (!this._running) this._loop();
  }
  _loop() {
    this._running = true;
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.pieces = this.pieces.filter(p => p.alpha > 0.01);
    this.pieces.forEach(p => {
      p.vy += p.gravity; p.x += p.vx; p.y += p.vy;
      p.rotation += p.rotSpeed; p.vx *= 0.99;
      if (p.y > canvas.height * 0.7) p.alpha -= 0.02;
      ctx.save(); ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y); ctx.rotate(p.rotation * Math.PI / 180);
      ctx.fillStyle = p.color;
      if (p.shape === 'circle') { ctx.beginPath(); ctx.arc(0,0,p.size/2,0,2*Math.PI); ctx.fill(); }
      else if (p.shape === 'square') { ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size); }
      else { ctx.fillRect(-p.size,-p.size/4,p.size*2,p.size/2); }
      ctx.restore();
    });
    if (this.pieces.length > 0) requestAnimationFrame(() => this._loop());
    else { this._running = false; ctx.clearRect(0,0,canvas.width,canvas.height); }
  }
}

// ════════════════════════════════════════════════════════════
//  INLINED: components/IpaKeyboard.js
// ════════════════════════════════════════════════════════════
const IPA_SECTIONS = [
  { label: 'Consonants',     keys: ['p','b','t','d','k','g','f','v','θ','ð','s','z','ʃ','ʒ','h','m','n','ŋ','tʃ','dʒ','l','r','j','w','ʔ','x','ɣ'] },
  { label: 'Short Vowels',   keys: ['ɪ','ʊ','e','ə','æ','ʌ','ɒ','ɛ','ɔ','ɑ'] },
  { label: 'Long Vowels',    keys: ['iː','uː','ɑː','ɔː','ɜː'] },
  { label: 'Diphthongs',     keys: ['eɪ','aɪ','ɔɪ','aʊ','əʊ','ɪə','eə','ʊə'] },
  { label: 'Stress',         keys: ['ˈ','ˌ','.','|','‖'] },
];

class IpaKeyboard {
  constructor(container, onChange) {
    this.container = container; this.onChange = onChange; this.value = '';
    this._build();
  }
  getValue() { return this.value; }
  _append(s) { this.value += s; this._update(); if (this.onChange) this.onChange(this.value); }
  _backspace() {
    if (!this.value) return;
    const two = this.value.slice(-2);
    const knownTwo = IPA_SECTIONS.flatMap(s => s.keys).filter(k => k.length >= 2);
    this.value = knownTwo.includes(two) ? this.value.slice(0,-2) : [...this.value].slice(0,-1).join('');
    this._update(); if (this.onChange) this.onChange(this.value);
  }
  _update() {
    const d = this.container.querySelector('.kbb-ipa-input-display');
    if (d) d.innerHTML = this.value
      ? `<span>${this.value}</span><span class="kbb-ipa-cursor"></span>`
      : `<span class="kbb-ipa-cursor"></span>`;
  }
  _build() {
    const wrap = _el('div','kbb-ipa-wrap');
    const display = _el('div','kbb-ipa-input-display'); display.innerHTML = '<span class="kbb-ipa-cursor"></span>';
    wrap.appendChild(display);
    const brow = _el('div','kbb-ipa-row');
    ['[',']','/'].forEach(ch => { const b=_el('button','kbb-ipa-key slash'); b.textContent=ch; b.addEventListener('click',()=>this._append(ch)); brow.appendChild(b); });
    const sp = _el('button','kbb-ipa-key space'); sp.textContent='SPACE'; sp.addEventListener('click',()=>this._append(' ')); brow.appendChild(sp);
    const bk = _el('button','kbb-ipa-key backspace'); bk.textContent='⌫ Del'; bk.addEventListener('click',()=>this._backspace()); brow.appendChild(bk);
    wrap.appendChild(brow);
    IPA_SECTIONS.forEach(sec => {
      const lbl = _el('div','kbb-ipa-section-label'); lbl.textContent = sec.label; wrap.appendChild(lbl);
      const row = _el('div','kbb-ipa-row');
      sec.keys.forEach(sym => { const b=_el('button','kbb-ipa-key'); b.textContent=sym; b.addEventListener('click',()=>this._append(sym)); row.appendChild(b); });
      wrap.appendChild(row);
    });
    this.container.appendChild(wrap);
  }
}

// ════════════════════════════════════════════════════════════
//  INLINED: question-types/QuestionTypes.js
// ════════════════════════════════════════════════════════════
function _shuffle(arr) {
  const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;
}
function _el(tag,cls,html){ const e=document.createElement(tag); if(cls)e.className=cls; if(html)e.innerHTML=html; return e; }

class MultipleChoice {
  constructor(c,q,onReady){ this.q=q; this.selected=null; const letters=['A','B','C','D']; const opts=_shuffle(q.options); const grid=_el('div','kbb-mc-options'); opts.forEach((opt,i)=>{ const btn=_el('button','kbb-mc-option'); btn.dataset.letter=letters[i]; btn.dataset.value=opt; btn.textContent=opt; btn.addEventListener('click',()=>{ grid.querySelectorAll('.kbb-mc-option').forEach(b=>b.classList.remove('selected')); btn.classList.add('selected'); this.selected=opt; onReady(true); }); grid.appendChild(btn); }); c.appendChild(grid); this._grid=grid; }
  validate(){ const ok=this.selected===this.q.answer; this._grid.querySelectorAll('.kbb-mc-option').forEach(btn=>{ if(btn.dataset.value===this.q.answer)btn.classList.add('correct'); else if(btn.dataset.value===this.selected&&!ok)btn.classList.add('wrong'); }); return ok; }
}

class TrueFalse {
  constructor(c,q,onReady){ this.q=q; this.selected=null; const grid=_el('div','kbb-tf-options'); [{label:'✅ True',val:true},{label:'❌ False',val:false}].forEach(item=>{ const btn=_el('button','kbb-tf-option'); btn.dataset.val=item.val; btn.textContent=item.label; btn.addEventListener('click',()=>{ grid.querySelectorAll('.kbb-tf-option').forEach(b=>b.classList.remove('selected')); btn.classList.add('selected'); this.selected=item.val; onReady(true); }); grid.appendChild(btn); }); c.appendChild(grid); }
  validate(){ return this.selected===this.q.answer; }
}

class FillInTheBlanks {
  constructor(c,q,onReady){ this.q=q; this.inputs=[]; const wrapper=_el('div','kbb-fib-wrap'); const parts=q.prompt.split('___'); parts.forEach((part,i)=>{ const s=_el('span','kbb-fib-text'); s.textContent=part; wrapper.appendChild(s); if(i<parts.length-1){ const inp=_el('input','kbb-fib-input'); inp.type='text'; inp.placeholder='?'; inp.size=Math.max(8,(q.blanks[i]||'').length+2); inp.addEventListener('input',()=>onReady(this.inputs.every(x=>x.value.trim()!==''))); wrapper.appendChild(inp); this.inputs.push(inp); } }); c.appendChild(wrapper); }
  validate(){ let ok=true; this.inputs.forEach((inp,i)=>{ const correct=inp.value.trim().toLowerCase()===(this.q.blanks[i]||'').toLowerCase(); inp.classList.toggle('correct',correct); inp.classList.toggle('wrong',!correct); if(!correct)ok=false; }); return ok; }
}

class ConnectTerms {
  constructor(c,q,onReady){ this.q=q; this.matches={}; this._selected=null; const pairs=_shuffle(q.pairs); const lefts=pairs.map(p=>p.left); const rights=_shuffle(pairs.map(p=>p.right)); const grid=_el('div','kbb-connect-grid'); const lc=_el('div','kbb-connect-col'); const rc=_el('div','kbb-connect-col'); lefts.forEach(t=>{ const item=_el('div','kbb-connect-item'); item.textContent=t; item.dataset.side='left'; item.dataset.value=t; lc.appendChild(item); }); rights.forEach(t=>{ const item=_el('div','kbb-connect-item'); item.textContent=t; item.dataset.side='right'; item.dataset.value=t; rc.appendChild(item); }); grid.appendChild(lc); grid.appendChild(rc); c.appendChild(grid); grid.addEventListener('click',e=>{ const item=e.target.closest('.kbb-connect-item'); if(!item||item.classList.contains('matched'))return; this._handleClick(item,q,onReady,grid); }); this._grid=grid; }
  _handleClick(item,q,onReady,grid){ if(!this._selected){ if(item.dataset.side!=='left')return; grid.querySelectorAll('.kbb-connect-item.selected').forEach(x=>x.classList.remove('selected')); item.classList.add('selected'); this._selected=item; } else { if(item.dataset.side==='left'){ grid.querySelectorAll('.kbb-connect-item.selected').forEach(x=>x.classList.remove('selected')); item.classList.add('selected'); this._selected=item; return; } const lv=this._selected.dataset.value; const rv=item.dataset.value; const pair=q.pairs.find(p=>p.left===lv); if(pair&&pair.right===rv){ this._selected.classList.remove('selected'); this._selected.classList.add('matched'); item.classList.add('matched'); this.matches[lv]=rv; this._selected=null; onReady(Object.keys(this.matches).length===q.pairs.length); } else { item.classList.add('wrong'); this._selected.classList.add('wrong'); const s=this._selected; setTimeout(()=>{ item.classList.remove('wrong'); s&&s.classList.remove('wrong','selected'); this._selected=null; },600); } } }
  validate(){ return Object.keys(this.matches).length===this.q.pairs.length; }
}

class OrganizeTags {
  constructor(c,q,onReady){ this._q=q; this.placed={}; this._onReady=onReady; const COLORS=['#7b61ff','#ff61b6','#00e5ff','#ffe456','#4dffb4','#ff9d4d']; const poolLabel=_el('div','kbb-bucket-label','🏷️ Drag these tags:'); const pool=_el('div','kbb-org-tags'); pool.id='kbb-tag-pool'; _shuffle(q.items).forEach((item,i)=>{ const tag=this._makeTag(item.text,COLORS[i%COLORS.length]); pool.appendChild(tag); }); c.appendChild(poolLabel); c.appendChild(pool); q.buckets.forEach((bucket,bi)=>{ const lbl=_el('div','kbb-bucket-label'); lbl.innerHTML=`<span style="color:${COLORS[bi%COLORS.length]}">●</span> ${bucket}`; const bkt=_el('div','kbb-bucket'); bkt.dataset.bucket=bucket; bkt.addEventListener('dragover',e=>{e.preventDefault();bkt.classList.add('over');}); bkt.addEventListener('dragleave',()=>bkt.classList.remove('over')); bkt.addEventListener('drop',e=>{ e.preventDefault(); bkt.classList.remove('over'); const t=e.dataTransfer.getData('text/plain'); const te=c.querySelector(`[data-tag="${t}"]`); if(te){bkt.appendChild(te);this.placed[t]=bucket;this._check();} }); c.appendChild(lbl); c.appendChild(bkt); }); pool.addEventListener('dragover',e=>e.preventDefault()); pool.addEventListener('drop',e=>{ e.preventDefault(); const t=e.dataTransfer.getData('text/plain'); const te=c.querySelector(`[data-tag="${t}"]`); if(te){pool.appendChild(te);delete this.placed[t];this._check();} }); }
  _makeTag(text,color){ const tag=_el('div','kbb-tag'); tag.textContent=text; tag.draggable=true; tag.dataset.tag=text; tag.style.background=`linear-gradient(135deg,${color}99,${color}44)`; tag.style.border=`2px solid ${color}66`; tag.style.color=color; tag.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',text);tag.classList.add('dragging');}); tag.addEventListener('dragend',()=>tag.classList.remove('dragging')); return tag; }
  _check(){ this._onReady(Object.keys(this.placed).length===this._q.items.length); }
  validate(){ return this._q.items.every(item=>this.placed[item.text]===item.bucket); }
}

class WordScramble {
  constructor(c,q,onReady){ this.q=q; this.answer=[]; this._onReady=onReady; const wrap=_el('div','kbb-scramble-area'); const pool=_el('div','kbb-scramble-letters'); const ansRow=_el('div','kbb-scramble-answer'); pool.innerHTML='<div class="kbb-bucket-label" style="width:100%">🔀 Click tiles to build the answer:</div>'; ansRow.innerHTML='<div class="kbb-bucket-label" style="width:100%">✏️ Your answer:</div>'; _shuffle([...q.scrambled]).forEach(letter=>{ const tile=this._makeTile(letter,()=>{ ansRow.appendChild(tile); this._syncAnswer(ansRow); }); pool.appendChild(tile); }); ansRow.addEventListener('click',e=>{ const tile=e.target.closest('.kbb-scr-tile'); if(!tile)return; pool.appendChild(tile); this._syncAnswer(ansRow); }); wrap.appendChild(pool); wrap.appendChild(ansRow); c.appendChild(wrap); this._ansRow=ansRow; }
  _makeTile(letter,onClick){ const t=_el('div','kbb-scr-tile'); t.textContent=letter; t.dataset.letter=letter; t.addEventListener('click',onClick); return t; }
  _syncAnswer(ansRow){ this.answer=[...ansRow.querySelectorAll('.kbb-scr-tile')].map(t=>t.dataset.letter); this._onReady(this.answer.length===this.q.scrambled.length); }
  validate(){ return this.answer.join('')===this.q.answer; }
}

class OddOneOut {
  constructor(c,q,onReady){ this.q=q; this.selected=null; const grid=_el('div','kbb-odd-grid'); _shuffle(q.options).forEach(opt=>{ const item=_el('div','kbb-odd-item'); item.textContent=opt; item.dataset.value=opt; item.addEventListener('click',()=>{ grid.querySelectorAll('.kbb-odd-item').forEach(i=>i.classList.remove('selected')); item.classList.add('selected'); this.selected=opt; onReady(true); }); grid.appendChild(item); }); c.appendChild(grid); this._grid=grid; }
  validate(){ const ok=this.selected===this.q.answer; this._grid.querySelectorAll('.kbb-odd-item').forEach(i=>{ if(i.dataset.value===this.q.answer)i.classList.add('correct'); else if(i.dataset.value===this.selected&&!ok)i.classList.add('wrong'); }); return ok; }
}

class CategorizeItems {
  constructor(c,q,onReady){ this._inner=new OrganizeTags(c,{buckets:q.categories,items:q.items.map(i=>({text:i.text,bucket:i.category}))},onReady); }
  validate(){ return this._inner.validate(); }
}

class SequenceOrder {
  constructor(c,q,onReady){ this.q=q; this._dragSrc=null; const list=_el('div','kbb-seq-list'); _shuffle([...q.correctOrder]).forEach((text,i)=>{ list.appendChild(this._makeRow(text,i+1,list)); }); c.appendChild(list); this._list=list; onReady(true); }
  _makeRow(text,num,list){ const row=_el('div','kbb-seq-item'); row.draggable=true; row.dataset.text=text; row.innerHTML=`<span class="kbb-seq-handle">⠿</span><span class="kbb-seq-num">${num}</span><span>${text}</span>`; row.addEventListener('dragstart',()=>{this._dragSrc=row;row.classList.add('dragging');}); row.addEventListener('dragend',()=>row.classList.remove('dragging')); row.addEventListener('dragover',e=>{e.preventDefault();row.classList.add('drag-over');}); row.addEventListener('dragleave',()=>row.classList.remove('drag-over')); row.addEventListener('drop',e=>{ e.preventDefault(); row.classList.remove('drag-over'); if(this._dragSrc&&this._dragSrc!==row){ const rows=[...list.children]; const si=rows.indexOf(this._dragSrc); const ti=rows.indexOf(row); if(si<ti)list.insertBefore(this._dragSrc,row.nextSibling); else list.insertBefore(this._dragSrc,row); this._renumber(list); } }); return row; }
  _renumber(list){ [...list.children].forEach((r,i)=>r.querySelector('.kbb-seq-num').textContent=i+1); }
  validate(){ return JSON.stringify([...this._list.children].map(r=>r.dataset.text))===JSON.stringify(this.q.correctOrder); }
}

class SpellItOut {
  constructor(c,q,onReady){ this.q=q; this.typed=[]; this._onReady=onReady; const ans=q.answer.toUpperCase(); const extra=_shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(ch=>!ans.includes(ch))).slice(0,6); const letters=[...(new Set([...ans,...extra]))]; const display=_el('div','kbb-spell-display'); ans.split('').forEach(()=>{ const box=_el('div','kbb-letter-box'); display.appendChild(box); }); const back=_el('button','kbb-btn kbb-btn-ghost','⌫'); back.style.cssText='margin-bottom:10px;font-size:18px;'; back.addEventListener('click',()=>{ if(this.typed.length){this.typed.pop();this._refresh(display,ans);this._onReady(this.typed.length===ans.length);} }); const pool=_el('div','kbb-letter-pool'); _shuffle(letters).forEach(ch=>{ const btn=_el('button','kbb-letter-btn'); btn.textContent=ch; btn.addEventListener('click',()=>{ if(this.typed.length<ans.length){this.typed.push(ch);this._refresh(display,ans);this._onReady(this.typed.length===ans.length);} }); pool.appendChild(btn); }); c.appendChild(display); c.appendChild(back); c.appendChild(pool); }
  _refresh(display,ans){ [...display.children].forEach((box,i)=>{ box.textContent=this.typed[i]||''; box.classList.toggle('filled',!!this.typed[i]); }); }
  validate(){ return this.typed.join('')===this.q.answer.toUpperCase(); }
}

class ShortAnswer {
  constructor(c,q,onReady){ this.q=q; const inp=_el('input','kbb-short-input'); inp.type='text'; inp.placeholder='Type your answer here…'; inp.addEventListener('input',()=>onReady(inp.value.trim().length>1)); inp.addEventListener('keydown',e=>{if(e.key==='Enter')onReady(true);}); c.appendChild(inp); this._input=inp; }
  validate(){ const v=this._input.value.trim().toLowerCase(); return this.q.answers.map(a=>a.toLowerCase()).some(a=>v===a||v.includes(a)||a.includes(v)); }
}

class IpaTranscription {
  constructor(c,q,onReady){ this.q=q; this._kb=new IpaKeyboard(c,val=>onReady(val.trim().length>0)); }
  validate(){ return this.q.answers.map(a=>a.trim()).includes(this._kb.getValue().trim()); }
}

// ════════════════════════════════════════════════════════════
//  INLINED: core/renderer.js
// ════════════════════════════════════════════════════════════
function renderQuestion(container, question, onReady) {
  container.innerHTML = '';
  switch (question.type) {
    case 'multiple_choice':   return new MultipleChoice(container, question, onReady);
    case 'true_false':        return new TrueFalse(container, question, onReady);
    case 'fill_in_the_blank': return new FillInTheBlanks(container, question, onReady);
    case 'connect_terms':     return new ConnectTerms(container, question, onReady);
    case 'organize_tags':     return new OrganizeTags(container, question, onReady);
    case 'word_scramble':     return new WordScramble(container, question, onReady);
    case 'odd_one_out':       return new OddOneOut(container, question, onReady);
    case 'categorize_items':  return new CategorizeItems(container, question, onReady);
    case 'sequence_order':    return new SequenceOrder(container, question, onReady);
    case 'spell_it_out':      return new SpellItOut(container, question, onReady);
    case 'short_answer':      return new ShortAnswer(container, question, onReady);
    case 'ipa_transcription': return new IpaTranscription(container, question, onReady);
    default:
      container.innerHTML = `<p style="color:#ff5252">⚠️ Unknown type: <code>${question.type}</code></p>`;
      return { validate: () => false };
  }
}

// ════════════════════════════════════════════════════════════
//  INLINED: core/validator.js
// ════════════════════════════════════════════════════════════
function calculateXP({ correct, timeLeft, totalTime, streakDays = 0 }) {
  if (!correct) return 0;
  let xp = 10;
  if (timeLeft > totalTime / 2) xp += 5;
  if (streakDays >= 3) xp = Math.floor(xp * 1.5);
  if (streakDays >= 7) xp = Math.floor(xp * 2);
  return xp;
}

function getResultData(correct) {
  if (correct) {
    return _shuffle([{emoji:'🎉',title:'Brilliant!'},{emoji:'🚀',title:'Nailed it!'},{emoji:'⭐',title:'Superstar!'},{emoji:'🏆',title:'Champion!'},{emoji:'🎯',title:'Spot on!'},{emoji:'💡',title:'Genius!'},{emoji:'🌟',title:'Outstanding!'}])[0];
  }
  return _shuffle([{emoji:'🤔',title:'Not quite…'},{emoji:'💪',title:'Keep going!'},{emoji:'📖',title:'Almost there!'},{emoji:'🌱',title:"You're learning!"}])[0];
}

// ════════════════════════════════════════════════════════════
//  MAIN CONTROLLER
// ════════════════════════════════════════════════════════════
const root    = window.__kbbShadowRoot;
const config  = window.__kbbConfig || {};

const QUESTION_TIME_SEC = 120;
const CATEGORY_LABELS = {
  ipa:      { label: '🔤 IPA Transcriber', cls: 'ipa'      },
  youtube:  { label: '▶️ YouTube Learner',  cls: 'youtube'  },
  academic: { label: '📚 Academic Quiz',    cls: 'academic' }
};

const $  = sel => root.querySelector(sel);

let allQuestions  = null;
let currentCat    = config.category || null;
let currentQ      = null;
let currentComp   = null;
let timerInterval = null;
let timeLeft      = QUESTION_TIME_SEC;
let streakDays    = 0;
let confettiInst  = null;

async function boot() {
  spawnParticles();
  const state = await sendMsg({ type: 'GET_STATE' });
  streakDays = state?.streakDays || 0;
  $('#kbb-streak-count').textContent = streakDays;
  $('#kbb-session-num').textContent  = (config.sessionCount || 0) + 1;
  confettiInst = new Confetti($('#kbb-confetti-canvas'));

  if (config.isFirstToday) { showScreen('wheel'); initWheel(); }
  else if (currentCat)     { await loadAndShowQuestion(currentCat); }
  else                     { showScreen('pick'); initCategoryPicker(); }

  setTimeout(() => { $('#kbb-backdrop').addEventListener('click', dismiss); }, 2500);
}

function initWheel() {
  const canvas = $('#kbb-wheel-canvas');
  const wheel  = new CanvasWheel(canvas);
  $('#kbb-spin-btn').addEventListener('click', () => {
    $('#kbb-spin-btn').disabled = true;
    wheel.spin(async (result) => {
      const resultEl = $('#kbb-spin-result');
      resultEl.textContent = result.label;
      resultEl.style.display = 'block';
      const kidPicks = result.label.includes('You Pick');
      await delay(1800);
      if (kidPicks) { showScreen('pick'); initCategoryPicker(); }
      else {
        const cats = ['ipa','youtube','academic'];
        const cat  = cats[Math.floor(Math.random() * cats.length)];
        await setCategory(cat);
        await loadAndShowQuestion(cat);
      }
    });
  });
}

function initCategoryPicker() {
  $('#kbb-category-cards').addEventListener('click', async e => {
    const card = e.target.closest('.kbb-cat-card');
    if (!card) return;
    await setCategory(card.dataset.cat);
    await loadAndShowQuestion(card.dataset.cat);
  });
}

async function setCategory(cat) {
  currentCat = cat;
  await sendMsg({ type: 'SET_CATEGORY', category: cat });
}

async function loadAndShowQuestion(cat) {
  if (!allQuestions) {
    const res = await sendMsg({ type: 'GET_QUESTIONS' });
    allQuestions = res?.questions;
  }
  const pool = allQuestions?.questions?.[cat] || [];
  if (!pool.length) { showFallback(); return; }
  currentQ = pool[Math.floor(Math.random() * pool.length)];
  showScreen('question');
  renderCurrentQuestion();
}

function renderCurrentQuestion() {
  const q    = currentQ;
  const meta = CATEGORY_LABELS[currentCat] || { label: '🧠', cls: 'academic' };
  const pill = $('#kbb-cat-pill');
  pill.textContent = meta.label;
  pill.className   = `kbb-cat-pill ${meta.cls}`;
  $('#kbb-prompt-text').textContent = q.prompt;

  const hintBtn  = $('#kbb-hint-btn');
  const hintText = $('#kbb-hint-text');
  if (q.hint) {
    hintBtn.style.display = '';
    hintBtn.onclick = () => { hintText.textContent = `💡 ${q.hint}`; hintText.style.display = ''; };
  } else {
    hintBtn.style.display = 'none';
  }
  hintText.style.display = 'none';

  const ytContainer = $('#kbb-yt-container');
  if (q.videoId) {
    $('#kbb-yt-frame').src = `https://www.youtube-nocookie.com/embed/${q.videoId}?autoplay=0&rel=0`;
    ytContainer.style.display = '';
  } else {
    ytContainer.style.display = 'none';
  }

  const area   = $('#kbb-question-area');
  const submit = $('#kbb-submit-btn');
  submit.disabled = true;
  currentComp = renderQuestion(area, q, ready => { submit.disabled = !ready; });
  submit.onclick = () => submitAnswer();
  startTimer();
}

function submitAnswer() {
  stopTimer();
  const correct = currentComp.validate();
  showResult(correct);
}

function startTimer() {
  timeLeft = QUESTION_TIME_SEC;
  updateTimerUI();
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerUI();
    if (timeLeft <= 0) { stopTimer(); submitAnswer(); }
  }, 1000);
}

function stopTimer() { clearInterval(timerInterval); timerInterval = null; }

function updateTimerUI() {
  const mins = String(Math.floor(timeLeft / 60)).padStart(2,'0');
  const secs = String(timeLeft % 60).padStart(2,'0');
  $('#kbb-timer-text').textContent = `${mins}:${secs}`;
  const arc = $('#kbb-timer-arc');
  const frac = timeLeft / QUESTION_TIME_SEC;
  arc.style.strokeDashoffset = 94.25 * (1 - frac);
  if (frac > 0.5)      { arc.style.stroke = 'var(--kbb-green)';  $('#kbb-timer-text').style.color = 'var(--kbb-green)'; }
  else if (frac > 0.2) { arc.style.stroke = 'var(--kbb-yellow)'; $('#kbb-timer-text').style.color = 'var(--kbb-yellow)'; }
  else                 { arc.style.stroke = 'var(--kbb-red)';    $('#kbb-timer-text').style.color = 'var(--kbb-red)'; }
}

function showResult(correct) {
  showScreen('result');
  const xp   = calculateXP({ correct, timeLeft, totalTime: QUESTION_TIME_SEC, streakDays });
  const data = getResultData(correct);
  $('#kbb-result-anim').textContent  = data.emoji;
  $('#kbb-result-title').textContent = data.title;
  $('#kbb-result-title').style.color = correct ? 'var(--kbb-green)' : 'var(--kbb-orange)';
  const expl = currentQ?.explanation || '';
  const explEl = $('#kbb-result-explanation');
  explEl.textContent  = expl;
  explEl.style.display = expl ? '' : 'none';
  $('#kbb-xp-amount').textContent   = xp;
  $('#kbb-xp-bar-wrap').style.display = correct ? '' : 'none';
  if (correct) { confettiInst.burst(150); setTimeout(() => { $('#kbb-xp-fill').style.width = '100%'; }, 200); }
  $('#kbb-next-btn').onclick = async () => { $('#kbb-xp-fill').style.width = '0%'; await loadAndShowQuestion(currentCat); };
  $('#kbb-done-btn').onclick = dismiss;
}

function showScreen(name) {
  ['wheel','pick','question','result'].forEach(s => {
    const el = $(`#kbb-screen-${s}`);
    if (el) el.style.display = s === name ? '' : 'none';
  });
}

function spawnParticles() {
  const container = $('#kbb-particles');
  const colors = ['#7b61ff','#ff61b6','#00e5ff','#ffe456','#4dffb4'];
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.className = 'kbb-particle';
    const size = 4 + Math.random() * 8;
    p.style.cssText = `width:${size}px;height:${size}px;left:${Math.random()*100}%;background:${colors[Math.floor(Math.random()*colors.length)]};animation-duration:${8+Math.random()*12}s;animation-delay:${Math.random()*10}s;`;
    container.appendChild(p);
  }
}

function dismiss() {
  stopTimer();
  const modal = $('#kbb-modal');
  if (modal) modal.style.animation = 'kbb-pop-in 0.3s cubic-bezier(0.6,-0.28,0.74,0.05) reverse forwards';
  const bd = $('#kbb-backdrop');
  if (bd) bd.style.animation = 'kbb-fade-in 0.3s ease reverse forwards';
  setTimeout(() => { if (window.__kbbDismiss) window.__kbbDismiss(); }, 320);
}

function sendMsg(msg) {
  return new Promise(resolve => {
    try { chrome.runtime.sendMessage(msg, resolve); }
    catch (e) { resolve(null); }
  });
}

function showFallback() {
  showScreen('question');
  $('#kbb-prompt-text').textContent = 'No questions found for this category.';
  $('#kbb-question-area').innerHTML = '<p style="color:var(--kbb-text-muted);text-align:center;padding:20px;">🤷 Update your GitHub JSON or local questions.json to add questions!</p>';
  $('#kbb-answer-controls').style.display = 'none';
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// Kick everything off
boot().catch(console.error);
