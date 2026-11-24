import { SECTIONS, LESSONS, sectionById, pathFor, levelName, LETTERS } from './curriculum.js';
import { layout } from './glyphs.js';
import { store } from './store.js';
import { sfx, speak } from './audio.js';
import { Notebook, playStrokes } from './notebook.js';

const app = document.getElementById('app');
const AVATARS = ['🦊', '🐻', '🐼', '🐯', '🐰', '🐸', '🦁', '🐨', '🐵', '🦄', '🐙', '🦉'];
const COLORS = ['#2b3fbf', '#7b2ff7', '#0a9d6c', '#e0457b', '#222b3a'];
const PRAISE = ['Молодец!', 'Отлично!', 'Здорово!', 'Супер!', 'Так держать!', 'Красота!'];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let cleanup = null;

/* ---------- значки ---------- */
const I = {
  back: '<path d="M15 5l-7 7 7 7"/>', next: '<path d="M9 5l7 7-7 7"/>', home: '<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z"/>',
  sound: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
  play: '<path d="M7 4.5v15l12-7.5z"/>', undo: '<path d="M8 5L3.5 9.5 8 14"/><path d="M4 9.5h10a5.5 5.5 0 0 1 0 11h-3"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>', gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.8a3.5 3.5 0 0 1 0 6.4M17.5 14a6.5 6.5 0 0 1 4 6"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM8 7h7M8 11h7"/>', redo: '<path d="M4 12a8 8 0 1 0 2.5-5.8M4 4v5h5"/>', check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', plus: '<path d="M12 5v14M5 12h14"/>',
};
const icon = n => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${I[n]}</svg>`;

/** Буквы из прописей как SVG-картинка */
function glyphSVG(set, keys, { color = 'currentColor', sw = 6.5, cls = '' } = {}) {
  const L = layout(set, keys);
  let y0 = Infinity, y1 = -Infinity;
  for (const s of L.strokes) for (const p of s) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  const pad = sw;
  const d = L.strokes.map(s => 'M' + s.map(p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L') + (s.length < 3 ? 'h.1' : '')).join('');
  return `<svg class="glyph ${cls}" viewBox="${-pad} ${y0 - pad} ${L.w + pad * 2} ${y1 - y0 + pad * 2}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
}
const starsHTML = (n, cls = '') => `<span class="stars ${cls}">${[0, 1, 2].map(i => `<i class="${i < n ? 'on' : ''}">★</i>`).join('')}</span>`;
const labelHTML = (l, color) => l.label.set ? glyphSVG(l.label.set, l.label.keys, { color }) : `<span class="tile-emoji">${l.label.emoji}</span>`;

/* ---------- навигация ---------- */
const go = h => { location.hash = h; };
window.addEventListener('hashchange', route);
function route() {
  cleanup?.(); cleanup = null;
  window.speechSynthesis?.cancel();
  window.scrollTo(0, 0);
  const [name, arg] = decodeURIComponent(location.hash.slice(1)).split('/');
  const p = store.profile;
  if (name === 'new') return viewEdit(null);
  if (!p || name === 'who') return store.state.profiles.length ? viewWho() : viewEdit(null, true);
  if (name === 's' && sectionById(arg)) return viewSection(sectionById(arg));
  if (name === 'l' && LESSONS.has(arg)) return viewLesson(LESSONS.get(arg));
  if (name === 'album') return viewAlbum();
  if (name === 'edit') return viewEdit(p);
  viewHome();
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-go],button,.tile,.card');
  if (b) sfx.tap();
  const g = e.target.closest('[data-go]');
  if (g) go(g.dataset.go);
}, true);
document.addEventListener('pointerdown', () => sfx.unlock(), { once: true });

function nextLesson(p) {
  for (const sid of pathFor(p.age)) for (const l of sectionById(sid).lessons) if (!p.stars[l.id]) return l;
  for (const s of SECTIONS) for (const l of s.lessons) if (!p.stars[l.id]) return l;
  return null;
}
function lessonAfter(l) {
  const ls = sectionById(l.sec).lessons, i = ls.indexOf(l);
  return ls[i + 1] || null;
}

/* ---------- кто пишет? ---------- */
function viewWho() {
  app.innerHTML = `<main class="screen center who">
    <div class="logo">${glyphSVG('c', [...'Прописи'], { color: '#fff', sw: 7 })}</div>
    <h1>Кто сегодня пишет?</h1>
    <div class="who-list">
      ${store.state.profiles.map(p => `<button class="who-card" data-id="${p.id}"><span class="ava">${p.avatar}</span><b>${esc(p.name)}</b><small>${p.age}${p.age >= 10 ? '+' : ''} лет · ⭐ ${store.totalStars(p)}</small></button>`).join('')}
      <button class="who-card add" data-go="new"><span class="ava">${icon('plus')}</span><b>Новый ученик</b><small>&nbsp;</small></button>
    </div></main>`;
  app.querySelectorAll('[data-id]').forEach(b => b.onclick = () => { store.select(b.dataset.id); go('home'); route(); });
}

/* ---------- создание и настройка профиля ---------- */
function viewEdit(p, first) {
  const d = p ? { name: p.name, age: p.age, avatar: p.avatar } : { name: '', age: 0, avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)] };
  const st = store.state;
  app.innerHTML = `<main class="screen center"><div class="panel form">
    ${p || !first ? `<button class="round ghost corner" data-go="${p ? 'home' : 'who'}" aria-label="Назад">${icon('back')}</button>` : ''}
    ${p ? '<h1>Настройки</h1>' : `<div class="logo dark">${glyphSVG('c', [...'Прописи'], { color: '#8e5cf7', sw: 7 })}</div><h1>Давай знакомиться!</h1>`}
    <label class="fld"><span>Как тебя зовут?</span><input id="nm" maxlength="14" placeholder="Имя" autocomplete="off" value="${esc(d.name)}"></label>
    <div class="fld"><span>Сколько тебе лет?</span><div class="chips" id="ages">${[4, 5, 6, 7, 8, 9, 10].map(a => `<button data-a="${a}" class="${d.age === a ? 'on' : ''}">${a}${a === 10 ? '+' : ''}</button>`).join('')}</div>
      <p class="hint" id="lvl">${d.age ? levelName(d.age) : 'От возраста зависит программа и размер букв'}</p></div>
    <div class="fld"><span>Выбери друга</span><div class="chips avas" id="avas">${AVATARS.map(a => `<button data-v="${a}" class="${d.avatar === a ? 'on' : ''}">${a}</button>`).join('')}</div></div>
    ${p ? `<div class="fld"><span>Размер букв</span><div class="chips" id="sizes">${[[-1, 'Мельче'], [0, 'Обычный'], [1, 'Крупнее']].map(([v, t]) => `<button data-s="${v}" class="${(p.size || 0) === v ? 'on' : ''}">${t}</button>`).join('')}</div></div>
    <div class="fld"><span>Для родителей</span>
      <label class="sw"><input type="checkbox" id="snd" ${st.sound ? 'checked' : ''}><i></i>Звуки</label>
      <label class="sw"><input type="checkbox" id="vce" ${st.voice ? 'checked' : ''}><i></i>Озвучка букв голосом</label>
      <label class="sw"><input type="checkbox" id="fng" ${p.finger ? 'checked' : ''}><i></i>Писать и пальцем, и стилусом</label>
      <p class="hint">Если ребёнок пишет Apple Pencil, касания ладони и пальцев не оставляют следов.</p></div>` : ''}
    <button class="big" id="ok" ${d.name && d.age ? '' : 'disabled'}>${p ? 'Готово' : 'Начать!'}</button>
    ${p ? `<div class="row-btns"><button class="link" data-go="who">${icon('users')} Сменить ученика</button><button class="link" id="reset">Сбросить прогресс</button><button class="link danger" id="del">Удалить профиль</button></div>` : ''}
  </div></main>`;
  const $ = s => app.querySelector(s), ok = $('#ok');
  const check = () => { ok.disabled = !(d.name.trim() && d.age); };
  $('#nm').oninput = e => { d.name = e.target.value; check(); };
  const chips = (sel, attr, fn) => $(sel)?.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $(sel).querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); fn(b.dataset[attr]); check();
  });
  chips('#ages', 'a', v => { d.age = +v; $('#lvl').textContent = levelName(d.age); });
  chips('#avas', 'v', v => { d.avatar = v; });
  chips('#sizes', 's', v => { d.size = +v; });
  ok.onclick = () => {
    d.name = d.name.trim();
    if (p) {
      store.update({ ...d, finger: $('#fng').checked });
      store.set('sound', $('#snd').checked); store.set('voice', $('#vce').checked);
    } else store.addProfile(d);
    go('home'); route();
  };
  if (p) {
    $('#reset').onclick = () => { if (confirm(`Сбросить все звёзды у ученика «${p.name}»?`)) { store.resetProgress(); go('home'); } };
    $('#del').onclick = () => { if (confirm(`Удалить профиль «${p.name}» и весь прогресс?`)) { store.remove(p.id); go('who'); route(); } };
  }
}

/* ---------- главная ---------- */
function viewHome() {
  const p = store.profile, path = pathFor(p.age), nxt = nextLesson(p);
  const card = s => {
    const done = s.lessons.filter(l => p.stars[l.id]).length, pct = Math.round(done / s.lessons.length * 100);
    return `<button class="card" style="--c:${s.color}" data-go="s/${s.id}">
      <div class="card-art">${glyphSVG(s.icon.set, s.icon.keys, { color: '#fff', sw: 7 })}</div>
      <div class="card-txt"><b>${s.title}</b><small>${s.sub}</small>
      <div class="bar"><i style="width:${pct}%"></i></div><em>${done} из ${s.lessons.length}</em></div></button>`;
  };
  const rest = SECTIONS.filter(s => !path.includes(s.id));
  app.innerHTML = `<main class="screen home">
    <header class="top">
      <button class="me" data-go="who"><span class="ava">${p.avatar}</span><span><b>Привет, ${esc(p.name)}!</b><small>${levelName(p.age).split(':')[0]}</small></span></button>
      <div class="top-r">
        <button class="pill gold" data-go="album">⭐ <b>${store.totalStars()}</b></button>
        <button class="pill" data-go="album">${icon('book')}<span>Наклейки</span></button>
        <button class="round" data-go="edit" aria-label="Настройки">${icon('gear')}</button>
      </div>
    </header>
    ${nxt ? `<button class="hero" style="--c:${sectionById(nxt.sec).color}" data-go="l/${nxt.id}">
      <div class="hero-art">${labelHTML(nxt, '#fff')}</div>
      <div class="hero-txt"><small>${p.stars && Object.keys(p.stars).length ? 'Продолжим?' : 'Начнём?'} · ${sectionById(nxt.sec).title}</small><b>${nxt.sentences ? 'Предложения' : esc(nxt.title)}</b></div>
      <span class="hero-go">Писать ${icon('next')}</span></button>` : '<div class="hero done" style="--c:#27ae60"><div class="hero-txt"><b>Вся программа пройдена! 🎉</b><small>Можно повторять любые уроки</small></div></div>'}
    <h2>Моя программа</h2>
    <div class="cards">${path.map(id => card(sectionById(id))).join('')}</div>
    ${rest.length ? `<h2>Ещё</h2><div class="cards more">${rest.map(card).join('')}</div>` : ''}
  </main>`;
}

/* ---------- раздел ---------- */
function viewSection(s) {
  const p = store.profile, nxt = s.lessons.find(l => !p.stars[l.id]);
  const wide = !s.lessons[0].label.set || s.id === 'csent';
  app.innerHTML = `<main class="screen section" style="--c:${s.color}">
    <header class="top"><button class="round" data-go="home" aria-label="Назад">${icon('back')}</button>
      <div class="ttl"><b>${s.title}</b><small>${s.sub}</small></div>
      <span class="pill gold">⭐ <b>${s.lessons.reduce((a, l) => a + (p.stars[l.id] || 0), 0)}</b></span></header>
    <div class="tiles ${wide ? 'wide' : ''}">
      ${s.lessons.map((l, i) => `<button class="tile ${p.stars[l.id] ? 'done' : ''} ${l === nxt ? 'next' : ''}" data-go="l/${l.id}">
        <span class="num">${i + 1}</span>
        ${wide ? `<span class="tile-emoji">${l.emoji}</span><span class="tile-t">${esc(l.sentences ? l.sentences[0] : l.title)}</span>${l.words ? `<span class="tile-s">${l.words.map(w => w[0]).join(', ')}</span>` : l.sentences ? `<span class="tile-s">${esc(l.sentences[1])}</span>` : ''}`
          : `<span class="tile-g">${labelHTML(l, s.color)}</span>${l.label.set === 'e' || l.label.set === 'ce' ? `<span class="tile-s">${l.title}</span>` : `<span class="tile-e">${l.emoji}</span>`}`}
        ${starsHTML(p.stars[l.id] || 0)}</button>`).join('')}
    </div></main>`;
  app.querySelector('.tile.next')?.scrollIntoView({ block: 'center' });
}

/* ---------- наклейки ---------- */
function viewAlbum() {
  const p = store.profile;
  const got = ch => p.stars[`print:${ch}`] || p.stars[`clow:${ch}`];
  const n = Object.keys(LETTERS).filter(got).length;
  app.innerHTML = `<main class="screen album">
    <header class="top"><button class="round" data-go="home" aria-label="Назад">${icon('back')}</button>
      <div class="ttl"><b>Альбом наклеек</b><small>Собрано ${n} из 33 · за каждую выученную букву</small></div>
      <span class="pill gold">⭐ <b>${store.totalStars()}</b></span></header>
    <div class="stickers">${Object.entries(LETTERS).map(([ch, [word, emoji]]) => `<div class="sticker ${got(ch) ? 'got' : ''}"><span>${got(ch) ? emoji : '?'}</span><b>${ch.toUpperCase()}${ch}</b><small>${got(ch) ? word : '•••'}</small></div>`).join('')}</div>
  </main>`;
}

/* ---------- урок ---------- */
function viewLesson(l) {
  const p = store.profile, s = sectionById(l.sec), rows = l.rows(p.age);
  let color = p.color || COLORS[0], nb = null, anim = null;
  app.innerHTML = `<main class="screen lesson" style="--c:${s.color}">
    <header class="lbar">
      <button class="round" data-go="s/${s.id}" aria-label="Назад">${icon('back')}</button>
      <button class="ltitle" id="say"><span class="lt-e">${l.emoji}</span><span class="lt-t"><b>${esc(l.sentences ? 'Предложения' : l.title)}</b><small id="pg"></small></span>${icon('sound')}</button>
      <div class="tools">
        <div class="inks">${COLORS.map(c => `<button class="ink ${c === color ? 'on' : ''}" data-c="${c}" style="--i:${c}" aria-label="Цвет"></button>`).join('')}</div>
        <button class="round" id="demo" aria-label="Покажи">${icon('play')}</button>
        <button class="round" id="undo" aria-label="Отменить">${icon('undo')}</button>
        <button class="round" id="clear" aria-label="Стереть">${icon('trash')}</button>
        <button class="go" id="next"><span>Дальше</span>${icon('next')}</button>
      </div>
    </header>
    <div class="nb" id="nb"></div>
    <div class="pops" id="pops"></div>
  </main>`;
  const $ = q => app.querySelector(q);
  const say = () => speak(l.say);
  const start = () => {
    nb = new Notebook($('#nb'), {
      rows, age: p.age, size: p.size || 0, color: () => color, fingerOk: () => !!store.profile?.finger,
      onPages: (n, i) => { $('#pg').innerHTML = Array.from({ length: n }, (_, k) => `<i class="${k < i ? 'd' : k === i ? 'c' : ''}"></i>`).join(''); $('#next').classList.remove('ready'); },
      onCell: (c, st, x, y) => { sfx.pop(st); pop(x, y, st); },
      onPage: () => { sfx.page(); $('#next').classList.add('ready'); },
    });
    if (location.hostname === 'localhost') window.__nb = nb;
    if (l.intro) setTimeout(() => nb?.demo(), 350);
  };
  const pop = (x, y, n) => {
    const r = $('#nb').getBoundingClientRect(), host = $('#pops'), el = document.createElement('span');
    el.className = 'pop'; el.textContent = '⭐'.repeat(n);
    el.style.left = r.left + x + 'px'; el.style.top = r.top + y + 'px';
    host.append(el); setTimeout(() => el.remove(), 1000);
  };
  $('#say').onclick = say;
  $('#demo').onclick = () => nb?.demo();
  $('#undo').onclick = () => nb?.undo();
  $('#clear').onclick = () => nb?.clear();
  app.querySelector('.inks').onclick = e => {
    const b = e.target.closest('.ink'); if (!b) return;
    color = b.dataset.c; store.update({ color });
    app.querySelectorAll('.ink').forEach(x => x.classList.toggle('on', x === b));
  };
  $('#next').onclick = () => {
    if (!nb) return;
    if (!nb.next()) finish();
  };
  const finish = () => {
    const stars = nb.result();
    if (stars) store.setStars(l.id, stars);
    const nxt = lessonAfter(l);
    const ov = document.createElement('div');
    ov.className = 'overlay';
    ov.innerHTML = stars ? `<div class="panel result">
        <canvas class="confetti"></canvas>
        <div class="res-e">${l.sticker || l.emoji}</div>
        <h1>${PRAISE[Math.floor(Math.random() * PRAISE.length)]}</h1>
        ${starsHTML(stars, 'huge')}
        <p>${l.sticker ? 'Новая наклейка в альбоме!' : stars === 3 ? 'Очень аккуратно!' : 'Попробуй ещё — получится ещё ровнее.'}</p>
        <div class="res-btns"><button class="round big-r" id="again" aria-label="Ещё раз">${icon('redo')}</button>
        ${nxt ? `<button class="big" id="fwd">Дальше ${icon('next')}</button>` : `<button class="big" data-go="s/${s.id}">Готово ${icon('check')}</button>`}
        <button class="round big-r" data-go="home" aria-label="Домой">${icon('home')}</button></div></div>`
      : `<div class="panel result"><div class="res-e">✏️</div><h1>Попробуем ещё раз?</h1><p>Обведи буквы по серым линиям — и получишь звёзды.</p>
        <div class="res-btns"><button class="big" id="again">Писать ${icon('redo')}</button><button class="round big-r" data-go="s/${s.id}" aria-label="Назад">${icon('back')}</button></div></div>`;
    app.firstElementChild.append(ov);
    if (stars) { sfx.win(); confetti(ov.querySelector('.confetti')); }
    ov.querySelector('#again').onclick = () => route();
    const f = ov.querySelector('#fwd'); if (f) f.onclick = () => go(`l/${nxt.id}`);
  };

  // знакомство с буквой
  if (l.intro) {
    const it = l.intro, ov = document.createElement('div');
    ov.className = 'overlay';
    const word = it.hi ? esc(it.word).replace(new RegExp(it.hi, 'i'), m => `<mark>${m}</mark>`) : esc(it.word);
    ov.innerHTML = `<div class="panel intro">
      <button class="round ghost corner" data-go="s/${s.id}" aria-label="Назад">${icon('back')}</button>
      <div class="intro-top"><span class="intro-e">${it.emoji}</span><div><small>${s.title}</small><h1>${word}</h1></div>
        <button class="round" id="isay" aria-label="Послушать">${icon('sound')}</button></div>
      <div class="intro-board"><canvas id="ic"></canvas><canvas id="ia"></canvas></div>
      <div class="res-btns"><button class="round big-r" id="iplay" aria-label="Показать ещё раз">${icon('redo')}</button><button class="big" id="igo">Писать! ${icon('next')}</button></div></div>`;
    app.firstElementChild.append(ov);
    const board = ov.querySelector('.intro-board'), ic = ov.querySelector('#ic'), ia = ov.querySelector('#ia');
    const draw = () => {
      const r = board.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 3), W = r.width, H = r.height;
      for (const c of [ic, ia]) { c.width = W * dpr; c.height = H * dpr; c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0); }
      const L = layout(it.set, it.set === 'p' ? [it.keys[0], ' ', it.keys[1]].filter(Boolean) : it.keys);
      let ya = 45, yb = 105;
      for (const q of L.strokes) for (const pt of q) { ya = Math.min(ya, pt[1]); yb = Math.max(yb, pt[1]); }
      const u = Math.min((H * 0.8) / (yb - ya), (W * 0.84) / L.w), ox = (W - L.w * u) / 2, oy = (H - (yb - ya) * u) / 2 - ya * u;
      const g = ic.getContext('2d'); g.clearRect(0, 0, W, H);
      g.strokeStyle = '#b9cff0'; g.lineWidth = 1.5;
      for (const y of [50, 100]) { g.beginPath(); g.moveTo(0, oy + y * u); g.lineTo(W, oy + y * u); g.stroke(); }
      g.strokeStyle = '#dbe7f8'; g.beginPath(); g.moveTo(0, oy); g.lineTo(W, oy); g.stroke();
      const st = L.strokes.map(q => q.map(([x, y]) => [ox + x * u, oy + y * u]));
      g.strokeStyle = '#d3dae8'; g.lineWidth = 7 * u; g.lineCap = g.lineJoin = 'round';
      for (const q of st) { g.beginPath(); q.forEach((pt, i) => i ? g.lineTo(pt[0], pt[1]) : g.moveTo(pt[0], pt[1])); if (q.length < 3) g.lineTo(q[0][0] + .1, q[0][1]); g.stroke(); }
      anim?.stop();
      anim = playStrokes(ia, st, { lw: 7 * u, speed: 130 * u, clear: [0, 0, W, H], loop: true, alive: () => ov.isConnected });
    };
    requestAnimationFrame(draw);
    say();
    ov.querySelector('#isay').onclick = say;
    ov.querySelector('#iplay').onclick = draw;
    ov.querySelector('#igo').onclick = () => { anim?.stop(); ov.remove(); start(); };
  } else { start(); if (l.say) say(); }

  cleanup = () => { anim?.stop(); nb?.destroy(); nb = null; };
}

function confetti(c) {
  const r = c.getBoundingClientRect(), g = c.getContext('2d');
  c.width = r.width; c.height = r.height;
  const cols = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#b983ff', '#ff8fab'];
  const ps = Array.from({ length: 70 }, () => ({ x: r.width / 2, y: r.height * 0.35, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 12 - 3, s: 5 + Math.random() * 7, c: cols[Math.floor(Math.random() * cols.length)], a: Math.random() * 6, va: (Math.random() - 0.5) * 0.4 }));
  let n = 0;
  const f = () => {
    if (!c.isConnected || n++ > 160) return g.clearRect(0, 0, c.width, c.height);
    g.clearRect(0, 0, c.width, c.height);
    for (const p of ps) { p.vy += 0.32; p.x += p.vx; p.y += p.vy; p.vx *= 0.985; p.a += p.va; g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.fillStyle = p.c; g.globalAlpha = Math.max(0, 1 - n / 160); g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore(); }
    requestAnimationFrame(f);
  };
  f();
}

route();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
