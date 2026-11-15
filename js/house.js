/* Isometric house that is built stage by stage.
   House.draw(svg, { W, L, floors, p: [p1..p6] }) — each p in 0..1:
   1 foundation (rebar grid, then concrete), 2 walls (brick courses), 3 roof (rafters, insulation, sheets),
   4 utilities (pipes and cables), 5 plaster and paint, 6 door, lights, garden.
   Returns anchor points (in viewBox units) for the floating labels. */
window.House = (function () {
  const C = Math.cos(Math.PI / 6), S = 0.5;
  const VW = 800, VH = 620;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  let uid = 0;

  function draw(svg, o) {
    const W = o.W, L = o.L, F = o.floors || 1, FH = 3;
    const Ht = F * FH, Rz = (L / 2 + 0.5) * 0.62, ze = Ht - 0.3, zr = Ht + Rz;
    const p = (o.p || [1, 1, 1, 1, 1, 1]).map(clamp01);
    function clamp01(v) { return clamp(v, 0, 1); }
    // fit the whole finished scene (ground plot + roof ridge) into the viewBox, so the scale never jumps between stages
    const P0 = (x, y, z) => [(x - y) * C, (x + y) * S - z];
    const box = [[-2, -2, 0], [W + 2, -2, 0], [W + 2, L + 2, 0], [-2, L + 2, 0], [-0.4, L / 2, 0.35 + zr], [W + 0.4, L / 2, 0.35 + zr]].map((q) => P0(...q));
    const bx0 = Math.min(...box.map((q) => q[0])), bx1 = Math.max(...box.map((q) => q[0]));
    const by0 = Math.min(...box.map((q) => q[1])), by1 = Math.max(...box.map((q) => q[1]));
    const k = (o.fixedK) || Math.min((VW - 40) / (bx1 - bx0), (VH - 30) / (by1 - by0));
    const ox = VW / 2 - ((bx0 + bx1) / 2) * k, oy = VH / 2 - ((by0 + by1) / 2) * k;
    const P = (x, y, z) => [ox + (x - y) * C * k, oy + (x + y) * S * k - z * k];
    const pts = (arr) => arr.map((q) => P(q[0], q[1], q[2]).map((n) => n.toFixed(1)).join(',')).join(' ');
    const poly = (arr, attrs) => `<polygon points="${pts(arr)}" ${attrs || ''}/>`;
    const line = (a, b, attrs) => { const A = P(...a), B = P(...b); return `<line x1="${A[0].toFixed(1)}" y1="${A[1].toFixed(1)}" x2="${B[0].toFixed(1)}" y2="${B[1].toFixed(1)}" ${attrs || ''}/>`; };
    const id = 'h' + (++uid);
    // pattern transforms: (u along face, v down) -> screen
    const mR = (x0) => { const o0 = P(x0, L, 0); return `matrix(${C * k} ${-S * k} 0 ${k} ${o0[0]} ${o0[1]})`; };   // face x=const, u = L - y
    const mL = () => { const o0 = P(0, L, 0); return `matrix(${C * k} ${S * k} 0 ${k} ${o0[0]} ${o0[1]})`; };        // face y=L, u = x
    const mB = () => { const o0 = P(0, 0, 0); return `matrix(${C * k} ${S * k} 0 ${k} ${o0[0]} ${o0[1]})`; };        // face y=0
    const mX0 = () => { const o0 = P(0, L, 0); return `matrix(${C * k} ${-S * k} 0 ${k} ${o0[0]} ${o0[1]})`; };     // face x=0
    const brickPat = (pid, tf, fill, joint) => `<pattern id="${pid}" patternUnits="userSpaceOnUse" width="0.52" height="0.16" patternTransform="${tf}">
      <rect width="0.52" height="0.16" fill="${fill}"/><path d="M0 0H0.52M0 0.08H0.52M0 0V0.08M0.26 0V0.08M0.13 0.08V0.16M0.39 0.08V0.16" stroke="${joint}" stroke-width="0.014" fill="none"/></pattern>`;

    let out = `<defs>
      ${brickPat(id + 'bR', mR(W), '#c9653d', '#ecdccb')}
      ${brickPat(id + 'bL', mL(), '#a9502f', '#d9c3ae')}
      ${brickPat(id + 'bB', mB(), '#6f3622', '#8e5b45')}
      ${brickPat(id + 'bX', mX0(), '#5f2e1d', '#7e4f3c')}
      <radialGradient id="${id}glow"><stop offset="0" stop-color="#ffd27a" stop-opacity=".9"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd4ff" stop-opacity=".55"/><stop offset="1" stop-color="#1b2a3a" stop-opacity=".9"/></linearGradient>
      <filter id="${id}blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
    </defs>`;

    /* ---------- ground ---------- */
    const g0 = -2, gx = W + 2, gy = L + 2;
    out += `<ellipse cx="${P(W / 2, L / 2, 0)[0]}" cy="${P(W / 2, L / 2, 0)[1] + 6}" rx="${(W + L) * C * k * 0.62}" ry="${(W + L) * S * k * 0.62}" fill="#000" opacity=".35" filter="url(#${id}blur)"/>`;
    out += poly([[g0, g0, 0], [gx, g0, 0], [gx, gy, 0], [g0, gy, 0]], 'fill="var(--h-ground, #151920)" stroke="var(--h-grid, #262c37)" stroke-width="1"');
    let grid = '';
    for (let x = Math.ceil(g0); x <= gx; x++) grid += line([x, g0, 0], [x, gy, 0]);
    for (let y = Math.ceil(g0); y <= gy; y++) grid += line([g0, y, 0], [gx, y, 0]);
    out += `<g stroke="var(--h-grid, #262c37)" stroke-width=".7" opacity=".8">${grid}</g>`;
    // site outline (pegs and string) before anything is built
    const outl = 1 - ease(seg(p[0], 0, 0.3));
    if (outl > 0) out += `<g opacity="${outl}">${poly([[0, 0, 0], [W, 0, 0], [W, L, 0], [0, L, 0]], 'fill="none" stroke="#d4f53c" stroke-width="1.6" stroke-dasharray="6 5"')}</g>`;

    /* ---------- 1 foundation ---------- */
    const reb = ease(seg(p[0], 0, 0.55)), pour = ease(seg(p[0], 0.45, 1));
    const fz = 0.35, fo = 0.25;
    const fx0 = -fo, fx1 = W + fo, fy0 = -fo, fy1 = L + fo;
    if (reb > 0 && pour < 1) {
      let r = '';
      for (let x = fx0 + 0.25; x < fx1; x += 0.5) r += `<path d="M${P(x, fy0, fz * 0.6).join(' ')}L${P(x, fy1, fz * 0.6).join(' ')}" pathLength="1"/>`;
      for (let y = fy0 + 0.25; y < fy1; y += 0.5) r += `<path d="M${P(fx0, y, fz * 0.6).join(' ')}L${P(fx1, y, fz * 0.6).join(' ')}" pathLength="1"/>`;
      out += `<g fill="none" stroke="#7d8794" stroke-width="1.1" stroke-dasharray="1" stroke-dashoffset="${1 - reb}" opacity="${1 - pour * 0.9}">${r}</g>`;
    }
    if (pour > 0) {
      const z = fz * pour;
      out += poly([[fx0, fy1, 0], [fx1, fy1, 0], [fx1, fy1, z], [fx0, fy1, z]], 'fill="#868b91"');
      out += poly([[fx1, fy0, 0], [fx1, fy1, 0], [fx1, fy1, z], [fx1, fy0, z]], 'fill="#9ea3a8"');
      out += poly([[fx0, fy0, z], [fx1, fy0, z], [fx1, fy1, z], [fx0, fy1, z]], `fill="#b8bcc0" opacity="${0.35 + 0.65 * pour}"`);
    }

    /* ---------- 2 walls ---------- */
    const wallP = seg(p[1], 0, 1);
    const course = 0.16;
    let h = Math.floor((Ht * ease(wallP)) / course) * course;
    if (wallP >= 1) h = Ht;
    const base = fz;
    const zt = base + h;
    const plaster = ease(seg(p[4], 0, 1));
    const xray = ease(seg(p[3], 0, 0.3)) * (1 - plaster);
    const T = 0.25;
    // windows/door layout in face coordinates (u along face, z from base)
    const winsR = [], winsL = [];
    for (let f = 0; f < F; f++) {
      [0.22, 0.62].forEach((u) => winsR.push({ u: L * u, w: Math.min(1.4, L * 0.18), z: f * FH + 0.9, h: 1.3 }));
      [0.12, 0.7].forEach((u) => winsL.push({ u: W * u, w: Math.min(1.5, W * 0.16), z: f * FH + 0.9, h: 1.3 }));
    }
    const door = { u: W * 0.42, w: 1.0, z: 0, h: 2.1 };
    if (h > 0) {
      // inner faces of the back walls (visible while there is no roof yet)
      out += poly([[0, 0, base], [W, 0, base], [W, 0, zt], [0, 0, zt]], `fill="url(#${id}bB)"`);
      out += poly([[0, 0, base], [0, L, base], [0, L, zt], [0, 0, zt]], `fill="url(#${id}bX)"`);
      // floor slab of the upper storey
      for (let f = 1; f < F; f++) if (h > f * FH) out += poly([[T, T, base + f * FH], [W - T, T, base + f * FH], [W - T, L - T, base + f * FH], [T, L - T, base + f * FH]], 'fill="#8d9298" opacity=".9"');
      // front faces
      out += poly([[0, L, base], [W, L, base], [W, L, zt], [0, L, zt]], `fill="url(#${id}bL)"`);
      out += poly([[W, 0, base], [W, L, base], [W, L, zt], [W, 0, zt]], `fill="url(#${id}bR)"`);
      // plaster and paint
      if (plaster > 0) {
        out += poly([[0, L, base], [W, L, base], [W, L, zt], [0, L, zt]], `fill="#d9d2c4" opacity="${plaster}"`);
        out += poly([[W, 0, base], [W, L, base], [W, L, zt], [W, 0, zt]], `fill="#efe9dd" opacity="${plaster}"`);
        out += poly([[0, L, base], [W, L, base], [W, L, base + 0.5], [0, L, base + 0.5]], `fill="#6d6a64" opacity="${plaster}"`);
        out += poly([[W, 0, base], [W, L, base], [W, L, base + 0.5], [W, 0, base + 0.5]], `fill="#7d7a73" opacity="${plaster}"`);
      }
      if (xray > 0) {
        out += poly([[0, L, base], [W, L, base], [W, L, zt], [0, L, zt]], `fill="#0b0e13" opacity="${0.55 * xray}"`);
        out += poly([[W, 0, base], [W, L, base], [W, L, zt], [W, 0, zt]], `fill="#0b0e13" opacity="${0.5 * xray}"`);
      }
      // openings (clipped to current wall height)
      const light = ease(seg(p[5], 0.3, 1));
      const openR = (o) => { const z1 = Math.min(o.z + o.h, h); if (z1 <= o.z + 0.05) return ''; const y0 = L - o.u, y1 = L - o.u - o.w;
        return poly([[W, y0, base + o.z], [W, y1, base + o.z], [W, y1, base + z1], [W, y0, base + z1]], `fill="${plaster > 0.5 ? `url(#${id}glass)` : '#0d1015'}"`) +
          (light > 0 ? poly([[W, y0, base + o.z], [W, y1, base + o.z], [W, y1, base + z1], [W, y0, base + z1]], `fill="#ffcf73" opacity="${0.85 * light}"`) : '') +
          (plaster > 0.5 ? poly([[W, y0, base + o.z - 0.08], [W, y1 - 0.1, base + o.z - 0.08], [W, y1 - 0.1, base + o.z], [W, y0, base + o.z]], `fill="#c9c2b4" opacity="${plaster}"`) : ''); };
      const openL = (o, isDoor) => { const z1 = Math.min(o.z + o.h, h); if (z1 <= o.z + 0.05) return ''; const x0 = o.u, x1 = o.u + o.w;
        let s = poly([[x0, L, base + o.z], [x1, L, base + o.z], [x1, L, base + z1], [x0, L, base + z1]], `fill="${isDoor ? '#0d1015' : plaster > 0.5 ? `url(#${id}glass)` : '#0d1015'}"`);
        if (!isDoor && light > 0) s += poly([[x0, L, base + o.z], [x1, L, base + o.z], [x1, L, base + z1], [x0, L, base + z1]], `fill="#f5c160" opacity="${0.8 * light}"`);
        return s; };
      out += winsR.map(openR).join('') + winsL.map((o) => openL(o)).join('') + openL(door, true);
      // door leaf
      const dp = ease(seg(p[5], 0, 0.5));
      if (dp > 0 && h >= door.h) {
        const x0 = door.u + 0.06, x1 = door.u + door.w - 0.06, zz = base + door.h - 0.06;
        out += `<g opacity="${dp}">${poly([[x0, L + 0.02, base], [x1, L + 0.02, base], [x1, L + 0.02, zz], [x0, L + 0.02, zz]], 'fill="#7a5134"')}
          ${poly([[x0 + 0.12, L + 0.03, base + 0.2], [x1 - 0.12, L + 0.03, base + 0.2], [x1 - 0.12, L + 0.03, zz - 0.2], [x0 + 0.12, L + 0.03, zz - 0.2]], 'fill="none" stroke="#5d3c25" stroke-width="1.2"')}
          ${(() => { const q = P(x1 - 0.18, L + 0.04, base + 1.0); return `<circle cx="${q[0]}" cy="${q[1]}" r="2.2" fill="#d4f53c"/>`; })()}</g>`;
        if (light > 0) { const q = P(door.u + door.w + 0.35, L + 0.05, base + 2.3); out += `<circle cx="${q[0]}" cy="${q[1]}" r="${26 * light}" fill="url(#${id}glow)"/><circle cx="${q[0]}" cy="${q[1]}" r="3" fill="#ffe2a6" opacity="${light}"/>`; }
      }
      // wall top rim
      if (h < Ht + 0.01) {
        const rimC = '#e3a283';
        out += poly([[0, 0, zt], [W, 0, zt], [W, T, zt], [0, T, zt]], `fill="${rimC}"`);
        out += poly([[0, 0, zt], [T, 0, zt], [T, L, zt], [0, L, zt]], `fill="${rimC}"`);
        out += poly([[0, L - T, zt], [W, L - T, zt], [W, L, zt], [0, L, zt]], `fill="${rimC}"`);
        out += poly([[W - T, 0, zt], [W, 0, zt], [W, L, zt], [W - T, L, zt]], `fill="${rimC}"`);
      }
    }

    /* ---------- 4 utilities (drawn on the walls, under the roof) ---------- */
    const util = ease(seg(p[3], 0, 1));
    if (util > 0 && h >= Ht - 0.01) {
      const pipe = [[W + 0.02, L - 0.3, base + 0.35], [W + 0.02, L * 0.45, base + 0.35], [W + 0.02, L * 0.45, base + Ht - 0.6], [W + 0.02, L * 0.12, base + Ht - 0.6]];
      const pipe2 = [[W + 0.02, L * 0.8, base + 0.35], [W + 0.02, L * 0.8, base + Math.min(Ht - 0.4, 2.6)]];
      const cab = [[0.3, L + 0.02, base + Ht - 0.45], [W - 0.3, L + 0.02, base + Ht - 0.45]];
      const drops = [0.25, 0.55, 0.85].map((u) => [[W * u, L + 0.02, base + Ht - 0.45], [W * u, L + 0.02, base + 0.4]]);
      const path = (arr) => `<path d="M${arr.map((q) => P(...q).map((n) => n.toFixed(1)).join(' ')).join('L')}" pathLength="1"/>`;
      const fade = 1 - plaster;
      out += `<g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1" stroke-dashoffset="${1 - util}" opacity="${0.25 + 0.75 * fade}">
        <g stroke="#5ad1ff" stroke-width="3">${path(pipe)}${path(pipe2)}</g>
        <g stroke="#d4f53c" stroke-width="2">${path(cab)}${drops.map(path).join('')}</g></g>`;
      if (util > 0.95 && fade > 0) out += `<g opacity="${fade}">${drops.map((d) => { const q = P(...d[1]); return `<rect x="${q[0] - 3}" y="${q[1] - 3}" width="6" height="6" rx="1" fill="#d4f53c"/>`; }).join('')}</g>`;
    }

    /* ---------- 3 roof ---------- */
    const raft = ease(seg(p[2], 0, 0.4)), wool = ease(seg(p[2], 0.35, 0.65)), sheet = ease(seg(p[2], 0.6, 1));
    if (p[2] > 0 && h >= Ht - 0.01) {
      const zb = base + Ht, zR = base + zr, zE = base + ze;
      // gable (x = W) grows with the rafters
      const gz = zb + (zR - zb) * raft;
      const gw = (L / 2) * raft;
      out += poly([[W, L / 2 - gw, zb], [W, L / 2 + gw, zb], [W, L / 2, gz]], `fill="url(#${id}bR)"`);
      if (plaster > 0) out += poly([[W, L / 2 - gw, zb], [W, L / 2 + gw, zb], [W, L / 2, gz]], `fill="#efe9dd" opacity="${plaster}"`);
      const xs = []; for (let x = -0.4; x <= W + 0.41; x += 0.6) xs.push(x);
      const yE1 = L + 0.5, yE0 = -0.5, yM = L / 2;
      // back plane then front plane
      const plane = (front) => {
        const yE = front ? yE1 : yE0;
        let s = '';
        // rafters
        s += `<g stroke="#c89b62" stroke-width="2" fill="none" stroke-dasharray="1" stroke-dashoffset="${1 - raft}">` + xs.map((x) => `<path d="M${P(x, yM, zR).join(' ')}L${P(x, yE, zE).join(' ')}" pathLength="1"/>`).join('') + `</g>`;
        if (front) s += line([-0.4, yM, zR], [W + 0.4, yM, zR], `stroke="#d9ad73" stroke-width="2.6" opacity="${raft}"`);
        // insulation between rafters
        if (wool > 0) s += poly([[-0.4, yM, zR], [W + 0.4, yM, zR], [W + 0.4, yE, zE], [-0.4, yE, zE]], `fill="#e3c66b" opacity="${0.55 * wool * (1 - sheet * 0.9)}"`);
        // roof sheets slide from ridge to eave
        if (sheet > 0) {
          const yS = yM + (yE - yM) * sheet, zS = zR + (zE - zR) * sheet;
          s += poly([[-0.4, yM, zR], [W + 0.4, yM, zR], [W + 0.4, yS, zS], [-0.4, yS, zS]], `fill="${front ? '#8f3427' : '#a8402f'}"`);
          let ribs = '';
          for (let x = -0.4; x <= W + 0.4; x += 0.35) ribs += line([x, yM, zR], [x, yS, zS]);
          const steps = Math.floor(Math.abs(yS - yM) / 0.35);
          for (let i = 1; i <= steps; i++) { const t = (i * 0.35) / Math.abs(yE - yM); ribs += line([-0.4, yM + (yE - yM) * t, zR + (zE - zR) * t], [W + 0.4, yM + (yE - yM) * t, zR + (zE - zR) * t]); }
          s += `<g stroke="${front ? '#6e251b' : '#86301f'}" stroke-width=".9">${ribs}</g>`;
        }
        return s;
      };
      out += plane(false) + plane(true);
      // gable edge (fascia) on the right
      if (sheet > 0.98) {
        out += poly([[W + 0.4, yM, zR], [W + 0.4, yE1, zE], [W + 0.4, yE1, zE - 0.2], [W + 0.4, yM, zR - 0.2]], 'fill="#5a1d15"');
        out += poly([[W + 0.4, yM, zR], [W + 0.4, yE0, zE], [W + 0.4, yE0, zE - 0.2], [W + 0.4, yM, zR - 0.2]], 'fill="#6b2219"');
      }
    }

    /* ---------- 6 garden ---------- */
    const gar = ease(seg(p[5], 0.4, 1));
    if (gar > 0) {
      const bush = (x, y, r) => { const q = P(x, y, 0); return `<circle cx="${q[0]}" cy="${q[1] - r * gar}" r="${r * gar}" fill="#2f5d3a"/><circle cx="${q[0] - r * 0.3}" cy="${q[1] - r * 1.2 * gar}" r="${r * 0.6 * gar}" fill="#3e7a4b"/>`; };
      const path = poly([[door.u, L + 0.3, 0.01], [door.u + door.w, L + 0.3, 0.01], [door.u + door.w + 0.2, L + 2, 0.01], [door.u - 0.2, L + 2, 0.01]], `fill="#3a3f48" opacity="${gar}"`);
      const tree = (x, y) => { const q = P(x, y, 0); const t = P(x, y, 2.2 * gar); return `<line x1="${q[0]}" y1="${q[1]}" x2="${t[0]}" y2="${t[1]}" stroke="#5b4030" stroke-width="${0.22 * k}"/><circle cx="${t[0]}" cy="${t[1] - 0.5 * k * gar}" r="${1.15 * k * gar}" fill="#2c5737"/><circle cx="${t[0] - 0.35 * k}" cy="${t[1] - 0.9 * k * gar}" r="${0.7 * k * gar}" fill="#3b7348"/>`; };
      out += path + tree(W * 0.8, L + 1.5) + bush(W + 1.1, L + 0.9, 0.85 * k) + bush(W * 0.12, L + 1.3, 0.7 * k) + bush(W + 1.25, L * 0.35, 0.6 * k);
    }

    svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
    svg.innerHTML = out;
    // label anchors in viewBox units
    const A = (x, y, z) => { const q = P(x, y, z); return { x: q[0] / VW * 100, y: q[1] / VH * 100 }; };
    return {
      1: A(W * 0.85, L + 0.25, 0.35), 2: A(W, L * 0.75, base + Ht * 0.45), 3: A(W * 0.55, L * 0.75, base + (ze + zr) / 2),
      4: A(W, L * 0.45, base + Ht - 0.6), 5: A(W * 0.25, L, base + Ht * 0.6), 6: A(door.u + door.w / 2, L, base + 1.2)
    };
  }
  return { draw, VW, VH };
})();
