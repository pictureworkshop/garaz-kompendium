/* Projektant – rysunki SVG: rzut, elewacje, plan sytuacyjny. 1 m = 100 jednostek. */
'use strict';

const Drawings = (() => {
  const S = 100;
  const f2 = n => new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2 }).format(n);
  const cm = n => Math.round(n * 100);

  /* Wysokość połaci nad poziomem posadzki w punkcie rzutu (x,y) – także na okapie */
  function roofZ(d, x, y) {
    const g = GarageCalc.geometry(d), H = d.wallHeight, k = Math.tan(g.pitch * Math.PI / 180);
    const W = d.width, L = d.length, r = d.roof;
    switch (r.type) {
      case 'dwuspadowy':
        return r.ridge === 'length' ? H + k * (W / 2 - Math.abs(x - W / 2)) : H + k * (L / 2 - Math.abs(y - L / 2));
      case 'czterospadowy':
        return H + k * Math.min(x, W - x, y, L - y, Math.min(W, L) / 2);
      default: { // jednospadowy, plaski
        const to = r.slopeTo || 'back';
        if (to === 'back') return H + k * (L - y);
        if (to === 'front') return H + k * y;
        if (to === 'left') return H + k * x;
        return H + k * (W - x);
      }
    }
  }

  /* Punkt na licu ściany: u – od lewego narożnika patrząc z zewnątrz; dep – odległość w głąb (do wewnątrz) */
  function wallPoint(d, wall, u, dep = 0) {
    const W = d.width, L = d.length;
    switch (wall) {
      case 'front': return [u, dep];
      case 'back': return [W - u, L - dep];
      case 'left': return [dep, L - u];
      case 'right': return [W - dep, u];
    }
  }
  const depthOf = (d, wall) => (wall === 'front' || wall === 'back') ? d.length : d.width;

  function dimH(x1, x2, y, label, cls = 'dim', tick = 8) {
    if (Math.abs(x2 - x1) < 1) return '';
    return `<g class="${cls}"><line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/>
      <line x1="${x1}" y1="${y - tick}" x2="${x1}" y2="${y + tick}" class="tick"/><line x1="${x2}" y1="${y - tick}" x2="${x2}" y2="${y + tick}" class="tick"/>
      <text x="${(x1 + x2) / 2}" y="${y - 6}" text-anchor="middle">${label}</text></g>`;
  }
  function dimV(x, y1, y2, label, cls = 'dim', tick = 8, side = -1) {
    if (Math.abs(y2 - y1) < 1) return '';
    const tx = x + side * 8;
    return `<g class="${cls}"><line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}"/>
      <line x1="${x - tick}" y1="${y1}" x2="${x + tick}" y2="${y1}" class="tick"/><line x1="${x - tick}" y1="${y2}" x2="${x + tick}" y2="${y2}" class="tick"/>
      <text x="${tx}" y="${(y1 + y2) / 2}" text-anchor="middle" transform="rotate(-90 ${tx} ${(y1 + y2) / 2})">${label}</text></g>`;
  }
  const defs = `<defs>
    <pattern id="hatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="12" height="12" class="hatch-bg"/><line x1="0" y1="0" x2="0" y2="12" class="hatch-line"/></pattern>
    <pattern id="hatchS" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="40" class="hatch-line"/></pattern>
  </defs>`;

  /* ---------- RZUT ---------- */
  function plan(d, opts = {}) {
    const W = d.width, L = d.length, g = GarageCalc.geometry(d), t = g.t;
    const P = (x, y) => [x * S, (L - y) * S];
    const m = 150;
    let out = '';
    // ściany
    const [ox, oy] = P(0, L), [ix, iy] = P(t, L - t);
    out += `<path class="wall" fill-rule="evenodd" d="M${ox} ${oy}h${W * S}v${L * S}h${-W * S}z M${ix} ${iy}h${(W - 2 * t) * S}v${(L - 2 * t) * S}h${-(W - 2 * t) * S}z"/>`;
    // okap (przerywany)
    const o = d.roof.overhang;
    out += `<rect class="overhang" x="${-o * S}" y="${-o * S}" width="${(W + 2 * o) * S}" height="${(L + 2 * o) * S}"/>`;
    // samochody
    if (opts.cars !== false) {
      for (const op of d.openings.filter(x => x.type === 'brama')) {
        const seg = GarageCalc.openingSegment(d, op);
        const nin = [-seg.nx, -seg.ny];
        const n = op.width >= 4.2 ? 2 : 1;
        const along = [(seg.bx - seg.ax) / op.width, (seg.by - seg.ay) / op.width];
        const inner = (op.wall === 'front' || op.wall === 'back') ? g.innerL : g.innerW;
        const fits = inner >= 4.75 + 0.3;
        for (let i = 0; i < n; i++) {
          const fu = n === 1 ? 0.5 : (i === 0 ? 0.27 : 0.73);
          const cx = seg.ax + along[0] * op.width * fu + nin[0] * (t + 0.3 + 2.375);
          const cy = seg.ay + along[1] * op.width * fu + nin[1] * (t + 0.3 + 2.375);
          const [sx, sy] = P(cx, cy);
          const rot = Math.abs(nin[0]) > 0.5 ? 90 : 0;
          out += `<g class="car ${fits ? '' : 'bad'}" transform="translate(${sx} ${sy}) rotate(${rot})">
            <rect x="-92" y="-237" width="184" height="475" rx="38"/><path d="M-75 ${nin[1] > 0 || nin[0] < 0 ? -90 : 90} q75 ${nin[1] > 0 || nin[0] < 0 ? -40 : 40} 150 0"/><path d="M-75 ${nin[1] > 0 || nin[0] < 0 ? 120 : -120} q75 ${nin[1] > 0 || nin[0] < 0 ? 25 : -25} 150 0"/></g>`;
        }
      }
    }
    // otwory
    for (const op of d.openings) {
      const s = GarageCalc.openingSegment(d, op);
      const nin = [-s.nx, -s.ny];
      const a = [s.ax, s.ay], b = [s.bx, s.by];
      const ai = [a[0] + nin[0] * t, a[1] + nin[1] * t], bi = [b[0] + nin[0] * t, b[1] + nin[1] * t];
      const pts = [a, b, bi, ai].map(p => P(...p).join(',')).join(' ');
      out += `<polygon class="cut" points="${pts}"/>`;
      const mid = (p, q, f = .5) => [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f];
      if (op.type === 'okno') {
        for (const f of [0.4, 0.6]) { const p1 = P(...mid(a, ai, f)), p2 = P(...mid(b, bi, f)); out += `<line class="glass" x1="${p1[0]}" y1="${p1[1]}" x2="${p2[0]}" y2="${p2[1]}"/>`; }
        out += `<polygon class="frame" points="${pts}"/>`;
      } else if (op.type === 'drzwi') {
        const hinge = ai, end = [ai[0] + nin[0] * op.width, ai[1] + nin[1] * op.width];
        const [hx, hy] = P(...hinge), [ex, ey] = P(...end), [bx2, by2] = P(...bi);
        out += `<line class="leaf" x1="${hx}" y1="${hy}" x2="${ex}" y2="${ey}"/>`;
        const cross = (end[0] - hinge[0]) * (bi[1] - hinge[1]) - (end[1] - hinge[1]) * (bi[0] - hinge[0]);
        out += `<path class="swing" d="M${ex} ${ey} A${op.width * S} ${op.width * S} 0 0 ${cross > 0 ? 0 : 1} ${bx2} ${by2}"/>`;
      } else {
        const p1 = P(...mid(ai, [ai[0] + nin[0] * 0.25, ai[1] + nin[1] * 0.25])), p2 = P(...mid(bi, [bi[0] + nin[0] * 0.25, bi[1] + nin[1] * 0.25]));
        out += `<line class="gateline" x1="${p1[0]}" y1="${p1[1]}" x2="${p2[0]}" y2="${p2[1]}"/>`;
      }
      // etykieta
      const lab = { brama: 'B', drzwi: 'D', okno: 'O' }[op.type] + ` ${cm(op.width)}×${cm(op.height)}`;
      const c = mid(a, b), lp = P(c[0] + s.nx * 0.14, c[1] + s.ny * 0.14);
      const rot = (op.wall === 'left' || op.wall === 'right') ? -90 : 0;
      out += `<text class="olabel" x="${lp[0]}" y="${lp[1]}" text-anchor="middle" dominant-baseline="middle" transform="rotate(${rot} ${lp[0]} ${lp[1]})">${lab}</text>`;
    }
    // wymiary łańcuchowe na ścianach z otworami + całkowite
    for (const wall of ['front', 'back', 'left', 'right']) {
      const list = d.openings.filter(o => o.wall === wall).sort((a, b) => a.offset - b.offset);
      if (!list.length) continue;
      const len = GarageCalc.wallLen(d, wall);
      const br = [0]; for (const o of list) br.push(o.offset, o.offset + o.width); br.push(len);
      for (let i = 0; i < br.length - 1; i++) {
        const p1 = wallPoint(d, wall, br[i], -0.55), p2 = wallPoint(d, wall, br[i + 1], -0.55);
        const [x1, y1] = P(...p1), [x2, y2] = P(...p2);
        if (wall === 'front' || wall === 'back') out += dimH(Math.min(x1, x2), Math.max(x1, x2), y1, Math.round(Math.abs(br[i + 1] - br[i]) * 100), 'dim small');
        else out += dimV(x1, Math.min(y1, y2), Math.max(y1, y2), Math.round(Math.abs(br[i + 1] - br[i]) * 100), 'dim small', 8, wall === 'left' ? -1 : 1);
      }
    }
    const [fx1, fy] = P(0, -1.0), [fx2] = P(W, 0);
    out += dimH(fx1, fx2, fy, f2(W) + ' m', 'dim main');
    const [lx, ly1] = P(-1.0, L), [, ly2] = P(0, 0);
    out += dimV(lx, ly1, ly2, f2(L) + ' m', 'dim main');
    // opis w środku
    const [cxm, cym] = P(W / 2, L / 2);
    out += `<text class="center" x="${cxm}" y="${cym - 12}" text-anchor="middle">${f2(g.innerW)} × ${f2(g.innerL)} m</text>
      <text class="center sub" x="${cxm}" y="${cym + 22}" text-anchor="middle">Pu = ${f2(g.usable)} m²</text>`;
    // strona frontu
    out += `<text class="note" x="${W * S / 2}" y="${(L + 1.45) * S}" text-anchor="middle">▲ FRONT (od ulicy)</text>`;
    const vb = [-m - 40, -m, W * S + 2 * m + 40, L * S + 2 * m + 40];
    return `<svg class="drawing" viewBox="${vb.join(' ')}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Rzut garażu">${defs}${out}</svg>`;
  }

  /* ---------- ELEWACJA ---------- */
  function elevation(d, wall) {
    const g = GarageCalc.geometry(d), len = GarageCalc.wallLen(d, wall), D = depthOf(d, wall), o = d.roof.overhang;
    const pl = g.plinth, thk = g.roofThk;
    const X = u => u * S, Y = z => -z * S;
    const zw = u => { const [x, y] = wallPoint(d, wall, Math.min(len, Math.max(0, u)), 0); return Math.max(d.wallHeight, roofZ(d, x, y)); };
    const zs = u => { let m = -1e9; for (const dep of [-o, 0, D / 2, D, D + o]) { const [x, y] = wallPoint(d, wall, u, dep); m = Math.max(m, roofZ(d, x, y)); } return m; };
    const zn = u => { const [x, y] = wallPoint(d, wall, u, -o); return roofZ(d, x, y); };
    const us = new Set([-o, 0, len / 2, len, len + o]);
    for (let i = 0; i <= 48; i++) us.add(-o + (len + 2 * o) * i / 48);
    if (d.roof.type === 'czterospadowy') { const h = Math.min(d.width, d.length) / 2; us.add(h); us.add(len - h); }
    const U = [...us].sort((a, b) => a - b);
    const UW = U.filter(u => u >= 0 && u <= len);
    let out = '';
    // grunt
    out += `<line class="ground" x1="${X(-o - 0.6)}" y1="0" x2="${X(len + o + 0.6)}" y2="0"/>`;
    out += `<rect class="plinth" x="0" y="${Y(pl)}" width="${X(len)}" height="${pl * S}"/>`;
    // ściana
    const wallPts = [[0, pl], ...UW.map(u => [u, pl + zw(u)]), [len, pl]];
    out += `<polygon class="ewall" points="${wallPts.map(([u, z]) => X(u) + ',' + Y(z)).join(' ')}"/>`;
    // dach
    const top = U.map(u => [u, pl + zs(u) + thk]), bot = [...U].reverse().map(u => [u, pl + Math.min(zn(u), zs(u))]);
    out += `<polygon class="roof roof-${d.roof.cover}" points="${[...top, ...bot].map(([u, z]) => X(u) + ',' + Y(z)).join(' ')}"/>`;
    // otwory
    for (const op of d.openings.filter(x => x.wall === wall)) {
      const z0 = pl + (op.type === 'okno' ? (op.sill || 0) : 0), x0 = X(op.offset), w = op.width * S, h = op.height * S, y0 = Y(z0 + op.height);
      if (op.type === 'brama') {
        out += `<rect class="gate" x="${x0}" y="${y0}" width="${w}" height="${h}"/>`;
        const gt = op.gate || 'segmentowa';
        if (gt === 'segmentowa' || gt === 'roletowa') { const n = gt === 'roletowa' ? Math.round(op.height / 0.12) : Math.max(3, Math.round(op.height / 0.55)); for (let i = 1; i < n; i++) out += `<line class="gatel" x1="${x0}" y1="${y0 + h * i / n}" x2="${x0 + w}" y2="${y0 + h * i / n}"/>`; }
        else if (gt === 'rozwierana') out += `<line class="gatel" x1="${x0 + w / 2}" y1="${y0}" x2="${x0 + w / 2}" y2="${y0 + h}"/>`;
        else for (let i = 1; i < Math.round(op.width / 0.15); i++) out += `<line class="gatel thin" x1="${x0 + i * 15}" y1="${y0}" x2="${x0 + i * 15}" y2="${y0 + h}"/>`;
      } else if (op.type === 'drzwi') {
        out += `<rect class="door" x="${x0}" y="${y0}" width="${w}" height="${h}"/><circle class="handle" cx="${x0 + w - 14}" cy="${y0 + h * 0.52}" r="5"/>`;
      } else {
        out += `<rect class="window" x="${x0}" y="${y0}" width="${w}" height="${h}"/><line class="wframe" x1="${x0 + w / 2}" y1="${y0}" x2="${x0 + w / 2}" y2="${y0 + h}"/>`;
      }
      out += dimH(x0, x0 + w, Y(z0 + op.height) - 14, cm(op.width), 'dim small', 6);
    }
    // wymiary
    const maxTop = Math.max(...U.map(u => zs(u))) + pl + thk;
    out += dimH(X(0), X(len), 70, f2(len) + ' m', 'dim main');
    out += dimV(X(len + o + 0.35), Y(0), Y(pl + d.wallHeight), f2(pl + d.wallHeight), 'dim small', 6, 1);
    out += dimV(X(len + o + 0.8), Y(0), Y(maxTop), f2(maxTop) + ' m', 'dim main', 8, 1);
    out += `<text class="level" x="${X(-o - 0.55)}" y="${Y(pl) + 6}">±0,00</text>`;
    if (d.roof.type !== 'plaski') out += `<text class="note" x="${X(len / 2)}" y="${Y(maxTop) - 18}" text-anchor="middle">dach ${g.pitch}°</text>`;
    const vb = [X(-o - 0.8), Y(maxTop + 0.55), X(len + 2 * o + 2.2), (maxTop + 0.55) * S + 120];
    return `<svg class="drawing" viewBox="${vb.join(' ')}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Elewacja ${GarageCalc.WALLS[wall]}">${defs}${out}</svg>`;
  }

  /* ---------- PLAN SYTUACYJNY ---------- */
  function site(d) {
    const p = d.plot, PW = p.width, PD = p.depth, W = d.width, L = d.length, o = d.roof.overhang;
    const k = Math.max(PW, PD) / 9; // skala tekstu
    const X = x => x * S, Y = y => (PD - y) * S;
    const checks = GarageCalc.boundaryChecks(d);
    const st = w => (checks.find(c => c.wall === w) || {}).status || 'ok';
    let out = '';
    out += `<rect class="street" x="${X(-3)}" y="${Y(0)}" width="${(PW + 6) * S}" height="${3.2 * S}"/>`;
    out += `<text class="streetlabel" x="${X(PW / 2)}" y="${Y(-1.9)}" text-anchor="middle" style="font-size:${22 * k}px">DROGA ${p.road && p.road !== 'brak' ? '(' + p.road + ')' : ''}</text>`;
    out += `<rect class="plot" x="0" y="0" width="${X(PW)}" height="${PD * S}" style="stroke-width:${3 * k}"/>`;
    if (p.buildLine > 0) out += `<line class="buildline" x1="0" y1="${Y(p.buildLine)}" x2="${X(PW)}" y2="${Y(p.buildLine)}" style="stroke-width:${2 * k};stroke-dasharray:${18 * k} ${8 * k}"/><text class="note" x="${X(PW) - 10 * k}" y="${Y(p.buildLine) - 8 * k}" text-anchor="end" style="font-size:${14 * k}px">linia zabudowy ${f2(p.buildLine)} m</text>`;
    if (p.house && p.house.enabled) {
      const h = p.house;
      out += `<g data-drag="house" class="draggable"><rect class="house" x="${X(h.x)}" y="${Y(h.y + h.d)}" width="${h.w * S}" height="${h.d * S}" style="stroke-width:${2 * k}"/>
        <text class="center" x="${X(h.x + h.w / 2)}" y="${Y(h.y + h.d / 2)}" text-anchor="middle" dominant-baseline="middle" style="font-size:${20 * k}px">DOM</text></g>`;
    }
    // garaż
    out += `<g data-drag="garage" class="draggable">
      <rect class="overhang" x="${X(p.x - o)}" y="${Y(p.y + L + o)}" width="${(W + 2 * o) * S}" height="${(L + 2 * o) * S}" style="stroke-width:${1.5 * k}"/>
      <rect class="garage" x="${X(p.x)}" y="${Y(p.y + L)}" width="${W * S}" height="${L * S}" style="stroke-width:${2.5 * k}"/>`;
    for (const op of d.openings) {
      const s = GarageCalc.openingSegment(d, op);
      out += `<line class="opmark ${op.type}" x1="${X(p.x + s.ax)}" y1="${Y(p.y + s.ay)}" x2="${X(p.x + s.bx)}" y2="${Y(p.y + s.by)}" style="stroke-width:${7 * k}"/>`;
    }
    out += `<text class="center" x="${X(p.x + W / 2)}" y="${Y(p.y + L / 2)}" text-anchor="middle" dominant-baseline="middle" style="font-size:${17 * k}px">GARAŻ</text>
      <text class="center sub" x="${X(p.x + W / 2)}" y="${Y(p.y + L / 2) + 22 * k}" text-anchor="middle" style="font-size:${13 * k}px">${f2(W)}×${f2(L)}</text></g>`;
    // odległości
    const my = p.y + L / 2, mx = p.x + W / 2;
    const dl = (x1, y1, x2, y2, val, status, lx, ly) => `<g class="dist ${status}"><line x1="${X(x1)}" y1="${Y(y1)}" x2="${X(x2)}" y2="${Y(y2)}" style="stroke-width:${2 * k};stroke-dasharray:${6 * k} ${4 * k}"/>
        <circle cx="${X(x1)}" cy="${Y(y1)}" r="${3.5 * k}"/><circle cx="${X(x2)}" cy="${Y(y2)}" r="${3.5 * k}"/>
        <text x="${X(lx)}" y="${Y(ly)}" text-anchor="middle" style="font-size:${22 * k}px" paint-order="stroke">${f2(val)} m</text></g>`;
    out += dl(0, my, p.x, my, p.x, st('left'), p.x / 2, my + 0.45 * k);
    out += dl(p.x + W, my, PW, my, PW - p.x - W, st('right'), (p.x + W + PW) / 2, my + 0.45 * k);
    out += dl(mx, p.y + L, mx, PD, PD - p.y - L, st('back'), mx + 0.9 * k, (p.y + L + PD) / 2);
    const fs = (checks.find(c => c.wall === 'front') || {}).status || 'ok';
    out += dl(mx, 0, mx, p.y, p.y, fs, mx + 0.9 * k, p.y / 2);
    // wymiary działki
    out += dimH(0, X(PW), Y(-3.2) + 30 * k, f2(PW) + ' m', 'dim main', 8 * k).replace('<g class="dim main">', `<g class="dim main" style="font-size:${16 * k}px;stroke-width:${1.5 * k}">`);
    out += dimV(-30 * k, Y(PD), Y(0), f2(PD) + ' m', 'dim main', 8 * k).replace('<g class="dim main">', `<g class="dim main" style="font-size:${16 * k}px;stroke-width:${1.5 * k}">`);
    // północ (umownie – góra rysunku)
    const vb = [-70 * k, -20 * k, X(PW) + 100 * k, (PD + 3.2) * S + 90 * k];
    return `<svg class="drawing site" viewBox="${vb.join(' ')}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Plan sytuacyjny">${defs}${out}</svg>`;
  }

  /* Opis techniczny do zgłoszenia */
  function techDescription(d) {
    const g = GarageCalc.geometry(d), m = GarageCalc.mat(d), q = GarageCalc.quantities(d), p = d.plot;
    const cover = GarageCalc.ROOF_COVERS[d.roof.cover].name.toLowerCase();
    const gates = d.openings.filter(o => o.type === 'brama'), doors = d.openings.filter(o => o.type === 'drzwi'), wins = d.openings.filter(o => o.type === 'okno');
    const checks = GarageCalc.boundaryChecks(d);
    const dist = w => { const c = checks.find(x => x.wall === w); return c ? f2(c.dist) + ' m' : '—'; };
    const roofDesc = { dwuspadowy: `dwuspadowy o nachyleniu połaci ${g.pitch}°, kalenica ${d.roof.ridge === 'length' ? 'równoległa do dłuższego boku' : 'prostopadła do frontu'}`, jednospadowy: `jednospadowy o nachyleniu ${g.pitch}°, ze spadkiem w kierunku ${({ back: 'tyłu', front: 'frontu', left: 'lewej strony', right: 'prawej strony' })[d.roof.slopeTo]} działki`, czterospadowy: `czterospadowy (kopertowy) o nachyleniu ${g.pitch}°`, plaski: 'płaski (stropodach) o spadku ok. 3°' }[d.roof.type];
    const lines = [
      `1. Przedmiot: budowa wolnostojącego, parterowego budynku garażu${gates.some(x => x.width >= 4.2) ? ' dwustanowiskowego' : ''} na działce${p.width ? ` o wymiarach ok. ${f2(p.width)} × ${f2(p.depth)} m` : ''}.`,
      `2. Wymiary zewnętrzne: ${f2(d.width)} × ${f2(d.length)} m; powierzchnia zabudowy ${f2(g.footprint)} m²; powierzchnia użytkowa ok. ${f2(g.usable)} m²; kubatura ok. ${f2(g.volume, 1)} m³.`,
      `3. Wysokość: ściany ${f2(d.wallHeight)} m nad posadzką; wysokość budynku (do kalenicy/najwyższego punktu) ok. ${f2(g.totalHeight)} m od poziomu terenu.`,
      `4. Fundamenty: ${d.foundation.type === 'lawy' ? `ławy żelbetowe 50×30 cm z betonu C20/25, posadowione na głębokości ok. ${f2(q.frost)} m p.p.t. (strefa przemarzania ${d.foundation.frostZone}); ściany fundamentowe z bloczków betonowych z izolacją przeciwwilgociową` : 'płyta fundamentowa żelbetowa ok. 25 cm na warstwie XPS, posadowiona na zagęszczonej podsypce'}.`,
      `5. Ściany: ${m.name.toLowerCase()}, grubość ${cm(g.t)} cm${d.insulation > 0 ? `, ocieplenie styropianem ${d.insulation} cm` : ''}; ${m.light ? '' : 'wieniec żelbetowy, nadproża prefabrykowane/żelbetowe; '}elewacja – tynk cienkowarstwowy.`,
      `6. Dach: ${roofDesc}, okap ${cm(d.roof.overhang)} cm; konstrukcja drewniana; pokrycie: ${cover}.`,
      `7. Posadzka: betonowa na podsypce piaskowej, ze spadkiem w kierunku bramy.`,
      `8. Stolarka: ${gates.map(x => `brama ${GarageCalc.GATE_TYPES[x.gate].name.toLowerCase()} ${cm(x.width)}×${cm(x.height)} cm${x.motor ? ' z napędem' : ''}`).join(', ') || 'brak bramy'}${doors.length ? `; drzwi ${doors.map(x => `${cm(x.width)}×${cm(x.height)} cm`).join(', ')}` : ''}${wins.length ? `; okna ${wins.map(x => `${cm(x.width)}×${cm(x.height)} cm`).join(', ')}` : ''}.`,
      `9. Instalacje: ${d.options.electric ? 'elektryczna zasilana kablem ziemnym z instalacji budynku mieszkalnego' : 'brak'}; wentylacja grawitacyjna (kratki nawiewna i wywiewna).`,
      `10. Odprowadzenie wód opadowych: rynny i rury spustowe – na teren własnej działki (bez spływu na działki sąsiednie).`,
      `11. Usytuowanie: odległość od granicy lewej ${dist('left')}, prawej ${dist('right')}, tylnej ${dist('back')}; od granicy z drogą ${f2(p.y)} m${p.house && p.house.enabled ? `; od budynku mieszkalnego ${dist('house')}` : ''}.`,
    ];
    return lines.join('\n');
  }

  return { plan, elevation, site, roofZ, wallPoint, techDescription };
})();
