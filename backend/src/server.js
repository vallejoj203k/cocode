import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';

const app = createApp();

const server = app.listen(env.port, env.host, () => {
  console.log(`[api] escuchando en ${env.host}:${env.port} (${env.nodeEnv})`);
  // Que version arranco, en los Deploy Logs. Un despliegue que Railway se salta
  // deja la plataforma Online con el codigo viejo y sin ningun error que mirar;
  // esta linea es la forma rapida de comprobar que lo que corre es lo ultimo.
  if (env.version.commit) {
    console.log(
      `[api] version ${env.version.commit}` +
        (env.version.rama ? ` (${env.version.rama})` : '') +
        (env.version.mensaje ? ` — ${env.version.mensaje.split('\n')[0]}` : ''),
    );
  }
});

server.on('error', (error) => {
  console.error('[api] no se pudo abrir el puerto:', error.message);
  process.exit(1);
});

async function shutdown(signal) {
  console.log(`[api] ${signal} recibido, cerrando...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  // Salida forzada si algo queda colgado.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
