'use strict';

async function kopieerLink() {
  const url = document.getElementById('kopieer-url').textContent.trim();
  const knop  = document.getElementById('kopieer-knop');
  const label = document.getElementById('kopieer-label');
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(url);
    } else {
      const ta = document.createElement('textarea');
      ta.value = url; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
    }
    label.textContent = '✓ Gekopieerd!';
    knop.disabled = true;
    setTimeout(function(){ label.textContent = 'Kopieer de link'; knop.disabled = false; }, 2400);
  } catch (e) {
    label.textContent = 'Kopiëren niet gelukt';
    setTimeout(function(){ label.textContent = 'Kopieer de link'; }, 2400);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const knop = document.getElementById('kopieer-knop');
  if (knop) knop.addEventListener('click', kopieerLink);

  const terug = document.getElementById('terug');
  if (terug) {
    terug.addEventListener('click', (ev) => {
      if (history.length > 1) {
        ev.preventDefault();
        history.back();
      }
    });
  }
});
