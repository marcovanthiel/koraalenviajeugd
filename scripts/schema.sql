-- ============================================================
-- D1 schema voor OCAI-cultuurmeting (Koraal & Via Jeugd)
-- ============================================================
--
-- Eénmalig draaien tegen de OCAI_DB-database:
--   wrangler d1 execute ocai --remote --file=scripts/schema.sql
-- (en/of --local voor lokale dev met wrangler pages dev)

CREATE TABLE IF NOT EXISTS inzendingen (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ref         TEXT    NOT NULL UNIQUE,
  organisatie TEXT    NOT NULL CHECK (organisatie IN ('Koraal', 'Via Jeugd')),
  team        TEXT    NOT NULL DEFAULT '',
  -- Gemiddeld profiel (over 6 dimensies, 1 decimaal) — wat de admin toont.
  nu_a        REAL    NOT NULL,
  nu_b        REAL    NOT NULL,
  nu_c        REAL    NOT NULL,
  nu_d        REAL    NOT NULL,
  gewenst_a   REAL    NOT NULL,
  gewenst_b   REAL    NOT NULL,
  gewenst_c   REAL    NOT NULL,
  gewenst_d   REAL    NOT NULL,
  -- Rauwe scores (6 dimensies × {nu,gewenst} × {A,B,C,D}) als JSON-string
  -- zodat we later opnieuw kunnen analyseren.
  scores_json TEXT    NOT NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  ip          TEXT
);

CREATE INDEX IF NOT EXISTS idx_inzendingen_organisatie
  ON inzendingen (organisatie);

CREATE INDEX IF NOT EXISTS idx_inzendingen_created
  ON inzendingen (created_at);
