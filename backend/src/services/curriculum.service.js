import { prisma } from '../lib/prisma.js';

/**
 * Total de clases de un curso. Es el denominador del avance de sus grupos:
 * cada grupo se mide contra su propio curso, no contra el curriculo completo.
 */
export function totalClasesDeCurso(courseId) {
  return prisma.class.count({ where: { module: { courseId } } });
}

/**
 * Mapa courseId -> total de clases, para calcular el avance de varios grupos
 * sin lanzar una consulta por grupo.
 */
export async function totalClasesPorCurso(courseIds) {
  const ids = [...new Set(courseIds.filter(Boolean))];
  if (ids.length === 0) return new Map();

  const modulos = await prisma.module.findMany({
    where: { courseId: { in: ids } },
    select: { courseId: true, _count: { select: { clases: true } } },
  });

  const totales = new Map(ids.map((id) => [id, 0]));
  for (const m of modulos) {
    totales.set(m.courseId, (totales.get(m.courseId) ?? 0) + m._count.clases);
  }
  return totales;
}

/** Porcentaje de avance, protegido contra la division por cero. */
export function porcentajeAvance(dictadas, total) {
  return total ? Math.round((dictadas / total) * 100) : 0;
}

/** Clases de un curso en el orden en que se dictan. */
export function clasesEnOrden(courseId) {
  return prisma.class.findMany({
    where: { module: { courseId } },
    orderBy: [{ module: { orden: 'asc' } }, { numeroClase: 'asc' }],
    include: { module: { select: { numero: true, nombre: true } } },
  });
}
