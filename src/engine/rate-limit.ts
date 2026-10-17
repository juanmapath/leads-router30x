// Límite de llamadas en vivo a Jev desde la URL pública (las reproducciones de grabaciones no cuentan).
// En memoria: en serverless vale por instancia, suficiente para un demo; en producción iría en Redis/KV.

export interface Limiter {
  check(ip: string, now?: number): { ok: true } | { ok: false; retryAfterSec: number; reason: 'ip' | 'global' };
}

const HOUR = 3_600_000;
const DAY = 86_400_000;

export function createLimiter({ perIpPerHour = 30, globalPerDay = 500 } = {}): Limiter {
  const byIp = new Map<string, number[]>(); // marcas de tiempo de la última hora (ventana deslizante)
  let day = -1;
  let dayCount = 0; // tope global por día calendario (UTC)

  return {
    check(ip, now = Date.now()) {
      const today = Math.floor(now / DAY);
      if (today !== day) { day = today; dayCount = 0; }
      if (dayCount >= globalPerDay) return { ok: false, reason: 'global', retryAfterSec: Math.ceil(((today + 1) * DAY - now) / 1000) };

      const recent = (byIp.get(ip) ?? []).filter((t) => t > now - HOUR);
      if (recent.length >= perIpPerHour) {
        byIp.set(ip, recent);
        return { ok: false, reason: 'ip', retryAfterSec: Math.ceil((recent[0] + HOUR - now) / 1000) };
      }
      recent.push(now);
      byIp.set(ip, recent);
      dayCount++;
      return { ok: true };
    },
  };
}
