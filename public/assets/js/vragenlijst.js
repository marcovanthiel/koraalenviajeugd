'use strict';

const DIMS = [
 ["Dominante kenmerken", [
  "De organisatie is heel persoonlijk, als een grote familie; mensen delen veel met elkaar.",
  "De organisatie is dynamisch en ondernemend; mensen durven hun nek uit te steken en pakken kansen.",
  "De organisatie is resultaatgericht; het werk afkrijgen telt; mensen zijn prestatiegericht.",
  "De organisatie is beheerst en gestructureerd; formele procedures bepalen in hoge mate het handelen."]],
 ["De leiding van de organisatie", [
  "De leiding wordt gezien als mentor en coach: faciliteren, ondersteunen en zorgen voor mensen.",
  "De leiding staat voor ondernemerschap, vernieuwing en het durven nemen van risico's.",
  "De leiding is no-nonsense, ambitieus en stuurt scherp op resultaten.",
  "De leiding coördineert en organiseert en zorgt dat processen soepel en voorspelbaar verlopen."]],
 ["Omgang met medewerkers", [
  "De stijl kenmerkt zich door teamwerk, consensus en participatie.",
  "De stijl kenmerkt zich door ruimte voor eigen initiatief, vrijheid en eigenheid.",
  "De stijl kenmerkt zich door hoge eisen, prestatiegerichtheid en onderlinge wedijver.",
  "De stijl kenmerkt zich door zekerheid, voorspelbaarheid en stabiele arbeidsverhoudingen."]],
 ["Het bindmiddel van de organisatie", [
  "Loyaliteit en onderling vertrouwen houden de organisatie bijeen; betrokkenheid staat hoog in het vaandel.",
  "Betrokkenheid bij vernieuwing en ontwikkeling houdt de organisatie bijeen; we willen vooroplopen.",
  "De nadruk op prestaties en het behalen van doelen houdt de organisatie bijeen.",
  "Formele regels, beleid en een soepel draaiende organisatie houden het geheel bijeen."]],
 ["Strategische accenten", [
  "De organisatie legt de nadruk op ontwikkeling van mensen, vertrouwen, openheid en participatie.",
  "De organisatie legt de nadruk op nieuwe mogelijkheden aanboren, experimenteren en kansen pakken.",
  "De organisatie legt de nadruk op prestaties, ambitieuze doelen en een sterke positie bij opdrachtgevers en gemeenten.",
  "De organisatie legt de nadruk op continuïteit, stabiliteit, doelmatigheid en beheersing."]],
 ["Succescriteria", [
  "Succes betekent: ontwikkeling van medewerkers, sterk teamwerk en goede zorg voor mensen.",
  "Succes betekent: vernieuwend aanbod en vooroplopen in het werkveld.",
  "Succes betekent: een sterke positie bij opdrachtgevers en het halen van doelen en productie.",
  "Succes betekent: betrouwbaarheid, doelmatige processen, goede planning en geborgde kwaliteit."]]
];
const LETTERS = ["A","B","C","D"];
const TYPEN = {A:"Familie", B:"Adhocratie", C:"Markt", D:"Hiërarchie"};
const TYPEKLEUR = {A:"#7DAF23", B:"#00A7E7", C:"#0A6FB8", D:"#0E2A5E"};
let organisatie = null;

function kiesOrg(o){
  organisatie = o;
  document.getElementById('knopKoraal').classList.toggle('actief', o==='Koraal');
  document.getElementById('knopVJ').classList.toggle('actief', o==='Via Jeugd');
  controleer();
}

function bouw(){
  const houder = document.getElementById('dimensies');
  DIMS.forEach((d,i)=>{
    const blok = document.createElement('div'); blok.className='dim';
    let html = `<div class="kop"><span class="dnr">${i+1}</span>${d[0]}</div>
      <div class="kolomkop"><span>Uitspraak</span><span>Nu</span><span>Gewenst</span></div>`;
    d[1].forEach((st,j)=>{
      const L = LETTERS[j];
      html += `<div class="rij">
        <span class="st"><span class="ltr" style="background:${TYPEKLEUR[L]}">${L}</span>${st}</span>
        <label class="invul"><span class="cap">Nu</span><input type="number" min="0" max="100" step="5" inputmode="numeric" placeholder="0" id="d${i}n${j}"></label>
        <label class="invul"><span class="cap">Gewenst</span><input type="number" min="0" max="100" step="5" inputmode="numeric" placeholder="0" id="d${i}g${j}"></label>
      </div>`;
    });
    const seg = r => LETTERS.map((L,j)=>`<i id="b${i}${r}${j}" style="background:${TYPEKLEUR[L]}"></i>`).join('');
    html += `<div class="dimfoot">
        <div class="totrij">
          <span class="totlabel">Totaal (moet 100 zijn)</span>
          <span class="badge" id="t${i}n">0</span><span class="badge" id="t${i}g">0</span>
        </div>
        <div class="balken">
          <span class="balklabel">Verdeling</span>
          <span class="balk">${seg('n')}</span>
          <span class="balk">${seg('g')}</span>
        </div>
      </div>`;
    blok.innerHTML = html;
    houder.appendChild(blok);
  });
  houder.addEventListener('input', controleer);
}

function som(i, ronde){
  let s = 0, leeg = 0;
  for (let j=0;j<4;j++){
    const v = document.getElementById(`d${i}${ronde}${j}`).value;
    if (v === '') leeg++;
    s += Number(v||0);
  }
  return {s, leeg};
}

function controleer(){
  let alles = true, klaar = 0;
  for (let i=0;i<6;i++){
    for (const r of ['n','g']){
      const {s, leeg} = som(i,r);
      const b = document.getElementById(`t${i}${r}`);
      b.textContent = s;
      b.className = 'badge ' + (s===100 ? 'goed' : (s>0||leeg<4 ? 'fout' : ''));
      const noemer = Math.max(s,100);
      for (let j=0;j<4;j++){
        const v = Number(document.getElementById(`d${i}${r}${j}`).value||0);
        document.getElementById(`b${i}${r}${j}`).style.width = (v/noemer*100)+'%';
      }
      if (s===100) klaar++; else alles=false;
    }
  }
  if (!organisatie) alles = false;
  document.getElementById('voortgangFill').style.width = (klaar/12*100)+'%';
  document.getElementById('verstuur').disabled = !alles;
  const hint = document.getElementById('hint');
  if (!alles){
    hint.style.display='block';
    hint.textContent = !organisatie
      ? 'Kies eerst je organisatie (Koraal of Via Jeugd).'
      : 'De knop wordt actief zodra elke verdeling (Nu én Gewenst) precies op 100 punten uitkomt.';
  } else hint.style.display='none';
}

function profiel(){
  const p = {nu:{}, gewenst:{}};
  for (const L of LETTERS){ p.nu[L]=0; p.gewenst[L]=0; }
  for (let i=0;i<6;i++) for (let j=0;j<4;j++){
    p.nu[LETTERS[j]]      += Number(document.getElementById(`d${i}n${j}`).value||0);
    p.gewenst[LETTERS[j]] += Number(document.getElementById(`d${i}g${j}`).value||0);
  }
  for (const L of LETTERS){ p.nu[L]=Math.round(p.nu[L]/6*10)/10; p.gewenst[L]=Math.round(p.gewenst[L]/6*10)/10; }
  return p;
}

function vlieger(profielen, breed){
  const W=breed||440, H=W, C=W/2, S=(W/2-58)/60;
  const dir = {A:[-1,1], B:[1,1], C:[1,-1], D:[-1,-1]};
  const pt = (L,v)=>{ const f=v*S/Math.SQRT2; return [C+dir[L][0]*f, C-dir[L][1]*f]; };
  let s = `<svg width="${W}" height="${H+34}" viewBox="0 0 ${W} ${H+34}" xmlns="http://www.w3.org/2000/svg">`;
  s += `<rect x="${C-60*S/Math.SQRT2}" y="${C-60*S/Math.SQRT2}" width="${120*S/Math.SQRT2}" height="${120*S/Math.SQRT2}" fill="#F4FAFD"/>`;
  for (const v of [20,40,60]) s += `<circle cx="${C}" cy="${C}" r="${v*S}" fill="none" stroke="#DDE9F4" stroke-dasharray="3 4"/>`;
  s += `<line x1="${C-62*S/Math.SQRT2}" y1="${C}" x2="${C+62*S/Math.SQRT2}" y2="${C}" stroke="#BBC9D8"/>`;
  s += `<line x1="${C}" y1="${C-62*S/Math.SQRT2}" x2="${C}" y2="${C+62*S/Math.SQRT2}" stroke="#BBC9D8"/>`;
  for (const pr of profielen){
    const pts = LETTERS.map(L=>pt(L,pr.p[L]).join(',')).join(' ');
    s += `<polygon points="${pts}" fill="${pr.stippel?'none':pr.kleur}" fill-opacity="0.15"
          stroke="${pr.kleur}" stroke-width="3" ${pr.stippel?'stroke-dasharray="8 6"':''}/>`;
  }
  const lab = (t,x,y,anch)=>`<text x="${x}" y="${y}" font-size="13" font-weight="bold" fill="#14387F" text-anchor="${anch}">${t}</text>`;
  s += lab('FAMILIE', 14, 18, 'start') + lab('ADHOCRATIE', W-14, 18, 'end');
  s += lab('HIËRARCHIE', 14, H-6, 'start') + lab('MARKT', W-14, H-6, 'end');
  let lx = 10;
  for (const pr of profielen){
    s += `<line x1="${lx}" y1="${H+22}" x2="${lx+26}" y2="${H+22}" stroke="${pr.kleur}" stroke-width="3" ${pr.stippel?'stroke-dasharray="8 6"':''}/>`;
    s += `<text x="${lx+32}" y="${H+26}" font-size="12" fill="#333">${pr.naam}</text>`;
    lx += 36 + pr.naam.length*6.4 + 18;
  }
  return s + '</svg>';
}

function dominant(p){ let m='A'; for (const L of LETTERS) if (p[L]>p[m]) m=L; return m; }

async function verstuur(){
  document.getElementById('verstuur').disabled = true;
  const scores = [];
  for (let i=0;i<6;i++){
    const dim = {nu:{}, gewenst:{}};
    for (let j=0;j<4;j++){
      dim.nu[LETTERS[j]]      = Number(document.getElementById(`d${i}n${j}`).value||0);
      dim.gewenst[LETTERS[j]] = Number(document.getElementById(`d${i}g${j}`).value||0);
    }
    scores.push(dim);
  }
  let ref = null;
  try {
    const res = await fetch('/api/opslaan', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ organisatie, team: document.getElementById('team').value, scores }),
    });
    const data = await res.json();
    if (data && data.ok && data.ref) ref = data.ref;
  } catch(e) { /* fallthrough — we tonen sowieso een resultaat */ }

  if (ref) { location.href = 'resultaat/?ref=' + encodeURIComponent(ref); return; }

  // Fallback (bv. netwerk-fout): toon het resultaat direct in de pagina.
  const p = profiel();
  document.getElementById('formulier').style.display='none';
  const res = document.getElementById('resultaat'); res.style.display='block'; res.classList.add('fade');
  let t = `<tr><th>Cultuurtype</th><th>Nu</th><th>Gewenst</th><th>Verschil</th></tr>`;
  for (const L of LETTERS){
    const d = Math.round((p.gewenst[L]-p.nu[L])*10)/10;
    t += `<tr><td><span style="display:inline-block;width:9px;height:9px;border-radius:2px;background:${TYPEKLEUR[L]};margin-right:7px;"></span>${TYPEN[L]}</td>
          <td>${p.nu[L]}</td><td>${p.gewenst[L]}</td><td>${d>0?'+':''}${d}</td></tr>`;
  }
  document.getElementById('restabel').innerHTML = t;
  const kleur = organisatie==='Via Jeugd' ? '#7DAF23' : '#14387F';
  document.getElementById('grafiek').innerHTML = vlieger([
    {p:p.nu, kleur, naam:'Nu', stippel:false},
    {p:p.gewenst, kleur:'#00A7E7', naam:'Gewenst', stippel:true}
  ], Math.min(420, document.getElementById('grafiek').clientWidth-30));
  const dn = dominant(p.nu), dg = dominant(p.gewenst);
  let duiding = `<div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:10px;">
      <span class="dombadge" style="background:${TYPEKLEUR[dn]}">${TYPEN[dn]}cultuur</span>
      <span style="color:var(--muted); font-size:.9em;">jouw dominante cultuurtype &middot; nu</span>
    </div>
    <p style="margin:0;">In jouw beeld is de cultuur nu vooral een <b>${TYPEN[dn].toLowerCase()}cultuur</b>`;
  duiding += dn===dg
    ? `, en dat blijft ook in je gewenste beeld het zwaartepunt &ndash; kijk vooral naar de verschuivingen in de tabel.</p>`
    : `; in je gewenste beeld verschuift het zwaartepunt naar een <b>${TYPEN[dg].toLowerCase()}cultuur</b>.</p>`;
  document.getElementById('duiding').innerHTML = duiding;
  window.scrollTo({top:0, behavior:'smooth'});
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('knopKoraal').addEventListener('click', () => kiesOrg('Koraal'));
  document.getElementById('knopVJ').addEventListener('click', () => kiesOrg('Via Jeugd'));
  document.getElementById('verstuur').addEventListener('click', verstuur);
  bouw();
  controleer();
});
