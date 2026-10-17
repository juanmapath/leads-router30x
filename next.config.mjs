/** @type {import('next').NextConfig} */
export default {
  // Las grabaciones de Jev (data/) viajan con las rutas /api en Vercel para el modo replay.
  outputFileTracingIncludes: { '/api/**': ['./data/**'] },
};
