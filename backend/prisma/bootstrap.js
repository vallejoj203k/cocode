/**
 * Paso previo al arranque del servidor.
 *
 * En Railway no hay una consola comoda para lanzar comandos sueltos, asi que
 * las dos tareas de mantenimiento se disparan con variables de entorno:
 *
 * - SEED_ON_START=true siembra el curriculo y la cuenta de administrador.
 * - LIMPIAR_AL_ARRANCAR=demo|todo borra datos de prueba. Es DESTRUCTIVO, asi
 *   que ademas exige LIMPIAR_CONFIRMAR=true; sin ella solo lista en el log lo
 *   que borraria.
 *
 * Conviene quitar ambas despues de usarlas: no tiene sentido repetirlas en cada
 * despliegue.
 */
import { seed } from './seed.js';
import { limpiar } from './limpiar.js';

const modoLimpieza = process.env.LIMPIAR_AL_ARRANCAR;

if (modoLimpieza === 'demo' || modoLimpieza === 'todo') {
  console.log(`[bootstrap] LIMPIAR_AL_ARRANCAR=${modoLimpieza}`);
  await limpiar({
    modo: modoLimpieza,
    confirmar: process.env.LIMPIAR_CONFIRMAR === 'true',
  });
} else if (modoLimpieza) {
  console.warn(`[bootstrap] LIMPIAR_AL_ARRANCAR="${modoLimpieza}" no es valido; usa "demo" o "todo".`);
}

if (process.env.SEED_ON_START === 'true') {
  console.log('[bootstrap] SEED_ON_START=true, sembrando la base de datos...');
  await seed();
} else {
  console.log('[bootstrap] SEED_ON_START no esta activo, se omite el seed.');
}
