'use strict';
const CULTUUR_NAAM = { A:'Familie', B:'Adhocratie', C:'Markt', D:'Hiërarchie' };
const ORG_KLEUR  = { 'Koraal':'#0F4C97', 'Via Jeugd':'#4FAE32' };
const ORG_LABEL  = { 'Koraal':'K', 'Via Jeugd':'VJ' };

function getRef() {
  const u = new URL(location.href);
  return u.searchParams.get('ref') || '';
}

function fmtDatum(iso) {
  if (!iso) return '';
  return String(iso).slice(0, 16).replace('T', ' om ') + ' uur';
}

function fmtVerschil(d) {
  const r = Math.round(d * 10) / 10;
  const cls = r > 0 ? 'delta-plus' : (r < 0 ? 'delta-min' : '');
  const txt = (r > 0 ? '+' : '') + r;
  return `<span class="${cls}">${txt}</span>`;
}

async function laad() {
  const ref = getRef();
  if (!ref) {
    document.getElementById('meta').textContent = '';
    document.getElementById('leeg').style.display = '';
    document.getElementById('leeg-msg').textContent = 'Geen referentie meegegeven in de URL.';
    return;
  }
  const res = await fetch('/api/resultaat?ref=' + encodeURIComponent(ref));
  if (!res.ok) {
    document.getElementById('meta').textContent = '';
    document.getElementById('leeg').style.display = '';
    document.getElementById('leeg-msg').textContent = 'Resultaat niet gevonden (referentie ' + ref + ').';
    return;
  }
  const data = await res.json();
  if (!data.ok || !data.item) {
    document.getElementById('meta').textContent = '';
    document.getElementById('leeg').style.display = '';
    document.getElementById('leeg-msg').textContent = data.fout || 'Resultaat niet gevonden.';
    return;
  }
  render(data.item);
}

function render(item) {
  const kleur = ORG_KLEUR[item.organisatie] || '#004289';

  document.getElementById('meta').innerHTML =
    `Inzending voor <strong>${item.organisatie}</strong>` +
    (item.team ? ` — team <em>${escapeHtml(item.team)}</em>` : '') +
    ` · ingestuurd ${fmtDatum(item.tijdstip)}<br>Referentie ${item.ref}`;

  document.getElementById('sw-nu').style.background = kleur;
  document.getElementById('sw-gewenst').style.background =
    `repeating-linear-gradient(90deg, transparent 0 5px, ${kleur} 5px 11px)`;

  const n = item.profiel.nu, g = item.profiel.gewenst;
  const tb = document.getElementById('scores-body');
  tb.innerHTML = '';
  for (const L of ['A','B','C','D']) {
    tb.insertAdjacentHTML('beforeend',
      `<tr><td class="l">${CULTUUR_NAAM[L]}</td><td>${n[L]}</td><td>${g[L]}</td><td>${fmtVerschil(g[L]-n[L])}</td></tr>`);
  }

  OcaiVlieger.render(document.getElementById('grafiek'), {
    width: 880,
    profielen: [{
      naam: item.organisatie,
      kleur: kleur,
      nu: n,
      gewenst: g,
    }],
  });

  document.getElementById('inhoud').style.display = '';
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

document.addEventListener('DOMContentLoaded', () => {
  const printBtn = document.getElementById('print');
  if (printBtn) printBtn.addEventListener('click', () => window.print());
  laad();
});
