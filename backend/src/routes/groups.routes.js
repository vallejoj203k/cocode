import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { ApiError, asyncHandler } from '../lib/http.js';
import { toJSON } from '../lib/serialize.js';
import { accountStudentIds, authenticate, authorize, isAdmin, isTutor } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

const DIAS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];

const groupSchema = z.object({
  nombre: z.string().min(2, 'El nombre del grupo es obligatorio'),
  diaSemana: z.enum(DIAS),
  hora: z.string().regex(/^\d{2}:\d{2}$/, 'La hora debe tener formato HH:MM'),
  fechaInicio: z.coerce.date(),
  tutorId: z.string().optional().nullable(),
  cupoMaximo: z.coerce.number().int().positive().optional().nullable(),
  notas: z.string().optional().nullable(),
  activo: z.boolean().optional(),
});

const progressSchema = z.object({
  estado: z.enum(['PENDIENTE', 'DICTADA', 'CANCELADA']),
  fechaDictada: z.coerce.date().optional().nullable(),
  notas: z.string().optional().nullable(),
});

const attendanceSchema = z.object({
  asistencias: z
    .array(
      z.object({
        studentId: z.string().min(1),
        asistio: z.boolean(),
        nota: z.string().optional().nullable(),
      }),
    )
    .min(1, 'Debes enviar al menos un registro de asistencia'),
});

/** Filtro de grupos visibles segun el rol. */
async function scopeForUser(req) {
  if (isAdmin(req)) return {};
  if (isTutor(req)) return { tutorId: req.user.id };
  const studentIds = await accountStudentIds(req.user.id);
  return { inscripciones: { some: { studentId: { in: studentIds } } } };
}

/** Carga el grupo verificando que el usuario pueda verlo. */
async function loadVisibleGroup(req, groupId) {
  const scope = await scopeForUser(req);
  const group = await prisma.group.findFirst({ where: { AND: [{ id: groupId }, scope] } });
  if (!group) throw ApiError.notFound('Grupo no encontrado');
  return group;
}

/** Solo el admin o el tutor asignado pueden modificar el avance del grupo. */
function assertCanTeach(req, group) {
  if (isAdmin(req)) return;
  if (isTutor(req) && group.tutorId === req.user.id) return;
  throw ApiError.forbidden('Solo el tutor asignado o un admin pueden registrar el avance');
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const scope = await scopeForUser(req);
    const where = {
      ...scope,
      ...(req.query.activo !== undefined ? { activo: req.query.activo === 'true' } : {}),
    };

    const groups = await prisma.group.findMany({
      where,
      orderBy: [{ activo: 'desc' }, { nombre: 'asc' }],
      include: {
        tutor: { select: { id: true, nombre: true, email: true } },
        _count: { select: { inscripciones: true } },
      },
    });

    // Ultima clase dictada de cada grupo, para mostrar "en que van".
    const ultimos = await prisma.groupProgress.findMany({
      where: { groupId: { in: groups.map((g) => g.id) }, estado: 'DICTADA' },
      orderBy: [{ fechaDictada: 'desc' }],
      include: { clase: { include: { module: { select: { numero: true, nombre: true } } } } },
    });

    const porGrupo = new Map();
    for (const p of ultimos) if (!porGrupo.has(p.groupId)) porGrupo.set(p.groupId, p);

    res.json(
      toJSON(
        groups.map((g) => ({
          ...g,
          ultimaClase: porGrupo.get(g.id) ?? null,
        })),
      ),
    );
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    await loadVisibleGroup(req, req.params.id);

    const group = await prisma.group.findUnique({
      where: { id: req.params.id },
      include: {
        tutor: { select: { id: true, nombre: true, email: true, telefono: true } },
        inscripciones: {
          include: { student: true },
          orderBy: { student: { nombre: 'asc' } },
        },
      },
    });

    const [totalClases, dictadas] = await Promise.all([
      prisma.class.count(),
      prisma.groupProgress.count({ where: { groupId: group.id, estado: 'DICTADA' } }),
    ]);

    res.json({
      ...toJSON(group),
      resumen: {
        totalClases,
        dictadas,
        porcentaje: totalClases ? Math.round((dictadas / totalClases) * 100) : 0,
        estudiantesActivos: group.inscripciones.filter((i) => i.estado === 'ACTIVO').length,
      },
    });
  }),
);

router.post(
  '/',
  authorize('ADMIN'),
  validate(groupSchema),
  asyncHandler(async (req, res) => {
    const group = await prisma.group.create({ data: req.body });
    res.status(201).json(toJSON(group));
  }),
);

router.patch(
  '/:id',
  authorize('ADMIN'),
  validate(groupSchema.partial()),
  asyncHandler(async (req, res) => {
    const group = await prisma.group.update({ where: { id: req.params.id }, data: req.body });
    res.json(toJSON(group));
  }),
);

router.delete(
  '/:id',
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    const group = await prisma.group.update({
      where: { id: req.params.id },
      data: { activo: false },
    });
    res.json({ mensaje: 'Grupo archivado', group: toJSON(group) });
  }),
);

// --- Inscripciones -------------------------------------------------------

router.post(
  '/:id/students',
  authorize('ADMIN'),
  validate(z.object({ studentId: z.string().min(1, 'Debes indicar el estudiante') })),
  asyncHandler(async (req, res) => {
    const { studentId } = req.body;
    const [group, student] = await Promise.all([
      prisma.group.findUnique({ where: { id: req.params.id } }),
      prisma.student.findUnique({ where: { id: studentId } }),
    ]);
    if (!group) throw ApiError.notFound('Grupo no encontrado');
    if (!student) throw ApiError.notFound('Estudiante no encontrado');

    if (group.cupoMaximo) {
      const activos = await prisma.studentGroup.count({
        where: { groupId: group.id, estado: 'ACTIVO' },
      });
      if (activos >= group.cupoMaximo) throw ApiError.conflict('El grupo alcanzo su cupo maximo');
    }

    // Si el estudiante ya estuvo y se retiro, lo reactivamos.
    const inscripcion = await prisma.studentGroup.upsert({
      where: { studentId_groupId: { studentId, groupId: group.id } },
      update: { estado: 'ACTIVO' },
      create: { studentId, groupId: group.id },
      include: { student: true },
    });

    res.status(201).json(toJSON(inscripcion));
  }),
);

router.delete(
  '/:id/students/:studentId',
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    await prisma.studentGroup.update({
      where: { studentId_groupId: { studentId: req.params.studentId, groupId: req.params.id } },
      data: { estado: 'RETIRADO' },
    });
    res.json({ mensaje: 'Estudiante retirado del grupo' });
  }),
);

// --- Avance del grupo ----------------------------------------------------

/** Currículo completo con el estado de avance del grupo para cada clase. */
router.get(
  '/:id/progress',
  asyncHandler(async (req, res) => {
    const group = await loadVisibleGroup(req, req.params.id);

    const [modules, progreso] = await Promise.all([
      prisma.module.findMany({
        orderBy: { orden: 'asc' },
        include: { clases: { orderBy: { numeroClase: 'asc' } } },
      }),
      prisma.groupProgress.findMany({
        where: { groupId: group.id },
        include: { _count: { select: { asistencias: true } } },
      }),
    ]);

    const porClase = new Map(progreso.map((p) => [p.classId, p]));

    const modulos = modules.map((m) => ({
      id: m.id,
      numero: m.numero,
      nombre: m.nombre,
      objetivo: m.objetivo,
      clases: m.clases.map((c) => ({
        ...c,
        progreso: porClase.get(c.id) ?? null,
      })),
    }));

    res.json(toJSON({ group, modulos }));
  }),
);

router.put(
  '/:id/progress/:classId',
  validate(progressSchema),
  asyncHandler(async (req, res) => {
    const group = await loadVisibleGroup(req, req.params.id);
    assertCanTeach(req, group);

    const clase = await prisma.class.findUnique({ where: { id: req.params.classId } });
    if (!clase) throw ApiError.notFound('Clase no encontrada');

    const { estado, notas } = req.body;
    const existente = await prisma.groupProgress.findUnique({
      where: { groupId_classId: { groupId: group.id, classId: clase.id } },
    });
    // Si se marca como dictada sin fecha, conservamos la registrada o usamos hoy.
    const fechaDictada =
      req.body.fechaDictada ??
      (estado === 'DICTADA' ? (existente?.fechaDictada ?? new Date()) : null);

    const progreso = await prisma.groupProgress.upsert({
      where: { groupId_classId: { groupId: group.id, classId: clase.id } },
      update: { estado, fechaDictada, notas },
      create: { groupId: group.id, classId: clase.id, estado, fechaDictada, notas },
    });

    res.json(toJSON(progreso));
  }),
);

// --- Asistencia ----------------------------------------------------------

router.get(
  '/:id/progress/:classId/attendance',
  asyncHandler(async (req, res) => {
    const group = await loadVisibleGroup(req, req.params.id);

    const [inscripciones, progreso] = await Promise.all([
      prisma.studentGroup.findMany({
        where: { groupId: group.id, estado: 'ACTIVO' },
        include: { student: true },
        orderBy: { student: { nombre: 'asc' } },
      }),
      prisma.groupProgress.findUnique({
        where: { groupId_classId: { groupId: group.id, classId: req.params.classId } },
        include: { asistencias: true },
      }),
    ]);

    const registros = new Map((progreso?.asistencias ?? []).map((a) => [a.studentId, a]));

    res.json(
      toJSON({
        progreso,
        asistencias: inscripciones.map(({ student }) => ({
          studentId: student.id,
          nombre: [student.nombre, student.apellido].filter(Boolean).join(' '),
          asistio: registros.get(student.id)?.asistio ?? false,
          nota: registros.get(student.id)?.nota ?? '',
          registrada: registros.has(student.id),
        })),
      }),
    );
  }),
);

router.put(
  '/:id/progress/:classId/attendance',
  validate(attendanceSchema),
  asyncHandler(async (req, res) => {
    const group = await loadVisibleGroup(req, req.params.id);
    assertCanTeach(req, group);

    const clase = await prisma.class.findUnique({ where: { id: req.params.classId } });
    if (!clase) throw ApiError.notFound('Clase no encontrada');

    // Solo se admite asistencia de estudiantes activos en el grupo.
    const inscritos = await prisma.studentGroup.findMany({
      where: { groupId: group.id, estado: 'ACTIVO' },
      select: { studentId: true },
    });
    const permitidos = new Set(inscritos.map((i) => i.studentId));
    const invalidos = req.body.asistencias.filter((a) => !permitidos.has(a.studentId));
    if (invalidos.length) {
      throw ApiError.badRequest('Hay estudiantes que no pertenecen a este grupo', {
        studentIds: invalidos.map((a) => a.studentId),
      });
    }

    // Registrar asistencia implica que la clase se dicto.
    const progreso = await prisma.groupProgress.upsert({
      where: { groupId_classId: { groupId: group.id, classId: clase.id } },
      update: {},
      create: { groupId: group.id, classId: clase.id, estado: 'DICTADA', fechaDictada: new Date() },
    });

    await prisma.$transaction(
      req.body.asistencias.map((a) =>
        prisma.attendance.upsert({
          where: {
            groupProgressId_studentId: { groupProgressId: progreso.id, studentId: a.studentId },
          },
          update: { asistio: a.asistio, nota: a.nota ?? null },
          create: {
            groupProgressId: progreso.id,
            studentId: a.studentId,
            asistio: a.asistio,
            nota: a.nota ?? null,
          },
        }),
      ),
    );

    const actualizado = await prisma.groupProgress.findUnique({
      where: { id: progreso.id },
      include: { asistencias: true },
    });

    res.json(toJSON(actualizado));
  }),
);

export default router;
