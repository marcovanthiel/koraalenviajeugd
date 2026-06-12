'use strict';
const STORAGE_KEY = 'ocai-admin-token';

function esc(s){ return String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

function token() {
  try { return sessionStorage.getItem(STORAGE_KEY) || ''; } catch(e) { return ''; }
}

function vlagje(land) {
  if (!land || typeof land !== 'string' || land.length !== 2) return '';
  const A = 0x1F1E6 - 'A'.charCodeAt(0);
  return String.fromCodePoint(land.charCodeAt(0) + A) + String.fromCodePoint(land.charCodeAt(1) + A);
}

async function laad() {
  const t = token();
  if (!t) {
    document.getElementById('meta').textContent = '';
    document.getElementById('leeg').style.display = '';
    document.getElementById('leeg-msg').innerHTML =
      'Geen admin-token gevonden. Ga eerst naar <a href="../">de beheerpagina</a> en log daar in.';
    return;
  }
  const dagen = document.getElementById('periode').value;
  const res = await fetch('/api/admin/analytics?dagen=' + encodeURIComponent(dagen), {
    headers: { 'Authorization': 'Bearer ' + t },
  });
  if (res.status === 401) {
    document.getElementById('meta').textContent = '';
    document.getElementById('leeg').style.display = '';
    document.getElementById('leeg-msg').innerHTML =
      'Token niet (meer) geldig. Ga terug naar <a href="../">de beheerpagina</a> en log opnieuw in.';
    return;
  }
  if (!res.ok) {
    document.getElementById('meta').textContent = 'Server-fout: ' + res.status;
    return;
  }
  const data = await res.json();
  if (!data.ok) {
    document.getElementById('meta').textContent = data.fout || 'Onbekende fout.';
    return;
  }
  render(data);
}

function bargrafiek(rijen) {
  if (!rijen.length) return '<p class="meta">Nog geen bezoeken in deze periode.</p>';
  const W = Math.max(640, rijen.length * 22);
  const H = 220, pad = 30;
  const maxN = Math.max(1, ...rijen.map(r => r.bezoeken));
  const barW = (W - pad * 2) / rijen.length;
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,Arial,sans-serif">`;
  // grid + y-as
  for (let i = 0; i <= 4; i++) {
    const y = H - pad - ((H - pad * 2) / 4) * i;
    const v = Math.round((maxN / 4) * i);
    svg += `<line x1="${pad}" y1="${y}" x2="${W - pad / 2}" y2="${y}" stroke="#E5EDF5"/>`;
    svg += `<text x="${pad - 6}" y="${y + 4}" text-anchor="end" font-size="10" fill="#888">${v}</text>`;
  }
  rijen.forEach((r, i) => {
    const x = pad + i * barW;
    const hv = ((H - pad * 2) * r.bezoeken) / maxN;
    const hu = ((H - pad * 2) * r.uniek) / maxN;
    svg += `<rect x="${x + 2}" y="${H - pad - hv}" width="${barW - 4}" height="${hv}" fill="#004289" rx="2"/>`;
    svg += `<rect x="${x + 2}" y="${H - pad - hu}" width="${barW - 4}" height="${hu}" fill="#009DDF" opacity=".85" rx="2"/>`;
    if (rijen.length <= 60 && i % Math.ceil(rijen.length / 15) === 0) {
      svg += `<text x="${x + barW / 2}" y="${H - pad + 14}" text-anchor="middle" font-size="10" fill="#666">${r.dag.slice(5)}</text>`;
    }
  });
  svg += `<g font-size="11">
    <rect x="${W - 200}" y="6" width="12" height="12" fill="#004289" rx="2"/>
    <text x="${W - 184}" y="16" fill="#333">pageviews</text>
    <rect x="${W - 110}" y="6" width="12" height="12" fill="#009DDF" opacity=".85" rx="2"/>
    <text x="${W - 94}" y="16" fill="#333">uniek</text>
  </g>`;
  return svg + '</svg>';
}

function render(data) {
  document.getElementById('inhoud').style.display = '';
  document.getElementById('leeg').style.display = 'none';
  document.getElementById('meta').innerHTML =
    `Periode: <strong>laatste ${data.periode_dagen} dagen</strong>.`;

  document.getElementById('n-bezoeken').textContent = data.totaal.bezoeken || 0;
  document.getElementById('n-uniek').textContent = data.totaal.uniek || 0;
  document.getElementById('n-landen').textContent =
    (data.landen || []).filter(l => l.k).length;

  document.getElementById('grafiek-dag').innerHTML = bargrafiek(data.per_dag || []);

  const fill = (id, rijen, formatter) => {
    const tb = document.getElementById(id);
    if (!rijen || rijen.length === 0) {
      tb.innerHTML = '<tr><td colspan="2" class="meta">Geen data.</td></tr>';
      return;
    }
    tb.innerHTML = rijen.map(r => formatter(r)).join('');
  };

  fill('tb-paths', data.top_paths, r =>
    `<tr><td class="l">${esc(r.k ?? '(onbekend)')}</td><td>${r.n}</td></tr>`);

  fill('tb-landen', data.landen, r => {
    const v = vlagje(r.k);
    const naam = r.k ? (v ? v + ' ' + esc(r.k) : esc(r.k)) : '(onbekend)';
    return `<tr><td class="l">${naam}</td><td>${r.n}</td></tr>`;
  });

  fill('tb-steden', data.steden, r =>
    `<tr><td class="l">${esc(r.k)}</td><td>${r.n}</td></tr>`);

  fill('tb-refs', data.referrers, r =>
    `<tr><td class="l">${esc(r.k)}</td><td>${r.n}</td></tr>`);

  const lz = document.getElementById('tb-laatste');
  const last = data.laatste || [];
  if (last.length === 0) {
    lz.innerHTML = '<tr><td colspan="4" class="meta">Geen bezoeken.</td></tr>';
  } else {
    lz.innerHTML = last.map(r => {
      const loc = [r.city, r.country].filter(Boolean).join(', ');
      const tijd = String(r.ts || '').slice(0, 16).replace('T', ' ');
      return `<tr>
        <td class="l">${esc(tijd)}</td>
        <td class="l">${esc(r.path)}</td>
        <td class="l">${esc(loc || '—')}</td>
        <td class="l">${esc(r.referrer_host || '—')}</td>
      </tr>`;
    }).join('');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('periode').addEventListener('change', laad);
  laad();
});
