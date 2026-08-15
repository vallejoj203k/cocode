import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../lib/http.js';
import { toJSON } from '../lib/serialize.js';
import { authenticate } from '../middleware/auth.js';
import { estadoCartera, periodoActual, resumenFinanciero } from '../services/finance.service.js';
import {
  clasesEnOrden,
  porcentajeAvance as avance,
  totalClasesPorCurso,
} from '../services/curriculum.service.js';

const router = Router();
router.use(authenticate);

async function dashboardAdmin() {
  const hoy = new Date();
  const desde = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() - 5, 1));

  const [estudiantes, tutores, grupos, cursos, sugerenciasNuevas, resumen, cartera] =
    await Promise.all([
      prisma.student.count({ where: { activo: true } }),
      prisma.user.count({ where: { rol: 'TUTOR', activo: true } }),
      prisma.group.findMany({
        where: { activo: true },
        include: {
          tutor: { select: { id: true, nombre: true } },
          course: { select: { id: true, nombre: true } },
          _count: { select: { inscripciones: true } },
        },
        orderBy: { nombre: 'asc' },
      }),
      prisma.course.findMany({
        where: { activo: true },
        orderBy: { orden: 'asc' },
        include: {
          _count: { select: { modulos: true, grupos: true } },
          modulos: { select: { _count: { select: { clases: true } } } },
        },
      }),
      prisma.suggestion.count({ where: { estado: 'NUEVA' } }),
      resumenFinanciero({ desde, hasta: hoy }),
      estadoCartera(periodoActual()),
    ]);

  const dictadasPorGrupo = await prisma.groupProgress.groupBy({
    by: ['groupId'],
    where: { estado: 'DICTADA', groupId: { in: grupos.map((g) => g.id) } },
    _count: { _all: true },
  });
  const dictadas = new Map(dictadasPorGrupo.map((d) => [d.groupId, d._count._all]));

  // Cada grupo se mide contra el total de clases de su propio curso.
  const totalesPorCurso = await totalClasesPorCurso(grupos.map((g) => g.courseId));

  const detalleCursos = cursos.map(({ modulos, _count, ...curso }) => ({
    id: curso.id,
    nombre: curso.nombre,
    modulos: _count.modulos,
    grupos: _count.grupos,
    totalClases: modulos.reduce((acc, m) => acc + m._count.clases, 0),
  }));

  return {
    tarjetas: {
      estudiantesActivos: estudiantes,
      tutores,
      gruposActivos: grupos.length,
      cursos: detalleCursos.length,
      modulos: detalleCursos.reduce((acc, c) => acc + c.modulos, 0),
      totalClases: detalleCursos.reduce((acc, c) => acc + c.totalClases, 0),
      sugerenciasNuevas,
    },
    cursos: detalleCursos,
    finanzas: {
      mesActual: resumen.porMes.at(-1) ?? null,
      totales: resumen.totales,
      porMes: resumen.porMes,
      cartera: cartera.resumen,
    },
    grupos: grupos.map((g) => ({
      id: g.id,
      nombre: g.nombre,
      curso: g.course.nombre,
      tutor: g.tutor?.nombre ?? 'Sin tutor',
      estudiantes: g._count.inscripciones,
      clasesDictadas: dictadas.get(g.id) ?? 0,
      totalClases: totalesPorCurso.get(g.courseId) ?? 0,
      avance: avance(dictadas.get(g.id) ?? 0, totalesPorCurso.get(g.courseId) ?? 0),
    })),
  };
}

async function dashboardTutor(userId) {
  const grupos = await prisma.group.findMany({
    where: { tutorId: userId, activo: true },
    include: {
      course: { select: { id: true, nombre: true } },
      inscripciones: { where: { estado: 'ACTIVO' }, select: { id: true } },
      progreso: {
        where: { estado: 'DICTADA' },
        orderBy: { fechaDictada: 'desc' },
        include: { clase: { include: { module: { select: { numero: true, nombre: true } } } } },
      },
    },
    orderBy: { nombre: 'asc' },
  });

  const cursoIds = [...new Set(grupos.map((g) => g.courseId))];
  const totalesPorCurso = await totalClasesPorCurso(cursoIds);

  // Orden del curriculo de cada curso, para saber cual es la proxima clase.
  const ordenPorCurso = new Map(
    await Promise.all(cursoIds.map(async (id) => [id, await clasesEnOrden(id)])),
  );

  const detalle = grupos.map((g) => {
    const totalClases = totalesPorCurso.get(g.courseId) ?? 0;
    const dictadasIds = new Set(g.progreso.map((p) => p.classId));
    const siguiente = (ordenPorCurso.get(g.courseId) ?? []).find((c) => !dictadasIds.has(c.id)) ?? null;

    return {
      id: g.id,
      nombre: g.nombre,
      curso: g.course.nombre,
      diaSemana: g.diaSemana,
      hora: g.hora,
      enlaceReunion: g.enlaceReunion,
      estudiantes: g.inscripciones.length,
      clasesDictadas: g.progreso.length,
      totalClases,
      avance: avance(g.progreso.length, totalClases),
      ultimaClase: g.progreso[0]
        ? {
            nombre: g.progreso[0].clase.nombre,
            modulo: g.progreso[0].clase.module.numero,
            fecha: g.progreso[0].fechaDictada,
          }
        : null,
      proximaClase: siguiente
        ? { id: siguiente.id, nombre: siguiente.nombre, modulo: siguiente.module.numero }
        : null,
    };
  });

  return {
    tarjetas: {
      gruposAsignados: detalle.length,
      estudiantes: detalle.reduce((acc, g) => acc + g.estudiantes, 0),
      cursos: cursoIds.length,
      clasesDictadas: detalle.reduce((acc, g) => acc + g.clasesDictadas, 0),
    },
    grupos: detalle,
  };
}

async function dashboardEstudiante(userId) {
  const students = await prisma.student.findMany({
    where: { userId },
    orderBy: { nombre: 'asc' },
    include: {
      inscripciones: {
        where: { estado: 'ACTIVO' },
        include: {
          group: {
            include: {
              tutor: { select: { nombre: true } },
              course: { select: { id: true, nombre: true } },
            },
          },
        },
      },
      asistencias: { select: { asistio: true } },
    },
  });

  const totalesPorCurso = await totalClasesPorCurso(
    students.flatMap((s) => s.inscripciones.map((i) => i.group.courseId)),
  );

  const detalle = await Promise.all(
    students.map(async (s) => {
      // Un estudiante puede llevar varios cursos a la vez: cada uno tiene su
      // propio avance, medido contra las clases de ese curso.
      const cursos = await Promise.all(
        s.inscripciones.map(async (i) => {
          const progreso = await prisma.groupProgress.findMany({
            where: { groupId: i.groupId, estado: 'DICTADA' },
            orderBy: { fechaDictada: 'desc' },
            include: { clase: { include: { module: { select: { numero: true, nombre: true } } } } },
          });
          const totalClases = totalesPorCurso.get(i.group.courseId) ?? 0;

          return {
            grupoId: i.group.id,
            grupoNombre: i.group.nombre,
            cursoNombre: i.group.course.nombre,
            diaSemana: i.group.diaSemana,
            hora: i.group.hora,
            enlaceReunion: i.group.enlaceReunion,
            tutor: i.group.tutor?.nombre ?? 'Sin tutor',
            clasesVistas: progreso.length,
            totalClases,
            avance: avance(progreso.length, totalClases),
            ultimaClase: progreso[0]
              ? {
                  nombre: progreso[0].clase.nombre,
                  modulo: progreso[0].clase.module.numero,
                  moduloNombre: progreso[0].clase.module.nombre,
                  fecha: progreso[0].fechaDictada,
                }
              : null,
          };
        }),
      );

      const registradas = s.asistencias.length;
      const presentes = s.asistencias.filter((a) => a.asistio).length;

      return {
        id: s.id,
        nombre: [s.nombre, s.apellido].filter(Boolean).join(' '),
        cursos,
        asistencia: {
          registradas,
          presentes,
          porcentaje: registradas ? Math.round((presentes / registradas) * 100) : null,
        },
      };
    }),
  );

  return { estudiantes: detalle };
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    if (req.user.rol === 'ADMIN') return res.json(toJSON(await dashboardAdmin()));
    if (req.user.rol === 'TUTOR') return res.json(toJSON(await dashboardTutor(req.user.id)));
    return res.json(toJSON(await dashboardEstudiante(req.user.id)));
  }),
);

export default router;
