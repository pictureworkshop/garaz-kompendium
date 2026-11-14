/* Garaż – wspólne narzędzia: pamięć, formatowanie, ikony, PWA */
'use strict';

const KEYS = {
  design: 'garaz.projekt',     // projekt z Projektanta (czyta go też Planer)
  variants: 'garaz.warianty',  // zapisane warianty projektu
  planer: 'garaz.planer',      // stan Planera
  theme: 'garaz.motyw',
};

const Store = {
  get(key, def) {
    try { const v = localStorage.getItem(key); return v == null ? def : JSON.parse(v); }
    catch (e) { return def; }
  },
  set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch (e) { toast('Nie udało się zapisać danych (pamięć przeglądarki zablokowana lub pełna).'); return false; }
  },
  remove(key) { try { localStorage.removeItem(key); } catch (e) {} },
  exportAll() {
    const out = { _format: 'garaz-backup', _version: 1, _date: new Date().toISOString(), data: {} };
    for (const k of Object.values(KEYS)) { const v = Store.get(k, null); if (v != null) out.data[k] = v; }
    return out;
  },
  importAll(obj) {
    if (!obj || obj._format !== 'garaz-backup' || !obj.data) throw new Error('To nie jest plik kopii zapasowej aplikacji Garaż.');
    for (const [k, v] of Object.entries(obj.data)) if (Object.values(KEYS).includes(k)) Store.set(k, v);
  },
};

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
const nfMoney = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 });
function fmtMoney(n) { return nfMoney.format(Math.round(+n || 0)); }
function fmtNum(n, d = 2) { return new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 0, maximumFractionDigits: d }).format(+n || 0); }
function fmtDate(d) {
  if (!d) return '—';
  const dt = typeof d === 'string' ? new Date(d + (d.length === 10 ? 'T12:00:00' : '')) : d;
  if (isNaN(dt)) return '—';
  return dt.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
}
function isoDate(dt) {
  const z = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}
function addDays(iso, n) { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return isoDate(d); }
function daysBetween(a, b) { return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000); }
function uid() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4); }
function num(v, def = 0) { const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : def; }

let toastTimer;
function toast(msg) {
  let el = document.querySelector('.toast');
  if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

/* Ikony (24×24, obrys) */
const ICON_PATHS = {
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
  route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7"/>',
  doc: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  check: '<path d="M4 12l5 5L20 6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  wallet: '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M16 15h2"/>',
  book: '<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z"/><path d="M20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z"/>',
  notes: '<path d="M5 3h14v18H5z"/><path d="M9 7h6M9 11h6M9 15h4"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14a5 5 0 0 1 5 5"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  ruler: '<path d="M3 17L17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>',
  plan: '<rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 12h7M14 12h7M12 3v6M12 15v6"/>',
  map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
  cube: '<path d="M12 2l9 5v10l-9 5-9-5V7z"/><path d="M12 22V12M21 7l-9 5-9-5"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  print: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M4 20h16"/>',
  upload: '<path d="M12 20V9M7 14l5-5 5 5M4 4h16"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 15A8 8 0 1 1 9 4a7 7 0 0 0 11 11z"/>',
  auto: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18" /><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>',
  swap: '<path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>',
  install: '<path d="M12 3v12M7 10l5 5 5-5"/><rect x="4" y="17" width="16" height="4" rx="1"/>',
  gate: '<path d="M3 10l9-6 9 6v10H3z"/><path d="M7 20v-7h10v7M7 15h10M7 17.5h10"/>',
  alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
};
function icon(name, extra = '') {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${ICON_PATHS[name] || ''}</svg>`;
}

/* Nawigacja: generuje pasek dolny (telefon) i boczny (komputer) */
function buildNav(items, onSelect) {
  const side = document.querySelector('.sidenav');
  const bar = document.querySelector('.tabbar');
  const html = items.map(it => it.sep ? '<div class="sep"></div>' :
    `<button type="button" data-view="${it.id}" title="${esc(it.label)}">${icon(it.icon)}<span>${esc(it.short || it.label)}</span></button>`).join('');
  side.innerHTML = html;
  // w bocznym menu pełne etykiety
  side.querySelectorAll('button').forEach(b => { const it = items.find(i => i.id === b.dataset.view); b.querySelector('span').textContent = it.label; });
  bar.innerHTML = items.filter(i => !i.sep && !i.desktopOnly).map(it =>
    `<button type="button" data-view="${it.id}">${icon(it.icon)}<span>${esc(it.short || it.label)}</span></button>`).join('');
  document.querySelectorAll('.sidenav button, .tabbar button').forEach(b => b.addEventListener('click', () => onSelect(b.dataset.view)));
}
function markNav(id) {
  document.querySelectorAll('.sidenav button, .tabbar button').forEach(b => {
    if (b.dataset.view === id) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  const active = document.querySelector(`.tabbar button[data-view="${id}"]`);
  if (active) active.scrollIntoView({ block: 'nearest', inline: 'center' });
}

/* Motyw: auto / jasny / ciemny */
function applyTheme() {
  const t = Store.get(KEYS.theme, 'auto');
  if (t === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t);
  const btn = document.getElementById('themeBtn');
  if (btn) { btn.innerHTML = icon(t === 'dark' ? 'moon' : t === 'light' ? 'sun' : 'auto'); btn.title = 'Motyw: ' + ({ auto: 'systemowy', light: 'jasny', dark: 'ciemny' })[t]; }
}
function cycleTheme() {
  const order = ['auto', 'light', 'dark'];
  const t = Store.get(KEYS.theme, 'auto');
  Store.set(KEYS.theme, order[(order.indexOf(t) + 1) % 3]);
  applyTheme();
  document.dispatchEvent(new CustomEvent('themechange'));
}
function isDark() {
  const t = document.documentElement.getAttribute('data-theme');
  if (t) return t === 'dark';
  return matchMedia('(prefers-color-scheme: dark)').matches;
}

/* PWA: service worker + przycisk instalacji */
let deferredInstall = null;
function setupPWA() {
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
  const btn = document.getElementById('installBtn');
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); deferredInstall = e;
    if (btn) btn.hidden = false;
  });
  if (btn) {
    btn.innerHTML = icon('install');
    btn.addEventListener('click', async () => {
      if (!deferredInstall) return;
      deferredInstall.prompt();
      await deferredInstall.userChoice; deferredInstall = null; btn.hidden = true;
    });
  }
  window.addEventListener('appinstalled', () => toast('Aplikacja zainstalowana'));
  const tb = document.getElementById('themeBtn');
  if (tb) tb.addEventListener('click', cycleTheme);
  applyTheme();
}

function downloadFile(name, content, type = 'application/json') {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function pickFile(accept = '.json,application/json') {
  return new Promise(resolve => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = accept;
    inp.onchange = () => resolve(inp.files[0] || null); inp.click();
  });
}
function confirmDialog(message, okLabel = 'Tak') {
  return new Promise(resolve => {
    const dlg = document.createElement('dialog');
    dlg.innerHTML = `<div class="dlg-body"><p>${esc(message)}</p></div><div class="dlg-foot"><button class="btn" value="no">Anuluj</button><button class="btn primary" value="yes">${esc(okLabel)}</button></div>`;
    document.body.appendChild(dlg);
    dlg.querySelectorAll('button').forEach(b => b.onclick = () => { dlg.close(); resolve(b.value === 'yes'); dlg.remove(); });
    dlg.addEventListener('cancel', () => { resolve(false); dlg.remove(); });
    dlg.showModal();
  });
}
