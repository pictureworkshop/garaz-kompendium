/* Garaż – silnik obliczeń: geometria, zestawienie materiałów, koszty, kontrola przepisów.
   Wszystkie wymiary w metrach. Ceny orientacyjne (PLN, 2026) – do edycji w Projektancie. */
'use strict';

const GarageCalc = (() => {

  const WALLS = { front: 'Frontowa', back: 'Tylna', left: 'Lewa', right: 'Prawa' };

  const WALL_MATERIALS = {
    beton24:     { name: 'Bloczek betonowy 38×24×12', t: 0.24, perM2: 19.5, piece: 5.5, mortar: 12, lab: 95, unitName: 'bloczków' },
    komorkowy24: { name: 'Beton komórkowy 59×24×24', t: 0.24, perM2: 7.0, piece: 17, mortar: 6, lab: 75, unitName: 'bloczków' },
    silikat24:   { name: 'Silikat 33×24×20', t: 0.24, perM2: 15.2, piece: 9.5, mortar: 6, lab: 85, unitName: 'bloczków' },
    ceramika25:  { name: 'Pustak ceramiczny 25 (37×25×24)', t: 0.25, perM2: 11.3, piece: 9.5, mortar: 8, lab: 85, unitName: 'pustaków' },
    keramzyt24:  { name: 'Keramzytobeton 50×24×24', t: 0.24, perM2: 8.3, piece: 13, mortar: 8, lab: 80, unitName: 'bloczków' },
    szkielet:    { name: 'Szkielet drewniany + OSB', t: 0.16, perM2: 1, piece: 210, mortar: 0, lab: 120, unitName: 'm²', light: true },
    stal:        { name: 'Konstrukcja stalowa + płyta warstwowa', t: 0.10, perM2: 1, piece: 220, mortar: 0, lab: 80, unitName: 'm²', light: true },
  };

  const ROOF_TYPES = {
    dwuspadowy: 'Dwuspadowy', jednospadowy: 'Jednospadowy', czterospadowy: 'Czterospadowy (kopertowy)', plaski: 'Płaski (stropodach)',
  };
  const ROOF_COVERS = {
    blachodachowka: { name: 'Blachodachówka', mat: 58, lab: 45, sub: 'pod_blache' },
    trapez:         { name: 'Blacha trapezowa', mat: 42, lab: 35, sub: 'pod_blache' },
    rabek:          { name: 'Blacha na rąbek', mat: 85, lab: 65, sub: 'deskowanie' },
    dachowka:       { name: 'Dachówka ceramiczna/betonowa', mat: 95, lab: 70, sub: 'pod_blache' },
    gont:           { name: 'Gont bitumiczny', mat: 65, lab: 55, sub: 'deskowanie' },
    papa:           { name: 'Papa termozgrzewalna (2 warstwy)', mat: 48, lab: 45, sub: 'deskowanie' },
    epdm:           { name: 'Membrana EPDM', mat: 85, lab: 45, sub: 'deskowanie' },
  };
  const GATE_TYPES = {
    segmentowa: { name: 'Segmentowa', base: 3800, perM2: 520, headroom: 0.25 },
    uchylna:    { name: 'Uchylna', base: 1500, perM2: 260, headroom: 0.05 },
    roletowa:   { name: 'Roletowa', base: 2600, perM2: 650, headroom: 0.30 },
    rozwierana: { name: 'Rozwierana (dwuskrzydłowa)', base: 1800, perM2: 420, headroom: 0.05 },
  };
  const FROST = { 1: 0.8, 2: 1.0, 3: 1.2, 4: 1.4 };
  const FROST_DESC = {
    1: 'Strefa I – 0,8 m (zachód: np. Szczecin, Wrocław, Poznań)',
    2: 'Strefa II – 1,0 m (centrum: np. Gdańsk, Łódź, Kraków, Katowice)',
    3: 'Strefa III – 1,2 m (wschód: np. Warszawa-wsch., Olsztyn, Lublin, Rzeszów)',
    4: 'Strefa IV – 1,4 m (północny wschód: Suwalszczyzna)',
  };
  const ROADS = { brak: 'Nie dotyczy / droga wewnętrzna', gminna: 'Gminna (6 m)', powiatowa: 'Powiatowa (8 m)', wojewodzka: 'Wojewódzka (8 m)', krajowa: 'Krajowa (10 m)' };
  const ROAD_MIN = { brak: 0, gminna: 6, powiatowa: 8, wojewodzka: 8, krajowa: 10 };

  // Ceny jednostkowe: materiał (mat) i robocizna (lab)
  const PRICES = {
    wykop:        { label: 'Wykop pod fundamenty', unit: 'm³', mat: 0, lab: 90, cat: 'Fundamenty' },
    lawy:         { label: 'Ławy fundamentowe – beton C20/25 + szalunek', unit: 'm³', mat: 480, lab: 300, cat: 'Fundamenty' },
    stal:         { label: 'Stal zbrojeniowa (pręty, strzemiona)', unit: 'kg', mat: 5.2, lab: 2.8, cat: 'Fundamenty' },
    scianaFund:   { label: 'Ściana fundamentowa z bloczków 38×24×12', unit: 'm²', mat: 120, lab: 110, cat: 'Fundamenty' },
    izolFund:     { label: 'Izolacja przeciwwilgociowa fundamentów', unit: 'm²', mat: 22, lab: 25, cat: 'Fundamenty' },
    xpsFund:      { label: 'Ocieplenie fundamentu XPS 10 cm', unit: 'm²', mat: 55, lab: 30, cat: 'Fundamenty' },
    plyta:        { label: 'Płyta fundamentowa – beton C25/30', unit: 'm³', mat: 500, lab: 350, cat: 'Fundamenty' },
    xpsPlyta:     { label: 'XPS pod płytą 10 cm', unit: 'm²', mat: 60, lab: 15, cat: 'Fundamenty' },
    podsypka:     { label: 'Podsypka piaskowa z zagęszczeniem', unit: 'm³', mat: 85, lab: 60, cat: 'Posadzka' },
    posadzka:     { label: 'Posadzka betonowa 12 cm z siatką, zatarta', unit: 'm²', mat: 75, lab: 65, cat: 'Posadzka' },
    sciany:       { label: 'Ściany nośne', unit: 'm²', mat: 0, lab: 0, cat: 'Ściany' },
    nadproza:     { label: 'Nadproża (prefabrykowane / belki)', unit: 'mb', mat: 95, lab: 45, cat: 'Ściany' },
    wieniec:      { label: 'Wieniec żelbetowy – beton + szalunek', unit: 'm³', mat: 480, lab: 450, cat: 'Ściany' },
    wiezba:       { label: 'Drewno konstrukcyjne C24 (więźba)', unit: 'm³', mat: 2600, lab: 0, cat: 'Dach' },
    dachRob:      { label: 'Montaż konstrukcji dachu', unit: 'm²', mat: 0, lab: 65, cat: 'Dach' },
    pod_blache:   { label: 'Membrana, łaty, kontrłaty', unit: 'm²', mat: 24, lab: 15, cat: 'Dach' },
    deskowanie:   { label: 'Deskowanie / OSB pod pokrycie', unit: 'm²', mat: 48, lab: 20, cat: 'Dach' },
    pokrycie:     { label: 'Pokrycie dachu', unit: 'm²', mat: 0, lab: 0, cat: 'Dach' },
    obrobki:      { label: 'Obróbki blacharskie', unit: 'mb', mat: 45, lab: 35, cat: 'Dach' },
    rynny:        { label: 'Rynny i rury spustowe', unit: 'mb', mat: 75, lab: 35, cat: 'Dach' },
    ocieplDach:   { label: 'Ocieplenie dachu/stropu wełną 20 cm', unit: 'm²', mat: 45, lab: 30, cat: 'Dach' },
    brama:        { label: 'Brama garażowa', unit: 'szt', mat: 0, lab: 700, cat: 'Stolarka i brama' },
    naped:        { label: 'Napęd bramy z pilotami', unit: 'szt', mat: 1700, lab: 300, cat: 'Stolarka i brama' },
    drzwi:        { label: 'Drzwi zewnętrzne stalowe', unit: 'szt', mat: 1400, lab: 350, cat: 'Stolarka i brama' },
    okno:         { label: 'Okno PCV', unit: 'm²', mat: 750, lab: 200, cat: 'Stolarka i brama' },
    elewOciepl:   { label: 'Elewacja: styropian + tynk cienkowarstwowy', unit: 'm²', mat: 95, lab: 85, cat: 'Wykończenie' },
    elewTynk:     { label: 'Elewacja: tynk cienkowarstwowy na siatce', unit: 'm²', mat: 45, lab: 55, cat: 'Wykończenie' },
    tynkWew:      { label: 'Tynk wewnętrzny', unit: 'm²', mat: 18, lab: 35, cat: 'Wykończenie' },
    opaska:       { label: 'Opaska żwirowa wokół budynku', unit: 'mb', mat: 35, lab: 30, cat: 'Wykończenie' },
    podjazd:      { label: 'Podjazd z kostki betonowej', unit: 'm²', mat: 95, lab: 85, cat: 'Wykończenie' },
    elektryka:    { label: 'Instalacja elektryczna (rozdzielnica, gniazda, oświetlenie)', unit: 'kpl', mat: 1800, lab: 1700, cat: 'Instalacje' },
    kabel:        { label: 'Kabel zasilający w ziemi (od domu)', unit: 'mb', mat: 35, lab: 25, cat: 'Instalacje' },
    ev:           { label: 'Przygotowanie pod ładowarkę EV', unit: 'kpl', mat: 1200, lab: 600, cat: 'Instalacje' },
    wentylacja:   { label: 'Kratki wentylacyjne nawiew/wywiew', unit: 'kpl', mat: 150, lab: 100, cat: 'Instalacje' },
    // Formalności i usługi
    wypis:        { label: 'Wypis i wyrys z MPZP / kopia mapy', unit: 'kpl', mat: 150, lab: 0, cat: 'Formalności' },
    szkice:       { label: 'Szkice/rysunki do zgłoszenia (architekt – opcjonalnie)', unit: 'kpl', mat: 900, lab: 0, cat: 'Formalności' },
    wz:           { label: 'Opłata skarbowa za decyzję WZ', unit: 'szt', mat: 598, lab: 0, cat: 'Formalności' },
    mapaProj:     { label: 'Mapa do celów projektowych (geodeta)', unit: 'kpl', mat: 1600, lab: 0, cat: 'Formalności' },
    geotech:      { label: 'Opinia geotechniczna', unit: 'kpl', mat: 1500, lab: 0, cat: 'Formalności' },
    projekt:      { label: 'Projekt budowlany (architekt + konstruktor)', unit: 'kpl', mat: 6000, lab: 0, cat: 'Formalności' },
    oplataPB:     { label: 'Opłata skarbowa za pozwolenie na budowę', unit: 'szt', mat: 48, lab: 0, cat: 'Formalności' },
    kierownik:    { label: 'Kierownik budowy', unit: 'kpl', mat: 3500, lab: 0, cat: 'Formalności' },
    wytyczenie:   { label: 'Wytyczenie budynku (geodeta)', unit: 'kpl', mat: 1200, lab: 0, cat: 'Formalności' },
    inwentar:     { label: 'Inwentaryzacja powykonawcza (geodeta)', unit: 'kpl', mat: 1700, lab: 0, cat: 'Formalności' },
  };
  const CATEGORIES = ['Formalności', 'Fundamenty', 'Posadzka', 'Ściany', 'Dach', 'Stolarka i brama', 'Instalacje', 'Wykończenie'];

  function defaultDesign() {
    return {
      name: 'Mój garaż',
      width: 5.8, length: 6.0, wallHeight: 2.7,
      wallMaterial: 'beton24', insulation: 0,
      roof: { type: 'dwuspadowy', pitch: 25, overhang: 0.4, ridge: 'length', slopeTo: 'back', cover: 'blachodachowka', insulated: false },
      foundation: { type: 'lawy', frostZone: 3, insulate: false },
      openings: [
        { id: 'o1', type: 'brama', wall: 'front', offset: 1.15, width: 3.0, height: 2.25, gate: 'segmentowa', motor: true },
        { id: 'o2', type: 'drzwi', wall: 'right', offset: 3.9, width: 0.9, height: 2.0 },
        { id: 'o3', type: 'okno', wall: 'left', offset: 2.4, width: 1.0, height: 0.6, sill: 1.5 },
      ],
      plot: {
        width: 24, depth: 40, x: 4.5, y: 8.0,
        house: { enabled: true, x: 13, y: 8.0, w: 9, d: 11 },
        hasMpzp: true,
        road: 'gminna', roadOffset: 3, buildLine: 6,
        mpzpBoundary: false, neighbourAtBoundary: false, maxHeight: 6, roofPitchMin: 0, roofPitchMax: 45,
        smallObjects: 0, attached: false,
      },
      options: { electric: true, cableLength: 15, ev: false, plaster: false, facade: true, gutters: true, apron: true, driveway: 0, formalSketchByArchitect: false, laborFactor: 1, reserve: 10 },
      prices: {},
      updated: new Date().toISOString(),
    };
  }

  function normalize(d) {
    const def = defaultDesign();
    d = d || {};
    const out = Object.assign({}, def, d);
    out.roof = Object.assign({}, def.roof, d.roof);
    out.foundation = Object.assign({}, def.foundation, d.foundation);
    out.plot = Object.assign({}, def.plot, d.plot);
    out.plot.house = Object.assign({}, def.plot.house, (d.plot || {}).house);
    out.options = Object.assign({}, def.options, d.options);
    out.prices = Object.assign({}, d.prices);
    out.openings = Array.isArray(d.openings) ? d.openings : def.openings;
    return out;
  }

  const rad = a => a * Math.PI / 180;
  function wallLen(d, wall) { return (wall === 'front' || wall === 'back') ? d.width : d.length; }
  function mat(d) { return WALL_MATERIALS[d.wallMaterial] || WALL_MATERIALS.beton24; }
  function price(d, key) {
    const base = PRICES[key]; const o = (d.prices || {})[key] || {};
    return { mat: o.mat != null ? +o.mat : base.mat, lab: o.lab != null ? +o.lab : base.lab };
  }

  /* --- Geometria --- */
  function geometry(d) {
    const W = d.width, L = d.length, H = d.wallHeight, m = mat(d);
    const ins = m.light ? 0 : (+d.insulation || 0) / 100; // ocieplenie zewnętrzne zwiększa obrys
    const tS = m.t, t = tS + ins;
    const r = d.roof;
    const type = r.type;
    const pitch = type === 'plaski' ? 3 : Math.max(1, Math.min(60, r.pitch));
    const o = r.overhang;
    let span, along, rise, gableArea = 0, roofVolume = 0;
    if (type === 'dwuspadowy') {
      span = r.ridge === 'length' ? W : L; along = r.ridge === 'length' ? L : W;
      rise = span / 2 * Math.tan(rad(pitch));
      gableArea = 2 * (span * rise / 2);
      roofVolume = span * rise / 2 * along;
    } else if (type === 'jednospadowy' || type === 'plaski') {
      const acrossX = (r.slopeTo === 'left' || r.slopeTo === 'right');
      span = acrossX ? W : L; along = acrossX ? L : W;
      rise = span * Math.tan(rad(pitch));
      gableArea = 2 * (span * rise / 2) + along * rise; // dwa trójkąty + pas ściany wyższej
      roofVolume = span * rise / 2 * along;
    } else { // czterospadowy
      span = Math.min(W, L); along = Math.max(W, L);
      rise = span / 2 * Math.tan(rad(pitch));
      const ridgeLen = along - span;
      roofVolume = rise * span * (ridgeLen / 2 + span / 3);
    }
    const planW = W + 2 * o, planL = L + 2 * o;
    const roofArea = planW * planL / Math.cos(rad(pitch));
    let eaves;
    if (type === 'dwuspadowy') eaves = 2 * (along + 2 * o);
    else if (type === 'czterospadowy') eaves = 2 * (planW + planL);
    else eaves = along + 2 * o;
    const plinth = 0.15; // posadzka ponad terenem
    const roofThk = type === 'plaski' ? 0.3 : 0.25;
    const totalHeight = plinth + H + rise + roofThk;
    const footprint = W * L;
    const innerW = W - 2 * t, innerL = L - 2 * t;
    const usable = innerW * innerL;
    const axisPerim = 2 * ((W - 2 * ins - tS) + (L - 2 * ins - tS));
    const volume = footprint * (H + plinth) + roofVolume;
    return { W, L, H, t, tS, ins, pitch, o, span, along, rise, gableArea, roofArea, eaves, totalHeight, footprint, innerW, innerL, usable, axisPerim, outerPerim: 2 * (W + L), volume, roofVolume, plinth, roofThk };
  }

  /* Położenie otworu w rzucie (lico zewnętrzne): punkty a→b */
  function openingSegment(d, op) {
    const W = d.width, L = d.length, s = op.offset, w = op.width;
    switch (op.wall) {
      case 'front': return { ax: s, ay: 0, bx: s + w, by: 0, nx: 0, ny: -1 };
      case 'back': return { ax: W - s, ay: L, bx: W - s - w, by: L, nx: 0, ny: 1 };
      case 'left': return { ax: 0, ay: L - s, bx: 0, by: L - s - w, nx: -1, ny: 0 };
      case 'right': return { ax: W, ay: s, bx: W, by: s + w, nx: 1, ny: 0 };
    }
    return null;
  }

  /* --- Ilości i koszty --- */
  function quantities(d) {
    const g = geometry(d), m = mat(d);
    const ops = d.openings || [];
    const opArea = ops.reduce((s, o) => s + o.width * o.height, 0);
    const wallGross = g.axisPerim * g.H + g.gableArea;
    const wallNet = Math.max(0, wallGross - opArea);
    const frost = FROST[d.foundation.frostZone] || 1.0;
    const q = { g, frost, opArea, wallGross, wallNet };
    if (d.foundation.type === 'lawy') {
      q.trench = g.axisPerim * 0.8 * frost;
      q.footingConcrete = g.axisPerim * 0.5 * 0.3;
      q.footingSteel = g.axisPerim * 5.0;
      q.fundWall = g.axisPerim * frost; // od ławy do poziomu posadzki
      q.fundBlocks = Math.ceil(q.fundWall * 19.5);
      q.fundIso = g.outerPerim * (frost + 0.15);
      q.fill = g.usable * 0.3;
      q.floor = g.usable;
      q.floorConcrete = g.usable * 0.12;
    } else {
      q.trench = g.footprint * 0.4;
      q.slabConcrete = g.footprint * 0.25;
      q.slabSteel = q.slabConcrete * 100;
      q.slabXps = (g.W + 0.3) * (g.L + 0.3);
      q.fill = g.footprint * 0.4;
    }
    q.wallPieces = m.light ? null : Math.ceil(wallNet * m.perM2 * 1.05);
    q.lintels = m.light ? 0 : ops.reduce((s, o) => s + o.width + 0.5, 0);
    q.ringConcrete = m.light ? 0 : g.axisPerim * g.tS * 0.24;
    q.ringSteel = m.light ? 0 : g.axisPerim * 5.0;
    q.timber = g.roofArea * (d.roof.type === 'plaski' ? 0.045 : 0.032);
    q.flashing = 2 * (g.W + 2 * g.o + g.L + 2 * g.o);
    q.gutters = g.eaves + (d.roof.type === 'dwuspadowy' ? 2 : d.roof.type === 'czterospadowy' ? 4 : 1) * (g.H + 0.4);
    q.facade = g.outerPerim * (g.H + g.plinth) + g.gableArea - opArea;
    q.innerPlaster = 2 * (g.innerW + g.innerL) * g.H - opArea;
    return q;
  }

  function costLines(d) {
    const q = quantities(d), g = q.g, m = mat(d), opt = d.options, lf = opt.laborFactor ?? 1;
    const lines = [];
    const add = (key, qty, extra = {}) => {
      if (!(qty > 0)) return;
      const p = price(d, key); const base = PRICES[key];
      const matU = extra.mat != null ? extra.mat : p.mat;
      const labU = extra.lab != null ? extra.lab : p.lab;
      lines.push({ key, cat: base.cat, label: extra.label || base.label, unit: extra.unit || base.unit, qty, matU, labU: labU * lf, mat: qty * matU, lab: qty * labU * lf, note: extra.note || '' });
    };
    // Fundamenty
    add('wykop', q.trench);
    if (d.foundation.type === 'lawy') {
      add('lawy', q.footingConcrete);
      add('stal', q.footingSteel + q.ringSteel, { note: 'ławy + wieniec' });
      add('scianaFund', q.fundWall, { note: `≈ ${q.fundBlocks} bloczków` });
      add('izolFund', q.fundIso);
      if (d.foundation.insulate) add('xpsFund', q.fundIso);
      add('podsypka', q.fill);
      add('posadzka', q.floor);
    } else {
      add('plyta', q.slabConcrete);
      add('stal', q.slabSteel + q.ringSteel, { note: 'płyta + wieniec' });
      add('xpsPlyta', q.slabXps);
      add('podsypka', q.fill);
    }
    // Ściany
    const ov = (d.prices || {}).sciany || {};
    const wallMatU = ov.mat != null ? +ov.mat : m.perM2 * m.piece + m.mortar;
    const wallLabU = ov.lab != null ? +ov.lab : m.lab;
    add('sciany', q.wallNet, { label: 'Ściany: ' + m.name + ` (${Math.round(g.tS * 100)} cm)`, mat: wallMatU, lab: wallLabU, note: q.wallPieces ? `≈ ${q.wallPieces} ${m.unitName}` : '' });
    add('nadproza', q.lintels);
    add('wieniec', q.ringConcrete);
    // Dach
    add('wiezba', q.timber);
    add('dachRob', g.roofArea);
    const cover = ROOF_COVERS[d.roof.cover] || ROOF_COVERS.blachodachowka;
    add(cover.sub, g.roofArea);
    const pc = (d.prices || {})['pokrycie_' + d.roof.cover] || {};
    add('pokrycie', g.roofArea, { label: 'Pokrycie: ' + cover.name, mat: pc.mat != null ? +pc.mat : cover.mat, lab: pc.lab != null ? +pc.lab : cover.lab });
    add('obrobki', q.flashing);
    if (opt.gutters) add('rynny', q.gutters);
    if (d.roof.insulated) add('ocieplDach', g.usable);
    // Stolarka
    for (const o of d.openings || []) {
      if (o.type === 'brama') {
        const gt = GATE_TYPES[o.gate] || GATE_TYPES.segmentowa;
        const po = (d.prices || {})['brama_' + o.gate] || {};
        const bmat = po.mat != null ? +po.mat : gt.base + gt.perM2 * o.width * o.height;
        add('brama', 1, { label: `Brama ${gt.name.toLowerCase()} ${fmt(o.width)}×${fmt(o.height)} m`, mat: bmat });
        if (o.motor) add('naped', 1);
      } else if (o.type === 'drzwi') add('drzwi', 1, { label: `Drzwi zewnętrzne ${fmt(o.width)}×${fmt(o.height)} m` });
      else if (o.type === 'okno') add('okno', o.width * o.height, { label: `Okno ${fmt(o.width)}×${fmt(o.height)} m` });
    }
    // Instalacje
    if (opt.electric) { add('elektryka', 1); add('kabel', opt.cableLength); }
    if (opt.ev) add('ev', 1);
    add('wentylacja', 1);
    // Wykończenie
    if (opt.facade) {
      if (d.insulation > 0 && !m.light) add('elewOciepl', q.facade, { label: `Elewacja: styropian ${d.insulation} cm + tynk` });
      else if (!m.light) add('elewTynk', q.facade);
    }
    if (opt.plaster && !m.light) add('tynkWew', q.innerPlaster);
    if (opt.apron) add('opaska', g.outerPerim + 1.6);
    if (opt.driveway > 0) add('podjazd', opt.driveway);
    // Formalności
    const path = legal(d).path;
    if (path === 'zgloszenie') {
      add('wypis', 1);
      if (opt.formalSketchByArchitect) add('szkice', 1);
      add('wytyczenie', 1, { note: 'zalecane' });
      add('inwentar', 1, { note: 'zalecane – ujawnienie w ewidencji' });
    } else {
      add('wypis', 1);
      if (!d.plot.hasMpzp) add('wz', 1, { note: 'gdy brak MPZP' });
      add('mapaProj', 1); add('geotech', 1); add('projekt', 1); add('oplataPB', 1);
      add('kierownik', 1); add('wytyczenie', 1); add('inwentar', 1);
    }
    return lines;
  }

  function costSummary(d) {
    const lines = costLines(d);
    const byCat = {};
    for (const c of CATEGORIES) byCat[c] = { mat: 0, lab: 0, total: 0 };
    for (const l of lines) { const c = byCat[l.cat]; c.mat += l.mat; c.lab += l.lab; c.total += l.mat + l.lab; }
    const mat = lines.reduce((s, l) => s + l.mat, 0), lab = lines.reduce((s, l) => s + l.lab, 0);
    const subtotal = mat + lab;
    const reserve = subtotal * (d.options.reserve || 0) / 100;
    return { lines, byCat, mat, lab, subtotal, reserve, total: subtotal + reserve };
  }

  /* --- Kontrola przepisów i ergonomii --- */
  function wallHasOpenings(d, wall) { return (d.openings || []).some(o => o.wall === wall); }

  function boundaryChecks(d) {
    const p = d.plot, W = d.width, L = d.length;
    const dist = { left: p.x, right: p.width - p.x - W, back: p.depth - p.y - L, front: p.y };
    const res = [];
    for (const wall of ['left', 'right', 'back']) {
      const dv = dist[wall];
      const withOp = wallHasOpenings(d, wall);
      const narrow = p.width < 16 && (wall === 'left' || wall === 'right');
      const relax = p.mpzpBoundary || narrow || p.neighbourAtBoundary;
      let need, status, msg;
      if (dv < -0.001) { status = 'bad'; msg = 'Garaż wychodzi poza granicę działki.'; need = 0; }
      else if (withOp) {
        need = narrow ? 3 : 4;
        status = dv >= need - 0.001 ? 'ok' : 'bad';
        msg = `Ściana z otworami (okno/drzwi/brama) – min. ${need} m od granicy${narrow ? ' (działka węższa niż 16 m)' : ''}.`;
      } else if (dv >= 3 - 0.001) { need = 3; status = 'ok'; msg = 'Ściana bez otworów – min. 3 m od granicy.'; }
      else if (relax && (dv >= 1.5 - 0.001 || dv < 0.05)) {
        need = 1.5; status = 'warn';
        msg = 'Ściana bez otworów bliżej niż 3 m – dopuszczalne tylko w odległości ≥1,5 m lub bezpośrednio przy granicy, gdy pozwala na to MPZP, działka ma < 16 m szerokości albo sąsiad ma budynek przy granicy. Sprawdź warunki (§12 WT, przepisy ppoż.).';
      } else {
        need = 3; status = 'bad';
        msg = relax ? 'Odległość między 0 a 1,5 m jest niedopuszczalna – przesuń garaż na granicę lub ≥1,5 m.' : 'Ściana bez otworów – min. 3 m (mniej tylko przy zgodzie MPZP, działce < 16 m lub budynku sąsiada przy granicy).';
      }
      res.push({ wall, label: `Ściana ${WALLS[wall].toLowerCase()} → granica`, dist: dv, need, status, msg });
    }
    // Front: droga i linia zabudowy
    const roadMin = ROAD_MIN[p.road] || 0;
    if (roadMin) {
      const total = dist.front + (+p.roadOffset || 0);
      res.push({ wall: 'front', label: 'Front → krawędź jezdni', dist: total, need: roadMin, status: total >= roadMin - 0.001 ? 'ok' : 'warn', msg: `Ustawa o drogach publicznych: min. ${roadMin} m od zewnętrznej krawędzi jezdni (w terenie zabudowy). Mniej – tylko za zgodą zarządcy drogi.` });
    }
    if (p.buildLine > 0) {
      res.push({ wall: 'front', label: 'Front → granica od ulicy (linia zabudowy)', dist: dist.front, need: +p.buildLine, status: dist.front >= p.buildLine - 0.001 ? 'ok' : 'bad', msg: `Linia zabudowy z MPZP/WZ: ${fmt(p.buildLine)} m od granicy z drogą.` });
    }
    if (p.house && p.house.enabled) {
      const h = p.house;
      const dx = Math.max(h.x - (p.x + W), p.x - (h.x + h.w), 0);
      const dy = Math.max(h.y - (p.y + L), p.y - (h.y + h.d), 0);
      const dd = Math.hypot(dx, dy);
      res.push({ wall: 'house', label: 'Garaż → dom', dist: dd, need: 0, status: dd > 0.01 ? 'info' : 'warn', msg: dd > 0.01 ? 'Między budynkami na jednej działce zabudowy jednorodzinnej przepisy ppoż. zwykle nie wymagają odstępu, ale zostaw miejsce na przejście i dach (okapy, śnieg).' : 'Garaż styka się z domem – to rozbudowa domu, inna ścieżka formalna.' });
    }
    return res;
  }

  function legal(d) {
    const g = geometry(d), p = d.plot;
    const reasons = [], notes = [];
    let path = 'zgloszenie';
    if (p.attached) {
      path = 'pozwolenie';
      reasons.push('Garaż dobudowany do domu to rozbudowa budynku mieszkalnego – zwykle pozwolenie na budowę (albo zgłoszenie z projektem, jeżeli dom spełnia warunki art. 29 ust. 1 pkt 1 PB). Wymagany projekt budowlany.');
    }
    if (g.footprint > 35 + 1e-9) {
      path = 'pozwolenie';
      reasons.push(`Powierzchnia zabudowy ${fmt(g.footprint)} m² przekracza 35 m² – wymagane pozwolenie na budowę i projekt budowlany.`);
    } else {
      reasons.push(`Powierzchnia zabudowy ${fmt(g.footprint)} m² ≤ 35 m² – wolnostojący, parterowy garaż może być budowany na zgłoszenie (art. 29 ust. 1 PB).`);
    }
    const plotArea = p.width * p.depth;
    const allowed = Math.floor(plotArea / 500) * 2;
    const count = (+p.smallObjects || 0) + (g.footprint <= 35 ? 1 : 0);
    if (g.footprint <= 35 && count > allowed) {
      path = 'pozwolenie';
      reasons.push(`Limit obiektów do 35 m² na zgłoszenie: 2 na każde 500 m² działki. Działka ${fmt(plotArea, 0)} m² → maks. ${allowed}, a byłoby ${count}.`);
    }
    notes.push('Zgłoszenie nie zwalnia ze zgodności z MPZP lub (bez planu) z ogólnymi przepisami – urząd może wnieść sprzeciw w ciągu 21 dni.');
    notes.push('W strefie ochrony konserwatorskiej / obszarze Natura 2000 urząd może nałożyć obowiązek uzyskania pozwolenia.');
    if (p.maxHeight > 0 && g.totalHeight > p.maxHeight) notes.push(`Wysokość ≈ ${fmt(g.totalHeight)} m przekracza dopuszczalne ${fmt(p.maxHeight)} m (MPZP/WZ).`);
    return { path, reasons, notes, allowed, count, plotArea };
  }

  function ergonomics(d) {
    const g = geometry(d), out = [];
    const cars = g.innerW >= 5.4 ? 2 : 1;
    const wNeed = cars === 2 ? 5.5 : 3.0, wGood = cars === 2 ? 6.0 : 3.5;
    out.push({ label: `Szerokość wewnętrzna (${cars === 2 ? '2 auta' : '1 auto'})`, value: g.innerW, status: g.innerW >= wGood ? 'ok' : g.innerW >= wNeed ? 'warn' : 'bad', msg: `min. ${fmt(wNeed)} m, wygodnie ${fmt(wGood)} m (otwieranie drzwi auta).` });
    out.push({ label: 'Długość wewnętrzna', value: g.innerL, status: g.innerL >= 6 ? 'ok' : g.innerL >= 5.4 ? 'warn' : 'bad', msg: 'min. 5,4 m (auto ~4,8 m + przejście), wygodnie 6 m i więcej (regały, rowery).' });
    const gates = (d.openings || []).filter(o => o.type === 'brama');
    if (!gates.length) out.push({ label: 'Brama', value: null, status: 'bad', msg: 'Brak bramy garażowej w projekcie.' });
    for (const o of gates) {
      const gt = GATE_TYPES[o.gate] || GATE_TYPES.segmentowa;
      out.push({ label: `Brama ${fmt(o.width)} m – szerokość`, value: o.width, status: o.width >= 2.5 ? 'ok' : o.width >= 2.3 ? 'warn' : 'bad', msg: 'Na 1 auto min. 2,4 m, wygodnie 2,5–3,0 m; na 2 auta 4,5–5,0 m.' });
      out.push({ label: `Brama – wysokość`, value: o.height, status: o.height >= 2.1 ? 'ok' : o.height >= 2.0 ? 'warn' : 'bad', msg: 'Min. 2,0 m; dla SUV/bagażnika dachowego 2,125–2,25 m.' });
      const need = o.height + gt.headroom;
      out.push({ label: `Nadproże nad bramą (${gt.name.toLowerCase()})`, value: g.H - o.height, status: g.H >= need ? 'ok' : 'bad', msg: `Ten typ bramy potrzebuje ok. ${Math.round(gt.headroom * 100)} cm nad otworem (prowadnice/zwój) – ściana min. ${fmt(need)} m.` });
    }
    // otwory w obrębie ścian i bez kolizji
    const byWall = {};
    for (const o of d.openings || []) (byWall[o.wall] = byWall[o.wall] || []).push(o);
    for (const [wall, list] of Object.entries(byWall)) {
      const len = wallLen(d, wall);
      list.sort((a, b) => a.offset - b.offset);
      for (const o of list) {
        if (o.offset < g.t + 0.05 || o.offset + o.width > len - g.t - 0.05)
          out.push({ label: `Otwór na ścianie ${WALLS[wall].toLowerCase()}`, value: null, status: 'bad', msg: `${typeName(o.type)} ${fmt(o.width)} m wychodzi poza ścianę lub jest za blisko narożnika (min. ${Math.round((g.t + 0.05) * 100)} cm od krawędzi).` });
        if (o.type === 'okno' && (o.sill || 0) + o.height > g.H - 0.15)
          out.push({ label: 'Okno', value: null, status: 'bad', msg: 'Okno sięga ponad ścianę – obniż parapet lub wysokość okna.' });
        if (o.height > g.H - 0.1) out.push({ label: `${typeName(o.type)} – wysokość`, value: o.height, status: 'bad', msg: 'Otwór wyższy niż ściana.' });
      }
      for (let i = 1; i < list.length; i++) {
        if (list[i].offset < list[i - 1].offset + list[i - 1].width + 0.3)
          out.push({ label: `Ściana ${WALLS[wall].toLowerCase()}`, value: null, status: 'bad', msg: 'Otwory nachodzą na siebie lub filarek między nimi < 30 cm.' });
      }
    }
    out.push({ label: 'Wentylacja', value: null, status: 'info', msg: 'Zaplanuj kratkę nawiewną nisko (np. w bramie/ścianie) i wywiewną pod dachem po przeciwnej stronie.' });
    return out;
  }

  function typeName(t) { return ({ brama: 'Brama', drzwi: 'Drzwi', okno: 'Okno' })[t] || t; }
  function fmt(n, d = 2) { return new Intl.NumberFormat('pl-PL', { maximumFractionDigits: d }).format(+n || 0); }

  return { WALLS, WALL_MATERIALS, ROOF_TYPES, ROOF_COVERS, GATE_TYPES, FROST, FROST_DESC, ROADS, ROAD_MIN, PRICES, CATEGORIES,
    defaultDesign, normalize, geometry, quantities, costLines, costSummary, legal, boundaryChecks, ergonomics, openingSegment, wallLen, typeName, mat, price };
})();
