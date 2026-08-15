import 'dotenv/config';

const isProd = process.env.NODE_ENV === 'production';

/**
 * Variables sin las cuales el servidor no puede funcionar. Se revisan todas de
 * una vez para que un despliegue mal configurado diga en un solo mensaje que
 * falta, en lugar de fallar de a una con un stack trace.
 */
const OBLIGATORIAS = [
  {
    nombre: 'DATABASE_URL',
    siempre: true,
    ayuda: 'En Railway: añade el plugin PostgreSQL y usa la referencia ${{Postgres.DATABASE_URL}}.',
  },
  {
    nombre: 'JWT_SECRET',
    siempre: false, // en desarrollo hay un valor por defecto
    ayuda: 'Genera una clave larga con: openssl rand -base64 48',
  },
];

const faltantes = OBLIGATORIAS.filter(
  (v) => (v.siempre || isProd) && !process.env[v.nombre],
);

if (faltantes.length > 0) {
  console.error(
    [
      '',
      '========================================================================',
      ' El servidor no puede arrancar: faltan variables de entorno obligatorias',
      '========================================================================',
      ...faltantes.flatMap((v) => [` · ${v.nombre}`, `     ${v.ayuda}`]),
      '',
      ' Documentacion: README.md → Despliegue en Railway',
      '========================================================================',
      '',
    ].join('\n'),
  );
  process.exit(1);
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  // Railway inyecta estos datos del commit desplegado. Sirven para saber de un
  // vistazo si un merge llego de verdad al servidor.
  version: {
    commit: process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    mensaje: process.env.RAILWAY_GIT_COMMIT_MESSAGE ?? null,
    rama: process.env.RAILWAY_GIT_BRANCH ?? null,
    desplegadoEn: process.env.RAILWAY_DEPLOYMENT_ID ? new Date().toISOString() : null,
  },
  isProd,
  port: Number(process.env.PORT ?? 4000),
  // Railway enruta el trafico al contenedor, hay que escuchar en todas las
  // interfaces y no solo en localhost.
  host: process.env.HOST ?? '0.0.0.0',
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-secret-no-usar-en-produccion',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  // Lista separada por comas. "*" permite cualquier origen (util en dev).
  corsOrigins: (process.env.CORS_ORIGINS ?? '*')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  seed: {
    adminEmail: process.env.SEED_ADMIN_EMAIL ?? 'admin@pythonkids.com',
    adminPassword: process.env.SEED_ADMIN_PASSWORD ?? 'Admin123*',
  },
  // Valor mensual de referencia del curso, usado por el estado de cartera.
  mensualidad: Number(process.env.VALOR_MENSUALIDAD ?? 120000),
};
