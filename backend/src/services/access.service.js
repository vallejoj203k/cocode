import { prisma } from '../lib/prisma.js';

/**
 * Lo que un estudiante tiene habilitado, en los tres niveles que se venden.
 *
 * - `cursos`: acceso al curso entero, sea por compra o por estar inscrito en un
 *   grupo de ese curso (la inscripcion implica el curso completo).
 * - `modulos` y `clases`: compras sueltas.
 */
async function accesosDe(where) {
  const [concedidos, inscripciones] = await Promise.all([
    prisma.studentAccess.findMany({
      where,
      select: {
        courseId: true,
        moduleId: true,
        classId: true,
        module: { select: { courseId: true } },
        clase: { select: { moduleId: true, module: { select: { courseId: true } } } },
      },
    }),
    prisma.studentGroup.findMany({
      where: { ...where, estado: 'ACTIVO' },
      select: { group: { select: { courseId: true } } },
    }),
  ]);

  const cursos = new Set(inscripciones.map((i) => i.group.courseId));
  const modulos = new Set();
  const clases = new Set();
  // Cursos con acceso parcial: se ven en el catalogo, pero con clases bloqueadas.
  const cursosParciales = new Set();

  for (const acceso of concedidos) {
    if (acceso.courseId) cursos.add(acceso.courseId);
    if (acceso.moduleId) {
      modulos.add(acceso.moduleId);
      if (acceso.module) cursosParciales.add(acceso.module.courseId);
    }
    if (acceso.classId) {
      clases.add(acceso.classId);
      if (acceso.clase?.module) cursosParciales.add(acceso.clase.module.courseId);
    }
  }

  return { cursos, modulos, clases, cursosParciales };
}

export const accesosDeEstudiante = (studentId) => accesosDe({ studentId });

/** Acceso de una cuenta familiar: la union del de todos sus hijos. */
export const accesosDeCuenta = (userId) => accesosDe({ student: { userId } });

/**
 * Cursos que el usuario puede ver en el curriculo. `null` significa "sin
 * restriccion": el equipo (admin y tutores) ve el catalogo completo porque
 * necesita preparar y consultar las clases.
 */
export async function cursosVisibles(user) {
  if (user.rol !== 'ESTUDIANTE') return null;
  const { cursos, cursosParciales } = await accesosDeCuenta(user.id);
  return [...new Set([...cursos, ...cursosParciales])];
}

/**
 * Marca cada clase como accesible o bloqueada. Las bloqueadas se muestran con
 * candado en lugar de ocultarse: si se escondieran, el plan del curso quedaria
 * con huecos y la familia no sabria que puede comprar.
 */
export async function marcarClasesAccesibles(user, modulos) {
  if (user.rol !== 'ESTUDIANTE') {
    return modulos.map((m) => ({
      ...m,
      clases: m.clases.map((c) => ({ ...c, accesible: true })),
    }));
  }

  const { cursos, modulos: modulosOk, clases } = await accesosDeCuenta(user.id);

  return modulos.map((m) => ({
    ...m,
    clases: m.clases.map((c) => {
      const accesible = cursos.has(m.courseId) || modulosOk.has(m.id) || clases.has(c.id);
      // De una clase bloqueada solo se publica el titulo: el contenido es
      // justamente lo que se esta vendiendo.
      return accesible
        ? { ...c, accesible: true }
        : {
            id: c.id,
            numeroClase: c.numeroClase,
            nombre: c.nombre,
            moduleId: c.moduleId,
            duracionMinutos: c.duracionMinutos,
            accesible: false,
          };
    }),
  }));
}

/** true si el usuario puede abrir el detalle completo de una clase. */
export async function puedeVerClase(user, clase) {
  if (user.rol !== 'ESTUDIANTE') return true;
  const { cursos, modulos, clases } = await accesosDeCuenta(user.id);
  return cursos.has(clase.module.courseId) || modulos.has(clase.moduleId) || clases.has(clase.id);
}

/**
 * Reemplaza los cursos completos concedidos a un estudiante. No toca los
 * accesos de modulo o clase sueltos, que se conceden al registrar su pago.
 */
export async function sincronizarAccesos(studentId, courseIds, concedidoPorId) {
  const deseados = [...new Set(courseIds)];

  const existentes = await prisma.studentAccess.findMany({
    where: { studentId, courseId: { not: null } },
    select: { courseId: true },
  });
  const actuales = new Set(existentes.map((a) => a.courseId));

  const porAgregar = deseados.filter((id) => !actuales.has(id));
  const porQuitar = [...actuales].filter((id) => !deseados.includes(id));

  await prisma.$transaction([
    ...(porQuitar.length
      ? [prisma.studentAccess.deleteMany({ where: { studentId, courseId: { in: porQuitar } } })]
      : []),
    ...porAgregar.map((courseId) =>
      prisma.studentAccess.create({ data: { studentId, courseId, concedidoPorId } }),
    ),
  ]);
}

/**
 * Concede el acceso que compra un pago. Es idempotente: si el estudiante ya
 * tenia ese acceso no se duplica, solo se deja constancia del pago que lo
 * origino.
 */
export async function concederAccesoPorPago(pago, concedidoPorId) {
  const destino =
    pago.tipo === 'CURSO_COMPLETO' && pago.courseId
      ? { courseId: pago.courseId }
      : pago.tipo === 'MODULO' && pago.moduleId
        ? { moduleId: pago.moduleId }
        : pago.tipo === 'CLASE' && pago.classId
          ? { classId: pago.classId }
          : null;

  // Una MENSUALIDAD no habilita contenido nuevo: renueva lo que ya tiene.
  if (!destino) return null;

  const [campo, valor] = Object.entries(destino)[0];
  const existente = await prisma.studentAccess.findFirst({
    where: { studentId: pago.studentId, [campo]: valor },
  });
  if (existente) return existente;

  return prisma.studentAccess.create({
    data: {
      studentId: pago.studentId,
      ...destino,
      origenPagoId: pago.id,
      concedidoPorId,
      nota: 'Habilitado por el pago registrado',
    },
  });
}
