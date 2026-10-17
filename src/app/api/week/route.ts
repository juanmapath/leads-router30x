import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// GET → "La semana de 30X", precalculada en el build (scripts/build-week.ts → data/week.json) desde las
// grabaciones. Si no existe, 500: nunca se inventa una semana ni se rellenan grabaciones faltantes.
export async function GET() {
  const file = path.join(process.cwd(), 'data', 'week.json');
  if (!existsSync(file)) {
    return NextResponse.json({ error: 'Falta data/week.json: corre npm run week (faltan grabaciones o no se precalculó).' }, { status: 500 });
  }
  return new NextResponse(readFileSync(file, 'utf8'), { headers: { 'content-type': 'application/json' } });
}
