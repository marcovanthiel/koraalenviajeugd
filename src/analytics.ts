import type { Env } from './index';

const SKIP_PREFIXES = ['/api/', '/admin', '/favicon/', '/assets/'];

const BOT_UA_RE = /bot|crawler|spider|crawling|preview|scraper|wget|curl|http-client|headless|monitor|uptime/i;

function shouldLog(request: Request, response: Response): boolean {
  if (request.method !== 'GET') return false;
  const url = new URL(request.url);
  if (SKIP_PREFIXES.some((p) => url.pathname.startsWith(p))) return false;

  const ct = (response.headers.get('content-type') || '').toLowerCase();
  if (!ct.startsWith('text/html')) return false;

  if (response.status < 200 || response.status >= 400) return false;

  const cf = (request as Request & { cf?: { botManagement?: { verifiedBot?: boolean } } }).cf;
  if (cf?.botManagement?.verifiedBot) return false;

  const ua = request.headers.get('user-agent') || '';
  if (!ua) return false;
  if (BOT_UA_RE.test(ua)) return false;

  return true;
}

async function hashVisitor(ip: string, salt: string): Promise<string> {
  const date = new Date().toISOString().slice(0, 10);
  const data = new TextEncoder().encode(ip + '|' + date + '|' + salt);
  const buf = await crypto.subtle.digest('SHA-256', data);
  let hex = '';
  for (const b of new Uint8Array(buf)) hex += b.toString(16).padStart(2, '0');
  return hex.slice(0, 16);
}

function refererHost(request: Request): string | null {
  const ref = request.headers.get('referer');
  if (!ref) return null;
  try {
    const r = new URL(ref);
    const host = r.hostname.toLowerCase();
    if (host === 'koraalenviajeugd.nl' || host === 'www.koraalenviajeugd.nl') return null;
    return host;
  } catch {
    return null;
  }
}

export async function logVisit(request: Request, response: Response, env: Env): Promise<void> {
  if (!shouldLog(request, response)) return;
  if (!env.OCAI_DB || !env.OCAI_ADMIN_TOKEN) return;

  const url = new URL(request.url);
  const ip = request.headers.get('cf-connecting-ip') || '0.0.0.0';
  const cf =
    (request as Request & { cf?: { country?: string; city?: string } }).cf || {};
  const country = cf.country || null;
  const city = cf.city || null;
  const ref = refererHost(request);
  const hash = await hashVisitor(ip, env.OCAI_ADMIN_TOKEN);

  try {
    await env.OCAI_DB.prepare(
      `INSERT INTO bezoeken (path, country, city, referrer_host, visitor_hash)
       VALUES (?, ?, ?, ?, ?)`,
    )
      .bind(url.pathname, country, city, ref, hash)
      .run();
  } catch (err) {
    console.error('logVisit failed:', err instanceof Error ? err.message : String(err));
  }
}
