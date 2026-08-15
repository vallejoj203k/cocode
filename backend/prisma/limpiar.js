/**
 * Borra datos de prueba para dejar la plataforma lista con informacion real.
 *
 * Por defecto SOLO SIMULA: enumera lo que borraria y no toca nada. Para que
 * borre de verdad hay que pasar `--confirmar` (o LIMPIAR_CONFIRMAR=true).
 *
 *   node prisma/limpiar.js                 # simula el borrado de los datos demo
 *   node prisma/limpiar.js --confirmar     # borra los datos demo
 *   node prisma/limpiar.js --todo          # simula el borrado de TODO lo operativo
 *   node prisma/limpiar.js --todo --confirmar
 *
 * Nunca borra el curriculo (cursos, modulos y clases) ni las cuentas de
 * administrador: son contenido y accesos reales.
 */
import { pathToFileURL } from 'node:url';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fixtures que crea prisma/seed.js con SEED_DEMO=true.
const CORREOS_DEMO = [
  'ana.tutora@pythonkids.com',
  'carlos.tutor@pythonkids.com',
  'familia.gomez@correo.com',
  'familia.perez@correo.com',
  'familia.lopez@correo.com',
];
const ESTUDIANTES_DEMO = [
  ['Sofia', 'Gomez'],
  ['Mateo', 'Gomez'],
  ['Valentina', 'Perez'],
  ['Samuel', 'Lopez'],
  ['Isabella', 'Torres'],
  ['Tomas', 'Rojas'],
];
const GRUPOS_DEMO = ['Grupo Serpientes', 'Grupo Pitones'];

/** Que se borraria en modo demo. */
async function inventarioDemo() {
  const [usuarios, estudiantes, grupos] = await Promise.all([
    prisma.user.findMany({
      where: { email: { in: CORREOS_DEMO } },
      select: { id: true, nombre: true, email: true },
    }),
    prisma.student.findMany({
      where: { OR: ESTUDIANTES_DEMO.map(([nombre, apellido]) => ({ nombre, apellido })) },
      select: { id: true, nombre: true, apellido: true },
    }),
    prisma.group.findMany({ where: { nombre: { in: GRUPOS_DEMO } }, select: { id: true, nombre: true } }),
  ]);

  const studentIds = estudiantes.map((e) => e.id);
  const [pagos, sugerencias] = await Promise.all([
    prisma.payment.count({ where: { studentId: { in: studentIds } } }),
    prisma.suggestion.count({ where: { userId: { in: usuarios.map((u) => u.id) } } }),
  ]);

  return { usuarios, estudiantes, grupos, pagos, sugerencias, gastos: 0 };
}

/** Que se borraria en modo total. */
async function inventarioTodo() {
  const [usuarios, estudiantes, grupos, pagos, gastos, sugerencias] = await Promise.all([
    prisma.user.findMany({ where: { rol: { not: 'ADMIN' } }, select: { id: true, nombre: true, email: true } }),
    prisma.student.findMany({ select: { id: true, nombre: true, apellido: true } }),
    prisma.group.findMany({ select: { id: true, nombre: true } }),
    prisma.payment.count(),
    prisma.expense.count(),
    prisma.suggestion.count(),
  ]);
  return { usuarios, estudiantes, grupos, pagos, gastos, sugerencias };
}

function describir(inv, modo) {
  const nombre = (e) => [e.nombre, e.apellido].filter(Boolean).join(' ');
  console.log(`\nModo: ${modo === 'todo' ? 'TODOS los datos operativos' : 'solo los datos de ejemplo'}`);
  console.log('Se borraria:');
  console.log(`  · ${inv.estudiantes.length} estudiante(s): ${inv.estudiantes.map(nombre).join(', ') || '—'}`);
  console.log(`  · ${inv.grupos.length} grupo(s): ${inv.grupos.map((g) => g.nombre).join(', ') || '—'}`);
  console.log(`  · ${inv.usuarios.length} cuenta(s): ${inv.usuarios.map((u) => u.email).join(', ') || '—'}`);
  console.log(`  · ${inv.pagos} pago(s), ${inv.gastos} gasto(s), ${inv.sugerencias} sugerencia(s)`);
  console.log('\nSe conserva: el curriculo completo (cursos, modulos y clases) y las cuentas de administrador.');
}

async function borrar(inv, modo) {
  const studentIds = inv.estudiantes.map((e) => e.id);
  const groupIds = inv.grupos.map((g) => g.id);
  const userIds = inv.usuarios.map((u) => u.id);

  // El orden respeta las llaves foraneas; el resto lo resuelve el cascade.
  await prisma.$transaction([
    prisma.attendance.deleteMany(
      modo === 'todo' ? {} : { where: { studentId: { in: studentIds } } },
    ),
    prisma.groupProgress.deleteMany(modo === 'todo' ? {} : { where: { groupId: { in: groupIds } } }),
    prisma.payment.deleteMany(modo === 'todo' ? {} : { where: { studentId: { in: studentIds } } }),
    ...(modo === 'todo' ? [prisma.expense.deleteMany({})] : []),
    prisma.suggestion.deleteMany(modo === 'todo' ? {} : { where: { userId: { in: userIds } } }),
    prisma.studentAccess.deleteMany(
      modo === 'todo' ? {} : { where: { studentId: { in: studentIds } } },
    ),
    prisma.studentGroup.deleteMany(
      modo === 'todo' ? {} : { where: { OR: [{ studentId: { in: studentIds } }, { groupId: { in: groupIds } }] } },
    ),
    prisma.student.deleteMany(modo === 'todo' ? {} : { where: { id: { in: studentIds } } }),
    prisma.group.deleteMany(modo === 'todo' ? {} : { where: { id: { in: groupIds } } }),
    prisma.user.deleteMany({ where: { id: { in: userIds } } }),
  ]);
}

export async function limpiar({ modo = 'demo', confirmar = false } = {}) {
  try {
    const inv = modo === 'todo' ? await inventarioTodo() : await inventarioDemo();
    describir(inv, modo);

    const nada =
      inv.estudiantes.length + inv.grupos.length + inv.usuarios.length + inv.pagos + inv.gastos === 0;
    if (nada) {
      console.log('\nNo hay nada que borrar.');
      return;
    }

    if (!confirmar) {
      console.log('\nSIMULACION: no se borro nada. Repite con --confirmar para ejecutarlo.');
      return;
    }

    await borrar(inv, modo);
    console.log('\nListo: los datos indicados fueron borrados.');
  } finally {
    await prisma.$disconnect();
  }
}

const invocadaDirectamente =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invocadaDirectamente) {
  limpiar({
    modo: process.argv.includes('--todo') ? 'todo' : 'demo',
    confirmar: process.argv.includes('--confirmar') || process.env.LIMPIAR_CONFIRMAR === 'true',
  }).catch((error) => {
    console.error('Error al limpiar:', error);
    process.exit(1);
  });
}
