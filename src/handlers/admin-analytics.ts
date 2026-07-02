import type { Env } from '../index';
import { tokenEquals } from '../security';

interface CountRow {
  k: string | null;
  n: number;
}

interface DagRow {
  dag: string;
  bezoeken: number;
  uniek: number;
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

function getToken(request: Request): string | null {
  const auth = request.headers.get('authorization');
  if (auth?.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  return null; // query-param-token verwijderd (lekt via logs/Referer); alleen Authorization: Bearer
}

export async function handleAdminAnalytics(request: Request, env: Env): Promise<Response> {
  try {
    if (!env.OCAI_DB) {
      return json({ ok: false, fout: 'Database is niet geconfigureerd.' }, 503);
    }
    const token = getToken(request);
    if (!token || !env.OCAI_ADMIN_TOKEN || !tokenEquals(token, env.OCAI_ADMIN_TOKEN)) {
      return json({ ok: false, fout: 'Niet ingelogd.' }, 401);
    }

    const url = new URL(request.url);
    const dagen = Math.max(1, Math.min(365, Number(url.searchParams.get('dagen')) || 30));
    const since = `datetime('now','-${dagen} days')`;

    const totaalQ = env.OCAI_DB.prepare(
      `SELECT COUNT(*) AS bezoeken, COUNT(DISTINCT visitor_hash) AS uniek
         FROM bezoeken WHERE ts >= ${since}`,
    ).first<{ bezoeken: number; uniek: number }>();

    const perDagQ = env.OCAI_DB.prepare(
      `SELECT substr(ts,1,10) AS dag,
              COUNT(*)                      AS bezoeken,
              COUNT(DISTINCT visitor_hash)  AS uniek
         FROM bezoeken WHERE ts >= ${since}
        GROUP BY dag ORDER BY dag ASC`,
    ).all<DagRow>();

    const topPathQ = env.OCAI_DB.prepare(
      `SELECT path AS k, COUNT(*) AS n
         FROM bezoeken WHERE ts >= ${since}
        GROUP BY path ORDER BY n DESC LIMIT 20`,
    ).all<CountRow>();

    const landenQ = env.OCAI_DB.prepare(
      `SELECT country AS k, COUNT(DISTINCT visitor_hash) AS n
         FROM bezoeken WHERE ts >= ${since}
        GROUP BY country ORDER BY n DESC LIMIT 50`,
    ).all<CountRow>();

    const stedenQ = env.OCAI_DB.prepare(
      `SELECT (COALESCE(city,'') || ' / ' || COALESCE(country,'')) AS k,
              COUNT(DISTINCT visitor_hash) AS n
         FROM bezoeken WHERE ts >= ${since} AND city IS NOT NULL AND city <> ''
        GROUP BY k ORDER BY n DESC LIMIT 30`,
    ).all<CountRow>();

    const referrersQ = env.OCAI_DB.prepare(
      `SELECT referrer_host AS k, COUNT(*) AS n
         FROM bezoeken WHERE ts >= ${since} AND referrer_host IS NOT NULL
        GROUP BY referrer_host ORDER BY n DESC LIMIT 20`,
    ).all<CountRow>();

    const laatsteQ = env.OCAI_DB.prepare(
      `SELECT ts, path, country, city, referrer_host
         FROM bezoeken WHERE ts >= ${since}
        ORDER BY ts DESC LIMIT 50`,
    ).all<{ ts: string; path: string; country: string | null; city: string | null; referrer_host: string | null }>();

    const [totaal, perDag, topPath, landen, steden, referrers, laatste] = await Promise.all([
      totaalQ,
      perDagQ,
      topPathQ,
      landenQ,
      stedenQ,
      referrersQ,
      laatsteQ,
    ]);

    return json({
      ok: true,
      periode_dagen: dagen,
      totaal: totaal ?? { bezoeken: 0, uniek: 0 },
      per_dag: perDag.results ?? [],
      top_paths: topPath.results ?? [],
      landen: landen.results ?? [],
      steden: steden.results ?? [],
      referrers: referrers.results ?? [],
      laatste: laatste.results ?? [],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('admin/analytics crashed:', msg);
    return json({ ok: false, fout: `Server-fout: ${msg}` }, 500);
  }
}
