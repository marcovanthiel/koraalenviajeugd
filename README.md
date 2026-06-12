# koraalenviajeugd.nl

OCAI-cultuurmeting voor de invlechting van Via Jeugd in Koraal.

- **Live:** https://koraalenviajeugd.nl/
- **Admin:** https://koraalenviajeugd.nl/admin/
- **Totaalweergave:** https://koraalenviajeugd.nl/admin/totaal/

## Structuur

| Pad | Inhoud |
|---|---|
| `public/` | Statische HTML/CSS/JS (Cloudflare Pages output) |
| `functions/api/` | Pages Functions (TypeScript) |
| `scripts/` | D1-schema + setup-instructies |
| `docs/` | Tekstvoorstellen en bronnen |

## Cloudflare-configuratie

- **Pages-project:** `koraalenviajeugd`
- **D1-database:** `ocai` (`4877440a-449f-4e87-a04e-a1c0b7c5ca02`)
- **Binding:** `OCAI_DB`
- **Secret:** `OCAI_ADMIN_TOKEN` (admin-login)

Bindings staan in `wrangler.toml`; de secret via dashboard of `wrangler pages secret put OCAI_ADMIN_TOKEN --project-name=koraalenviajeugd`.

Schema initialiseren:

```bash
wrangler d1 execute ocai --remote --file=scripts/schema.sql
```
