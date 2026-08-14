import 'dotenv/config';

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Falta la variable de entorno obligatoria: ${name}`);
  }
  return value;
}

const isProd = process.env.NODE_ENV === 'production';

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProd,
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required('DATABASE_URL'),
  jwt: {
    // En produccion nunca usamos el secreto por defecto.
    secret: isProd ? required('JWT_SECRET') : (process.env.JWT_SECRET ?? 'dev-secret-no-usar-en-produccion'),
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
