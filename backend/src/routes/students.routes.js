import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { ApiError, asyncHandler, paginated, parsePagination } from '../lib/http.js';
import { toJSON } from '../lib/serialize.js';
import { accountStudentIds, authenticate, authorize, isAdmin, isTutor, tutorGroupIds } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

const studentSchema = z.object({
  nombre: z.string().min(2, 'El nombre es obligatorio'),
  apellido: z.string().optional().nullable(),
  fechaNacimiento: z.coerce.date().optional().nullable(),
  acudienteNombre: z.string().optional().nullable(),
  acudienteTelefono: z.string().optional().nullable(),
  acudienteEmail: z.string().email('Email de acudiente invalido').optional().nullable().or(z.literal('')),
  notas: z.string().optional().nullable(),
  userId: z.string().optional().nullable(),
  activo: z.boolean().optional(),
});

/**
 * Filtro base segun el rol: el admin ve todo, el tutor solo los estudiantes de
 * sus grupos y la cuenta estudiante/acudiente solo a sus propios hijos.
 */
async function scopeForUser(req) {
  if (isAdmin(req)) return {};
  if (isTutor(req)) {
    const groupIds = await tutorGroupIds(req.user.id);
    return { inscripciones: { some: { groupId: { in: groupIds }, estado: 'ACTIVO' } } };
  }
  const ids = await accountStudentIds(req.user.id);
  return { id: { in: ids } };
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query);
    const scope = await scopeForUser(req);
    const { search, groupId, activo } = req.query;

    const where = {
      ...scope,
      ...(activo !== undefined ? { activo: activo === 'true' } : {}),
      ...(groupId ? { inscripciones: { some: { groupId, estado: 'ACTIVO' } } } : {}),
      ...(search
        ? {
            OR: [
              { nombre: { contains: search, mode: 'insensitive' } },
              { apellido: { contains: search, mode: 'insensitive' } },
              { acudienteNombre: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ activo: 'desc' }, { nombre: 'asc' }],
        include: {
          user: { select: { id: true, nombre: true, email: true } },
          inscripciones: {
            where: { estado: 'ACTIVO' },
            include: { group: { select: { id: true, nombre: true } } },
          },
        },
      }),
      prisma.student.count({ where }),
    ]);

    res.json(paginated(toJSON(students), total, { page, limit }));
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const scope = await scopeForUser(req);
    const student = await prisma.student.findFirst({
      where: { AND: [{ id: req.params.id }, scope] },
      include: {
        user: { select: { id: true, nombre: true, email: true } },
        inscripciones: { include: { group: { select: { id: true, nombre: true, diaSemana: true, hora: true } } } },
        asistencias: {
          include: {
            groupProgress: {
              include: { clase: { include: { module: { select: { numero: true, nombre: true } } } } },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });
    if (!student) throw ApiError.notFound('Estudiante no encontrado');

    const totalAsistencias = student.asistencias.length;
    const presentes = student.asistencias.filter((a) => a.asistio).length;

    res.json({
      ...toJSON(student),
      resumen: {
        clasesRegistradas: totalAsistencias,
        asistencias: presentes,
        inasistencias: totalAsistencias - presentes,
        porcentajeAsistencia: totalAsistencias ? Math.round((presentes / totalAsistencias) * 100) : null,
      },
    });
  }),
);

router.post(
  '/',
  authorize('ADMIN'),
  validate(studentSchema),
  asyncHandler(async (req, res) => {
    const data = { ...req.body };
    if (data.acudienteEmail === '') data.acudienteEmail = null;
    const student = await prisma.student.create({ data });
    res.status(201).json(toJSON(student));
  }),
);

router.patch(
  '/:id',
  authorize('ADMIN'),
  validate(studentSchema.partial()),
  asyncHandler(async (req, res) => {
    const data = { ...req.body };
    if (data.acudienteEmail === '') data.acudienteEmail = null;
    const student = await prisma.student.update({ where: { id: req.params.id }, data });
    res.json(toJSON(student));
  }),
);

/** Baja logica para no perder asistencia ni historial de pagos. */
router.delete(
  '/:id',
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    const student = await prisma.student.update({
      where: { id: req.params.id },
      data: { activo: false },
    });
    await prisma.studentGroup.updateMany({
      where: { studentId: student.id, estado: 'ACTIVO' },
      data: { estado: 'RETIRADO' },
    });
    res.json({ mensaje: 'Estudiante dado de baja', student: toJSON(student) });
  }),
);

export default router;
