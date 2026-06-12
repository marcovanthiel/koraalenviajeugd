import { handleOpslaan } from './handlers/opslaan';
import { handleResultaat } from './handlers/resultaat';
import { handleAdminList } from './handlers/admin-list';
import { handleAdminExport } from './handlers/admin-export';
import { handleAdminDelete } from './handlers/admin-delete';
import { withSecurityHeaders } from './security';

export interface RateLimit {
  limit(opts: { key: string }): Promise<{ success: boolean }>;
}

export interface Env {
  OCAI_DB: D1Database;
  OCAI_ADMIN_TOKEN: string;
  ASSETS: Fetcher;
  OPSLAAN_RL: RateLimit;
}

async function route(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  if (url.hostname === 'www.koraalenviajeugd.nl') {
    url.hostname = 'koraalenviajeugd.nl';
    return Response.redirect(url.toString(), 301);
  }

  const path = url.pathname;
  const method = request.method;

  if (path === '/api/opslaan' && method === 'POST') {
    return handleOpslaan(request, env);
  }
  if (path === '/api/resultaat' && method === 'GET') {
    return handleResultaat(request, env);
  }
  if (path === '/api/admin/list' && method === 'GET') {
    return handleAdminList(request, env);
  }
  if (path === '/api/admin/export' && method === 'GET') {
    return handleAdminExport(request, env);
  }
  if (path === '/api/admin/delete' && method === 'DELETE') {
    return handleAdminDelete(request, env);
  }

  return env.ASSETS.fetch(request);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const res = await route(request, env);
    return withSecurityHeaders(res);
  },
} satisfies ExportedHandler<Env>;
