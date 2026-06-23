# CLAUDE.md — koraalenviajeugd.nl

Gedeelde bron-van-waarheid tussen claude.ai-chats en Claude Code-sessies voor de OCAI-cultuurmeting Koraal × Via Jeugd.

## Doel & context

- Online cultuurmeting volgens OCAI (Cameron & Quinn) voor de invlechting van Via Jeugd in Koraal.
- Bestuurlijk samen sinds 1 juli 2025; juridisch één per 1 maart 2027.
- Medewerkersbijeenkomst 23 juni 2026 — uitkomsten zijn daar gespreksstof.
- Centrale boodschap: "snelheid mét borging" — het beste van Via Jeugd (familie/adhocratie) en Koraal (hiërarchie/borging), niet één cultuur laat winnen.
- **Status 23-6-2026:** meting afgerond (uitkomsten op de bijeenkomst). De homepage (`public/index.html`) is vervangen door een **voorpagina met schakelaar** met 4 weergaven: **1 Samenvloeiing** + **2 Koraaltuin** (generatieve canvas-animaties) en **3 Foto's** + **4 Vragen** (slideshows van de kickoff-presentaties van 24-6). De OCAI-vragenlijst die vóór 23-6 op de homepage stond, blijft in de git-historie (terughaalbaar); `/uitleg`, `/resultaat`, `/admin` en de `/api/*`-endpoints zijn ongewijzigd.
  - **Let op CSP:** `src/security.ts` zet `script-src 'self'` (géén `'unsafe-inline'`). Homepage-JS moet daarom een **extern bestand** zijn: `public/assets/home.js` (geladen via `<script src="/assets/home.js?v=N">`, bump `?v=` bij wijziging). Een inline `<script>` wordt door de browser geweigerd → animaties starten dan niet. `<style>` mag wél inline (`style-src 'unsafe-inline'`).
  - **Presentaties:** slides staan als JPG in `public/presentaties/foto/01–44.jpg` en `public/presentaties/vragen/01–06.jpg`. Aantal slides staat in `home.js` (`PRES_FOTO.count` / `PRES_VRAGEN.count`). Pijplijn om ze te (her)maken uit een `.pptx`: `soffice --headless --convert-to pdf <file>` → `pdftoppm -jpeg -r 200 …` → hernoemen naar `NN.jpg` → `jpegoptim --strip-all`. (LibreOffice + poppler via Homebrew; PowerPoints AppleScript-PDF-export is een no-op in deze build.)
    - Slideshow start bij **elke** activatie van knop 3/4 weer op **dia 1** (`start(){…show(0)…}`).
    - **Gotcha:** de fade-in van een dia zet de class `is-on` **direct** (niet in `requestAnimationFrame`) — zonder lopende animatieloop wordt een eenmalige rAF-callback niet betrouwbaar uitgevoerd, waardoor de foto onzichtbaar bleef (opacity 0).
  - **Koraaltuin (variant 2):** generatief vertakkend koraal (space-colonization) met dikke, taps toelopende takken, poliep-tips en warme op-merk-kleuren (tropisch roze + zonnegloed-oranje) op licht water met lichtschachten/zandbodem. Bewust géén dunne elektrisch-blauwe lijnen (zag er als bliksem uit).
  - **Volledig scherm:** knoppenbalk + cursor verbergen na 3s rust en komen terug bij muisbeweging (class `body.fs-idle`, gestuurd door `mousemove`/`fullscreenchange` in `home.js`).
  - **Lokaal testen van de animaties/slideshow:** headless Chrome — serveer `public/` (`python3 -m http.server`), prime `localStorage['koraal-variant']` in een testkopie van `index.html`, en `--headless --screenshot --virtual-time-budget=…`.

## Architectuur

- **Cloudflare Worker + Static Assets**: statische site (`public/`) wordt door de `ASSETS`-binding geserveerd; één Worker-entrypoint (`src/index.ts`) routeert `/api/*` naar handler-modules in `src/handlers/`.
- **D1** voor opslag (sqlite-edge); binding `OCAI_DB` → database `ocai`.
- **Admin-token** in `sessionStorage` + bearer in `Authorization`-header.
- Cloudflare faseerde de Pages-creation flow uit medio 2026; vandaar de Workers + Static Assets route. Marcovanthiel-static draait nog op het oude Pages-model.

### Pagina's (statisch, in `public/`)

| Pad | Bestand | Wie ziet het |
|---|---|---|
| `/` | `public/index.html` | publiek — vragenlijst |
| `/resultaat/?ref=O-XXXX` | `public/resultaat/index.html` | publiek met onraadbare ref |
| `/uitleg/` | `public/uitleg/index.html` | publiek — OCAI-uitleg + CTA |
| `/admin/` | `public/admin/index.html` | token-login; tellers, lijst, CSV |
| `/admin/totaal/` | `public/admin/totaal/index.html` | token-vereist; stippenplaat + per-org vliegers |

### Endpoints (Worker, `src/handlers/`)

| Method + pad | Handler | Auth |
|---|---|---|
| POST `/api/opslaan` | `handleOpslaan` (`opslaan.ts`) | publiek |
| GET `/api/resultaat?ref=…` | `handleResultaat` (`resultaat.ts`) | publiek (ref onraadbaar) |
| GET `/api/resultaat?summary=1&token=…` | `handleResultaat` (`resultaat.ts`) | admin-token |
| GET `/api/admin/list` | `handleAdminList` (`admin-list.ts`) | admin-token |
| GET `/api/admin/export` | `handleAdminExport` (`admin-export.ts`) | admin-token; CSV (UTF-8 BOM, `;`) |

Routing zit in `src/index.ts`: pad-match → handler; anders `env.ASSETS.fetch(request)` als fallback.

## Grafiek-conventie (variant B, definitief)

- Vlieger-polygon op 4 diagonale assen: A=Familie (LB), B=Adhocratie (RB), C=Markt (RO), D=Hiërarchie (LO).
- Ruitvormige gridlijnen 10/20/30/40/50, schaal 0–60.
- Achtergrond: 4 kwadrantpanelen met ondertitels (mensgericht/ondernemend/procedureel/resultaat) in pastel-blauwe gradient.
- Buitenlabels FLEXIBEL/BEHEERSBAAR/INTERN GERICHT/EXTERN GERICHT.
- "Nu" = doorgetrokken polygon (stroke 2.5, fill 0.13). "Gewenst" = gestippeld (dasharray 6 5, geen fill).
- Kleuren (huisstijl Koraal-handboek): Koraal `#14387F` (diepzeeblauw), Via Jeugd `#7DAF23` (palmgroen). Op de individuele resultaatpagina: huidig = org-kleur, gewenst = frisblauw `#00A7E7` — via optionele `gewenstKleur` op een profiel (admin-multi-org-grafieken laten gewenst gestippeld in dezelfde kleur als nu).
- Totaalplaat (`renderTotaalStippen`): één stip per organisatie op zwaartepunt van gemiddelde nu-profiel, factor 3,2× uitvergroot, geen tekstlabels, geen gewenst-lijn.
- Renderer: `public/assets/diagram-vlieger.js` (`window.OcaiVlieger.render` + `renderTotaalStippen`).

## Styling

- Favicon-set in `public/favicon/` — officiële koraal.nl-favicon, mask-kleur `#00a7e7`.
- Logo's in `public/`: `koraal_logo.png`, `vj_logo_ok.png`.
- Centrale stylesheet `public/assets/stijl.css` (cache-bust `?v=N` in `<link>`; nu `?v=7`).
- **Digitaal lettertype: Mulish** (Google Fonts — doorontwikkeling van het handboek-font Muli/FF Mark). Font-stack `'Mulish',Arial,Helvetica,sans-serif`; Google-Fonts-link in elke `<head>`.
- CSS-variabelen (huisstijl Koraal-handboek, dec 2023): `--blauw:#14387F` (diepzeeblauw, PMS 280) `--dblauw:#0E2A5E` `--cyaan:#00A7E7` (frisblauw, PMS 2995) `--groen:#7DAF23` (palmgroen). Ondersteunend spaarzaam: zandgeel `#E1B900` (vlak `#FBF1CC`, tekst `#7A5C12`), zonnegloed-oranje `#EA5B25`, rotsgrijs `#769A99`, tropisch roze `#DD73A2`. Lichte kaart-/tabel-fills blijven (`--kaart:#E5F1FA --zacht:#F4FAFD`).
- Schil 2 (professioneel): diepzee- en frisblauw dominant; groen/geel/oranje alléén als functioneel accent. Logo's links boven op witte panelen (hiërarchieniveau 1), met witruimte.

## Toon & taal

- **Je-vorm overal** (vriendelijker voor medewerkers-doelgroep).
- "Over twee jaar" als gewenste-horizon (NIET vijf jaar) — consistent in vragenlijst, resultaat, uitleg.

## Regels & gotchas

- **Ref-format**: `O-` + hex `[0-9A-F]{8}` zoals `O-A1B2C3D4`. Validatie-regex in `resultaat.ts` accepteert `[0-9A-F]{4,16}`. Demo-data: Koraal = `O-DEAD000X`, Via Jeugd = `O-BEEF000X`.
- **Cloudflare cache-poisoning**: nieuwe JS/CSS soms 1–2 min als 404 met text/html-fallback gecachet. Oplossing: cache-bust `?v=N` bumpen in script-tags.
- **Vóór livegang**: demo-rijen weg met `DELETE FROM inzendingen WHERE ref LIKE 'O-DE%' OR ref LIKE 'O-BE%';`.
- **Privacy**: anoniem — alleen organisatie + optioneel team + scores + tijdstip + IP (abuse-mitigation). Geen namen/e-mails.

## Migratiehistorie

- **Tot 12 juni 2026**: subpad `/koraalenviajeugd/` binnen `marcovanthiel/marcovanthiel-static` (Hugo-zustersite). Endpoints onder `/api/koraalenviajeugd/`.
- **Vanaf 12 juni 2026**: standalone domein `koraalenviajeugd.nl` in eigen repo `marcovanthiel/koraalenviajeugd`, opgezet als Worker + Static Assets (Cloudflare heeft Pages-creation flow gepensioneerd voor nieuwe projecten). 4 Pages Functions → 1 Worker-entrypoint met simpele path-routing. Endpoints onder `/api/`. Zelfde D1-database (binding `OCAI_DB` → `ocai`) hergebruikt.
- **15 juni 2026**: huisstijl gelijkgetrokken met Koraal-handboek (dec 2023, schil 2) — kleuren `#004289→#14387F` (diepzee), `#009DDF→#00A7E7` (frisblauw), `#4FAE32→#7DAF23` (palmgroen), gele accenten → zandgeel `#E1B900`; digitaal font **Mulish**; gewenst-lijn frisblauw op de resultaatpagina; meer logo-witruimte; cache-bust `?v=7`. Logo-positionering, Koraalkernen, QR en kernzin "Samen op eigen kracht" zijn bewust **niet** toegevoegd — die vragen eerst afstemming met Communicatie Koraal & Via Jeugd (schil 5).

## Gedeelde context (claude.ai ↔ Claude Code)

Bij dit project horen ook (in claude.ai-project, niet in repo): brainstorm-placemat 2×A4, presentatie 23 juni (pptx Koraal-sjabloon), document "Vier modellen voor cultuurintegratie", Word-versie van het OCAI-instrument. Bij wijzigingen aan vragen/profielen ook die documenten laten bijwerken in de chat.
