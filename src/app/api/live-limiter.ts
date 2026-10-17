// Un solo limitador para todas las llamadas EN VIVO a Jev desde la URL pública (/api/decide y /api/try).
// 30 por IP por hora y 500 al día en total; las reproducciones de grabaciones no cuentan.
import { createLimiter } from '../../engine/rate-limit.ts';

export const liveLimiter = createLimiter({ perIpPerHour: 30, globalPerDay: 500 });

export function clientIp(req: Request) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
}
