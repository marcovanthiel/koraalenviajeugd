import type { Env } from '../index';

type Letter = 'A' | 'B' | 'C' | 'D';
type LetterScore = Record<Letter, number>;
const LETTERS: Letter[] = ['A', 'B', 'C', 'D'];

interface Row {
  ref: string;
  organisatie: string;
  team: string;
  nu_a: number;
  nu_b: number;
  nu_c: number;
  nu_d: number;
  gewenst_a: number;
  gewenst_b: number;
  gewenst_c: number;
  gewenst_d: number;
  created_at: string;
}

interface Item {
  ref: string;
  tijdstip: string;
  organisatie: string;
  team: string;
  profiel: { nu: LetterScore; gewenst: LetterScore };
}

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'private, no-store',
    },
  });
}

function rowToItem(r: Row): Item {
  return {
    ref: r.ref,
    tijdstip: r.created_at,
    organisatie: r.organisatie,
    team: r.team,
    profiel: {
      nu: { A: r.nu_a, B: r.nu_b, C: r.nu_c, D: r.nu_d },
      gewenst: { A: r.gewenst_a, B: r.gewenst_b, C: r.gewenst_c, D: r.gewenst_d },
    },
  };
}

function gemiddeld(rs: Item[], ronde: 'nu' | 'gewenst'): LetterScore | null {
  if (rs.length === 0) return null;
  const g: LetterScore = { A: 0, B: 0, C: 0, D: 0 };
  for (const r of rs) for (const L of LETTERS) g[L] += r.profiel[ronde][L];
  for (const L of LETTERS) g[L] = Math.round((g[L] / rs.length) * 10) / 10;
  return g;
}

function getToken(request: Request): string | null {
  const auth = request.headers.get('authorization');
  if (auth?.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  const url = new URL(request.url);
  return url.searchParams.get('token');
}

export async function handleResultaat(request: Request, env: Env): Promise<Response> {
  try {
    if (!env.OCAI_DB) {
      return json({ ok: false, fout: 'Database is niet geconfigureerd.' }, 503);
    }
    const url = new URL(request.url);

    if (url.searchParams.has('summary')) {
      const token = getToken(request);
      if (!token || !env.OCAI_ADMIN_TOKEN || token !== env.OCAI_ADMIN_TOKEN) {
        return json({ ok: false, fout: 'Niet ingelogd.' }, 401);
      }
      const result = await env.OCAI_DB.prepare(
        `SELECT ref, organisatie, team,
                nu_a, nu_b, nu_c, nu_d,
                gewenst_a, gewenst_b, gewenst_c, gewenst_d,
                created_at
           FROM inzendingen ORDER BY id ASC`,
      ).all<Row>();
      const items = (result.results ?? []).map(rowToItem);
      const koraal = items.filter((i) => i.organisatie === 'Koraal');
      const vj = items.filter((i) => i.organisatie === 'Via Jeugd');
      return json({
        ok: true,
        Koraal: {
          n: koraal.length,
          nu: gemiddeld(koraal, 'nu'),
          gewenst: gemiddeld(koraal, 'gewenst'),
        },
        'Via Jeugd': {
          n: vj.length,
          nu: gemiddeld(vj, 'nu'),
          gewenst: gemiddeld(vj, 'gewenst'),
        },
        totaal: { n: items.length },
      });
    }

    const ref = url.searchParams.get('ref');
    if (!ref || !/^O-[0-9A-F]{4,16}$/.test(ref)) {
      return json({ ok: false, fout: 'Geen geldige referentie.' }, 400);
    }
    const result = await env.OCAI_DB.prepare(
      `SELECT ref, organisatie, team,
              nu_a, nu_b, nu_c, nu_d,
              gewenst_a, gewenst_b, gewenst_c, gewenst_d,
              created_at
         FROM inzendingen WHERE ref = ? LIMIT 1`,
    )
      .bind(ref)
      .first<Row>();
    if (!result) {
      return json({ ok: false, fout: 'Resultaat niet gevonden.' }, 404);
    }
    return json({ ok: true, item: rowToItem(result) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('resultaat crashed:', msg);
    return json({ ok: false, fout: `Server-fout: ${msg}` }, 500);
  }
}
