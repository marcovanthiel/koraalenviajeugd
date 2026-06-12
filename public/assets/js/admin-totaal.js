'use strict';
const STORAGE_KEY = 'ocai-admin-token';
const KORAAL_KLEUR = '#0F4C97';
const VJ_KLEUR     = '#4FAE32';

function token() {
  try { return sessionStorage.getItem(STORAGE_KEY) || ''; } catch(e) { return ''; }
}

async function laad() {
  const t = token();
  if (!t) {
    document.getElementById('meta').textContent = '';
    document.getElementById('leeg').style.display = '';
    document.getElementById('leeg-msg').innerHTML =
      'Geen admin-token gevonden. Ga eerst naar <a href="../">de admin-pagina</a> en log daar in.';
    return;
  }
  const res = await fetch('/api/resultaat?summary=1', {
    headers: { 'Authorization': 'Bearer ' + t },
  });
  if (res.status === 401) {
    document.getElementById('meta').textContent = '';
    document.getElementById('leeg').style.display = '';
    document.getElementById('leeg-msg').innerHTML =
      'Token niet (meer) geldig. Ga terug naar <a href="../">de admin-pagina</a> en log opnieuw in.';
    return;
  }
  if (!res.ok) {
    document.getElementById('meta').textContent = '';
    document.getElementById('leeg').style.display = '';
    document.getElementById('leeg-msg').textContent = 'Server-fout: ' + res.status;
    return;
  }
  const data = await res.json();
  if (!data.ok) {
    document.getElementById('meta').textContent = '';
    document.getElementById('leeg').style.display = '';
    document.getElementById('leeg-msg').textContent = data.fout || 'Onbekende fout.';
    return;
  }
  render(data);
}

function render(data) {
  const k  = data.Koraal;
  const vj = data['Via Jeugd'];

  document.getElementById('meta').innerHTML =
    `Op basis van <strong>${data.totaal.n}</strong> inzending(en) — ` +
    `Koraal: ${k.n}, Via Jeugd: ${vj.n}.`;
  document.getElementById('inhoud').style.display = '';
  document.getElementById('t-koraal-h').textContent = `Koraal (n=${k.n})`;
  document.getElementById('t-vj-h').textContent     = `Via Jeugd (n=${vj.n})`;

  const stippenProfielen = [];
  if (k.n > 0)  stippenProfielen.push({ naam:'Koraal',    kleur: KORAAL_KLEUR, nu: k.nu });
  if (vj.n > 0) stippenProfielen.push({ naam:'Via Jeugd', kleur: VJ_KLEUR,     nu: vj.nu });
  if (stippenProfielen.length > 0) {
    OcaiVlieger.renderTotaalStippen(document.getElementById('grafiek-totaal'), {
      width: 880,
      profielen: stippenProfielen,
    });
  } else {
    document.getElementById('grafiek-totaal').innerHTML =
      '<p class="geen">Nog geen inzendingen om te tonen.</p>';
  }

  if (k.n > 0) {
    OcaiVlieger.render(document.getElementById('grafiek-koraal'), {
      width: 540,
      profielen: [{ naam:'Koraal', kleur: KORAAL_KLEUR, nu: k.nu, gewenst: k.gewenst }],
    });
  } else {
    document.getElementById('grafiek-koraal').innerHTML =
      '<p class="geen">Nog geen inzendingen voor Koraal.</p>';
  }
  if (vj.n > 0) {
    OcaiVlieger.render(document.getElementById('grafiek-vj'), {
      width: 540,
      profielen: [{ naam:'Via Jeugd', kleur: VJ_KLEUR, nu: vj.nu, gewenst: vj.gewenst }],
    });
  } else {
    document.getElementById('grafiek-vj').innerHTML =
      '<p class="geen">Nog geen inzendingen voor Via Jeugd.</p>';
  }

  const body = document.getElementById('agg-body');
  body.innerHTML = '';
  for (const grp of ['Koraal','Via Jeugd']) {
    const a = data[grp];
    if (!a.n) continue;
    const n = a.nu, g = a.gewenst;
    body.insertAdjacentHTML('beforeend',
      `<tr><td class="l"><b>${grp}</b> (${a.n})</td>
        <td>${n.A}</td><td>${n.B}</td><td>${n.C}</td><td>${n.D}</td>
        <td>${g.A}</td><td>${g.B}</td><td>${g.C}</td><td>${g.D}</td></tr>`);
  }
}

document.addEventListener('DOMContentLoaded', laad);
