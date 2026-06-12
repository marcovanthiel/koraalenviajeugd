/* ============================================================
 *  Variant B — OCAI-vlieger op diagonale assen
 *  Volgens CLAUDE.md: 4 diagonale assen vanuit het midden,
 *  ruitvormige gridlijnen 10/20/30/40/50 (schaal 0–60),
 *  kwadrantpanelen + buitenlabels FLEXIBEL/BEHEERSBAAR/INTERN/EXTERN.
 *  ============================================================ */
(function (global) {
  'use strict';

  const SCALE_MAX = 60;
  const GRID = [10, 20, 30, 40, 50];

  // Letter-mapping: A=Familie (linksboven), B=Adhocratie (rechtsboven),
  // C=Markt (rechtsonder), D=Hierarchie (linksonder)
  const DIR = { A:[-1, +1], B:[+1, +1], C:[+1, -1], D:[-1, -1] };

  function svgEl(name, attrs, parent) {
    const e = document.createElementNS('http://www.w3.org/2000/svg', name);
    for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, String(attrs[k]));
    if (parent) parent.appendChild(e);
    return e;
  }

  function asPolyPoints(profiel, cx, cy, R) {
    // Schaal: score/60 → fractie van radius R, gedeeld door sqrt(2)
    // zodat 60 op een diagonaal precies op afstand R van het midden zit.
    return ['A','B','C','D'].map(L => {
      const v = (profiel && profiel[L] != null ? profiel[L] : 0);
      const f = (v / SCALE_MAX) * R / Math.SQRT2;
      return (cx + DIR[L][0]*f) + ',' + (cy - DIR[L][1]*f);
    }).join(' ');
  }

  /**
   * Render een vlieger-diagram met (optioneel) twee polygonen per profiel.
   *
   * @param {HTMLElement} container
   * @param {Object} opts
   * @param {Array<{naam, kleur, nu, gewenst?}>} opts.profielen
   * @param {number} [opts.width=820]
   * @param {boolean} [opts.showLegend=true]
   */
  function renderVlieger(container, opts) {
    const W = opts.width || 820;
    const H = Math.round(W * 0.86);
    const pad = { l: 90, r: 64, t: 36, b: 80 };
    const innerW = W - pad.l - pad.r;
    const innerH = H - pad.t - pad.b;
    const cx = pad.l + innerW / 2;
    const cy = pad.t + innerH / 2;
    const R = Math.min(innerW, innerH) / 2 - 18;

    const svg = svgEl('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: `0 0 ${W} ${H}`,
      class: 'ocai-svg',
      role: 'img',
    });

    // ---- Kwadrant-panelen (zelfde stijl als variant A) ----
    const corners = [
      [pad.l,             pad.t,             innerW/2, innerH/2, '#D9E7F3', 'FAMILIE',    'mensgericht · informeel'],
      [pad.l + innerW/2,  pad.t,             innerW/2, innerH/2, '#D5E2EF', 'ADHOCRATIE', 'ondernemend · snel'],
      [pad.l,             pad.t + innerH/2,  innerW/2, innerH/2, '#E3ECF6', 'HIËRARCHIE', 'procedureel · geborgd'],
      [pad.l + innerW/2,  pad.t + innerH/2,  innerW/2, innerH/2, '#DDE7F2', 'MARKT',      'resultaat · prestatie'],
    ];
    for (const [x,y,w,h,col,nm,sub] of corners) {
      svgEl('rect', { x:x+4, y:y+4, width:w-8, height:h-8, rx:8, ry:8, fill: col, stroke:'none' }, svg);
      svgEl('text', { x:x+w/2, y:y+30, 'text-anchor':'middle', 'font-weight':'700', 'font-size':18, fill:'#15407A' }, svg).textContent = nm;
      svgEl('text', { x:x+w/2, y:y+50, 'text-anchor':'middle', 'font-size':12, fill:'#5A7691' }, svg).textContent = sub;
    }

    // ---- Buitenlabels FLEXIBEL / BEHEERSBAAR / INTERN / EXTERN ----
    svgEl('text', { x: cx, y: pad.t - 14, 'text-anchor':'middle', 'font-size':14, 'font-weight':'700', 'letter-spacing':2, fill:'#5A7691' }, svg).textContent = 'FLEXIBEL';
    svgEl('text', { x: cx, y: H - 20, 'text-anchor':'middle', 'font-size':14, 'font-weight':'700', 'letter-spacing':2, fill:'#5A7691' }, svg).textContent = 'BEHEERSBAAR';
    const tl = svgEl('text', { x: 26, y: cy, 'text-anchor':'middle', 'font-size':13, 'font-weight':'700', 'letter-spacing':1.5, fill:'#5A7691', transform: `rotate(-90 26 ${cy})` }, svg);
    tl.textContent = 'INTERN GERICHT';
    const tr = svgEl('text', { x: W - 26, y: cy, 'text-anchor':'middle', 'font-size':13, 'font-weight':'700', 'letter-spacing':1.5, fill:'#5A7691', transform: `rotate(90 ${W-26} ${cy})` }, svg);
    tr.textContent = 'EXTERN GERICHT';

    // ---- Ruitvormige gridlijnen 10..50 (schaal 0..60) ----
    for (const v of GRID) {
      const pts = asPolyPoints({A:v,B:v,C:v,D:v}, cx, cy, R);
      svgEl('polygon', { points: pts, fill:'none', stroke:'#B7C7D9', 'stroke-width': v===50 ? 1 : 0.7, 'stroke-dasharray': '3 4' }, svg);
      // Schaalcijfer onderaan elke ruit (op de C-as = rechtsonder hoek)
      const f = (v / SCALE_MAX) * R / Math.SQRT2;
      svgEl('text', { x: cx + f + 6, y: cy + f + 13, 'font-size':10, fill:'#7A91A7' }, svg).textContent = v;
    }

    // ---- Vier diagonale assen ----
    for (const L of ['A','B','C','D']) {
      const dx = DIR[L][0] * R / Math.SQRT2;
      const dy = -DIR[L][1] * R / Math.SQRT2;
      svgEl('line', {
        x1: cx, y1: cy, x2: cx + dx, y2: cy + dy,
        stroke: '#7A91A7', 'stroke-width': 1.2,
      }, svg);
    }

    // ---- Polygonen per profiel ----
    for (const pr of opts.profielen) {
      if (pr.nu) {
        svgEl('polygon', {
          points: asPolyPoints(pr.nu, cx, cy, R),
          fill: pr.kleur, 'fill-opacity': 0.13,
          stroke: pr.kleur, 'stroke-width': 2.5,
        }, svg);
      }
      if (pr.gewenst) {
        svgEl('polygon', {
          points: asPolyPoints(pr.gewenst, cx, cy, R),
          fill: 'none',
          stroke: pr.kleur, 'stroke-width': 2.5,
          'stroke-dasharray': '6 5',
        }, svg);
      }
    }

    // ---- Legenda onderaan ----
    if (opts.showLegend !== false) {
      let lx = pad.l, ly = H - 38;
      for (const pr of opts.profielen) {
        if (pr.nu) {
          svgEl('line', { x1: lx, y1: ly, x2: lx + 26, y2: ly, stroke: pr.kleur, 'stroke-width': 2.5 }, svg);
          const t = svgEl('text', { x: lx + 32, y: ly + 4, 'font-size': 12, fill: '#333' }, svg);
          t.textContent = pr.naam + ' — nu';
          lx += 36 + (pr.naam.length + 5) * 6.8 + 14;
        }
        if (pr.gewenst) {
          svgEl('line', { x1: lx, y1: ly, x2: lx + 26, y2: ly, stroke: pr.kleur, 'stroke-width': 2.5, 'stroke-dasharray': '6 5' }, svg);
          const t = svgEl('text', { x: lx + 32, y: ly + 4, 'font-size': 12, fill: '#333' }, svg);
          t.textContent = pr.naam + ' — gewenst';
          lx += 36 + (pr.naam.length + 11) * 6.8 + 14;
        }
      }
    }

    container.innerHTML = '';
    container.appendChild(svg);
  }

  /**
   * Variant B — TOTAALPLAAT met stippen op uitvergrote zwaartepunten.
   * Per CLAUDE.md: factor 3,2 uitvergroting, geen tekstlabels, geen
   * "gewenst richtbeeld"-lijn. Voetnoot moet de uitvergroting noemen.
   */
  function renderTotaalStippen(container, opts) {
    const W = opts.width || 820;
    const H = Math.round(W * 0.86);
    const pad = { l: 90, r: 64, t: 36, b: 80 };
    const innerW = W - pad.l - pad.r;
    const innerH = H - pad.t - pad.b;
    const cx = pad.l + innerW / 2;
    const cy = pad.t + innerH / 2;
    const R = Math.min(innerW, innerH) / 2 - 18;
    const STIP_FACTOR = 3.2;

    const svg = svgEl('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: `0 0 ${W} ${H}`,
      class: 'ocai-svg',
      role: 'img',
    });

    // Achtergrond identiek aan vlieger (kwadranten + assen + grid + buitenlabels)
    const corners = [
      [pad.l,             pad.t,             innerW/2, innerH/2, '#D9E7F3', 'FAMILIE',    'mensgericht · informeel'],
      [pad.l + innerW/2,  pad.t,             innerW/2, innerH/2, '#D5E2EF', 'ADHOCRATIE', 'ondernemend · snel'],
      [pad.l,             pad.t + innerH/2,  innerW/2, innerH/2, '#E3ECF6', 'HIËRARCHIE', 'procedureel · geborgd'],
      [pad.l + innerW/2,  pad.t + innerH/2,  innerW/2, innerH/2, '#DDE7F2', 'MARKT',      'resultaat · prestatie'],
    ];
    for (const [x,y,w,h,col,nm,sub] of corners) {
      svgEl('rect', { x:x+4, y:y+4, width:w-8, height:h-8, rx:8, ry:8, fill: col, stroke:'none' }, svg);
      svgEl('text', { x:x+w/2, y:y+30, 'text-anchor':'middle', 'font-weight':'700', 'font-size':18, fill:'#15407A' }, svg).textContent = nm;
      svgEl('text', { x:x+w/2, y:y+50, 'text-anchor':'middle', 'font-size':12, fill:'#5A7691' }, svg).textContent = sub;
    }
    svgEl('text', { x: cx, y: pad.t - 14, 'text-anchor':'middle', 'font-size':14, 'font-weight':'700', 'letter-spacing':2, fill:'#5A7691' }, svg).textContent = 'FLEXIBEL';
    svgEl('text', { x: cx, y: H - 20, 'text-anchor':'middle', 'font-size':14, 'font-weight':'700', 'letter-spacing':2, fill:'#5A7691' }, svg).textContent = 'BEHEERSBAAR';
    const tl = svgEl('text', { x: 26, y: cy, 'text-anchor':'middle', 'font-size':13, 'font-weight':'700', 'letter-spacing':1.5, fill:'#5A7691', transform: `rotate(-90 26 ${cy})` }, svg);
    tl.textContent = 'INTERN GERICHT';
    const tr = svgEl('text', { x: W - 26, y: cy, 'text-anchor':'middle', 'font-size':13, 'font-weight':'700', 'letter-spacing':1.5, fill:'#5A7691', transform: `rotate(90 ${W-26} ${cy})` }, svg);
    tr.textContent = 'EXTERN GERICHT';
    for (const v of GRID) {
      const pts = asPolyPoints({A:v,B:v,C:v,D:v}, cx, cy, R);
      svgEl('polygon', { points: pts, fill:'none', stroke:'#B7C7D9', 'stroke-width': v===50 ? 1 : 0.7, 'stroke-dasharray': '3 4' }, svg);
    }
    for (const L of ['A','B','C','D']) {
      const dx = DIR[L][0] * R / Math.SQRT2;
      const dy = -DIR[L][1] * R / Math.SQRT2;
      svgEl('line', { x1: cx, y1: cy, x2: cx + dx, y2: cy + dy, stroke:'#7A91A7', 'stroke-width': 1.2 }, svg);
    }

    // ---- Per organisatie: stip op uitvergroot zwaartepunt ----
    for (const pr of opts.profielen) {
      if (!pr.nu) continue;
      // Zwaartepunt = vector-som van de 4 punten / 4.
      // Schaal: score/60 * R/sqrt(2) per as, vector-sum dan delen door 4 voor centroïde.
      let sx = 0, sy = 0;
      for (const L of ['A','B','C','D']) {
        const v = pr.nu[L] / SCALE_MAX;
        sx += DIR[L][0] * v;
        sy += -DIR[L][1] * v;
      }
      const cx2 = cx + (sx / 4) * STIP_FACTOR * R / Math.SQRT2;
      const cy2 = cy + (sy / 4) * STIP_FACTOR * R / Math.SQRT2;
      svgEl('circle', { cx: cx2, cy: cy2, r: 14, fill: pr.kleur, stroke: '#FFF', 'stroke-width': 2 }, svg);
    }

    container.innerHTML = '';
    container.appendChild(svg);
  }

  global.OcaiVlieger = {
    render: renderVlieger,
    renderTotaalStippen: renderTotaalStippen,
  };
})(window);
