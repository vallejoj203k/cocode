import { prisma } from '../lib/prisma.js';

/**
 * Cursos que puede ver un estudiante: los que el admin le concedio MAS los de
 * los grupos donde esta inscrito. La union evita el caso absurdo de estar en un
 * grupo y no poder abrir el curriculo de ese mismo curso.
 */
export async function cursosDeEstudiante(studentId) {
  const [concedidos, inscripciones] = await Promise.all([
    prisma.studentCourse.findMany({ where: { studentId }, select: { courseId: true } }),
    prisma.studentGroup.findMany({
      where: { studentId, estado: 'ACTIVO' },
      select: { group: { select: { courseId: true } } },
    }),
  ]);

  return new Set([
    ...concedidos.map((a) => a.courseId),
    ...inscripciones.map((i) => i.group.courseId),
  ]);
}

/** Cursos visibles para una cuenta familiar: la union de los de todos sus hijos. */
export async function cursosDeCuenta(userId) {
  const [concedidos, inscripciones] = await Promise.all([
    prisma.studentCourse.findMany({
      where: { student: { userId } },
      select: { courseId: true },
    }),
    prisma.studentGroup.findMany({
      where: { student: { userId }, estado: 'ACTIVO' },
      select: { group: { select: { courseId: true } } },
    }),
  ]);

  return new Set([
    ...concedidos.map((a) => a.courseId),
    ...inscripciones.map((i) => i.group.courseId),
  ]);
}

/**
 * Cursos que el usuario puede ver en el curriculo.
 * `null` significa "sin restriccion": el equipo (admin y tutores) ve el
 * catalogo completo porque necesita preparar y consultar las clases.
 */
export async function cursosVisibles(user) {
  if (user.rol !== 'ESTUDIANTE') return null;
  return [...(await cursosDeCuenta(user.id))];
}

/** Reemplaza la lista de cursos concedidos a un estudiante. */
export async function sincronizarAccesos(studentId, courseIds, concedidoPorId) {
  const deseados = [...new Set(courseIds)];

  const existentes = await prisma.studentCourse.findMany({
    where: { studentId },
    select: { courseId: true },
  });
  const actuales = new Set(existentes.map((a) => a.courseId));

  const porAgregar = deseados.filter((id) => !actuales.has(id));
  const porQuitar = [...actuales].filter((id) => !deseados.includes(id));

  await prisma.$transaction([
    ...(porQuitar.length
      ? [prisma.studentCourse.deleteMany({ where: { studentId, courseId: { in: porQuitar } } })]
      : []),
    ...porAgregar.map((courseId) =>
      prisma.studentCourse.create({ data: { studentId, courseId, concedidoPorId } }),
    ),
  ]);
}
