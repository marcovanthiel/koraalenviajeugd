// Toont de deploy-versie (versie + git-commit) subtiel onderaan de pagina.
(function () {
  fetch('/version.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
    if (!d || !d.version) return;
    var f = document.createElement('div');
    f.style.cssText = 'text-align:center;color:#9aa3b2;font-size:.72rem;padding:18px 0 22px';
    f.textContent = 'v' + d.version + (d.commit ? ' · ' + d.commit : '');
    document.body.appendChild(f);
  }).catch(function () {});
})();
