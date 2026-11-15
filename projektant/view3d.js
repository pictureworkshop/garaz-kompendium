/* Projektant – widok 3D (three.js r128, lokalnie). Rzut (x, y) → three (X = x, Z = -y), wysokość → Y. */
'use strict';

const View3D = (() => {
  let renderer, scene, camera, root, container, ro, raf = 0;
  const cam = { theta: -0.75, phi: 1.05, dist: 16, target: new THREE.Vector3() };
  let showPlot = true;

  const COLORS = {
    wall: 0xe9e4da, wallLight: 0xc8a676, wallSteel: 0xb9c0c8, plinth: 0x8c8c8c,
    roof: { blachodachowka: 0x5a2f2a, trapez: 0x4b5157, rabek: 0x3b3f44, dachowka: 0xa0492f, gont: 0x50443f, papa: 0x2e2e2e, epdm: 0x262626 },
    gate: 0xf2f2f2, door: 0x5b6670, glass: 0x8fc3e8, grass: 0x5f8a45, street: 0x8a8d90, house: 0xd8d2c8, houseRoof: 0x6a6f75, slab: 0xb0aca5,
  };

  function init(el) {
    container = el;
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(40, 1, 0.1, 500);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x667755, 0.75));
    const sun = new THREE.DirectionalLight(0xffffff, 0.85);
    sun.position.set(-12, 22, 14); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 80 });
    scene.add(sun); scene.add(sun.target);
    scene.userData.sun = sun;
    bindControls(renderer.domElement);
    ro = new ResizeObserver(resize); ro.observe(el);
    resize();
  }

  function resize() {
    if (!container || !renderer) return;
    const w = container.clientWidth, h = container.clientHeight || 400;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%';
    camera.aspect = w / h; camera.updateProjectionMatrix(); requestRender();
  }

  function requestRender() { if (!renderer) return; if (!raf) raf = requestAnimationFrame(() => { raf = 0; render(); }); }
  function render() {
    if (!renderer) return;
    const { theta, phi, dist, target } = cam;
    camera.position.set(target.x + dist * Math.sin(phi) * Math.sin(theta), target.y + dist * Math.cos(phi), target.z + dist * Math.sin(phi) * Math.cos(theta));
    camera.lookAt(target);
    renderer.render(scene, camera);
  }

  function bindControls(el) {
    const ptrs = new Map(); let lastDist = 0;
    el.style.touchAction = 'none';
    el.addEventListener('pointerdown', e => { el.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); });
    el.addEventListener('pointermove', e => {
      if (!ptrs.has(e.pointerId)) return;
      const prev = ptrs.get(e.pointerId); const cur = { x: e.clientX, y: e.clientY };
      ptrs.set(e.pointerId, cur);
      if (ptrs.size === 1) {
        cam.theta -= (cur.x - prev.x) * 0.008;
        cam.phi = Math.max(0.15, Math.min(1.52, cam.phi - (cur.y - prev.y) * 0.008));
      } else if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()]; const dd = Math.hypot(a.x - b.x, a.y - b.y);
        if (lastDist) cam.dist = Math.max(4, Math.min(120, cam.dist * lastDist / dd));
        lastDist = dd;
      }
      requestRender();
    });
    const up = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) lastDist = 0; };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', e => { e.preventDefault(); cam.dist = Math.max(4, Math.min(120, cam.dist * (1 + Math.sign(e.deltaY) * 0.1))); requestRender(); }, { passive: false });
  }

  const mat = (color, extra = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.85, metalness: 0 }, extra));

  /* Ściana jako wyciągnięty kształt (elewacja z otworami) */
  function wallMesh(d, wall, material) {
    const g = GarageCalc.geometry(d), len = GarageCalc.wallLen(d, wall), t = g.t, pl = g.plinth;
    const pts = [0, len / 2, len];
    for (let i = 1; i < 24; i++) pts.push(len * i / 24);
    if (d.roof.type === 'czterospadowy') { const h = Math.min(d.width, d.length) / 2; pts.push(h, len - h); }
    const us = [...new Set(pts)].filter(u => u >= 0 && u <= len).sort((a, b) => a - b);
    const shape = new THREE.Shape();
    shape.moveTo(0, 0); shape.lineTo(len, 0);
    for (const u of [...us].reverse()) {
      const [x, y] = Drawings.wallPoint(d, wall, u, 0);
      shape.lineTo(u, pl + Math.max(d.wallHeight, Drawings.roofZ(d, x, y)));
    }
    shape.lineTo(0, 0);
    for (const op of d.openings.filter(o => o.wall === wall)) {
      const z0 = pl + (op.type === 'okno' ? (op.sill || 0) : 0);
      const h = new THREE.Path();
      h.moveTo(op.offset, z0); h.lineTo(op.offset + op.width, z0); h.lineTo(op.offset + op.width, z0 + op.height); h.lineTo(op.offset, z0 + op.height); h.lineTo(op.offset, z0);
      shape.holes.push(h);
    }
    const geo = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false });
    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = true; mesh.receiveShadow = true;
    place(mesh, d, wall, t);
    return mesh;
  }
  function place(obj, d, wall, t) {
    const W = d.width, L = d.length;
    switch (wall) {
      case 'front': obj.position.set(0, 0, -t); break;
      case 'back': obj.rotation.y = Math.PI; obj.position.set(W, 0, -L + t); break;
      case 'left': obj.rotation.y = -Math.PI / 2; obj.position.set(t, 0, -L); break;
      case 'right': obj.rotation.y = Math.PI / 2; obj.position.set(W - t, 0, 0); break;
    }
  }

  function openingMeshes(d, group) {
    const g = GarageCalc.geometry(d), t = g.t, pl = g.plinth;
    for (const op of d.openings) {
      const z0 = pl + (op.type === 'okno' ? (op.sill || 0) : 0);
      const inset = t - (op.type === 'okno' ? t * 0.35 : t * 0.25); // lico zewn. = t
      const sub = new THREE.Group();
      if (op.type === 'brama') {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(op.width, op.height, 0.04), mat(COLORS.gate, { roughness: 0.5 }));
        panel.position.set(op.offset + op.width / 2, z0 + op.height / 2, inset); sub.add(panel);
        const gt = op.gate || 'segmentowa';
        const n = gt === 'roletowa' ? Math.round(op.height / 0.12) : gt === 'segmentowa' ? Math.max(3, Math.round(op.height / 0.55)) : 0;
        for (let i = 1; i < n; i++) {
          const ln = new THREE.Mesh(new THREE.BoxGeometry(op.width, 0.015, 0.05), mat(0xb5b5b5));
          ln.position.set(op.offset + op.width / 2, z0 + op.height * i / n, inset); sub.add(ln);
        }
        if (gt === 'rozwierana') { const ln = new THREE.Mesh(new THREE.BoxGeometry(0.02, op.height, 0.05), mat(0x999999)); ln.position.set(op.offset + op.width / 2, z0 + op.height / 2, inset); sub.add(ln); }
      } else if (op.type === 'drzwi') {
        const di = op.swing === 'in' ? 0.06 : t - 0.06; // skrzydło przy licu, w stronę którego się otwiera
        const p = new THREE.Mesh(new THREE.BoxGeometry(op.width, op.height, 0.05), mat(COLORS.door, { roughness: 0.6 }));
        p.position.set(op.offset + op.width / 2, z0 + op.height / 2, di); sub.add(p);
        const hx = GarageCalc.doorHingeLeftOutside(op) ? op.offset + op.width - 0.12 : op.offset + 0.12;
        const hnd = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.08), mat(0xcccccc, { metalness: 0.6 }));
        hnd.position.set(hx, z0 + 1.05, di + 0.05); sub.add(hnd);
      } else {
        const gl = new THREE.Mesh(new THREE.BoxGeometry(op.width, op.height, 0.02), mat(COLORS.glass, { roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.75 }));
        gl.position.set(op.offset + op.width / 2, z0 + op.height / 2, inset); sub.add(gl);
        const fr = new THREE.Mesh(new THREE.BoxGeometry(0.05, op.height, 0.06), mat(0xffffff)); fr.position.copy(gl.position); sub.add(fr);
      }
      place(sub, d, op.wall, t);
      group.add(sub);
    }
  }

  function roofMesh(d) {
    const g = GarageCalc.geometry(d), W = d.width, L = d.length, o = d.roof.overhang, pl = g.plinth;
    const Z = (x, y) => pl + Drawings.roofZ(d, x, y) + 0.02;
    const P = (x, y) => [x, Z(x, y), -y];
    const faces = [];
    const quad = (a, b, c, e) => faces.push([a, b, c], [a, c, e]);
    const x0 = -o, x1 = W + o, y0 = -o, y1 = L + o;
    const r = d.roof;
    if (r.type === 'dwuspadowy') {
      if (r.ridge === 'length') { quad(P(x0, y0), P(W / 2, y0), P(W / 2, y1), P(x0, y1)); quad(P(W / 2, y0), P(x1, y0), P(x1, y1), P(W / 2, y1)); }
      else { quad(P(x0, y0), P(x1, y0), P(x1, L / 2), P(x0, L / 2)); quad(P(x0, L / 2), P(x1, L / 2), P(x1, y1), P(x0, y1)); }
    } else if (r.type === 'czterospadowy') {
      const h = Math.min(W, L) / 2;
      if (W <= L) {
        const r1 = [W / 2, h], r2 = [W / 2, L - h];
        faces.push([P(x0, y0), P(x1, y0), P(...r1)], [P(x1, y1), P(x0, y1), P(...r2)]);
        quad(P(x1, y0), P(x1, y1), P(...r2), P(...r1)); quad(P(x0, y1), P(x0, y0), P(...r1), P(...r2));
      } else {
        const r1 = [h, L / 2], r2 = [W - h, L / 2];
        faces.push([P(x0, y1), P(x0, y0), P(...r1)], [P(x1, y0), P(x1, y1), P(...r2)]);
        quad(P(x0, y0), P(x1, y0), P(...r2), P(...r1)); quad(P(x1, y1), P(x0, y1), P(...r1), P(...r2));
      }
    } else quad(P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1));
    const pos = [];
    for (const f of faces) for (const v of f) pos.push(...v);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.computeVertexNormals();
    const color = COLORS.roof[r.cover] || 0x555555;
    const m = new THREE.Mesh(geo, mat(color, { side: THREE.DoubleSide, roughness: 0.6, metalness: r.cover === 'trapez' || r.cover === 'rabek' ? 0.3 : 0.05 }));
    m.castShadow = true; m.receiveShadow = true;
    // grubość dachu – krawędzie (deska czołowa)
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 1), new THREE.LineBasicMaterial({ color: 0x222222 }));
    const grp = new THREE.Group(); grp.add(m, edges);
    return grp;
  }

  function houseMesh(h) {
    const grp = new THREE.Group();
    const H = 3.2, rise = Math.min(h.w, h.d) / 2 * Math.tan(35 * Math.PI / 180);
    const box = new THREE.Mesh(new THREE.BoxGeometry(h.w, H, h.d), mat(COLORS.house, { transparent: true, opacity: 0.9 }));
    box.position.set(h.x + h.w / 2, H / 2, -(h.y + h.d / 2)); box.castShadow = box.receiveShadow = true; grp.add(box);
    const shape = new THREE.Shape(); shape.moveTo(-0.4, 0); shape.lineTo(h.w + 0.4, 0); shape.lineTo(h.w / 2, rise); shape.lineTo(-0.4, 0);
    const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: h.d + 0.8, bevelEnabled: false }), mat(COLORS.houseRoof));
    roof.position.set(h.x, H, -(h.y - 0.4)); roof.rotation.y = 0; roof.position.z = -(h.y + h.d + 0.4); roof.castShadow = true;
    grp.add(roof);
    return grp;
  }

  function build(d) {
    if (!scene) return;
    if (root) { scene.remove(root); root.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose?.(); }); }
    root = new THREE.Group();
    const g = GarageCalc.geometry(d), m = GarageCalc.mat(d);
    const garage = new THREE.Group();
    const wm = mat(m.light ? (d.wallMaterial === 'stal' ? COLORS.wallSteel : COLORS.wallLight) : COLORS.wall);
    for (const w of ['front', 'back', 'left', 'right']) garage.add(wallMesh(d, w, wm));
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(d.width + 0.02, g.plinth, d.length + 0.02), mat(COLORS.plinth));
    plinth.position.set(d.width / 2, g.plinth / 2 - 0.001, -d.length / 2); plinth.receiveShadow = true; garage.add(plinth);
    const floor = new THREE.Mesh(new THREE.BoxGeometry(d.width - 0.02, 0.02, d.length - 0.02), mat(COLORS.slab));
    floor.position.set(d.width / 2, g.plinth, -d.length / 2); floor.receiveShadow = true; garage.add(floor);
    openingMeshes(d, garage);
    garage.add(roofMesh(d));
    const p = d.plot;
    if (showPlot) {
      garage.position.set(p.x, 0, -p.y);
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(p.width, p.depth), mat(COLORS.grass));
      ground.rotation.x = -Math.PI / 2; ground.position.set(p.width / 2, 0, -p.depth / 2); ground.receiveShadow = true; root.add(ground);
      const street = new THREE.Mesh(new THREE.PlaneGeometry(p.width + 10, 6), mat(COLORS.street));
      street.rotation.x = -Math.PI / 2; street.position.set(p.width / 2, -0.01, 3 + (+p.roadOffset > 0 ? 0 : 0)); street.receiveShadow = true; root.add(street);
      const border = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0.03, 0), new THREE.Vector3(p.width, 0.03, 0), new THREE.Vector3(p.width, 0.03, -p.depth), new THREE.Vector3(0, 0.03, -p.depth)]),
        new THREE.LineBasicMaterial({ color: 0xffffff }));
      root.add(border);
      if (p.house && p.house.enabled) root.add(houseMesh(p.house));
      // podjazd
      const gate = d.openings.find(o => o.type === 'brama' && o.wall === 'front');
      if (gate && p.y > 0.2) {
        const dw = new THREE.Mesh(new THREE.PlaneGeometry(gate.width + 0.6, p.y), mat(0xa9a39a));
        dw.rotation.x = -Math.PI / 2; dw.position.set(p.x + gate.offset + gate.width / 2, 0.01, -p.y / 2); dw.receiveShadow = true; root.add(dw);
      }
      cam.target.set(p.x + d.width / 2, 1.4, -(p.y + d.length / 2));
    } else {
      const ground = new THREE.Mesh(new THREE.CircleGeometry(Math.max(d.width, d.length) * 1.6, 48), mat(COLORS.grass));
      ground.rotation.x = -Math.PI / 2; ground.position.set(d.width / 2, 0, -d.length / 2); ground.receiveShadow = true; root.add(ground);
      cam.target.set(d.width / 2, 1.4, -d.length / 2);
    }
    root.add(garage);
    scene.add(root);
    const sun = scene.userData.sun; sun.target.position.copy(cam.target); sun.position.set(cam.target.x - 12, 22, cam.target.z + 14);
    requestRender();
  }

  function setBackground(dark) { if (scene) { scene.background = new THREE.Color(dark ? 0x000000 : 0xdfe8f0); requestRender(); } }
  function preset(name, d) {
    const size = Math.max(d.width, d.length);
    if (name === 'front') { cam.theta = 0; cam.phi = 1.35; cam.dist = size * 2.6; }
    else if (name === 'side') { cam.theta = -Math.PI / 2; cam.phi = 1.35; cam.dist = size * 2.6; }
    else if (name === 'top') { cam.theta = 0; cam.phi = 0.16; cam.dist = showPlot ? Math.max(d.plot.width, d.plot.depth) * 1.6 : size * 3; }
    else { cam.theta = -0.6; cam.phi = 1.1; cam.dist = size * 3.6; }
    requestRender();
  }
  function togglePlot(v, d) { showPlot = v; build(d); }
  function snapshot() { render(); return renderer.domElement.toDataURL('image/png'); }
  function destroy() { if (raf) cancelAnimationFrame(raf); raf = 0; if (ro) ro.disconnect(); if (renderer) { renderer.dispose(); renderer.domElement.remove(); } renderer = scene = root = null; container = null; }
  return { init, build, preset, togglePlot, setBackground, snapshot, destroy, get showPlot() { return showPlot; } };
})();
