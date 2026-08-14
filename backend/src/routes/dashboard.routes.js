import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../lib/http.js';
import { toJSON } from '../lib/serialize.js';
import { authenticate } from '../middleware/auth.js';
import { estadoCartera, periodoActual, resumenFinanciero } from '../services/finance.service.js';

const router = Router();
router.use(authenticate);

/** Porcentaje de avance de un grupo sobre el total de clases del curriculo. */
function avance(dictadas, totalClases) {
  return totalClases ? Math.round((dictadas / totalClases) * 100) : 0;
}

async function dashboardAdmin() {
  const hoy = new Date();
  const desde = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() - 5, 1));

  const [estudiantes, tutores, grupos, modulos, totalClases, sugerenciasNuevas, resumen, cartera] =
    await Promise.all([
      prisma.student.count({ where: { activo: true } }),
      prisma.user.count({ where: { rol: 'TUTOR', activo: true } }),
      prisma.group.findMany({
        where: { activo: true },
        include: {
          tutor: { select: { id: true, nombre: true } },
          _count: { select: { inscripciones: true } },
        },
        orderBy: { nombre: 'asc' },
      }),
      prisma.module.count(),
      prisma.class.count(),
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

  return {
    tarjetas: {
      estudiantesActivos: estudiantes,
      tutores,
      gruposActivos: grupos.length,
      modulos,
      totalClases,
      sugerenciasNuevas,
    },
    finanzas: {
      mesActual: resumen.porMes.at(-1) ?? null,
      totales: resumen.totales,
      porMes: resumen.porMes,
      cartera: cartera.resumen,
    },
    grupos: grupos.map((g) => ({
      id: g.id,
      nombre: g.nombre,
      tutor: g.tutor?.nombre ?? 'Sin tutor',
      estudiantes: g._count.inscripciones,
      clasesDictadas: dictadas.get(g.id) ?? 0,
      avance: avance(dictadas.get(g.id) ?? 0, totalClases),
    })),
  };
}

async function dashboardTutor(userId) {
  const [grupos, totalClases] = await Promise.all([
    prisma.group.findMany({
      where: { tutorId: userId, activo: true },
      include: {
        inscripciones: { where: { estado: 'ACTIVO' }, select: { id: true } },
        progreso: {
          where: { estado: 'DICTADA' },
          orderBy: { fechaDictada: 'desc' },
          include: { clase: { include: { module: { select: { numero: true, nombre: true } } } } },
        },
      },
      orderBy: { nombre: 'asc' },
    }),
    prisma.class.count(),
  ]);

  // Proxima clase pendiente de cada grupo, siguiendo el orden del curriculo.
  const orden = await prisma.class.findMany({
    orderBy: [{ module: { orden: 'asc' } }, { numeroClase: 'asc' }],
    include: { module: { select: { numero: true, nombre: true } } },
  });

  const detalle = grupos.map((g) => {
    const dictadasIds = new Set(g.progreso.map((p) => p.classId));
    const siguiente = orden.find((c) => !dictadasIds.has(c.id)) ?? null;
    return {
      id: g.id,
      nombre: g.nombre,
      diaSemana: g.diaSemana,
      hora: g.hora,
      estudiantes: g.inscripciones.length,
      clasesDictadas: g.progreso.length,
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
      totalClases,
      clasesDictadas: detalle.reduce((acc, g) => acc + g.clasesDictadas, 0),
    },
    grupos: detalle,
  };
}

async function dashboardEstudiante(userId) {
  const [students, totalClases] = await Promise.all([
    prisma.student.findMany({
      where: { userId },
      include: {
        inscripciones: {
          where: { estado: 'ACTIVO' },
          include: { group: { include: { tutor: { select: { nombre: true } } } } },
        },
        asistencias: {
          include: {
            groupProgress: {
              include: { clase: { include: { module: { select: { numero: true, nombre: true } } } } },
            },
          },
        },
      },
    }),
    prisma.class.count(),
  ]);

  const detalle = await Promise.all(
    students.map(async (s) => {
      const groupIds = s.inscripciones.map((i) => i.groupId);
      const progreso = groupIds.length
        ? await prisma.groupProgress.findMany({
            where: { groupId: { in: groupIds }, estado: 'DICTADA' },
            orderBy: { fechaDictada: 'desc' },
            include: { clase: { include: { module: { select: { numero: true, nombre: true } } } } },
          })
        : [];

      const registradas = s.asistencias.length;
      const presentes = s.asistencias.filter((a) => a.asistio).length;

      return {
        id: s.id,
        nombre: [s.nombre, s.apellido].filter(Boolean).join(' '),
        grupos: s.inscripciones.map((i) => ({
          id: i.group.id,
          nombre: i.group.nombre,
          diaSemana: i.group.diaSemana,
          hora: i.group.hora,
          tutor: i.group.tutor?.nombre ?? 'Sin tutor',
        })),
        clasesVistas: progreso.length,
        avance: avance(progreso.length, totalClases),
        ultimaClase: progreso[0]
          ? {
              nombre: progreso[0].clase.nombre,
              modulo: progreso[0].clase.module.numero,
              moduloNombre: progreso[0].clase.module.nombre,
              fecha: progreso[0].fechaDictada,
            }
          : null,
        asistencia: {
          registradas,
          presentes,
          porcentaje: registradas ? Math.round((presentes / registradas) * 100) : null,
        },
      };
    }),
  );

  return { totalClases, estudiantes: detalle };
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
