/* Planowanie budowy */
'use strict';

const NAV = [
  { id: 'pulpit', label: 'Pulpit', icon: 'home' },
  { id: 'sciezka', label: 'Ścieżka formalna', short: 'Ścieżka', icon: 'route' },
  { id: 'formalnosci', label: 'Lista kontrolna', short: 'Lista', icon: 'check' },
  { id: 'harmonogram', label: 'Harmonogram', short: 'Plan', icon: 'calendar' },
  { id: 'budzet', label: 'Budżet', icon: 'wallet' },
  { id: 'wiedza', label: 'Kompendium', short: 'Wiedza', icon: 'book' },
  { id: 'notatki', label: 'Notatki i kontakty', short: 'Notatki', icon: 'notes' },
  { sep: true },
  { id: 'ustawienia', label: 'Ustawienia i kopia', short: 'Więcej', icon: 'gear' },
];

function nextYearDate(m, d) { const y = new Date().getFullYear() + 1; return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`; }

function defaultState() {
  return {
    path: null, startDate: nextYearDate(1, 11), buildMin: nextYearDate(4, 1),
    checks: {}, itemNotes: {}, tasks: {}, budget: [], budgetLimit: 0, notes: [], contacts: [],
    wizard: { area: null, detached: true, parter: true, plotArea: null, others: 0, mpzp: 'tak', zabytek: false, natura: false, temp: false },
  };
}
let S = Object.assign(defaultState(), Store.get(KEYS.planer, {}));
S.wizard = Object.assign(defaultState().wizard, S.wizard);
function save() { Store.set(KEYS.planer, S); }

function design() {
  const d = Store.get(KEYS.design, null);
  return d ? GarageCalc.normalize(d) : null;
}
function effectivePath() {
  if (S.path) return S.path;
  const d = design();
  return d ? GarageCalc.legal(d).path : 'zgloszenie';
}
const PATH_LABEL = { zgloszenie: 'Zgłoszenie', pozwolenie: 'Pozwolenie na budowę' };

/* ---------- Router ---------- */
const view = document.getElementById('view');
let current = 'pulpit';
function go(id) { location.hash = id; }
function route() {
  const h = location.hash.slice(1) || 'pulpit';
  const [id, arg] = h.split('/');
  current = NAV.some(n => n.id === id) ? id : 'pulpit';
  markNav(current);
  const fn = VIEWS[current];
  view.innerHTML = '';
  fn(arg);
  view.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);

/* ---------- Checklista ---------- */
function checklist(path = effectivePath()) { return CHECKLISTS[path]; }
function checkKey(path, id) { return path + ':' + id; }
function checkStats(path = effectivePath()) {
  const all = checklist(path).flatMap(p => p.items);
  const done = all.filter(i => S.checks[checkKey(path, i.id)]).length;
  return { done, total: all.length, pct: all.length ? Math.round(done / all.length * 100) : 0 };
}

/* ---------- Harmonogram ---------- */
function schedule() {
  const path = effectivePath();
  const d = design();
  const hasMpzp = d ? d.plot.hasMpzp : S.wizard.mpzp !== 'nie';
  const formal = SCHEDULE[path].filter(t => !(t.ifNoMpzp && hasMpzp));
  const ids = new Set([...formal, ...SCHEDULE.budowa].map(t => t.id));
  const formalCore = formal.filter(t => t.id !== 'f4').map(t => t.id);
  const tasks = [...formal, ...SCHEDULE.budowa].map(t => ({
    ...t, deps: t.deps.flatMap(x => x === 'FORMAL' ? formalCore : [x]).filter(x => ids.has(x)),
  }));
  const ends = {};
  for (const t of tasks) {
    const o = S.tasks[t.id] || {};
    t.dur = o.dur != null ? o.dur : t.dur;
    let start = S.startDate;
    for (const dep of t.deps) if (ends[dep] && ends[dep] > start) start = ends[dep];
    if (t.id === 'b1' && S.buildMin > start) start = S.buildMin;
    if (o.start && o.start > start) start = o.start;
    t.start = start; t.end = addDays(start, t.dur); t.done = !!o.done; t.manual = !!o.start;
    ends[t.id] = t.end;
    const m1 = +t.start.slice(5, 7), m2 = +t.end.slice(5, 7);
    t.frost = t.concrete && ([11, 12, 1, 2, 3].includes(m1) || [12, 1, 2].includes(m2));
  }
  const buildStart = tasks.find(t => t.id === 'b1').start;
  const finish = tasks.reduce((m, t) => t.end > m ? t.end : m, S.startDate);
  const formalEnd = formalCore.reduce((m, id) => ends[id] > m ? ends[id] : m, S.startDate);
  return { tasks, buildStart, finish, formalEnd };
}

/* ---------- Budżet ---------- */
function budgetTotals() {
  const plan = S.budget.reduce((s, i) => s + (+i.plan || 0), 0);
  const actual = S.budget.reduce((s, i) => s + (+i.actual || 0), 0);
  const paid = S.budget.filter(i => i.paid).reduce((s, i) => s + (+i.actual || +i.plan || 0), 0);
  return { plan, actual, paid };
}

/* ================= WIDOKI ================= */
const VIEWS = {};

VIEWS.pulpit = () => {
  const path = effectivePath(), cs = checkStats(path), sc = schedule(), bt = budgetTotals(), d = design();
  const today = isoDate(new Date());
  const toBuild = daysBetween(today, sc.buildStart);
  const open = checklist(path).flatMap(p => p.items.map(i => ({ ...i, phase: p.phase }))).filter(i => !S.checks[checkKey(path, i.id)]).slice(0, 5);
  const upcoming = sc.tasks.filter(t => !t.done).slice(0, 4);
  let projHtml;
  if (d) {
    const g = GarageCalc.geometry(d), cost = GarageCalc.costSummary(d), lg = GarageCalc.legal(d);
    projHtml = `<dl class="kv">
      <dt>Wymiary zewn.</dt><dd>${fmtNum(d.width)} × ${fmtNum(d.length)} m</dd>
      <dt>Pow. zabudowy</dt><dd>${fmtNum(g.footprint)} m² ${g.footprint > 35 ? '<span class="badge warn">&gt; 35</span>' : '<span class="badge ok">≤ 35</span>'}</dd>
      <dt>Pow. użytkowa</dt><dd>${fmtNum(g.usable)} m²</dd>
      <dt>Dach</dt><dd>${GarageCalc.ROOF_TYPES[d.roof.type]}${d.roof.type !== 'plaski' ? ', ' + d.roof.pitch + '°' : ''}</dd>
      <dt>Wysokość całk.</dt><dd>${fmtNum(g.totalHeight)} m</dd>
      <dt>Szac. koszt</dt><dd>${fmtMoney(cost.total)}</dd>
      <dt>Wg projektu</dt><dd>${PATH_LABEL[lg.path]}</dd></dl>
      <div class="row" style="margin-top:12px"><a class="btn small" href="../projektant/">${icon('ruler')} Edytuj projekt</a><button class="btn small" id="impBudget">${icon('download')} Kosztorys → budżet</button></div>`;
  } else {
    projHtml = `<p class="muted">Nie masz jeszcze projektu. W Projektowaniu garażu ustawisz wymiary, dach, bramę i położenie na działce – Planowanie budowy pobierze z niego ścieżkę formalną i kosztorys.</p><a class="btn primary" href="../projektant/">${icon('ruler')} Zaprojektuj garaż</a>`;
  }
  const month = new Date().getMonth() + 1;
  const tip = month >= 11 || month <= 2
    ? 'Zima to najlepszy czas na formalności, projekt, wybór wykonawcy i zamówienie bramy – żeby ruszyć z fundamentami w kwietniu.'
    : month <= 4 ? 'Wiosna: rusza sezon – rezerwuj ekipę i beton z wyprzedzeniem, sprawdź, czy minęło 21 dni od zgłoszenia.'
    : month <= 9 ? 'Sezon budowlany: pilnuj przerw technologicznych (beton!) i odbieraj etapy przed płatnością.'
    : 'Jesień: zamknij stan surowy przed mrozami (dach!), prace betonowe kończ przy temperaturach powyżej +5°C.';

  view.innerHTML = `
    <div class="card"><div class="hero">
      <div style="flex:1">
        <div class="muted" style="font-size:.85rem">Twoja ścieżka formalna</div>
        <div class="big">${PATH_LABEL[path]}</div>
        <p class="muted" style="margin:4px 0 0">${S.path ? 'Ustawiona ręcznie w kreatorze.' : d ? 'Wynika z projektu w Projektowaniu garażu.' : 'Domyślnie – sprawdź w kreatorze.'}</p>
      </div>
      <button class="btn small" onclick="go('sciezka')">${icon('route')} Kreator</button>
    </div></div>
    <div class="grid grid-4" style="margin-bottom:16px">
      <div class="stat"><div class="label">Lista kontrolna</div><div class="value">${cs.done}/${cs.total}</div><div class="progress" style="margin-top:6px"><i style="width:${cs.pct}%"></i></div></div>
      <div class="stat"><div class="label">Start budowy</div><div class="value">${fmtDate(sc.buildStart)}</div><div class="sub">${toBuild > 0 ? 'za ' + toBuild + ' dni' : toBuild === 0 ? 'dziś' : 'w toku / minął'}</div></div>
      <div class="stat"><div class="label">Zakończenie (plan)</div><div class="value">${fmtDate(sc.finish)}</div><div class="sub">formalności do ${fmtDate(sc.formalEnd)}</div></div>
      <div class="stat"><div class="label">Budżet</div><div class="value">${fmtMoney(bt.plan)}</div><div class="sub">wydano ${fmtMoney(bt.actual)}</div></div>
    </div>
    <div class="grid grid-2">
      <div class="card"><div class="card-head"><h2>Najbliższe kroki</h2><button class="btn small" onclick="go('formalnosci')">Wszystkie</button></div>
        ${open.length ? open.map(i => `<label class="chk-item"><input type="checkbox" data-chk="${i.id}"><div class="tx"><b>${esc(i.t)}</b><p>${esc(i.phase)}</p></div></label>`).join('') : '<p class="empty">Wszystko odhaczone – gratulacje!</p>'}
      </div>
      <div class="card"><div class="card-head"><h2>Projekt garażu</h2></div>${projHtml}</div>
      <div class="card"><div class="card-head"><h2>Następne etapy</h2><button class="btn small" onclick="go('harmonogram')">Harmonogram</button></div>
        <ul class="list">${upcoming.map(t => `<li class="row"><span style="flex:1">${esc(t.name)}${t.frost ? ' <span class="badge warn">mróz?</span>' : ''}</span><small>${fmtDate(t.start)} → ${fmtDate(t.end)}</small></li>`).join('')}</ul>
      </div>
      <div class="card"><h2>Wskazówka na teraz</h2><p>${tip}</p><p class="muted" style="font-size:.8rem;margin:0">${esc(DISCLAIMER)}</p></div>
    </div>`;
  view.querySelectorAll('[data-chk]').forEach(cb => cb.addEventListener('change', () => {
    S.checks[checkKey(path, cb.dataset.chk)] = cb.checked; save(); toast('Odhaczono'); setTimeout(route, 300);
  }));
  const ib = document.getElementById('impBudget'); if (ib) ib.onclick = () => { importBudget(); go('budzet'); };
};

/* ---------- Kreator ścieżki ---------- */
VIEWS.sciezka = () => {
  const d = design(), w = S.wizard;
  if (d) {
    const g = GarageCalc.geometry(d);
    if (w.area == null) w.area = +g.footprint.toFixed(2);
    if (w.plotArea == null) w.plotArea = d.plot.width * d.plot.depth;
  }
  view.innerHTML = `
    <div class="card">
      <h1>Kreator ścieżki formalnej</h1>
      <p class="muted">Odpowiedz na kilka pytań – podpowiem, czy wystarczy zgłoszenie, czy potrzebne jest pozwolenie na budowę.</p>
      ${d ? `<div class="callout">Wartości wstępnie pobrane z Twojego projektu (${fmtNum(d.width)} × ${fmtNum(d.length)} m). <button class="btn small" id="fromDesign">Pobierz ponownie</button></div>` : ''}
      <div class="form-grid">
        <label class="field">Powierzchnia zabudowy [m²]<input type="number" step="0.1" min="0" id="w_area" value="${w.area ?? ''}" placeholder="np. 34.8"><span class="hint">obrys zewnętrzny ścian, z ociepleniem</span></label>
        <label class="field">Powierzchnia działki [m²]<input type="number" step="1" min="0" id="w_plot" value="${w.plotArea ?? ''}" placeholder="np. 900"></label>
        <label class="field">Inne obiekty do 35 m² na działce<input type="number" min="0" step="1" id="w_others" value="${w.others}"><span class="hint">budynki gospodarcze, wiaty, altany</span></label>
        <label class="field">Czy działka ma MPZP?<select id="w_mpzp"><option value="tak">Tak</option><option value="nie">Nie</option><option value="?">Nie wiem</option></select></label>
        <div class="full stack">
          <label class="check"><input type="checkbox" id="w_det" ${w.detached ? 'checked' : ''}> Garaż wolnostojący (nie styka się z domem)</label>
          <label class="check"><input type="checkbox" id="w_par" ${w.parter ? 'checked' : ''}> Parterowy (jedna kondygnacja)</label>
          <label class="check"><input type="checkbox" id="w_zab" ${w.zabytek ? 'checked' : ''}> Działka w rejestrze zabytków / strefie konserwatorskiej</label>
          <label class="check"><input type="checkbox" id="w_nat" ${w.natura ? 'checked' : ''}> Obszar Natura 2000</label>
          <label class="check"><input type="checkbox" id="w_tmp" ${w.temp ? 'checked' : ''}> Obiekt tymczasowy (niezwiązany trwale z gruntem, na max 180 dni)</label>
        </div>
      </div>
    </div>
    <div id="wizResult"></div>`;
  document.getElementById('w_mpzp').value = w.mpzp;
  const bind = (id, key, fn) => document.getElementById(id).addEventListener('input', e => { w[key] = fn(e.target); save(); renderResult(); });
  bind('w_area', 'area', t => t.value === '' ? null : num(t.value));
  bind('w_plot', 'plotArea', t => t.value === '' ? null : num(t.value));
  bind('w_others', 'others', t => num(t.value));
  bind('w_mpzp', 'mpzp', t => t.value);
  bind('w_det', 'detached', t => t.checked); bind('w_par', 'parter', t => t.checked);
  bind('w_zab', 'zabytek', t => t.checked); bind('w_nat', 'natura', t => t.checked); bind('w_tmp', 'temp', t => t.checked);
  const fd = document.getElementById('fromDesign');
  if (fd) fd.onclick = () => { w.area = null; w.plotArea = null; save(); route(); };
  renderResult();

  function renderResult() {
    const r = evaluateWizard(w);
    document.getElementById('wizResult').innerHTML = `
      <div class="card">
        <div class="card-head"><h2>Wynik: ${PATH_LABEL[r.path]}</h2><span class="badge ${r.path === 'zgloszenie' ? 'ok' : 'warn'}">${r.path === 'zgloszenie' ? '21 dni na sprzeciw' : 'projekt + decyzja'}</span></div>
        <ul>${r.reasons.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        ${r.notes.length ? `<div class="callout warn"><ul style="margin:0;padding-left:1.2em">${r.notes.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
        <div class="row">
          <button class="btn primary" id="applyPath">${S.path === r.path ? icon('check') + ' Ścieżka przyjęta' : 'Przyjmij tę ścieżkę'}</button>
          ${S.path ? '<button class="btn" id="autoPath">Ustalaj z projektu</button>' : ''}
          <button class="btn" onclick="go('wiedza/sciezka')">${icon('book')} Więcej o trybach</button>
        </div>
      </div>`;
    document.getElementById('applyPath').onclick = () => { S.path = r.path; save(); toast('Ścieżka: ' + PATH_LABEL[r.path]); renderResult(); };
    const ap = document.getElementById('autoPath'); if (ap) ap.onclick = () => { S.path = null; save(); toast('Ścieżka będzie wynikała z projektu'); renderResult(); };
  }
};

function evaluateWizard(w) {
  const reasons = [], notes = [];
  let path = 'zgloszenie';
  const area = w.area;
  if (w.temp) {
    reasons.push('Tymczasowy obiekt niezwiązany trwale z gruntem (do 180 dni) – wymaga zgłoszenia z terminem rozbiórki/przeniesienia.');
  } else {
    if (!w.detached) { path = 'pozwolenie'; reasons.push('Garaż dobudowany do domu = rozbudowa budynku mieszkalnego: pozwolenie na budowę (lub zgłoszenie z projektem, gdy dom spełnia warunki art. 29 ust. 1 pkt 1 PB). Potrzebny projekt architekta.'); }
    if (!w.parter) { path = 'pozwolenie'; reasons.push('Tryb zgłoszenia obejmuje tylko garaże parterowe – garaż piętrowy wymaga pozwolenia.'); }
    if (area == null) reasons.push('Podaj powierzchnię zabudowy, aby sprawdzić limit 35 m².');
    else if (area > 35) { path = 'pozwolenie'; reasons.push(`${fmtNum(area)} m² > 35 m² – wymagane pozwolenie na budowę z projektem budowlanym.`); }
    else if (w.detached && w.parter) reasons.push(`${fmtNum(area)} m² ≤ 35 m² – wolnostojący parterowy garaż: wystarczy zgłoszenie (art. 29 ust. 1 PB).`);
    if (w.plotArea && area != null && area <= 35) {
      const allowed = Math.floor(w.plotArea / 500) * 2, count = (w.others || 0) + 1;
      if (count > allowed) { path = 'pozwolenie'; reasons.push(`Limit: 2 obiekty do 35 m² na każde 500 m² działki. Na ${fmtNum(w.plotArea, 0)} m² możesz mieć ${allowed}, a byłoby ${count}.`); }
      else reasons.push(`Limit obiektów spełniony (${count} z ${allowed} dopuszczalnych).`);
    }
  }
  if (w.zabytek) notes.push('Rejestr zabytków: potrzebne pozwolenie wojewódzkiego konserwatora zabytków; w strefie ochrony – uzgodnienia. Urząd może wymagać pozwolenia na budowę.');
  if (w.natura) notes.push('Natura 2000: urząd może nałożyć obowiązek uzyskania pozwolenia na budowę, jeśli inwestycja może oddziaływać na obszar.');
  if (w.mpzp === 'nie' && path === 'pozwolenie') notes.push('Brak MPZP + pozwolenie = potrzebna decyzja WZ. Od 1.09.2026 wydawana tylko w gminie z planem ogólnym (obszar uzupełnienia zabudowy) – sprawdź status w gminie!');
  if (w.mpzp === '?') notes.push('Sprawdź MPZP na geoportalu gminy – od tego zależą linia zabudowy, wysokość i dach.');
  if (path === 'zgloszenie') notes.push('Pamiętaj o zgodności z MPZP i odległościach od granic – inaczej urząd wniesie sprzeciw.');
  return { path, reasons, notes };
}

/* ---------- Lista kontrolna ---------- */
VIEWS.formalnosci = () => {
  const path = effectivePath(), cs = checkStats(path);
  view.innerHTML = `
    <div class="card"><div class="card-head"><h1 style="margin:0">Lista kontrolna – ${PATH_LABEL[path]}</h1><span class="badge accent">${cs.done}/${cs.total}</span></div>
      <div class="progress"><i style="width:${cs.pct}%"></i></div>
      <p class="muted" style="margin:10px 0 0;font-size:.85rem">Dotknij pozycji, by odhaczyć. Ikona notatki pozwala zapisać numer sprawy, datę złożenia itp. Zmień ścieżkę w <a href="#sciezka">kreatorze</a>.</p>
    </div>
    ${checklist(path).map((ph, pi) => {
      const done = ph.items.filter(i => S.checks[checkKey(path, i.id)]).length;
      return `<details class="acc" ${done < ph.items.length && pi < 3 ? 'open' : ''}><summary>${pi + 1}. ${esc(ph.phase)} <span class="badge ${done === ph.items.length ? 'ok' : ''}">${done}/${ph.items.length}</span></summary><div class="body">
        ${ph.items.map(i => {
          const k = checkKey(path, i.id), note = S.itemNotes[k] || '';
          return `<div class="chk-item ${S.checks[k] ? 'done' : ''}">
            <input type="checkbox" data-k="${k}" ${S.checks[k] ? 'checked' : ''} aria-label="${esc(i.t)}">
            <div class="tx"><b>${esc(i.t)}</b><p>${esc(i.d)}${i.app === 'projektant' ? ' <a href="../projektant/">Otwórz Projektowanie garażu →</a>' : ''}</p>
              <textarea data-n="${k}" placeholder="Notatka (np. nr sprawy, data złożenia)" ${note ? '' : 'hidden'}>${esc(note)}</textarea></div>
            <button class="iconbtn" data-tn="${k}" title="Notatka">${icon('edit')}</button>
          </div>`;
        }).join('')}
      </div></details>`;
    }).join('')}`;
  view.querySelectorAll('[data-k]').forEach(cb => cb.addEventListener('change', () => {
    S.checks[cb.dataset.k] = cb.checked; save();
    cb.closest('.chk-item').classList.toggle('done', cb.checked);
    const st = checkStats(path);
    view.querySelector('.progress i').style.width = st.pct + '%';
    view.querySelector('.card .badge').textContent = `${st.done}/${st.total}`;
  }));
  view.querySelectorAll('[data-tn]').forEach(b => b.addEventListener('click', () => {
    const ta = view.querySelector(`[data-n="${b.dataset.tn}"]`); ta.hidden = !ta.hidden; if (!ta.hidden) ta.focus();
  }));
  view.querySelectorAll('[data-n]').forEach(ta => ta.addEventListener('input', () => { S.itemNotes[ta.dataset.n] = ta.value; save(); }));
};

/* ---------- Harmonogram ---------- */
VIEWS.harmonogram = () => {
  const sc = schedule(), path = effectivePath();
  const min = sc.tasks.reduce((m, t) => t.start < m ? t.start : m, S.startDate);
  const max = sc.finish;
  const span = Math.max(1, daysBetween(min, max));
  const pos = iso => Math.max(0, Math.min(100, daysBetween(min, iso) / span * 100));
  const today = isoDate(new Date());
  const months = [];
  { const d = new Date(min + 'T12:00:00'); d.setDate(1); d.setMonth(d.getMonth() + 1);
    while (isoDate(d) <= max) { months.push(isoDate(d)); d.setMonth(d.getMonth() + 1); } }
  const frostCount = sc.tasks.filter(t => t.frost && !t.done).length;
  view.innerHTML = `
    <div class="card">
      <h1>Harmonogram – ${PATH_LABEL[path]}</h1>
      <div class="form-grid cols-3">
        <label class="field">Start formalności<input type="date" id="h_start" value="${S.startDate}"></label>
        <label class="field">Najwcześniejszy start budowy<input type="date" id="h_build" value="${S.buildMin}"><span class="hint">np. po zimie</span></label>
        <div class="field"><span>Podsumowanie</span><div style="font-weight:600;color:var(--text)">${fmtDate(sc.buildStart)} → ${fmtDate(sc.finish)}<br><small>${daysBetween(S.startDate, sc.finish)} dni łącznie</small></div></div>
      </div>
      ${frostCount ? `<div class="callout warn">${frostCount} etap(y) z betonowaniem wypada w okresie ryzyka mrozu (lis–mar). Przesuń „najwcześniejszy start budowy” lub zaplanuj betonowanie zimowe.</div>` : ''}
      <div class="row" style="font-size:.78rem;color:var(--muted);gap:14px;margin-top:8px">
        <span class="row" style="gap:5px"><i style="width:14px;height:10px;background:#7b5cc4;border-radius:3px;display:inline-block"></i>formalności</span>
        <span class="row" style="gap:5px"><i style="width:14px;height:10px;background:var(--accent);border-radius:3px;display:inline-block"></i>roboty</span>
        <span class="row" style="gap:5px"><i style="width:14px;height:10px;background:repeating-linear-gradient(45deg,var(--muted) 0 3px,transparent 3px 6px);display:inline-block"></i>przerwa technologiczna</span>
        <span class="row" style="gap:5px"><i style="width:14px;height:10px;background:var(--ok);border-radius:3px;display:inline-block"></i>zrobione</span>
      </div>
    </div>
    <div class="card gantt">
      <div class="g-head"><div class="muted" style="font-size:.78rem">Etap (dotknij, by edytować)</div>
        <div class="g-months">${months.map(m => `<span style="left:${pos(m)}%">${new Date(m + 'T12:00:00').toLocaleDateString('pl-PL', { month: 'short' })}${m.slice(5, 7) === '01' ? ' ' + m.slice(0, 4) : ''}</span>`).join('')}</div></div>
      ${sc.tasks.map(t => `
        <div class="g-row ${t.done ? 'done' : ''}" data-t="${t.id}">
          <div class="g-label"><span class="nm">${esc(t.name)}${t.manual ? ' 📌' : ''}${t.frost && !t.done ? ' <span class="badge warn">mróz</span>' : ''}</span><span class="dt">${fmtDate(t.start)} · ${t.dur} d</span></div>
          <div class="g-track">${today >= min && today <= max ? `<i class="g-today" style="left:${pos(today)}%"></i>` : ''}
            <i class="g-bar ${t.ph} ${t.wait ? 'wait' : ''} ${t.done ? 'done' : ''} ${t.frost && !t.done ? 'warn' : ''}" style="left:${pos(t.start)}%;width:${Math.max(.6, pos(t.end) - pos(t.start))}%"></i></div>
        </div>`).join('')}
    </div>
    <div class="row hide-print"><button class="btn" id="resetSched">Przywróć domyślne czasy</button><button class="btn" onclick="print()">${icon('print')} Drukuj</button></div>`;
  document.getElementById('h_start').onchange = e => { if (e.target.value) { S.startDate = e.target.value; save(); route(); } };
  document.getElementById('h_build').onchange = e => { if (e.target.value) { S.buildMin = e.target.value; save(); route(); } };
  document.getElementById('resetSched').onclick = async () => { if (await confirmDialog('Usunąć własne czasy trwania, daty i oznaczenia „zrobione”?', 'Przywróć')) { S.tasks = {}; save(); route(); } };
  view.querySelectorAll('.g-row').forEach(r => r.addEventListener('click', () => editTask(sc.tasks.find(t => t.id === r.dataset.t))));
};

function editTask(t) {
  const o = S.tasks[t.id] || {};
  const dlg = document.createElement('dialog');
  dlg.innerHTML = `<form method="dialog"><div class="dlg-body"><h2>${esc(t.name)}</h2>
    <div class="form-grid">
      <label class="field">Czas trwania [dni]<input type="number" min="0" id="e_dur" value="${t.dur}"></label>
      <label class="field">Nie wcześniej niż<input type="date" id="e_start" value="${o.start || ''}"><span class="hint">puste = automatycznie</span></label>
      <label class="check full"><input type="checkbox" id="e_done" ${t.done ? 'checked' : ''}> Etap zakończony</label>
    </div>
    <p class="muted" style="font-size:.85rem">Obecnie: ${fmtDate(t.start)} → ${fmtDate(t.end)}. ${t.deps.length ? 'Zaczyna się po: ' + t.deps.map(id => esc(schedule().tasks.find(x => x.id === id)?.name || id)).join(', ') + '.' : ''}</p>
    </div><div class="dlg-foot"><button class="btn" value="cancel">Anuluj</button><button class="btn primary" value="ok">Zapisz</button></div></form>`;
  document.body.appendChild(dlg);
  dlg.addEventListener('close', () => {
    if (dlg.returnValue === 'ok') {
      const dur = parseInt(dlg.querySelector('#e_dur').value, 10);
      const start = dlg.querySelector('#e_start').value;
      S.tasks[t.id] = { dur: isFinite(dur) ? dur : t.dur, start: start || undefined, done: dlg.querySelector('#e_done').checked };
      save(); route();
    }
    dlg.remove();
  });
  dlg.showModal();
}

/* ---------- Budżet ---------- */
function importBudget() {
  const d = design();
  if (!d) { toast('Najpierw utwórz projekt w Projektowaniu garażu'); return; }
  const cs = GarageCalc.costSummary(d);
  const old = Object.fromEntries(S.budget.filter(i => i.src === 'projekt').map(i => [i.key, i]));
  const manual = S.budget.filter(i => i.src !== 'projekt');
  const items = cs.lines.map(l => {
    const key = l.key + ':' + l.label;
    const prev = old[key] || {};
    return { id: prev.id || uid(), src: 'projekt', key, cat: l.cat, name: l.label, qty: `${fmtNum(l.qty)} ${l.unit}`, plan: Math.round(l.mat + l.lab), actual: prev.actual || 0, paid: !!prev.paid, note: prev.note || l.note || '' };
  });
  if (cs.reserve > 0) {
    const prev = old['rezerwa'] || {};
    items.push({ id: prev.id || uid(), src: 'projekt', key: 'rezerwa', cat: 'Inne', name: `Rezerwa ${d.options.reserve}%`, qty: '', plan: Math.round(cs.reserve), actual: prev.actual || 0, paid: !!prev.paid, note: '' });
  }
  S.budget = [...items, ...manual];
  save(); toast(`Zaimportowano ${items.length} pozycji z kosztorysu`);
}

VIEWS.budzet = () => {
  const bt = budgetTotals();
  const byCat = {};
  for (const c of BUDGET_CATS) byCat[c] = { plan: 0, actual: 0 };
  for (const i of S.budget) { const c = byCat[i.cat] || (byCat[i.cat] = { plan: 0, actual: 0 }); c.plan += +i.plan || 0; c.actual += +i.actual || 0; }
  const maxV = Math.max(1, ...Object.values(byCat).map(c => Math.max(c.plan, c.actual)));
  const limit = +S.budgetLimit || 0;
  view.innerHTML = `
    <div class="grid grid-4" style="margin-bottom:16px">
      <div class="stat"><div class="label">Plan</div><div class="value">${fmtMoney(bt.plan)}</div></div>
      <div class="stat"><div class="label">Wydano (faktycznie)</div><div class="value">${fmtMoney(bt.actual)}</div><div class="sub">${bt.plan ? Math.round(bt.actual / bt.plan * 100) : 0}% planu</div></div>
      <div class="stat"><div class="label">Opłacone</div><div class="value">${fmtMoney(bt.paid)}</div></div>
      <div class="stat"><div class="label">Limit budżetu</div><div class="value">${limit ? fmtMoney(limit) : '—'}</div><div class="sub">${limit ? (bt.plan > limit ? `<span style="color:var(--bad)">plan ponad limit o ${fmtMoney(bt.plan - limit)}</span>` : `zapas ${fmtMoney(limit - bt.plan)}`) : '<a href="#" id="setLimit">ustaw limit</a>'}</div></div>
    </div>
    <div class="card"><div class="card-head"><h2>Wg kategorii</h2><small>pole = plan, pasek = wydano</small></div>
      <div class="bars">${Object.entries(byCat).filter(([, c]) => c.plan || c.actual).map(([k, c]) => `
        <div class="bar-row"><span>${esc(k)}</span><div class="bar-track"><i class="bar-plan" style="width:${c.plan / maxV * 100}%"></i><i class="bar-act ${c.actual > c.plan ? 'over' : ''}" style="width:${c.actual / maxV * 100}%"></i></div><span class="num" style="font-variant-numeric:tabular-nums">${fmtMoney(c.actual)} / ${fmtMoney(c.plan)}</span></div>`).join('') || '<p class="empty">Brak pozycji.</p>'}</div>
    </div>
    <div class="card">
      <div class="card-head"><h2>Pozycje</h2><div class="row">
        <button class="btn small" id="imp">${icon('download')} Import z Projektowania garażu</button>
        <button class="btn small" id="limitBtn">Limit</button>
        <button class="btn small primary" id="add">${icon('plus')} Dodaj</button></div></div>
      ${S.budget.length ? `<div class="table-wrap"><table><thead><tr><th>Pozycja</th><th class="num">Plan</th><th class="num">Faktycznie</th><th>Opł.</th><th></th></tr></thead><tbody>
        ${BUDGET_CATS.concat(Object.keys(byCat).filter(c => !BUDGET_CATS.includes(c))).map(cat => {
          const items = S.budget.filter(i => i.cat === cat); if (!items.length) return '';
          return `<tr><td colspan="5" style="background:var(--surface-2);font-weight:700;font-size:.8rem">${esc(cat)}</td></tr>` + items.map(i => `
            <tr><td>${esc(i.name)}${i.qty ? `<br><small>${esc(i.qty)}</small>` : ''}${i.note ? `<br><small>${esc(i.note)}</small>` : ''}</td>
            <td class="num">${fmtMoney(i.plan)}</td>
            <td class="num"><input type="number" inputmode="decimal" data-act="${i.id}" value="${i.actual || ''}" placeholder="0" style="width:100px;min-height:32px;padding:4px 6px;text-align:right"></td>
            <td><input type="checkbox" data-paid="${i.id}" ${i.paid ? 'checked' : ''} aria-label="Opłacone"></td>
            <td><button class="iconbtn" data-edit="${i.id}" title="Edytuj">${icon('edit')}</button></td></tr>`).join('');
        }).join('')}
        </tbody><tfoot><tr><td>Razem</td><td class="num">${fmtMoney(bt.plan)}</td><td class="num">${fmtMoney(bt.actual)}</td><td colspan="2"></td></tr></tfoot></table></div>`
      : `<p class="empty">Budżet jest pusty. Zaimportuj kosztorys z Projektowania garażu albo dodaj pozycje ręcznie.</p>`}
    </div>`;
  document.getElementById('imp').onclick = () => { importBudget(); route(); };
  document.getElementById('add').onclick = () => editBudget(null);
  const setLim = async () => {
    const v = prompt('Limit budżetu (zł):', S.budgetLimit || '');
    if (v != null) { S.budgetLimit = num(v); save(); route(); }
  };
  document.getElementById('limitBtn').onclick = setLim;
  const sl = document.getElementById('setLimit'); if (sl) sl.onclick = e => { e.preventDefault(); setLim(); };
  view.querySelectorAll('[data-act]').forEach(inp => inp.addEventListener('change', () => {
    const it = S.budget.find(i => i.id === inp.dataset.act); it.actual = num(inp.value); save(); route();
  }));
  view.querySelectorAll('[data-paid]').forEach(cb => cb.addEventListener('change', () => {
    const it = S.budget.find(i => i.id === cb.dataset.paid); it.paid = cb.checked; save();
  }));
  view.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => editBudget(S.budget.find(i => i.id === b.dataset.edit))));
};

function editBudget(item) {
  const it = item || { id: uid(), src: 'reczne', cat: 'Inne', name: '', plan: 0, actual: 0, paid: false, note: '' };
  const dlg = document.createElement('dialog');
  dlg.innerHTML = `<form method="dialog"><div class="dlg-body"><h2>${item ? 'Edytuj pozycję' : 'Nowa pozycja'}</h2>
    <div class="form-grid">
      <label class="field full">Nazwa<input id="b_name" required value="${esc(it.name)}"></label>
      <label class="field">Kategoria<select id="b_cat">${BUDGET_CATS.map(c => `<option ${c === it.cat ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
      <label class="field">Ilość / opis<input id="b_qty" value="${esc(it.qty || '')}"></label>
      <label class="field">Plan [zł]<input id="b_plan" type="number" inputmode="decimal" value="${it.plan || ''}"></label>
      <label class="field">Faktycznie [zł]<input id="b_act" type="number" inputmode="decimal" value="${it.actual || ''}"></label>
      <label class="field full">Notatka (dostawca, nr faktury)<input id="b_note" value="${esc(it.note || '')}"></label>
      <label class="check full"><input type="checkbox" id="b_paid" ${it.paid ? 'checked' : ''}> Opłacone</label>
    </div></div>
    <div class="dlg-foot">${item ? '<button class="btn danger" value="del" formnovalidate>Usuń</button><span class="spacer"></span>' : ''}<button class="btn" value="cancel" formnovalidate>Anuluj</button><button class="btn primary" value="ok">Zapisz</button></div></form>`;
  document.body.appendChild(dlg);
  dlg.addEventListener('close', () => {
    const q = s => dlg.querySelector(s);
    if (dlg.returnValue === 'ok') {
      Object.assign(it, { name: q('#b_name').value.trim() || 'Pozycja', cat: q('#b_cat').value, qty: q('#b_qty').value, plan: num(q('#b_plan').value), actual: num(q('#b_act').value), note: q('#b_note').value, paid: q('#b_paid').checked });
      if (!item) S.budget.push(it);
      save(); route();
    } else if (dlg.returnValue === 'del') { S.budget = S.budget.filter(i => i.id !== it.id); save(); route(); }
    dlg.remove();
  });
  dlg.showModal();
}

/* ---------- Kompendium ---------- */
VIEWS.wiedza = (arg) => {
  const a = ARTICLES.find(x => x.id === arg);
  if (a) {
    const idx = ARTICLES.indexOf(a), next = ARTICLES[idx + 1], prev = ARTICLES[idx - 1];
    view.innerHTML = `
      <div class="row hide-print" style="margin-bottom:12px"><button class="btn small" onclick="go('wiedza')">← Spis treści</button></div>
      <article class="card article"><h1>${esc(a.title)}</h1>${a.html}</article>
      <div class="row hide-print">${prev ? `<button class="btn" onclick="go('wiedza/${prev.id}')">← ${esc(prev.title)}</button>` : ''}<span class="spacer"></span>${next ? `<button class="btn" onclick="go('wiedza/${next.id}')">${esc(next.title)} →</button>` : ''}</div>
      <p class="muted" style="font-size:.8rem;margin-top:16px">${esc(DISCLAIMER)}</p>`;
    view.querySelectorAll('table').forEach(t => { const w = document.createElement('div'); w.className = 'table-wrap'; t.replaceWith(w); w.appendChild(t); });
    return;
  }
  view.innerHTML = `
    <div class="card"><h1>Kompendium budowy garażu</h1><p class="muted" style="margin:0">Przepisy, technologia, wymiary i koszty – w pigułce. Działa offline.</p></div>
    <div class="article-list">${ARTICLES.map(x => `<button onclick="go('wiedza/${x.id}')">${icon(x.icon)}<span>${esc(x.title)}</span></button>`).join('')}</div>
    <div class="callout" style="margin-top:16px">${esc(DISCLAIMER)}</div>`;
};

/* ---------- Notatki i kontakty ---------- */
let notesTab = 'notes';
VIEWS.notatki = () => {
  const notes = [...S.notes].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  view.innerHTML = `
    <div class="card"><div class="card-head"><div class="seg" role="group">
        <button aria-pressed="${notesTab === 'notes'}" data-tab="notes">Dziennik / notatki</button>
        <button aria-pressed="${notesTab === 'contacts'}" data-tab="contacts">Kontakty</button></div>
      <button class="btn small primary" id="addN">${icon('plus')} Dodaj</button></div>
      ${notesTab === 'notes'
        ? (notes.length ? `<ul class="list">${notes.map(n => `<li><div class="row"><b style="flex:1">${esc(n.title || 'Notatka')}</b><small>${fmtDate(n.date)}</small><button class="iconbtn" data-en="${n.id}">${icon('edit')}</button></div>${n.text ? `<div style="white-space:pre-wrap;font-size:.9rem;margin-top:4px">${esc(n.text)}</div>` : ''}</li>`).join('')}</ul>`
          : '<p class="empty">Zapisuj tu przebieg budowy: dostawy, odbiory, ustalenia z wykonawcą, numery spraw w urzędzie.</p>')
        : (S.contacts.length ? `<ul class="list">${S.contacts.map(c => `<li><div class="row"><div style="flex:1"><b>${esc(c.name)}</b> <span class="badge">${esc(c.role || '')}</span>
            <div style="font-size:.88rem">${c.phone ? `<a href="tel:${esc(c.phone.replace(/\s/g, ''))}">${esc(c.phone)}</a>` : ''} ${c.email ? ` · <a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : ''}</div>${c.note ? `<small>${esc(c.note)}</small>` : ''}</div>
            <button class="iconbtn" data-ec="${c.id}">${icon('edit')}</button></div></li>`).join('')}</ul>`
          : '<p class="empty">Architekt, geodeta, wykonawca, dostawca bramy, elektryk, urząd…</p>')}
    </div>`;
  view.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { notesTab = b.dataset.tab; route(); });
  document.getElementById('addN').onclick = () => notesTab === 'notes' ? editNote(null) : editContact(null);
  view.querySelectorAll('[data-en]').forEach(b => b.onclick = () => editNote(S.notes.find(n => n.id === b.dataset.en)));
  view.querySelectorAll('[data-ec]').forEach(b => b.onclick = () => editContact(S.contacts.find(n => n.id === b.dataset.ec)));
};
function formDialog(title, fields, obj, isNew, onSave, onDelete) {
  const dlg = document.createElement('dialog');
  dlg.innerHTML = `<form method="dialog"><div class="dlg-body"><h2>${esc(title)}</h2><div class="form-grid">
    ${fields.map(f => `<label class="field ${f.full ? 'full' : ''}">${esc(f.label)}${f.type === 'textarea'
      ? `<textarea id="f_${f.k}" rows="6">${esc(obj[f.k] || '')}</textarea>`
      : f.type === 'select' ? `<select id="f_${f.k}">${f.options.map(o => `<option ${o === obj[f.k] ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`
      : `<input id="f_${f.k}" type="${f.type || 'text'}" value="${esc(obj[f.k] || '')}">`}</label>`).join('')}
    </div></div><div class="dlg-foot">${!isNew ? '<button class="btn danger" value="del">Usuń</button><span class="spacer"></span>' : ''}<button class="btn" value="cancel">Anuluj</button><button class="btn primary" value="ok">Zapisz</button></div></form>`;
  document.body.appendChild(dlg);
  dlg.addEventListener('close', () => {
    if (dlg.returnValue === 'ok') { for (const f of fields) obj[f.k] = dlg.querySelector('#f_' + f.k).value; onSave(obj); }
    else if (dlg.returnValue === 'del') onDelete(obj);
    dlg.remove();
  });
  dlg.showModal();
}
function editNote(n) {
  const isNew = !n; n = n || { id: uid(), date: isoDate(new Date()), title: '', text: '' };
  formDialog(isNew ? 'Nowa notatka' : 'Notatka', [
    { k: 'date', label: 'Data', type: 'date' }, { k: 'title', label: 'Tytuł' }, { k: 'text', label: 'Treść', type: 'textarea', full: true },
  ], n, isNew, o => { if (isNew) S.notes.push(o); save(); route(); }, o => { S.notes = S.notes.filter(x => x.id !== o.id); save(); route(); });
}
function editContact(c) {
  const isNew = !c; c = c || { id: uid(), name: '', role: 'Wykonawca', phone: '', email: '', note: '' };
  formDialog(isNew ? 'Nowy kontakt' : 'Kontakt', [
    { k: 'name', label: 'Imię / firma', full: true },
    { k: 'role', label: 'Rola', type: 'select', options: ['Architekt', 'Geodeta', 'Wykonawca', 'Kierownik budowy', 'Elektryk', 'Dostawca bramy', 'Hurtownia', 'Urząd', 'Inne'] },
    { k: 'phone', label: 'Telefon', type: 'tel' }, { k: 'email', label: 'E-mail', type: 'email' }, { k: 'note', label: 'Notatka', full: true },
  ], c, isNew, o => { if (isNew) S.contacts.push(o); save(); route(); }, o => { S.contacts = S.contacts.filter(x => x.id !== o.id); save(); route(); });
}

/* ---------- Ustawienia ---------- */
VIEWS.ustawienia = () => {
  view.innerHTML = `
    <div class="card"><h2>Kopia zapasowa</h2>
      <p class="muted">Dane (Planowanie budowy + projekt z Projektowania garażu) są zapisane tylko w tej przeglądarce. Zrób kopię, aby przenieść je na inne urządzenie.</p>
      <div class="row"><button class="btn primary" id="exp">${icon('download')} Eksportuj (.json)</button><button class="btn" id="imp">${icon('upload')} Importuj</button></div>
    </div>
    <div class="card"><h2>Instalacja na telefonie</h2>
      <ul><li><b>Android / Chrome:</b> menu ⋮ → „Zainstaluj aplikację” (lub ikona instalacji w pasku u góry).</li>
      <li><b>iPhone / Safari:</b> Udostępnij → „Do ekranu początkowego”.</li>
      <li><b>Komputer (Chrome/Edge):</b> ikona instalacji w pasku adresu.</li></ul>
      <p class="muted" style="margin:0">Planowanie budowy i Projektowanie garażu to dwie osobne aplikacje, ale współdzielą dane, gdy są otwierane z tego samego adresu.</p>
    </div>
    <div class="card"><h2>Reset</h2><div class="row">
      <button class="btn danger" id="rst">Wyczyść dane Planowania budowy</button></div></div>
    <div class="card"><h2>O aplikacji</h2><p>${esc(DISCLAIMER)}</p><p class="muted" style="margin:0">Wersja 1.0 · działa offline</p></div>`;
  document.getElementById('exp').onclick = () => downloadFile(`garaz-kopia-${isoDate(new Date())}.json`, JSON.stringify(Store.exportAll(), null, 2));
  document.getElementById('imp').onclick = async () => {
    const f = await pickFile(); if (!f) return;
    try { Store.importAll(JSON.parse(await f.text())); S = Object.assign(defaultState(), Store.get(KEYS.planer, {})); toast('Zaimportowano dane'); route(); }
    catch (e) { toast(e.message || 'Błąd importu'); }
  };
  document.getElementById('rst').onclick = async () => {
    if (await confirmDialog('Usunąć wszystkie dane Planowania budowy (listę, harmonogram, budżet, notatki)? Projekt w Projektowaniu garażu zostanie. Tej operacji nie można cofnąć.', 'Usuń')) {
      S = defaultState(); save(); toast('Wyczyszczono'); route();
    }
  };
};

/* ---------- Start ---------- */
buildNav(NAV, go);
setupPWA();
if (new URLSearchParams(location.search).has('import')) {
  importBudget();
  history.replaceState(null, '', location.pathname + (location.hash || '#budzet'));
}
window.addEventListener('storage', e => { if (e.key === KEYS.design) route(); });
route();
