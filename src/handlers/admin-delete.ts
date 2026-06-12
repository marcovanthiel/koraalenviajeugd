import type { Env } from '../index';
import { tokenEquals } from '../security';

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
  const url = new URL(request.url);
  return url.searchParams.get('token');
}

export async function handleAdminDelete(request: Request, env: Env): Promise<Response> {
  try {
    if (!env.OCAI_DB) {
      return json({ ok: false, fout: 'Database is niet geconfigureerd.' }, 503);
    }
    const token = getToken(request);
    if (!token || !env.OCAI_ADMIN_TOKEN || !tokenEquals(token, env.OCAI_ADMIN_TOKEN)) {
      return json({ ok: false, fout: 'Niet ingelogd.' }, 401);
    }

    const url = new URL(request.url);
    const ref = url.searchParams.get('ref');
    if (!ref || !/^O-[0-9A-F]{4,16}$/.test(ref)) {
      return json({ ok: false, fout: 'Geen geldige referentie.' }, 400);
    }

    const result = await env.OCAI_DB.prepare(`DELETE FROM inzendingen WHERE ref = ?`)
      .bind(ref)
      .run();

    const changes =
      (result.meta as { changes?: number } | undefined)?.changes ?? 0;
    if (changes === 0) {
      return json({ ok: false, fout: 'Inzending niet gevonden.' }, 404);
    }

    return json({ ok: true, ref, verwijderd: changes });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('admin/delete crashed:', msg);
    return json({ ok: false, fout: `Server-fout: ${msg}` }, 500);
  }
}
