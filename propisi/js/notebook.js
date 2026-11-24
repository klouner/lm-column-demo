// Тетрадь: линовка, образцы букв, письмо стилусом/пальцем и мягкая проверка
import { layout, resample, SLANT } from './glyphs.js';

const PAPER = '#fffdf7', RULE = '#9fbdea', RULE_SOFT = '#cfe0f6', MARGIN = '#f08a8a';
const GUIDE = '#cdd5e4', GUIDE_DOT = '#9aa7c2', SAMPLE = '#5a6684', START = '#22b573', DEMO = '#ff6b35';

let penSeen = false;

export class Notebook {
  /**
   * @param host контейнер
   * @param opts { rows, age, cursive, color, size, onCell(cell, stars, x, y), onPage(stars) }
   */
  constructor(host, opts) {
    this.host = host; this.o = opts;
    this.page = 0; this.pages = []; this.cells = []; this.ink = []; this.cur = null;
    this.scores = []; // звёзды по всем клеткам урока
    host.innerHTML = '<div class="nb-paper"><canvas class="nb-bg"></canvas><canvas class="nb-ink"></canvas><canvas class="nb-fx"></canvas></div>';
    this.paper = host.firstChild;
    [this.bg, this.inkC, this.fx] = this.paper.querySelectorAll('canvas');
    this._bind();
    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(host);
    this._resize(true);
  }

  destroy() { this._ro.disconnect(); cancelAnimationFrame(this._raf); this.dead = true; }

  /* ---------- геометрия ---------- */
  _measure() {
    const r = this.paper.getBoundingClientRect();
    this.W = Math.max(200, r.width); this.H = Math.max(160, r.height);
    const age = this.o.age;
    // младшим — крупнее буквы и меньше строк на странице
    const want = age <= 5 ? 2 : age <= 7 ? 3 : 4, maxXh = (age <= 5 ? 84 : age <= 7 ? 66 : 54) * (1 + 0.18 * (this.o.size || 0));
    const rows = Math.min(want, this.o.rows.length);
    let xh = Math.min(maxXh, (this.H - 10) / (rows * 3.55), this.W / 11);
    if (xh < 24 && rows > 2) xh = Math.min(maxXh, (this.H - 10) / (2 * 3.55), this.W / 11); // на телефоне лучше две строки покрупнее
    this.xh = Math.max(14, xh);
    this.rowH = this.xh * 3.55;
    this.perPage = Math.max(1, Math.min(4, Math.floor((this.H - 8) / this.rowH)));
    this.tol = this.xh * (age <= 5 ? 0.3 : age <= 7 ? 0.25 : 0.21);
  }

  _resize(first) {
    const oldPer = this.perPage, oldW = this.W, oldH = this.H;
    this._measure();
    if (!first && Math.abs(oldW - this.W) < 2 && Math.abs(oldH - this.H) < 2) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    for (const c of [this.bg, this.inkC, this.fx]) {
      c.width = Math.round(this.W * dpr); c.height = Math.round(this.H * dpr);
      c.style.width = this.W + 'px'; c.style.height = this.H + 'px';
      c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    if (first || oldPer !== this.perPage) {
      const firstRow = first ? 0 : this.pages[this.page]?.[0] ?? 0;
      this.pages = [];
      for (let i = 0; i < this.o.rows.length; i += this.perPage) this.pages.push(this.o.rows.slice(i, i + this.perPage).map((_, k) => i + k));
      this.page = Math.max(0, this.pages.findIndex(p => p.includes(firstRow)));
      this.o.onPages?.(this.pages.length, this.page);
    }
    const keep = new Map(this.cells.map(c => [c.key, c.stars]));
    this.ink = []; this.cur = null;
    this._layoutPage();
    for (const c of this.cells) if (keep.get(c.key)) c.stars = keep.get(c.key);
    this._drawBg(); this._redrawInk();
  }

  _layoutPage() {
    const rows = this.pages[this.page].map(i => this.o.rows[i]);
    const xh = this.xh, padL = Math.max(14, this.W * 0.025), padR = Math.max(26, this.W * 0.05);
    const availW = this.W - padL - padR;
    const top = Math.max(4, (this.H - rows.length * this.rowH) / 2 - this.xh * 0.1);
    this.rowsGeo = []; this.cells = [];
    rows.forEach((row, ri) => {
      const y0 = top + ri * this.rowH, capY = y0 + xh * 0.6;
      const L = layout(row.set, row.keys);
      let u = xh / 50;
      const isWord = row.keys.length > 1;
      const minGap = xh * (isWord ? 1.3 : 0.75);
      if (L.w * u > availW) u = availW / L.w;
      const itemW = L.w * u;
      let n = Math.max(1, Math.floor((availW + minGap) / (itemW + minGap)));
      n = Math.min(n, isWord ? 4 : this.o.age <= 5 ? 6 : 9);
      const slot = availW / n;
      let mode = row.mode;
      if (mode === 'free' && n < 2) mode = 'faint';
      const geo = { y0, capY, midY: capY + xh, baseY: capY + 2 * xh, descY: capY + 3 * xh, cursive: row.set === 'c' || row.set === 'ce' };
      this.rowsGeo.push(geo);
      for (let k = 0; k < n; k++) {
        const x = padL + slot * k + Math.min((slot - itemW) / 2, xh * 0.9);
        const sy = capY + (xh * 2 - 100 * u); // при уменьшении строки буквы остаются на линии
        const strokes = L.strokes.map(s => s.map(([px, py]) => [x + px * u, sy + py * u]));
        const pts = [];
        for (const s of strokes) for (let i = 0; i < s.length; i += 2) pts.push(s[i]);
        let x0 = Infinity, x1 = -Infinity, yA = Infinity, yB = -Infinity;
        for (const [px, py] of pts) { x0 = Math.min(x0, px); x1 = Math.max(x1, px); yA = Math.min(yA, py); yB = Math.max(yB, py); }
        const cellMode = mode === 'free' && k === 0 ? 'sample' : mode;
        this.cells.push({
          key: `${this.page}.${ri}.${k}`, row: ri, mode: cellMode, strokes, pts, x0, x1, yA, yB,
          rx0: padL + slot * k - (k === 0 ? padL : 0), rx1: padL + slot * (k + 1) + (k === n - 1 ? padR : 0),
          ry0: y0, ry1: y0 + this.rowH, stars: 0, first: k === 0 && !isWord, u,
        });
      }
    });
  }

  /* ---------- фон: бумага, линейки, образцы ---------- */
  _drawBg() {
    const g = this.bg.getContext('2d'), { W, H, xh } = this;
    g.clearRect(0, 0, W, H);
    g.fillStyle = PAPER; g.fillRect(0, 0, W, H);
    const anyCursive = this.rowsGeo.some(r => r.cursive);
    if (anyCursive) { // косая линейка
      g.strokeStyle = RULE_SOFT; g.lineWidth = 1; g.beginPath();
      const step = xh * 1.9;
      for (let x = -H * SLANT; x < W + H * SLANT; x += step) { g.moveTo(x + H * SLANT, 0); g.lineTo(x, H); }
      g.stroke();
    }
    for (const r of this.rowsGeo) {
      g.lineWidth = 1.2; g.strokeStyle = RULE;
      for (const y of [r.midY, r.baseY]) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
      g.strokeStyle = RULE_SOFT;
      if (!r.cursive) g.setLineDash([xh * 0.16, xh * 0.14]);
      g.beginPath(); g.moveTo(0, r.capY); g.lineTo(W, r.capY); g.stroke();
      g.setLineDash([]);
      if (!r.cursive) { g.fillStyle = 'rgba(159,189,234,0.09)'; g.fillRect(0, r.midY, W, xh); }
    }
    g.strokeStyle = MARGIN; g.lineWidth = 1.5; g.beginPath();
    const mx = W - Math.max(18, W * 0.035); g.moveTo(mx, 0); g.lineTo(mx, H); g.stroke();

    const lw = Math.max(2.5, xh * 0.105);
    g.lineCap = g.lineJoin = 'round';
    for (const c of this.cells) {
      const done = c.stars > 0;
      if (c.mode === 'sample') this._strokeAll(g, c, SAMPLE, lw);
      else if (c.mode === 'trace' || c.mode === 'faint') this._strokeAll(g, c, done ? '#dfe5f0' : c.mode === 'faint' ? '#e3e8f1' : GUIDE, lw * (c.mode === 'faint' ? 0.8 : 1.15));
      else if (c.mode === 'dots') { g.setLineDash([0.01, lw * 1.45]); this._strokeAll(g, c, done ? '#cfd6e4' : GUIDE_DOT, lw * 0.6); g.setLineDash([]); }
      if (c.mode !== 'sample' && !done) {
        // точка начала и стрелочка направления
        const s0 = c.strokes[0], a = s0[0];
        g.fillStyle = START; g.beginPath(); g.arc(a[0], a[1], lw * 0.95, 0, 7); g.fill();
        if (c.first && c.mode !== 'free') c.strokes.forEach((s, i) => {
          if (c.strokes.length < 2 || s.length < 3 && i > 0) return;
          const p = s[0];
          g.fillStyle = i ? '#7d8bb0' : START; g.beginPath(); g.arc(p[0], p[1], lw * 0.95, 0, 7); g.fill();
          g.fillStyle = '#fff'; g.font = `700 ${lw * 1.35}px system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle';
          g.fillText(i + 1, p[0], p[1] + lw * 0.08);
        });
      }
      if (done) this._stars(g, c);
    }
  }

  _strokeAll(g, c, color, lw) {
    g.strokeStyle = color; g.lineWidth = lw;
    for (const s of c.strokes) {
      g.beginPath(); g.moveTo(s[0][0], s[0][1]);
      for (let i = 1; i < s.length; i++) g.lineTo(s[i][0], s[i][1]);
      if (s.length < 3) g.lineTo(s[0][0] + 0.1, s[0][1]);
      g.stroke();
    }
  }

  _stars(g, c) {
    const r = this.xh * 0.17, cx = (c.x0 + c.x1) / 2, cy = this.rowsGeo[c.row].y0 + r * 1.35;
    for (let i = 0; i < 3; i++) star(g, cx + (i - 1) * r * 2.3, cy, r, i < c.stars ? '#ffc531' : '#e9edf3', i < c.stars ? '#f0a400' : '#dde2ea');
  }

  /* ---------- ввод ---------- */
  _bind() {
    const el = this.inkC;
    const pos = e => { const r = el.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top, e.pointerType === 'pen' ? (e.pressure || 0.5) : 0.5]; };
    el.addEventListener('pointerdown', e => {
      if (e.pointerType === 'pen') penSeen = true;
      if (e.pointerType === 'touch' && penSeen && !this.o.fingerOk?.()) return; // ладонь не пишет
      if (this.cur) return;
      e.preventDefault();
      try { el.setPointerCapture(e.pointerId); } catch { /* не критично */ }
      this._stopDemo();
      this.cur = { id: e.pointerId, pts: [pos(e)], color: this.o.color() };
      this._dot(this.cur);
    });
    el.addEventListener('pointermove', e => {
      if (!this.cur || e.pointerId !== this.cur.id) return;
      e.preventDefault();
      const evs = e.getCoalescedEvents?.() || [];
      for (const ev of evs.length ? evs : [e]) {
        const p = pos(ev), l = this.cur.pts[this.cur.pts.length - 1];
        if (Math.hypot(p[0] - l[0], p[1] - l[1]) < 0.7) continue;
        this.cur.pts.push(p); this._segment(this.cur);
      }
    });
    const end = e => {
      if (!this.cur || e.pointerId !== this.cur.id) return;
      const s = this.cur; this.cur = null;
      this.ink.push(s); this._evaluate(true);
    };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    for (const t of ['touchstart', 'touchmove', 'contextmenu', 'selectstart', 'gesturestart'])
      this.paper.addEventListener(t, e => e.preventDefault(), { passive: false });
  }

  _lw(p) { return Math.max(2.2, this.xh * 0.085) * (0.6 + 0.8 * p); }
  _dot(s) { const g = this.inkC.getContext('2d'), p = s.pts[0]; g.fillStyle = s.color; g.beginPath(); g.arc(p[0], p[1], this._lw(p[2]) / 2, 0, 7); g.fill(); }
  _segment(s, i = s.pts.length - 1, g = this.inkC.getContext('2d')) {
    const P = s.pts; if (i < 1) return;
    const a = P[i - 2] || P[i - 1], b = P[i - 1], c = P[i];
    g.strokeStyle = s.color; g.lineCap = g.lineJoin = 'round'; g.lineWidth = this._lw((b[2] + c[2]) / 2);
    g.beginPath(); g.moveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    g.quadraticCurveTo(b[0], b[1], (b[0] + c[0]) / 2, (b[1] + c[1]) / 2); g.stroke();
    if (i === P.length - 1) { /* хвостик до пера дорисуется следующим сегментом */ }
  }
  _redrawInk() {
    const g = this.inkC.getContext('2d'); g.clearRect(0, 0, this.W, this.H);
    for (const s of this.ink) {
      this._dot(s);
      for (let i = 1; i < s.pts.length; i++) this._segment(s, i, g);
      const l = s.pts[s.pts.length - 1], k = s.pts[s.pts.length - 2];
      if (k) { g.lineWidth = this._lw(l[2]); g.beginPath(); g.moveTo((k[0] + l[0]) / 2, (k[1] + l[1]) / 2); g.lineTo(l[0], l[1]); g.stroke(); }
    }
  }

  /* ---------- проверка ---------- */
  _evaluate(announce) {
    const inkPts = [];
    for (const s of this.ink) for (const p of resample(s.pts, 3)) inkPts.push(p);
    let changed = false;
    for (const c of this.cells) {
      if (c.mode === 'sample') continue;
      const mine = inkPts.filter(p => p[0] >= c.rx0 && p[0] < c.rx1 && p[1] >= c.ry0 && p[1] < c.ry1);
      const stars = mine.length < 3 ? 0 : this._score(c, mine);
      if (stars !== c.stars) {
        const was = c.stars; c.stars = stars; changed = true;
        if (announce && stars > was) this.o.onCell?.(c, stars, (c.x0 + c.x1) / 2, this.rowsGeo[c.row].y0 + this.xh * 0.3);
      }
    }
    if (changed) this._drawBg();
    const scored = this.cells.filter(c => c.mode !== 'sample');
    const allDone = scored.every(c => c.stars > 0);
    if (allDone && announce && !this._pageDone) {
      this._pageDone = true;
      this.o.onPage?.(Math.round(scored.reduce((a, c) => a + c.stars, 0) / scored.length));
    }
    if (!allDone) this._pageDone = false;
  }

  _score(c, ink) {
    const free = c.mode === 'free';
    let dx = 0, dy = 0, tol = this.tol * Math.max(0.75, Math.min(1, c.u / (this.xh / 50) + 0.2));
    if (free) { // в пустой клетке сравниваем форму, а не точное место
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (const [x, y] of ink) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      dx = (c.x0 + c.x1) / 2 - (x0 + x1) / 2; dy = (c.yA + c.yB) / 2 - (y0 + y1) / 2;
      dy = Math.max(-this.xh * 0.45, Math.min(this.xh * 0.45, dy));
      tol *= 1.6;
    }
    const t2 = tol * tol, p2 = t2 * 1.7 * 1.7;
    let hit = 0;
    for (const [tx, ty] of c.pts) {
      for (let i = 0; i < ink.length; i++) { const ex = ink[i][0] + dx - tx, ey = ink[i][1] + dy - ty; if (ex * ex + ey * ey <= t2) { hit++; break; } }
    }
    const cov = hit / c.pts.length;
    if (cov < 0.8) return 0;
    let ok = 0;
    for (const [ix, iy] of ink) {
      for (let i = 0; i < c.pts.length; i++) { const ex = ix + dx - c.pts[i][0], ey = iy + dy - c.pts[i][1]; if (ex * ex + ey * ey <= p2) { ok++; break; } }
    }
    const prec = ok / ink.length;
    // лишние каракули: чернил гораздо больше, чем нужно
    const excess = ink.length * 3 / Math.max(1, c.pts.length * 2 * c.u * 1.5);
    if (prec >= 0.86 && cov >= 0.92 && excess < 2.2) return 3;
    if (prec >= 0.68 && excess < 3.2) return 2;
    return 1;
  }

  /* ---------- управление ---------- */
  undo() { if (this.ink.pop()) { this._redrawInk(); this._evaluate(false); } }
  clear() { this.ink = []; this._redrawInk(); this._evaluate(false); }
  get pageCount() { return this.pages.length; }
  get isLast() { return this.page >= this.pages.length - 1; }
  /** Собрать оценки страницы и перейти дальше; false — если страниц больше нет */
  next() {
    for (const c of this.cells) if (c.mode !== 'sample') this.scores.push(c.stars);
    if (this.isLast) return false;
    this.page++; this.ink = []; this._pageDone = false; this._stopDemo();
    this._layoutPage(); this._drawBg(); this._redrawInk();
    this.o.onPages?.(this.pages.length, this.page);
    return true;
  }
  /** Итог урока: 1–3 звезды */
  result() {
    const s = this.scores; if (!s.length) return 0;
    const done = s.filter(x => x > 0);
    if (done.length < s.length * 0.5) return done.length ? 1 : 0;
    const avg = done.reduce((a, b) => a + b, 0) / done.length * (done.length / s.length);
    return Math.max(1, Math.min(3, Math.round(avg)));
  }

  /* ---------- показ: как писать ---------- */
  demo() {
    this._stopDemo();
    const c = this.cells.find(c => c.mode !== 'free');
    if (c) this._raf = playStrokes(this.fx, c.strokes, { lw: Math.max(3, this.xh * 0.12), speed: this.xh * 3.2, clear: [0, 0, this.W, this.H], fade: true, alive: () => !this.dead });
  }
  _stopDemo() { if (this._raf) { this._raf.stop(); this._raf = null; } }
}

/** Анимация письма по штрихам на холсте */
export function playStrokes(canvas, strokes, { lw, speed, clear, fade, alive = () => true, loop = false }) {
  const g = canvas.getContext('2d');
  let stopped = false, id = 0;
  const lens = strokes.map(s => { let l = 0; for (let i = 1; i < s.length; i++) l += Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]); return Math.max(l, 1); });
  const pause = 0.28, durs = lens.map(l => Math.max(0.18, l / speed));
  const total = durs.reduce((a, d) => a + d + pause, 0);
  let t0 = performance.now();
  const tail = fade ? 0.7 : 1.4;
  const frame = now => {
    if (stopped || !alive()) return;
    if (loop && (now - t0) / 1000 > total + tail) t0 = now;
    let t = (now - t0) / 1000;
    g.clearRect(...clear);
    g.globalAlpha = fade && t > total ? Math.max(0, 1 - (t - total) / tail) : 1;
    g.lineCap = g.lineJoin = 'round'; g.strokeStyle = DEMO; g.lineWidth = lw;
    let pen = null;
    for (let k = 0; k < strokes.length; k++) {
      const s = strokes[k], f = Math.min(1, t / durs[k]);
      if (f <= 0) break;
      const upto = f * lens[k]; let acc = 0;
      g.beginPath(); g.moveTo(s[0][0], s[0][1]); pen = s[0];
      for (let i = 1; i < s.length; i++) {
        const d = Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]);
        if (acc + d > upto) { const q = (upto - acc) / (d || 1); pen = [s[i - 1][0] + (s[i][0] - s[i - 1][0]) * q, s[i - 1][1] + (s[i][1] - s[i - 1][1]) * q]; g.lineTo(pen[0], pen[1]); break; }
        acc += d; g.lineTo(s[i][0], s[i][1]); pen = s[i];
      }
      if (s.length < 3) g.lineTo(s[0][0] + 0.1, s[0][1]);
      g.stroke();
      if (f < 1) break;
      t -= durs[k] + pause;
      if (t < 0) break;
    }
    if (pen && (now - t0) / 1000 < total) { g.fillStyle = '#ffd23f'; g.strokeStyle = '#e85d04'; g.lineWidth = lw * 0.3; g.beginPath(); g.arc(pen[0], pen[1], lw * 0.95, 0, 7); g.fill(); g.stroke(); }
    g.globalAlpha = 1;
    if ((now - t0) / 1000 < total + tail || loop) id = requestAnimationFrame(frame); else g.clearRect(...clear);
  };
  id = requestAnimationFrame(frame);
  const ctl = { stop() { stopped = true; cancelAnimationFrame(id); g.clearRect(...clear); } };
  return ctl;
}

export function star(g, cx, cy, r, fill, stroke) {
  g.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.48 : r; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
  g.closePath(); g.fillStyle = fill; g.fill();
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = Math.max(1, r * 0.12); g.lineJoin = 'round'; g.stroke(); }
}
