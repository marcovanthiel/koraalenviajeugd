import type { Env } from '../index';
import { tokenEquals } from '../security';

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

function unauthorized(): Response {
  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'www-authenticate': 'Bearer realm="ocai-admin"',
      'content-type': 'text/plain; charset=utf-8',
    },
  });
}

function getToken(request: Request): string | null {
  const auth = request.headers.get('authorization');
  if (auth?.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  return null; // query-param-token verwijderd (lekt via logs/Referer); alleen Authorization: Bearer
}

function csv(v: unknown): string {
  const s = String(v ?? '');
  return /[";\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export async function handleAdminExport(request: Request, env: Env): Promise<Response> {
  try {
    if (!env.OCAI_DB) {
      return new Response('Database is niet geconfigureerd.', { status: 503 });
    }
    const token = getToken(request);
    if (!token || !env.OCAI_ADMIN_TOKEN || !tokenEquals(token, env.OCAI_ADMIN_TOKEN)) {
      return unauthorized();
    }

    const result = await env.OCAI_DB.prepare(
      `SELECT ref, organisatie, team,
              nu_a, nu_b, nu_c, nu_d,
              gewenst_a, gewenst_b, gewenst_c, gewenst_d,
              created_at
         FROM inzendingen
        ORDER BY id ASC`,
    ).all<Row>();

    const header = [
      'tijdstip',
      'organisatie',
      'team',
      'nu_familie',
      'nu_adhocratie',
      'nu_markt',
      'nu_hierarchie',
      'gewenst_familie',
      'gewenst_adhocratie',
      'gewenst_markt',
      'gewenst_hierarchie',
    ];
    const lines = [header.map(csv).join(';')];
    for (const r of result.results ?? []) {
      lines.push(
        [
          r.created_at,
          r.organisatie,
          r.team,
          r.nu_a,
          r.nu_b,
          r.nu_c,
          r.nu_d,
          r.gewenst_a,
          r.gewenst_b,
          r.gewenst_c,
          r.gewenst_d,
        ]
          .map(csv)
          .join(';'),
      );
    }
    const body = '﻿' + lines.join('\r\n') + '\r\n';

    return new Response(body, {
      status: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': 'attachment; filename="ocai_resultaten.csv"',
        'cache-control': 'private, no-store',
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('admin/export crashed:', msg);
    return new Response(`Server-fout: ${msg}`, { status: 500 });
  }
}
