/* Projektant garażu */
'use strict';

const NAV = [
  { id: 'parametry', label: 'Wymiary i konstrukcja', short: 'Wymiary', icon: 'ruler' },
  { id: 'otwory', label: 'Brama, drzwi, okna', short: 'Otwory', icon: 'gate' },
  { id: 'dzialka', label: 'Położenie na działce', short: 'Działka', icon: 'map' },
  { id: 'widok3d', label: 'Widok 3D', short: '3D', icon: 'cube' },
  { id: 'rysunki', label: 'Rysunki i opis', short: 'Rysunki', icon: 'plan' },
  { id: 'kosztorys', label: 'Kosztorys', short: 'Koszty', icon: 'wallet' },
  { id: 'kontrola', label: 'Kontrola przepisów', short: 'Kontrola', icon: 'shield' },
  { sep: true },
  { id: 'warianty', label: 'Warianty i plik', short: 'Warianty', icon: 'list' },
];

let D = GarageCalc.normalize(Store.get(KEYS.design, null));
let saveTimer;
function commit(rerenderHeader = true) {
  D.updated = new Date().toISOString();
  clearTimeout(saveTimer); saveTimer = setTimeout(() => Store.set(KEYS.design, D), 250);
  if (rerenderHeader) header();
}
Store.set(KEYS.design, D); // pierwsze uruchomienie – zapisz domyślny projekt, by Planer go widział

function header() {
  const g = GarageCalc.geometry(D), lg = GarageCalc.legal(D);
  document.getElementById('subtitle').textContent = `${D.name} · ${fmtNum(D.width)}×${fmtNum(D.length)} m`;
  document.getElementById('hdrBadge').innerHTML = `<span class="badge ${g.footprint > 35 ? 'warn' : 'ok'}">${fmtNum(g.footprint)} m² · ${lg.path === 'zgloszenie' ? 'zgłoszenie' : 'pozwolenie'}</span>`;
}

/* ---------- Pola formularza ---------- */
function getPath(o, p) { return p.split('.').reduce((a, k) => a == null ? a : a[k], o); }
function setPath(o, p, v) { const ks = p.split('.'); const last = ks.pop(); ks.reduce((a, k) => a[k], o)[last] = v; }
function F(label, path, o = {}) {
  const v = getPath(D, path);
  const re = o.rerender ? ' data-re="1"' : '';
  if (o.type === 'bool') return `<label class="check ${o.full ? 'full' : ''}"><input type="checkbox" data-b="${path}" data-t="bool"${re} ${v ? 'checked' : ''}> ${label}</label>`;
  const hint = o.hint ? `<span class="hint">${o.hint}</span>` : '';
  if (o.options) return `<label class="field ${o.full ? 'full' : ''}">${label}<select data-b="${path}" data-t="${o.num ? 'num' : 'str'}"${re}>${o.options.map(([val, lab]) => `<option value="${val}" ${String(val) === String(v) ? 'selected' : ''}>${esc(lab)}</option>`).join('')}</select>${hint}</label>`;
  if (o.type === 'text') return `<label class="field ${o.full ? 'full' : ''}">${label}<input type="text" data-b="${path}" data-t="str" value="${esc(v)}">${hint}</label>`;
  return `<label class="field ${o.full ? 'full' : ''}">${label}<input type="number" inputmode="decimal" data-b="${path}" data-t="num"${re} value="${v}" step="${o.step || 0.05}" ${o.min != null ? `min="${o.min}"` : ''} ${o.max != null ? `max="${o.max}"` : ''}>${hint}</label>`;
}
function bind(root, after) {
  root.querySelectorAll('[data-b]').forEach(el => {
    const ev = el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(ev, () => {
      let v = el.dataset.t === 'bool' ? el.checked : el.dataset.t === 'num' ? num(el.value, NaN) : el.value;
      if (el.dataset.t === 'num') { if (!isFinite(v)) return; if (el.min !== '' && v < +el.min) v = +el.min; if (el.max !== '' && v > +el.max) v = +el.max; }
      setPath(D, el.dataset.b, v);
      commit();
      if (el.dataset.re) route(true); else if (after) after(el);
    });
  });
}
const opt = obj => Object.entries(obj).map(([k, v]) => [k, typeof v === 'string' ? v : v.name]);

/* ---------- Router ---------- */
const view = document.getElementById('view');
let current = null;
function go(id) { location.hash = id; }
function route(keepScroll) {
  const id = (location.hash.slice(1) || 'parametry').split('/')[0];
  const next = NAV.some(n => n.id === id) ? id : 'parametry';
  if (current === 'widok3d' && next !== 'widok3d') View3D.destroy();
  current = next;
  markNav(current);
  const y = window.scrollY;
  view.innerHTML = '';
  VIEWS[current]();
  if (keepScroll === true) window.scrollTo(0, y); else window.scrollTo(0, 0);
}
window.addEventListener('hashchange', () => route());

/* Lista kontroli: ikonka + tekst */
function chkRow(c) {
  const sym = { ok: '✓', warn: '!', bad: '✕', info: 'i' }[c.status] || '·';
  const val = c.dist != null ? fmtNum(c.dist) + ' m' : c.value != null ? fmtNum(c.value) + ' m' : '';
  return `<div class="chk"><span class="ic ${c.status}">${sym}</span><div class="tx"><b>${esc(c.label)}</b><small class="muted">${esc(c.msg)}</small></div><span class="val">${val}</span></div>`;
}
function problems() {
  const all = [...GarageCalc.boundaryChecks(D), ...GarageCalc.ergonomics(D)];
  return { bad: all.filter(c => c.status === 'bad').length, warn: all.filter(c => c.status === 'warn').length };
}

/* ================= WIDOKI ================= */
const VIEWS = {};

VIEWS.parametry = () => {
  const r = D.roof;
  view.innerHTML = `
  <div class="split">
    <div>
      <div class="card"><h2>Wymiary zewnętrzne</h2>
        <div class="presets" style="margin-bottom:12px">
          <button class="btn small" data-preset="3.6,6.0,2.6">1 auto · 3,6×6,0</button>
          <button class="btn small" data-preset="5.8,6.0,2.7">Max 35 m² · 5,8×6,0</button>
          <button class="btn small" data-preset="4.5,7.7,2.8">Auto + warsztat · 4,5×7,7</button>
          <button class="btn small" data-preset="6.4,6.5,2.7">2 auta · 6,4×6,5 (pozwolenie)</button>
        </div>
        <div class="form-grid cols-3">
          ${F('Szerokość (front) [m]', 'width', { min: 2, max: 20, step: 0.05 })}
          ${F('Długość (głębokość) [m]', 'length', { min: 2, max: 20, step: 0.05 })}
          ${F('Wysokość ścian [m]', 'wallHeight', { min: 2, max: 5, step: 0.05, hint: 'od posadzki do okapu' })}
          ${F('Nazwa projektu', 'name', { type: 'text', full: true })}
        </div>
        <p class="muted" style="font-size:.82rem;margin:10px 0 0">Wymiary zewnętrzne łącznie z ociepleniem – to one decydują o limicie 35 m².</p>
      </div>
      <div class="card"><h2>Ściany</h2><div class="form-grid">
        ${F('Materiał', 'wallMaterial', { options: opt(GarageCalc.WALL_MATERIALS), rerender: true, full: true })}
        ${F('Ocieplenie ścian', 'insulation', { options: [[0, 'brak'], [5, '5 cm'], [10, '10 cm'], [15, '15 cm']], num: true })}
      </div></div>
      <div class="card"><h2>Dach</h2><div class="form-grid">
        ${F('Rodzaj dachu', 'roof.type', { options: opt(GarageCalc.ROOF_TYPES), rerender: true })}
        ${F('Pokrycie', 'roof.cover', { options: opt(GarageCalc.ROOF_COVERS) })}
        ${r.type !== 'plaski' ? F('Kąt nachylenia [°]', 'roof.pitch', { min: 5, max: 50, step: 1 }) : ''}
        ${F('Okap (wysięg) [m]', 'roof.overhang', { min: 0, max: 1.2, step: 0.05 })}
        ${r.type === 'dwuspadowy' ? F('Kalenica', 'roof.ridge', { options: [['length', 'wzdłuż garażu (szczyt od frontu)'], ['width', 'w poprzek (połać od frontu)']] }) : ''}
        ${r.type === 'jednospadowy' || r.type === 'plaski' ? F('Spadek w stronę', 'roof.slopeTo', { options: [['back', 'tyłu'], ['front', 'frontu'], ['left', 'lewej'], ['right', 'prawej']] }) : ''}
        ${F('Ocieplenie dachu / stropu', 'roof.insulated', { type: 'bool', full: true })}
      </div></div>
      <div class="card"><h2>Fundamenty i posadzka</h2><div class="form-grid">
        ${F('Typ', 'foundation.type', { options: [['lawy', 'Ławy + ściany fundamentowe'], ['plyta', 'Płyta fundamentowa']] })}
        ${F('Strefa przemarzania', 'foundation.frostZone', { options: Object.entries(GarageCalc.FROST_DESC), num: true })}
        ${F('Ocieplenie fundamentu XPS', 'foundation.insulate', { type: 'bool', full: true })}
      </div></div>
      <div class="card"><h2>Instalacje i wykończenie</h2><div class="form-grid">
        ${F('Instalacja elektryczna', 'options.electric', { type: 'bool', full: true })}
        ${F('Długość kabla od domu [m]', 'options.cableLength', { min: 0, max: 200, step: 1 })}
        ${F('Podjazd z kostki [m²]', 'options.driveway', { min: 0, max: 500, step: 1 })}
        ${F('Przygotowanie pod ładowarkę EV', 'options.ev', { type: 'bool', full: true })}
        ${F('Rynny i rury spustowe', 'options.gutters', { type: 'bool' })}
        ${F('Elewacja (tynk)', 'options.facade', { type: 'bool' })}
        ${F('Tynk wewnętrzny', 'options.plaster', { type: 'bool' })}
        ${F('Opaska żwirowa', 'options.apron', { type: 'bool' })}
      </div></div>
    </div>
    <div class="preview">
      <div class="card"><div class="card-head"><h3 style="margin:0">Rzut</h3><span id="pvBadges"></span></div><div id="pvPlan"></div></div>
      <div class="card"><h3>Elewacja frontowa</h3><div id="pvElev"></div></div>
      <div class="card"><h3>Podsumowanie</h3><div id="pvSum"></div></div>
    </div>
  </div>`;
  const refresh = () => {
    document.getElementById('pvPlan').innerHTML = Drawings.plan(D);
    document.getElementById('pvElev').innerHTML = Drawings.elevation(D, 'front');
    const g = GarageCalc.geometry(D), cs = GarageCalc.costSummary(D), pr = problems();
    document.getElementById('pvBadges').innerHTML = `${pr.bad ? `<span class="badge bad">${pr.bad} problem(y)</span>` : '<span class="badge ok">bez błędów</span>'} ${pr.warn ? `<span class="badge warn">${pr.warn} uwag</span>` : ''}`;
    document.getElementById('pvSum').innerHTML = `<dl class="kv">
      <dt>Powierzchnia zabudowy</dt><dd>${fmtNum(g.footprint)} m² ${g.footprint > 35 ? '<span class="badge warn">&gt; 35 m²</span>' : '<span class="badge ok">≤ 35 m²</span>'}</dd>
      <dt>Powierzchnia użytkowa</dt><dd>${fmtNum(g.usable)} m²</dd>
      <dt>Wnętrze</dt><dd>${fmtNum(g.innerW)} × ${fmtNum(g.innerL)} m</dd>
      <dt>Wysokość całkowita</dt><dd>${fmtNum(g.totalHeight)} m</dd>
      <dt>Kubatura</dt><dd>${fmtNum(g.volume, 1)} m³</dd>
      <dt>Powierzchnia dachu</dt><dd>${fmtNum(g.roofArea, 1)} m²</dd>
      <dt>Szacunkowy koszt</dt><dd>${fmtMoney(cs.total)}</dd></dl>
      <div class="row" style="margin-top:12px"><button class="btn small" onclick="go('kontrola')">${icon('shield')} Kontrola</button><button class="btn small" onclick="go('widok3d')">${icon('cube')} 3D</button></div>`;
  };
  bind(view, refresh);
  view.querySelectorAll('[data-preset]').forEach(b => b.onclick = () => {
    const [w, l, h] = b.dataset.preset.split(',').map(Number);
    const oldW = D.width;
    D.width = w; D.length = l; D.wallHeight = h;
    for (const o of D.openings) {
      const len = GarageCalc.wallLen(D, o.wall);
      if (o.type === 'brama' && (o.wall === 'front' || o.wall === 'back')) { o.width = Math.min(o.width, w >= 6 ? 5.0 : Math.max(2.4, w - 0.9)); o.offset = +((len - o.width) / 2).toFixed(2); }
      else o.offset = Math.min(o.offset, Math.max(0.3, len - o.width - 0.35));
    }
    commit(); route(true);
  });
  refresh();
};

/* ---------- Otwory ---------- */
let selOp = null;
VIEWS.otwory = () => {
  if (!D.openings.some(o => o.id === selOp)) selOp = D.openings[0]?.id || null;
  const sel = D.openings.find(o => o.id === selOp);
  const wallOpts = Object.entries(GarageCalc.WALLS).map(([k, v]) => [k, v]);
  view.innerHTML = `
  <div class="split">
    <div>
      <div class="card"><div class="card-head"><h2 style="margin:0">Otwory</h2>
        <div class="row"><button class="btn small" data-add="brama">${icon('plus')} Brama</button><button class="btn small" data-add="drzwi">${icon('plus')} Drzwi</button><button class="btn small" data-add="okno">${icon('plus')} Okno</button></div></div>
        <p class="muted" style="font-size:.82rem;margin:0">Położenie = odległość od lewego narożnika ściany, patrząc na nią <b>z zewnątrz</b>. Pamiętaj: ściana z oknem/drzwiami musi stać min. 4 m od granicy.</p>
      </div>
      ${D.openings.map((o, i) => `
        <div class="op-card ${o.id === selOp ? 'sel' : ''}" data-op="${o.id}">
          <div class="head">${icon(o.type === 'brama' ? 'gate' : o.type === 'drzwi' ? 'doc' : 'plan', 'width="18" height="18"')} ${GarageCalc.typeName(o.type)} – ściana ${GarageCalc.WALLS[o.wall].toLowerCase()}
            <span class="spacer"></span><button class="iconbtn" data-center="${o.id}" title="Wyśrodkuj na ścianie">${icon('swap')}</button><button class="iconbtn" data-del="${o.id}" title="Usuń">${icon('trash')}</button></div>
          <div class="form-grid cols-3">
            ${F('Ściana', `openings.${i}.wall`, { options: wallOpts, rerender: true })}
            ${F('Położenie od lewej [m]', `openings.${i}.offset`, { min: 0, max: 20, step: 0.05 })}
            ${F('Szerokość [m]', `openings.${i}.width`, { min: 0.3, max: 8, step: 0.05 })}
            ${F('Wysokość [m]', `openings.${i}.height`, { min: 0.3, max: 4, step: 0.05 })}
            ${o.type === 'okno' ? F('Parapet [m]', `openings.${i}.sill`, { min: 0, max: 3, step: 0.05 }) : ''}
            ${o.type === 'brama' ? F('Typ bramy', `openings.${i}.gate`, { options: opt(GarageCalc.GATE_TYPES) }) : ''}
            ${o.type === 'brama' ? F('Napęd elektryczny', `openings.${i}.motor`, { type: 'bool' }) : ''}
          </div>
        </div>`).join('') || '<div class="card empty">Brak otworów – dodaj bramę.</div>'}
    </div>
    <div class="preview">
      <div class="card"><h3 id="pvTitle">Elewacja</h3><div id="pvElev"></div></div>
      <div class="card"><h3>Rzut</h3><div id="pvPlan"></div></div>
      <div class="card"><h3>Uwagi</h3><div id="pvChk"></div></div>
    </div>
  </div>`;
  const refresh = () => {
    const s = D.openings.find(o => o.id === selOp);
    const wall = s ? s.wall : 'front';
    document.getElementById('pvTitle').textContent = 'Elewacja – ściana ' + GarageCalc.WALLS[wall].toLowerCase() + ' (z zewnątrz)';
    document.getElementById('pvElev').innerHTML = Drawings.elevation(D, wall);
    document.getElementById('pvPlan').innerHTML = Drawings.plan(D);
    const list = GarageCalc.ergonomics(D).filter(c => c.status !== 'ok' && c.status !== 'info');
    document.getElementById('pvChk').innerHTML = list.length ? list.map(chkRow).join('') : '<p class="muted" style="margin:0">Otwory poprawne – brak kolizji.</p>';
  };
  bind(view, refresh);
  view.querySelectorAll('[data-op]').forEach(c => c.addEventListener('focusin', () => {
    if (selOp === c.dataset.op) return;
    selOp = c.dataset.op; view.querySelectorAll('.op-card').forEach(x => x.classList.toggle('sel', x === c)); refresh();
  }));
  view.querySelectorAll('[data-add]').forEach(b => b.onclick = () => {
    const type = b.dataset.add;
    const presets = { brama: { wall: 'front', width: 2.5, height: 2.125, gate: 'segmentowa', motor: true }, drzwi: { wall: 'right', width: 0.9, height: 2.0 }, okno: { wall: 'back', width: 1.0, height: 0.6, sill: 1.5 } };
    const o = Object.assign({ id: uid(), type }, presets[type]);
    o.offset = +((GarageCalc.wallLen(D, o.wall) - o.width) / 2).toFixed(2);
    D.openings.push(o); selOp = o.id; commit(); route(true);
  });
  view.querySelectorAll('[data-del]').forEach(b => b.onclick = e => { e.stopPropagation(); D.openings = D.openings.filter(o => o.id !== b.dataset.del); commit(); route(true); });
  view.querySelectorAll('[data-center]').forEach(b => b.onclick = e => {
    e.stopPropagation(); const o = D.openings.find(x => x.id === b.dataset.center);
    o.offset = +((GarageCalc.wallLen(D, o.wall) - o.width) / 2).toFixed(2); selOp = o.id; commit(); route(true);
  });
  refresh();
};

/* ---------- Działka ---------- */
VIEWS.dzialka = () => {
  const h = D.plot.house;
  view.innerHTML = `
  <div class="split">
    <div>
      <div class="card"><h2>Działka i położenie garażu</h2><div class="form-grid">
        ${F('Szerokość działki (front) [m]', 'plot.width', { min: 5, max: 300, step: 0.5 })}
        ${F('Głębokość działki [m]', 'plot.depth', { min: 5, max: 500, step: 0.5 })}
        ${F('Garaż – od lewej granicy [m]', 'plot.x', { min: -5, max: 300, step: 0.05 })}
        ${F('Garaż – od granicy z drogą [m]', 'plot.y', { min: -5, max: 500, step: 0.05 })}
      </div><p class="muted" style="font-size:.82rem;margin:10px 0 0">Na planie możesz przeciągać garaż i dom palcem lub myszą.</p></div>
      <div class="card"><h2>Dom</h2><div class="form-grid">
        ${F('Pokaż dom na planie', 'plot.house.enabled', { type: 'bool', full: true, rerender: true })}
        ${h.enabled ? F('Od lewej granicy [m]', 'plot.house.x', { min: 0, step: 0.1 }) + F('Od drogi [m]', 'plot.house.y', { min: 0, step: 0.1 }) + F('Szerokość [m]', 'plot.house.w', { min: 3, step: 0.1 }) + F('Głębokość [m]', 'plot.house.d', { min: 3, step: 0.1 }) : ''}
      </div></div>
      <div class="card"><h2>Ustalenia MPZP / WZ i droga</h2><div class="form-grid">
        ${F('Działka objęta MPZP', 'plot.hasMpzp', { type: 'bool', full: true })}
        ${F('Linia zabudowy od drogi [m]', 'plot.buildLine', { min: 0, step: 0.5, hint: '0 = brak' })}
        ${F('Max wysokość garażu [m]', 'plot.maxHeight', { min: 0, step: 0.1, hint: '0 = brak' })}
        ${F('Kategoria drogi', 'plot.road', { options: Object.entries(GarageCalc.ROADS) })}
        ${F('Granica → krawędź jezdni [m]', 'plot.roadOffset', { min: 0, step: 0.5 })}
        ${F('MPZP pozwala budować przy granicy (1,5 m / 0 m)', 'plot.mpzpBoundary', { type: 'bool', full: true })}
        ${F('Sąsiad ma budynek ścianą przy granicy', 'plot.neighbourAtBoundary', { type: 'bool', full: true })}
        ${F('Inne obiekty do 35 m² na działce (szt.)', 'plot.smallObjects', { min: 0, max: 20, step: 1 })}
        ${F('Garaż dobudowany do domu', 'plot.attached', { type: 'bool' })}
      </div></div>
    </div>
    <div class="preview">
      <div class="card"><h3>Plan sytuacyjny</h3><div id="pvSite" class="site-wrap"></div></div>
      <div class="card"><h3>Odległości</h3><div id="pvChk"></div></div>
    </div>
  </div>`;
  const site = document.getElementById('pvSite');
  const refresh = () => {
    site.innerHTML = Drawings.site(D);
    document.getElementById('pvChk').innerHTML = GarageCalc.boundaryChecks(D).map(chkRow).join('');
  };
  bind(view, refresh);
  // przeciąganie
  let drag = null;
  const svgPt = (svg, e) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  site.addEventListener('pointerdown', e => {
    const g = e.target.closest('[data-drag]'); if (!g) return;
    const svg = site.querySelector('svg'); const pt = svgPt(svg, e);
    const obj = g.dataset.drag === 'garage' ? D.plot : D.plot.house;
    drag = { obj, x0: obj.x, y0: obj.y, px: pt.x, py: pt.y, kind: g.dataset.drag };
    site.setPointerCapture(e.pointerId); svg.classList.add('dragging'); e.preventDefault();
  });
  site.addEventListener('pointermove', e => {
    if (!drag) return;
    const svg = site.querySelector('svg'); const pt = svgPt(svg, e);
    const snap = v => Math.round(v * 20) / 20;
    drag.obj.x = snap(drag.x0 + (pt.x - drag.px) / 100);
    drag.obj.y = snap(drag.y0 - (pt.y - drag.py) / 100);
    refresh(); site.querySelector('svg').classList.add('dragging');
    const pre = drag.kind === 'garage' ? 'plot.' : 'plot.house.';
    for (const k of ['x', 'y']) { const inp = view.querySelector(`[data-b="${pre}${k}"]`); if (inp) inp.value = drag.obj[k]; }
  });
  const end = () => { if (drag) { drag = null; commit(); refresh(); } };
  site.addEventListener('pointerup', end); site.addEventListener('pointercancel', end);
  refresh();
};

/* ---------- 3D ---------- */
VIEWS.widok3d = () => {
  view.innerHTML = `
    <div class="card"><div class="card-head"><h2 style="margin:0">Widok 3D</h2>
      <div class="row">
        <div class="seg" role="group"><button data-p="iso" aria-pressed="false">Perspektywa</button><button data-p="front" aria-pressed="false">Front</button><button data-p="side" aria-pressed="false">Bok</button><button data-p="top" aria-pressed="false">Góra</button></div>
        <label class="check" style="font-size:.85rem"><input type="checkbox" id="plotT" ${View3D.showPlot ? 'checked' : ''}> działka</label>
        <button class="btn small" id="snap">${icon('download')} PNG</button>
      </div></div>
      <div class="canvas3d" id="c3d"><span class="hint3d">przeciągnij – obrót · kółko/2 palce – zoom</span></div>
    </div>
    <div class="grid grid-3">
      <div class="stat"><div class="label">Wysokość całkowita</div><div class="value">${fmtNum(GarageCalc.geometry(D).totalHeight)} m</div></div>
      <div class="stat"><div class="label">Dach</div><div class="value" style="font-size:1rem">${GarageCalc.ROOF_TYPES[D.roof.type]}</div><div class="sub">${GarageCalc.ROOF_COVERS[D.roof.cover].name}</div></div>
      <div class="stat"><div class="label">Ściany</div><div class="value" style="font-size:1rem">${GarageCalc.mat(D).name}</div></div>
    </div>`;
  const el = document.getElementById('c3d');
  try {
    View3D.init(el); View3D.setBackground(isDark()); View3D.build(D); View3D.preset('iso', D);
  } catch (e) {
    el.innerHTML = `<p class="empty">Nie udało się uruchomić grafiki 3D (WebGL) na tym urządzeniu.<br><small>${esc(e.message)}</small></p>`; return;
  }
  view.querySelectorAll('[data-p]').forEach(b => b.onclick = () => View3D.preset(b.dataset.p, D));
  document.getElementById('plotT').onchange = e => { View3D.togglePlot(e.target.checked, D); View3D.preset('iso', D); };
  document.getElementById('snap').onclick = () => {
    const url = View3D.snapshot(); const a = document.createElement('a'); a.href = url; a.download = 'garaz-3d.png'; a.click();
  };
};
document.addEventListener('themechange', () => { if (current === 'widok3d') View3D.setBackground(isDark()); });

/* ---------- Rysunki ---------- */
VIEWS.rysunki = () => {
  const g = GarageCalc.geometry(D);
  const desc = Drawings.techDescription(D);
  view.innerHTML = `
    <div class="card hide-print"><div class="card-head"><h2 style="margin:0">Rysunki do zgłoszenia</h2>
      <div class="row"><button class="btn primary" onclick="print()">${icon('print')} Drukuj / PDF</button></div></div>
      <p class="muted" style="margin:0;font-size:.85rem">Szkice pomocnicze (nie projekt budowlany). Do zgłoszenia dołącz szkic sytuacyjny naniesiony na kopię mapy, rzut, elewacje i opis. W druku wybierz „Zapisz jako PDF”.</p>
    </div>
    <div class="sheet-title"><b>${esc(D.name)}</b> – garaż wolnostojący ${fmtNum(D.width)}×${fmtNum(D.length)} m, pow. zabudowy ${fmtNum(g.footprint)} m² · ${new Date().toLocaleDateString('pl-PL')}</div>
    <div class="card drawing-card"><h3>Rzut przyziemia</h3>${Drawings.plan(D)}</div>
    <div class="elev-grid page-break">
      ${['front', 'right', 'back', 'left'].map(w => `<div class="card drawing-card"><h3>Elewacja ${GarageCalc.WALLS[w].toLowerCase()}</h3>${Drawings.elevation(D, w)}</div>`).join('')}
    </div>
    <div class="card drawing-card page-break"><h3>Plan sytuacyjny (schemat – nanieś na kopię mapy)</h3>${Drawings.site(D)}</div>
    <div class="card drawing-card"><div class="card-head"><h3 style="margin:0">Opis techniczny</h3><button class="btn small hide-print" id="copyDesc">${icon('copy')} Kopiuj</button></div>
      <div style="white-space:pre-wrap;font-size:.92rem">${esc(desc)}</div></div>`;
  document.getElementById('copyDesc').onclick = async () => {
    try { await navigator.clipboard.writeText(desc); toast('Skopiowano opis'); } catch (e) { toast('Nie udało się skopiować'); }
  };
};

/* ---------- Kosztorys ---------- */
VIEWS.kosztorys = () => {
  const cs = GarageCalc.costSummary(D), g = GarageCalc.geometry(D);
  const lf = Math.round((D.options.laborFactor ?? 1) * 100);
  view.innerHTML = `
    <div class="grid grid-4" style="margin-bottom:16px">
      <div class="stat"><div class="label">Materiały</div><div class="value">${fmtMoney(cs.mat)}</div></div>
      <div class="stat"><div class="label">Robocizna (${lf}%)</div><div class="value">${fmtMoney(cs.lab)}</div></div>
      <div class="stat"><div class="label">Rezerwa ${D.options.reserve}%</div><div class="value">${fmtMoney(cs.reserve)}</div></div>
      <div class="stat"><div class="label">Razem</div><div class="value" style="color:var(--accent)">${fmtMoney(cs.total)}</div><div class="sub">${fmtMoney(cs.total / g.footprint)} / m² zabudowy</div></div>
    </div>
    <div class="card"><div class="form-grid cols-3">
      <label class="field">Robocizna: <b id="lfv" style="color:var(--text)">${lf}%</b><input type="range" min="0" max="150" step="5" value="${lf}" id="lf"><span class="hint">0% = budujesz sam, 100% = typowe stawki firm</span></label>
      ${F('Rezerwa na nieprzewidziane [%]', 'options.reserve', { min: 0, max: 50, step: 1 })}
      ${F('Szkice do zgłoszenia przez architekta', 'options.formalSketchByArchitect', { type: 'bool', rerender: true })}
    </div>
    <div class="row" style="margin-top:12px">
      <a class="btn primary" href="../planer/?import=1#budzet">${icon('wallet')} Przenieś do budżetu w Planerze</a>
      <button class="btn" id="resetPrices">Przywróć ceny domyślne</button>
      <button class="btn" onclick="print()">${icon('print')} Drukuj</button>
    </div></div>
    <div class="card"><p class="muted" style="font-size:.82rem;margin-top:0">Ceny orientacyjne (2026, średnie krajowe) – dotknij ✎, by wpisać ceny z Twojej hurtowni lub oferty wykonawcy. Ilości liczone z projektu.</p>
    <div class="table-wrap"><table><thead><tr><th>Pozycja</th><th class="num">Ilość</th><th class="num">Cena j. mat. / rob.</th><th class="num">Wartość</th><th class="hide-print"></th></tr></thead><tbody>
      ${GarageCalc.CATEGORIES.map(cat => {
        const ls = cs.lines.filter(l => l.cat === cat); if (!ls.length) return '';
        return `<tr><td colspan="3" style="background:var(--surface-2);font-weight:700;font-size:.8rem">${cat}</td><td class="num" style="background:var(--surface-2);font-weight:700;font-size:.8rem">${fmtMoney(cs.byCat[cat].total)}</td><td class="hide-print" style="background:var(--surface-2)"></td></tr>` +
          ls.map((l, i) => `<tr><td>${esc(l.label)}${l.note ? `<br><small>${esc(l.note)}</small>` : ''}</td><td class="num">${fmtNum(l.qty)} ${l.unit}</td>
            <td class="num price-cell">${fmtNum(l.matU)} / ${fmtNum(l.labU)} zł</td><td class="num">${fmtMoney(l.mat + l.lab)}</td>
            <td class="hide-print"><button class="iconbtn" data-price="${cs.lines.indexOf(l)}" title="Zmień cenę">${icon('edit')}</button></td></tr>`).join('');
      }).join('')}
    </tbody><tfoot><tr><td colspan="3">Suma netto (bez rezerwy)</td><td class="num">${fmtMoney(cs.subtotal)}</td><td></td></tr>
      <tr><td colspan="3">Razem z rezerwą</td><td class="num">${fmtMoney(cs.total)}</td><td></td></tr></tfoot></table></div></div>`;
  const lfIn = document.getElementById('lf');
  lfIn.oninput = () => { document.getElementById('lfv').textContent = lfIn.value + '%'; };
  lfIn.onchange = () => { D.options.laborFactor = lfIn.value / 100; commit(); route(true); };
  bind(view, () => route(true));
  document.getElementById('resetPrices').onclick = async () => { if (await confirmDialog('Przywrócić wszystkie ceny domyślne?', 'Przywróć')) { D.prices = {}; commit(); route(true); } };
  view.querySelectorAll('[data-price]').forEach(b => b.onclick = () => editPrice(cs.lines[+b.dataset.price]));
};

function priceKeyFor(line) {
  if (line.key === 'pokrycie') return 'pokrycie_' + D.roof.cover;
  if (line.key === 'brama') { const m = D.openings.find(o => o.type === 'brama' && line.label.toLowerCase().includes(GarageCalc.GATE_TYPES[o.gate].name.toLowerCase())); return 'brama_' + (m ? m.gate : 'segmentowa'); }
  return line.key;
}
function editPrice(line) {
  const key = priceKeyFor(line), lf = D.options.laborFactor ?? 1;
  const isGate = key.startsWith('brama_');
  const dlg = document.createElement('dialog');
  dlg.innerHTML = `<form method="dialog"><div class="dlg-body"><h2>${esc(line.label)}</h2>
    <div class="form-grid">
      <label class="field">Materiał [zł/${isGate ? 'szt' : line.unit}]<input type="number" inputmode="decimal" id="pm" value="${+line.matU.toFixed(2)}"></label>
      <label class="field">Robocizna [zł/${line.unit}]<input type="number" inputmode="decimal" id="pl" value="${+(lf ? line.labU / lf : line.labU).toFixed(2)}"><span class="hint">przed mnożnikiem ${Math.round(lf * 100)}%</span></label>
    </div>${isGate ? '<p class="muted" style="font-size:.82rem">Cena bramy dotyczy wszystkich bram tego typu w projekcie.</p>' : ''}</div>
    <div class="dlg-foot"><button class="btn" value="reset">Domyślna</button><span class="spacer"></span><button class="btn" value="cancel">Anuluj</button><button class="btn primary" value="ok">Zapisz</button></div></form>`;
  document.body.appendChild(dlg);
  dlg.addEventListener('close', () => {
    if (dlg.returnValue === 'ok') { D.prices[key] = { mat: num(dlg.querySelector('#pm').value), lab: num(dlg.querySelector('#pl').value) }; commit(); route(true); }
    else if (dlg.returnValue === 'reset') { delete D.prices[key]; commit(); route(true); }
    dlg.remove();
  });
  dlg.showModal();
}

/* ---------- Kontrola ---------- */
VIEWS.kontrola = () => {
  const lg = GarageCalc.legal(D), bc = GarageCalc.boundaryChecks(D), er = GarageCalc.ergonomics(D), pr = problems();
  view.innerHTML = `
    <div class="card"><div class="card-head"><h1 style="margin:0">Kontrola przepisów i ergonomii</h1>
      ${pr.bad ? `<span class="badge bad">${pr.bad} do poprawy</span>` : '<span class="badge ok">brak błędów</span>'}</div>
      <p class="muted" style="margin:0;font-size:.85rem">Automatyczna, uproszczona weryfikacja (Prawo budowlane, §12 WT, ustawa o drogach publicznych, dobre praktyki). Nie zastępuje weryfikacji przez urząd/architekta.</p></div>
    <div class="card"><div class="card-head"><h2 style="margin:0">Ścieżka formalna</h2><span class="badge ${lg.path === 'zgloszenie' ? 'ok' : 'warn'}">${lg.path === 'zgloszenie' ? 'Zgłoszenie' : 'Pozwolenie na budowę'}</span></div>
      <ul>${lg.reasons.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
      <div class="callout warn"><ul style="margin:0;padding-left:1.2em">${lg.notes.map(r => `<li>${esc(r)}</li>`).join('')}</ul></div>
      <a class="btn small" href="../planer/#sciezka">${icon('route')} Kreator w Planerze</a></div>
    <div class="grid grid-2">
      <div class="card"><div class="card-head"><h2 style="margin:0">Odległości</h2><button class="btn small" onclick="go('dzialka')">Działka</button></div>${bc.map(chkRow).join('')}</div>
      <div class="card"><div class="card-head"><h2 style="margin:0">Wymiary i otwory</h2><button class="btn small" onclick="go('otwory')">Otwory</button></div>${er.map(chkRow).join('')}</div>
    </div>`;
};

/* ---------- Warianty ---------- */
VIEWS.warianty = () => {
  const vars = Store.get(KEYS.variants, []);
  view.innerHTML = `
    <div class="card"><h2>Zapisz bieżący projekt jako wariant</h2>
      <div class="row"><input id="vName" placeholder="np. Wariant z dachem płaskim" value="${esc(D.name)}" style="flex:1;min-width:200px"><button class="btn primary" id="vSave">${icon('plus')} Zapisz wariant</button></div></div>
    <div class="card"><h2>Warianty</h2>
      ${vars.length ? `<ul class="list">${vars.map((v, i) => {
        const d = GarageCalc.normalize(v.design), g = GarageCalc.geometry(d), c = GarageCalc.costSummary(d);
        return `<li class="row"><div style="flex:1;min-width:180px"><b>${esc(v.name)}</b><br><small>${fmtNum(d.width)}×${fmtNum(d.length)} m · ${fmtNum(g.footprint)} m² · ${GarageCalc.ROOF_TYPES[d.roof.type].toLowerCase()} · ${fmtMoney(c.total)} · ${fmtDate(v.date)}</small></div>
          <button class="btn small" data-load="${i}">Wczytaj</button><button class="iconbtn" data-vdel="${i}" title="Usuń">${icon('trash')}</button></li>`;
      }).join('')}</ul>` : '<p class="empty">Brak zapisanych wariantów. Zapisz kilka wersji i porównaj koszty.</p>'}
    </div>
    <div class="card"><h2>Plik projektu</h2><div class="row">
      <button class="btn" id="exp">${icon('download')} Eksportuj projekt (.json)</button>
      <button class="btn" id="imp">${icon('upload')} Importuj projekt</button>
      <button class="btn danger" id="rst">Nowy projekt (domyślny)</button></div>
      <p class="muted" style="font-size:.82rem;margin:10px 0 0">Pełną kopię (Planer + Projektant) zrobisz w Planerze → Ustawienia i kopia.</p></div>`;
  document.getElementById('vSave').onclick = () => {
    const name = document.getElementById('vName').value.trim() || D.name;
    vars.unshift({ name, date: isoDate(new Date()), design: JSON.parse(JSON.stringify(D)) });
    Store.set(KEYS.variants, vars.slice(0, 30)); toast('Zapisano wariant'); route(true);
  };
  view.querySelectorAll('[data-load]').forEach(b => b.onclick = async () => {
    if (await confirmDialog('Wczytać wariant? Bieżący projekt zostanie zastąpiony (zapisz go wcześniej jako wariant).', 'Wczytaj')) {
      D = GarageCalc.normalize(JSON.parse(JSON.stringify(vars[+b.dataset.load].design))); commit(); toast('Wczytano wariant'); go('parametry');
    }
  });
  view.querySelectorAll('[data-vdel]').forEach(b => b.onclick = async () => {
    if (await confirmDialog('Usunąć ten wariant?', 'Usuń')) { vars.splice(+b.dataset.vdel, 1); Store.set(KEYS.variants, vars); route(true); }
  });
  document.getElementById('exp').onclick = () => downloadFile(`garaz-projekt-${isoDate(new Date())}.json`, JSON.stringify({ _format: 'garaz-projekt', design: D }, null, 2));
  document.getElementById('imp').onclick = async () => {
    const f = await pickFile(); if (!f) return;
    try {
      const o = JSON.parse(await f.text());
      const des = o._format === 'garaz-projekt' ? o.design : o._format === 'garaz-backup' ? o.data[KEYS.design] : null;
      if (!des) throw new Error('Nieznany format pliku');
      D = GarageCalc.normalize(des); commit(); toast('Zaimportowano projekt'); go('parametry');
    } catch (e) { toast(e.message || 'Błąd importu'); }
  };
  document.getElementById('rst').onclick = async () => {
    if (await confirmDialog('Zastąpić bieżący projekt domyślnym? Niezapisane zmiany przepadną.', 'Nowy projekt')) { D = GarageCalc.defaultDesign(); commit(); go('parametry'); }
  };
};

/* ---------- Start ---------- */
buildNav(NAV, go);
setupPWA();
header();
route();
