/**
 * Comprobacion previa a `prisma migrate deploy`.
 *
 * Sin esto, una DATABASE_URL vacia la reporta Prisma con un error de validacion
 * del esquema ("get-config wasm", codigo P1012) que apunta a la linea 10 de
 * schema.prisma. El esquema no tiene nada malo: lo que falta es la variable, y
 * el mensaje manda a mirar donde no es.
 *
 * Es el fallo tipico despues de borrar y recrear la base en Railway: el backend
 * conserva la referencia al servicio anterior, que ya no existe, y Railway la
 * resuelve como cadena vacia en lugar de avisar.
 */
import 'dotenv/config';

const url = (process.env.DATABASE_URL ?? '').trim();

function abortar(motivo, pasos) {
  console.error(
    [
      '',
      '========================================================================',
      ' El backend no puede arrancar: la base de datos no esta conectada',
      '========================================================================',
      ` Motivo: ${motivo}`,
      '',
      ' Como se arregla en Railway:',
      ...pasos.map((p) => `   ${p}`),
      '',
      ' Documentacion: README.md → Despliegue en Railway',
      '========================================================================',
      '',
    ].join('\n'),
  );
  process.exit(1);
}

if (!url) {
  abortar(
    process.env.DATABASE_URL === undefined
      ? 'la variable DATABASE_URL no esta definida.'
      : 'la variable DATABASE_URL existe pero llega vacia (referencia rota).',
    [
      '1. Abre el servicio del backend → pestana Variables.',
      '2. Borra la variable DATABASE_URL que tenga ahora.',
      '3. Anadela de nuevo con "Add Variable Reference" eligiendo el servicio',
      '   Postgres actual y su variable DATABASE_URL. Escribirla a mano no basta:',
      '   tiene que ser una referencia, y el nombre del servicio debe coincidir',
      '   con el que aparece hoy en el lienzo (al recrear la base suele cambiar).',
      '4. Guarda y vuelve a desplegar. La flecha entre los dos servicios aparece',
      '   sola cuando la referencia es correcta: si no la ves, no quedo enlazada.',
    ],
  );
}

if (!/^postgres(ql)?:\/\//.test(url)) {
  abortar('DATABASE_URL no parece una direccion de PostgreSQL.', [
    '1. Debe empezar por postgresql:// (o postgres://).',
    '2. Usa la referencia ${{Postgres.DATABASE_URL}} del servicio Postgres,',
    '   no DATABASE_PUBLIC_URL ni una cadena copiada a mano.',
  ]);
}

console.log('[preflight] DATABASE_URL presente, aplicando migraciones...');
