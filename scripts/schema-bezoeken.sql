-- ============================================================
-- D1 schema voor de bezoekersteller (analytics)
-- ============================================================
--
-- Eénmalig draaien tegen de OCAI_DB-database:
--   wrangler d1 execute ocai --remote --file=scripts/schema-bezoeken.sql

CREATE TABLE IF NOT EXISTS bezoeken (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  ts              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  path            TEXT     NOT NULL,
  country         TEXT,
  city            TEXT,
  referrer_host   TEXT,
  -- visitor_hash = SHA-256(IP || datum || admin-secret), 16 hex-chars.
  -- Zelfde bezoeker binnen 1 dag = zelfde hash, daarna nieuwe identiteit.
  -- Niet omkeerbaar zonder de geheime salt.
  visitor_hash    TEXT     NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bezoeken_ts          ON bezoeken (ts);
CREATE INDEX IF NOT EXISTS idx_bezoeken_visitor     ON bezoeken (visitor_hash);
CREATE INDEX IF NOT EXISTS idx_bezoeken_path        ON bezoeken (path);
