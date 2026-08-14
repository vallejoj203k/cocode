/**
 * Paso previo al arranque del servidor.
 *
 * En Railway no hay una consola comoda para lanzar comandos sueltos, asi que
 * con SEED_ON_START=true el primer despliegue siembra el curriculo y la cuenta
 * de administrador por si solo. El seed es idempotente, pero conviene apagar la
 * variable despues del primer arranque para no sembrar en cada despliegue.
 */
import { seed } from './seed.js';

if (process.env.SEED_ON_START === 'true') {
  console.log('[bootstrap] SEED_ON_START=true, sembrando la base de datos...');
  await seed();
} else {
  console.log('[bootstrap] SEED_ON_START no esta activo, se omite el seed.');
}
