import type { Env } from '../index';
import { tokenEquals } from '../security';

type Letter = 'A' | 'B' | 'C' | 'D';
type LetterScore = Record<Letter, number>;
const LETTERS: Letter[] = ['A', 'B', 'C', 'D'];

interface Row {
  id: number;
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
  id: number;
  ref: string;
  tijdstip: string;
  organisatie: string;
  team: string;
  profiel: { nu: LetterScore; gewenst: LetterScore };
}

function unauthorized(): Response {
  return new Response(JSON.stringify({ ok: false, fout: 'Niet ingelogd.' }), {
    status: 401,
    headers: {
      'www-authenticate': 'Bearer realm="ocai-admin"',
      'content-type': 'application/json; charset=utf-8',
    },
  });
}

function getToken(request: Request): string | null {
  const auth = request.headers.get('authorization');
  if (auth?.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  const url = new URL(request.url);
  return url.searchParams.get('token');
}

function gemiddeld(rs: Item[], ronde: 'nu' | 'gewenst'): LetterScore | null {
  if (rs.length === 0) return null;
  const g: LetterScore = { A: 0, B: 0, C: 0, D: 0 };
  for (const r of rs) for (const L of LETTERS) g[L] += r.profiel[ronde][L];
  for (const L of LETTERS) g[L] = Math.round((g[L] / rs.length) * 10) / 10;
  return g;
}

export async function handleAdminList(request: Request, env: Env): Promise<Response> {
  try {
    if (!env.OCAI_DB) {
      return new Response(
        JSON.stringify({ ok: false, fout: 'Database is niet geconfigureerd.' }),
        { status: 503, headers: { 'content-type': 'application/json; charset=utf-8' } },
      );
    }
    const token = getToken(request);
    if (!token || !env.OCAI_ADMIN_TOKEN || !tokenEquals(token, env.OCAI_ADMIN_TOKEN)) {
      return unauthorized();
    }

    const result = await env.OCAI_DB.prepare(
      `SELECT id, ref, organisatie, team,
              nu_a, nu_b, nu_c, nu_d,
              gewenst_a, gewenst_b, gewenst_c, gewenst_d,
              created_at
         FROM inzendingen
        ORDER BY id DESC`,
    ).all<Row>();

    const items: Item[] = (result.results ?? []).map((r) => ({
      id: r.id,
      ref: r.ref,
      tijdstip: r.created_at,
      organisatie: r.organisatie,
      team: r.team,
      profiel: {
        nu: { A: r.nu_a, B: r.nu_b, C: r.nu_c, D: r.nu_d },
        gewenst: { A: r.gewenst_a, B: r.gewenst_b, C: r.gewenst_c, D: r.gewenst_d },
      },
    }));

    const koraal = items.filter((i) => i.organisatie === 'Koraal');
    const vj = items.filter((i) => i.organisatie === 'Via Jeugd');
    const aggregates = {
      totaal: {
        n: items.length,
        nu: gemiddeld(items, 'nu'),
        gewenst: gemiddeld(items, 'gewenst'),
      },
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
    };

    return new Response(JSON.stringify({ ok: true, items, aggregates }), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'private, no-store',
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('admin/list crashed:', msg);
    return new Response(JSON.stringify({ ok: false, fout: `Server-fout: ${msg}` }), {
      status: 500,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }
}
