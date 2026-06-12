/**
 * Cloudflare Pages Function — POST /api/opslaan
 *
 * Slaat één OCAI-inzending op in de D1-database OCAI_DB. Vervangt het
 * originele opslaan.php uit de PHP-versie van het instrument; validatie en
 * profiel-berekening zijn 1:1 overgenomen.
 *
 * Payload:
 *   {
 *     organisatie: 'Koraal' | 'Via Jeugd',
 *     team: string,                       // optioneel, max 80 tekens
 *     scores: Array<{                     // exact 6 dimensies
 *       nu:      { A:number, B:number, C:number, D:number },  // som = 100
 *       gewenst: { A:number, B:number, C:number, D:number }   // som = 100
 *     }>
 *   }
 *
 * Antwoord: { ok:true, profiel: { nu:{A,B,C,D}, gewenst:{A,B,C,D} } }
 *
 * Bindings/secrets in Cloudflare Pages:
 *   - D1 binding: OCAI_DB  (database "ocai")
 */

interface Env {
  OCAI_DB: D1Database;
}

type Letter = 'A' | 'B' | 'C' | 'D';
type LetterScore = Record<Letter, number>;

interface ScoreDim {
  nu: LetterScore;
  gewenst: LetterScore;
}

interface Payload {
  organisatie?: unknown;
  team?: unknown;
  scores?: unknown;
}

const LETTERS: Letter[] = ['A', 'B', 'C', 'D'];
const ORGS = ['Koraal', 'Via Jeugd'] as const;

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function isLetterScore(x: unknown): x is LetterScore {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  for (const L of LETTERS) {
    const v = o[L];
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 100) {
      return false;
    }
  }
  return true;
}

function sum(s: LetterScore): number {
  return s.A + s.B + s.C + s.D;
}

/** Gemiddeld profiel over 6 dimensies, gerond op 1 decimaal. */
function profielGemiddeld(scores: ScoreDim[]): {
  nu: LetterScore;
  gewenst: LetterScore;
} {
  const acc = { nu: { A: 0, B: 0, C: 0, D: 0 }, gewenst: { A: 0, B: 0, C: 0, D: 0 } };
  for (const dim of scores) {
    for (const L of LETTERS) {
      acc.nu[L] += dim.nu[L];
      acc.gewenst[L] += dim.gewenst[L];
    }
  }
  const out = { nu: { A: 0, B: 0, C: 0, D: 0 }, gewenst: { A: 0, B: 0, C: 0, D: 0 } };
  for (const L of LETTERS) {
    out.nu[L] = Math.round((acc.nu[L] / 6) * 10) / 10;
    out.gewenst[L] = Math.round((acc.gewenst[L] / 6) * 10) / 10;
  }
  return out;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    if (!env.OCAI_DB) {
      return json({ ok: false, fout: 'Database is niet geconfigureerd.' }, 503);
    }

    let body: Payload;
    try {
      body = (await request.json()) as Payload;
    } catch {
      return json({ ok: false, fout: 'Ongeldige invoer.' }, 400);
    }

    if (
      typeof body.organisatie !== 'string' ||
      !(ORGS as readonly string[]).includes(body.organisatie)
    ) {
      return json({ ok: false, fout: 'Kies eerst Koraal of Via Jeugd.' }, 400);
    }
    const organisatie = body.organisatie;

    const team = (
      typeof body.team === 'string' ? body.team : ''
    )
      .trim()
      .slice(0, 80);

    if (!Array.isArray(body.scores) || body.scores.length !== 6) {
      return json({ ok: false, fout: 'Scores onvolledig.' }, 400);
    }
    const dims: ScoreDim[] = [];
    for (const dim of body.scores) {
      if (
        !dim ||
        typeof dim !== 'object' ||
        !isLetterScore((dim as ScoreDim).nu) ||
        !isLetterScore((dim as ScoreDim).gewenst)
      ) {
        return json({ ok: false, fout: 'Ongeldige score.' }, 400);
      }
      const d = dim as ScoreDim;
      if (Math.abs(sum(d.nu) - 100) > 0.01 || Math.abs(sum(d.gewenst) - 100) > 0.01) {
        return json(
          { ok: false, fout: 'Elke verdeling moet op 100 punten uitkomen.' },
          400
        );
      }
      dims.push(d);
    }

    const profiel = profielGemiddeld(dims);
    const ref =
      'O-' + crypto.randomUUID().replace(/-/g, '').toUpperCase().slice(0, 8);
    const ip =
      request.headers.get('cf-connecting-ip') ??
      request.headers.get('x-forwarded-for') ??
      null;

    await env.OCAI_DB.prepare(
      `INSERT INTO inzendingen (
        ref, organisatie, team,
        nu_a, nu_b, nu_c, nu_d,
        gewenst_a, gewenst_b, gewenst_c, gewenst_d,
        scores_json, ip
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        ref,
        organisatie,
        team,
        profiel.nu.A,
        profiel.nu.B,
        profiel.nu.C,
        profiel.nu.D,
        profiel.gewenst.A,
        profiel.gewenst.B,
        profiel.gewenst.C,
        profiel.gewenst.D,
        JSON.stringify(dims),
        ip
      )
      .run();

    return json({ ok: true, ref, profiel });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('opslaan crashed:', msg);
    return json({ ok: false, fout: `Server-fout: ${msg}` }, 500);
  }
};
