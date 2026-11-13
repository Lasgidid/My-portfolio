import * as THREE from "three";

// Palette (matches index.css)
const MASK = "#123d30";
const MASK_DEEP = "#0c2b22";
const COPPER = "#c98a4b";
const SILK = "#e8ece4";

const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => t * t * (3 - 2 * t);
const lerpArr = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));

// Seeded random so the board looks the same on every visit
function rng(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

function boardTexture() {
  const c = document.createElement("canvas");
  c.width = 1536; c.height = 1024;
  const g = c.getContext("2d");
  g.fillStyle = MASK; g.fillRect(0, 0, c.width, c.height);
  // faint ground-plane hatch
  g.strokeStyle = "rgba(255,255,255,0.035)"; g.lineWidth = 2;
  for (let x = -c.height; x < c.width; x += 22) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + c.height, c.height); g.stroke(); }
  // silkscreen
  g.strokeStyle = SILK; g.fillStyle = SILK; g.lineWidth = 4;
  g.strokeRect(40, 40, c.width - 80, c.height - 80);
  g.font = "600 34px Archivo, sans-serif";
  g.fillText("SA-PORTFOLIO  REV 2026", 70, c.height - 70);
  g.fillText("LAGOS, NG", c.width - 260, c.height - 70);
  g.font = "600 30px Archivo, sans-serif";
  g.fillText("U1", c.width / 2 - 150, c.height / 2 - 150);
  // mounting holes
  [[110, 110], [c.width - 110, 110], [110, c.height - 140], [c.width - 110, c.height - 140]].forEach(([x, y]) => {
    g.fillStyle = "#c7cdc8"; g.beginPath(); g.arc(x, y, 34, 0, 7); g.fill();
    g.fillStyle = MASK_DEEP; g.beginPath(); g.arc(x, y, 18, 0, 7); g.fill();
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

function panelTexture(p) {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 640;
  const g = c.getContext("2d");
  g.fillStyle = "#16201c"; g.fillRect(0, 0, 1024, 640);
  // browser bar
  g.fillStyle = "#223029"; g.fillRect(0, 0, 1024, 64);
  ["#e0866a", "#d8c167", "#93bf8c"].forEach((col, i) => { g.fillStyle = col; g.beginPath(); g.arc(36 + i * 30, 32, 9, 0, 7); g.fill(); });
  g.fillStyle = "#2f3f37"; g.fillRect(150, 16, 640, 32);
  g.fillStyle = "#9fb0a8"; g.font = "400 20px Archivo, sans-serif"; g.fillText(p.url, 166, 39);
  // page content
  g.fillStyle = p.color; g.fillRect(56, 112, 10, 200);
  g.fillStyle = SILK; g.font = "800 66px Archivo, sans-serif";
  wrap(g, p.title, 92, 176, 860, 72);
  g.fillStyle = "#9fb0a8"; g.font = "400 30px Archivo, sans-serif";
  g.fillText(p.kind, 92, 352);
  // abstract layout blocks
  g.fillStyle = "rgba(232,236,228,0.08)";
  g.fillRect(56, 420, 420, 150); g.fillRect(500, 420, 220, 150); g.fillRect(744, 420, 224, 150);
  g.fillStyle = p.color; g.globalAlpha = 0.85; g.fillRect(56, 420, 420, 8); g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

function wrap(g, text, x, y, max, lh) {
  const words = text.split(" "); let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (g.measureText(test).width > max && line) { g.fillText(line, x, y); line = w; y += lh; }
    else line = test;
  }
  g.fillText(line, x, y);
}

export function createScene(canvas, projects, opts = {}) {
  const reduced = opts.reducedMotion;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(MASK_DEEP, 9, 22);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);

  scene.add(new THREE.HemisphereLight("#dfe9e2", "#0a1f18", 0.9));
  const key = new THREE.DirectionalLight("#fff3e2", 2.2); key.position.set(4, 8, 5); scene.add(key);
  const rim = new THREE.PointLight(COPPER, 0, 8); rim.position.set(0, 1.2, 0); scene.add(rim);

  // ---- Board ----
  const world = new THREE.Group(); scene.add(world);
  const board = new THREE.Group(); world.add(board);
  const BW = 6, BD = 4, BT = 0.14;
  const edgeMat = new THREE.MeshStandardMaterial({ color: "#0e3127", roughness: 0.7 });
  const topMat = new THREE.MeshStandardMaterial({ map: boardTexture(), roughness: 0.55, metalness: 0.05 });
  board.add(new THREE.Mesh(new THREE.BoxGeometry(BW, BT, BD), [edgeMat, edgeMat, topMat, edgeMat, edgeMat, edgeMat]));

  // Chip (U1)
  const chip = new THREE.Group(); board.add(chip);
  const chipBody = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.16, 1.1), new THREE.MeshStandardMaterial({ color: "#1a1c1b", roughness: 0.45 }));
  chipBody.position.y = BT / 2 + 0.1; chip.add(chipBody);
  const pinMat = new THREE.MeshStandardMaterial({ color: "#c9ccc8", metalness: 0.9, roughness: 0.3 });
  const pinGeo = new THREE.BoxGeometry(0.05, 0.03, 0.14);
  for (let i = 0; i < 8; i++) {
    const o = -0.42 + i * 0.12;
    [[o, 0.62, 0], [o, -0.62, 0], [0.62, o, Math.PI / 2], [-0.62, o, Math.PI / 2]].forEach(([x, z, r]) => {
      const pin = new THREE.Mesh(pinGeo, pinMat); pin.position.set(x, BT / 2 + 0.04, z); pin.rotation.y = r; chip.add(pin);
    });
  }
  // chip marking
  const mc = document.createElement("canvas"); mc.width = 256; mc.height = 256;
  const mg = mc.getContext("2d"); mg.fillStyle = "#1a1c1b"; mg.fillRect(0, 0, 256, 256);
  mg.fillStyle = "#8d918e"; mg.font = "800 92px Archivo, sans-serif"; mg.fillText("SA", 60, 150);
  mg.font = "400 22px Archivo, sans-serif"; mg.fillText("2026 LAGOS", 64, 190);
  mg.beginPath(); mg.arc(36, 36, 10, 0, 7); mg.fill();
  const markTex = new THREE.CanvasTexture(mc); markTex.colorSpace = THREE.SRGBColorSpace;
  const mark = new THREE.Mesh(new THREE.PlaneGeometry(1.02, 1.02), new THREE.MeshStandardMaterial({ map: markTex, roughness: 0.5 }));
  mark.rotation.x = -Math.PI / 2; mark.position.y = BT / 2 + 0.181; chip.add(mark);

  // Traces: Manhattan paths from the chip's pins out toward the board edge
  const rand = rng(7);
  const traceMat = new THREE.MeshStandardMaterial({ color: COPPER, metalness: 0.85, roughness: 0.35, emissive: COPPER, emissiveIntensity: 0 });
  const padMat = new THREE.MeshStandardMaterial({ color: "#d7d9d4", metalness: 0.9, roughness: 0.25 });
  const y0 = BT / 2 + 0.006;
  const paths = [];
  const addSeg = (a, b) => {
    const len = a.distanceTo(b); if (len < 1e-3) return;
    const m = new THREE.Mesh(new THREE.BoxGeometry(len + 0.035, 0.012, 0.035), traceMat);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x);
    board.add(m);
  };
  for (let side = 0; side < 4; side++) {
    for (let i = 0; i < 8; i++) {
      if (rand() < 0.25) continue;
      const o = -0.42 + i * 0.12;
      const dir = [[0, 1], [0, -1], [1, 0], [-1, 0]][side];
      let p = new THREE.Vector3(dir[0] ? dir[0] * 0.7 : o, y0, dir[1] ? dir[1] * 0.7 : o);
      const pts = [p.clone()];
      let along = 0.25 + rand() * 0.6;
      p = p.clone().add(new THREE.Vector3(dir[0] * along, 0, dir[1] * along)); pts.push(p.clone());
      // 45° jog, then run out
      const jog = (rand() - 0.5) * 1.2;
      const perp = [dir[1], dir[0]];
      p = p.clone().add(new THREE.Vector3(dir[0] * Math.abs(jog) + perp[0] * jog, 0, dir[1] * Math.abs(jog) + perp[1] * jog)); pts.push(p.clone());
      const maxX = BW / 2 - 0.35, maxZ = BD / 2 - 0.35;
      const end = p.clone().add(new THREE.Vector3(dir[0] * 4, 0, dir[1] * 4));
      end.x = THREE.MathUtils.clamp(end.x, -maxX, maxX); end.z = THREE.MathUtils.clamp(end.z, -maxZ, maxZ);
      if (Math.abs(p.x) > maxX || Math.abs(p.z) > maxZ) continue;
      pts.push(end);
      for (let k = 0; k < pts.length - 1; k++) addSeg(pts[k], pts[k + 1]);
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 16), padMat);
      pad.position.copy(end); board.add(pad);
      paths.push(pts);
    }
  }
  // Path lengths for the moving signal pulses
  const pathData = paths.map((pts) => {
    const segs = []; let total = 0;
    for (let k = 0; k < pts.length - 1; k++) { const l = pts[k].distanceTo(pts[k + 1]); segs.push(l); total += l; }
    return { pts, segs, total };
  });
  const pointOn = (pd, d, out) => {
    for (let k = 0; k < pd.segs.length; k++) {
      if (d <= pd.segs[k]) return out.lerpVectors(pd.pts[k], pd.pts[k + 1], d / pd.segs[k]);
      d -= pd.segs[k];
    }
    return out.copy(pd.pts[pd.pts.length - 1]);
  };

  // Small parts: resistors and capacitors
  const resMat = new THREE.MeshStandardMaterial({ color: "#2a2724", roughness: 0.6 });
  const capMat = new THREE.MeshStandardMaterial({ color: "#b8a27a", roughness: 0.5 });
  for (let i = 0; i < 22; i++) {
    const x = (rand() - 0.5) * (BW - 0.8), z = (rand() - 0.5) * (BD - 0.8);
    if (Math.abs(x) < 1 && Math.abs(z) < 1) continue;
    const isCap = rand() < 0.35;
    const m = isCap
      ? new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.26, 20), capMat)
      : new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.1), resMat);
    m.position.set(x, BT / 2 + (isCap ? 0.13 : 0.03), z); m.rotation.y = rand() > 0.5 ? Math.PI / 2 : 0;
    board.add(m);
  }

  // Signal pulses
  const PULSES = paths.length * 2;
  const pulseMat = new THREE.MeshBasicMaterial({ color: "#ffd9a8", transparent: true, opacity: 0 });
  const pulses = new THREE.InstancedMesh(new THREE.SphereGeometry(0.035, 10, 10), pulseMat, PULSES);
  board.add(pulses);
  const pulseInfo = Array.from({ length: PULSES }, (_, i) => ({ path: i % paths.length, off: rand(), speed: 0.6 + rand() * 0.8 }));

  // ---- Project panels (rise out of the chip) ----
  const panels = projects.map((p) => {
    const grp = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.28, 0.05), new THREE.MeshStandardMaterial({ color: "#0d1613", roughness: 0.4, metalness: 0.3 }));
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.92, 1.2), new THREE.MeshBasicMaterial({ map: panelTexture(p), toneMapped: false }));
    screen.position.z = 0.027;
    const edge = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.02, 0.052), new THREE.MeshBasicMaterial({ color: p.color }));
    edge.position.y = -0.65;
    grp.add(frame, screen, edge);
    grp.userData.redraw = () => { screen.material.map.dispose(); screen.material.map = panelTexture(p); };
    world.add(grp);
    return grp;
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      panels.forEach((g) => g.userData.redraw());
      topMat.map.dispose(); topMat.map = boardTexture(); topMat.needsUpdate = true;
    });
  }

  // ---- Keyframes, one per story chapter ----
  // 0 intro, 1 origin, 2 shift, 3..(3+n-1) projects, then skills, contact
  const n = projects.length;
  const hidden = () => projects.map(() => ({ p: [0, 0.3, 0], r: [-Math.PI / 2, 0, 0], s: 0.02 }));
  // Projects flow upward like a conveyor: the current one faces you, the rest wait above and below
  const ring = (focus) => projects.map((_, j) => {
    const d = j - focus, ad = Math.abs(d);
    return { p: [0.35 * ad, 1.35 - d * 1.75, -ad * 1.6], r: [d * 0.32, -0.12 * ad, 0], s: ad === 0 ? 1.12 : 0.85 };
  });
  const keys = [];
  keys.push({ cam: [5.6, 5.0, 7.0], look: [-1.1, 0, 0.4], board: [0, 0, 0], ry: 0.55, chip: 0, glow: 0.12, panels: hidden() });
  // University: close on the chip, traces light up
  keys.push({ cam: [1.9, 1.9, 2.4], look: [0.5, 0, 0.3], board: [0, 0, 0], ry: 0.25, chip: 0, glow: 1, speed: 1, panels: hidden() });
  keys.push({
    cam: [0, 3.0, 6.4], look: [0, 0.9, 0], board: [0, 0, 0], ry: 0, chip: 0.25, glow: 0.9,
    panels: projects.map((_, j) => ({ p: [(j - (n - 1) / 2) * 0.14, 1.0 + j * 0.16, (j - (n - 1) / 2) * -0.05], r: [-0.25, (j - (n - 1) / 2) * 0.22, 0], s: 0.62 })),
  });
  for (let f = 0; f < n; f++) keys.push({ cam: [0, 1.7, 5.4], look: [0, 1.35, -0.6], board: [0, -1.35, -1.8], ry: 0, chip: 0, glow: 0.55, panels: ring(f) });
  keys.push({
    cam: [0, 4.2, 6.6], look: [0, 0.4, 0], board: [0, 0, 0], ry: 0, chip: 0, glow: 1,
    panels: projects.map((_, j) => ({ p: [(j - (n - 1) / 2) * 1.12, 0.95, -1.4], r: [-0.15, 0, 0], s: 0.5 })),
  });
  // Next: the chip lifts off the board, ready for the next level
  keys.push({ cam: [-2.2, 2.4, 3.8], look: [0, 0.7, 0], board: [0, 0, 0], ry: -0.2, chip: 0.7, glow: 0.85, speed: 1.8, panels: hidden() });
  keys.push({ cam: [0.01, 8.2, 3.2], look: [0, 0, 0], board: [0, 0, 0], ry: 0, chip: 0, glow: 1, panels: hidden() });

  // ---- Sizing ----
  let mobile = false;
  const resize = () => {
    const w = window.innerWidth, h = window.innerHeight;
    mobile = w < 820;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = mobile ? 50 : 38;
    // Shift the 3D scene to the right so the story text has room on the left
    if (!mobile) camera.setViewOffset(w, h, -w * 0.2, 0, w, h); else camera.setViewOffset(w, h, 0, h * 0.16, w, h);
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener("resize", resize);

  // ---- Loop ----
  let target = 0, current = 0, raf = 0, last = performance.now(), time = 0, phase = 0;
  const m4 = new THREE.Matrix4(), v = new THREE.Vector3(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3();
  const lookV = new THREE.Vector3();

  const frame = (now) => {
    const dt = Math.min((now - last) / 1000, 0.05); last = now; time += dt;
    current = reduced ? target : current + (target - current) * (1 - Math.pow(0.0025, dt));
    const i = Math.max(0, Math.min(keys.length - 2, Math.floor(current)));
    const t = ease(Math.max(0, Math.min(1, current - i)));
    const A = keys[i], B = keys[i + 1];

    const cam = lerpArr(A.cam, B.cam, t);
    camera.position.set(cam[0], cam[1], cam[2]);
    lookV.fromArray(lerpArr(A.look, B.look, t));
    camera.lookAt(lookV);

    const bp = lerpArr(A.board, B.board, t);
    board.position.set(bp[0], bp[1], bp[2]);
    const sway = reduced ? 0 : Math.sin(time * 0.35) * 0.04;
    board.rotation.y = lerp(A.ry, B.ry, t) + sway;
    chip.position.y = lerp(A.chip, B.chip, t);

    const glow = lerp(A.glow, B.glow, t);
    phase += dt * lerp(A.speed ?? 1, B.speed ?? 1, t);
    traceMat.emissiveIntensity = glow * 0.55;
    rim.intensity = glow * 6;
    pulseMat.opacity = reduced ? 0 : glow;
    for (let k = 0; k < PULSES; k++) {
      const pi = pulseInfo[k], pd = pathData[pi.path];
      const d = ((pi.off + phase * pi.speed * 0.25) % 1) * pd.total;
      pointOn(pd, d, v); v.y += 0.012;
      m4.compose(v, q.identity(), sc.setScalar(glow > 0.05 ? 1 : 0.001));
      pulses.setMatrixAt(k, m4);
    }
    pulses.instanceMatrix.needsUpdate = true;

    panels.forEach((g, j) => {
      const pa = A.panels[j], pb = B.panels[j];
      const p = lerpArr(pa.p, pb.p, t), r = lerpArr(pa.r, pb.r, t);
      const s = lerp(pa.s, pb.s, t);
      g.position.set(p[0], p[1], p[2]);
      g.rotation.copy(e.set(r[0], r[1], r[2]));
      if (!reduced) g.position.y += Math.sin(time * 0.8 + j) * 0.02 * s;
      g.scale.setScalar(mobile ? s * 0.78 : s);
      g.visible = s > 0.03;
    });

    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  return {
    setProgress: (p) => { target = p; },
    chapterCount: keys.length,
    dispose: () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); renderer.dispose(); },
  };
}
