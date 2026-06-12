# CLAUDE.md — koraalenviajeugd.nl

Gedeelde bron-van-waarheid tussen claude.ai-chats en Claude Code-sessies voor de OCAI-cultuurmeting Koraal × Via Jeugd.

## Doel & context

- Online cultuurmeting volgens OCAI (Cameron & Quinn) voor de invlechting van Via Jeugd in Koraal.
- Bestuurlijk samen sinds 1 juli 2025; juridisch één per 1 maart 2027.
- Medewerkersbijeenkomst 23 juni 2026 — uitkomsten zijn daar gespreksstof.
- Centrale boodschap: "snelheid mét borging" — het beste van Via Jeugd (familie/adhocratie) en Koraal (hiërarchie/borging), niet één cultuur laat winnen.

## Architectuur

- **Cloudflare Pages** statische site (`public/`) + **Pages Functions** (TypeScript, `functions/api/`).
- **D1** voor opslag (sqlite-edge); binding `OCAI_DB` → database `ocai`.
- **Admin-token** in `sessionStorage` + bearer in `Authorization`-header.

### Pages

| Pad | Bestand | Wie ziet het |
|---|---|---|
| `/` | `public/index.html` | publiek — vragenlijst |
| `/resultaat/?ref=O-XXXX` | `public/resultaat/index.html` | publiek met onraadbare ref |
| `/uitleg/` | `public/uitleg/index.html` | publiek — OCAI-uitleg + CTA |
| `/admin/` | `public/admin/index.html` | token-login; tellers, lijst, CSV |
| `/admin/totaal/` | `public/admin/totaal/index.html` | token-vereist; stippenplaat + per-org vliegers |

### Endpoints

| Method + pad | File | Auth |
|---|---|---|
| POST `/api/opslaan` | `functions/api/opslaan.ts` | publiek |
| GET `/api/resultaat?ref=…` | `functions/api/resultaat.ts` | publiek (ref onraadbaar) |
| GET `/api/resultaat?summary=1&token=…` | `functions/api/resultaat.ts` | admin-token |
| GET `/api/admin/list` | `functions/api/admin/list.ts` | admin-token |
| GET `/api/admin/export` | `functions/api/admin/export.ts` | admin-token; CSV (UTF-8 BOM, `;`) |

## Grafiek-conventie (variant B, definitief)

- Vlieger-polygon op 4 diagonale assen: A=Familie (LB), B=Adhocratie (RB), C=Markt (RO), D=Hiërarchie (LO).
- Ruitvormige gridlijnen 10/20/30/40/50, schaal 0–60.
- Achtergrond: 4 kwadrantpanelen met ondertitels (mensgericht/ondernemend/procedureel/resultaat) in pastel-blauwe gradient.
- Buitenlabels FLEXIBEL/BEHEERSBAAR/INTERN GERICHT/EXTERN GERICHT.
- "Nu" = doorgetrokken polygon (stroke 2.5, fill 0.13). "Gewenst" = gestippeld (dasharray 6 5, geen fill).
- Kleuren: Koraal `#0F4C97` (donkerblauw), Via Jeugd `#4FAE32` (groen).
- Totaalplaat (`renderTotaalStippen`): één stip per organisatie op zwaartepunt van gemiddelde nu-profiel, factor 3,2× uitvergroot, geen tekstlabels, geen gewenst-lijn.
- Renderer: `public/assets/diagram-vlieger.js` (`window.OcaiVlieger.render` + `renderTotaalStippen`).

## Styling

- Favicon-set in `public/favicon/` — officiële koraal.nl-favicon, mask-kleur `#00a7e7`.
- Logo's in `public/`: `koraal_logo.png`, `vj_logo_ok.png`.
- Centrale stylesheet `public/assets/stijl.css` (cache-bust `?v=N` in `<link>`).
- CSS-variabelen: `--blauw:#004289 --cyaan:#009DDF --groen:#4FAE32 --zacht:#F2F8FD --kaart:#E5F1FA --rand:#C9DCEF`.

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
- **Vanaf 12 juni 2026**: standalone domein `koraalenviajeugd.nl` in eigen repo `marcovanthiel/koraalenviajeugd`. Endpoints onder `/api/`. Zelfde D1-database (binding `OCAI_DB` → `ocai`) hergebruikt.

## Gedeelde context (claude.ai ↔ Claude Code)

Bij dit project horen ook (in claude.ai-project, niet in repo): brainstorm-placemat 2×A4, presentatie 23 juni (pptx Koraal-sjabloon), document "Vier modellen voor cultuurintegratie", Word-versie van het OCAI-instrument. Bij wijzigingen aan vragen/profielen ook die documenten laten bijwerken in de chat.
