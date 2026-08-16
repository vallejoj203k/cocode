import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { ApiError, asyncHandler, paginated, parsePagination } from '../lib/http.js';
import { publicUser } from '../lib/serialize.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { sincronizarAccesos } from '../services/access.service.js';

const router = Router();

// Toda la gestion de usuarios es exclusiva del Admin.
router.use(authenticate, authorize('ADMIN'));

const createUserSchema = z
  .object({
    nombre: z.string().min(2, 'El nombre es obligatorio'),
    email: z.string().email('Email invalido'),
    password: z.string().min(8, 'La contrasena debe tener al menos 8 caracteres'),
    rol: z.enum(['ADMIN', 'TUTOR', 'VENDEDOR', 'ESTUDIANTE']),
    telefono: z.string().optional().nullable(),
    // Al crear una cuenta de estudiante se crea tambien la ficha del nino, con
    // los cursos que el admin le habilita.
    estudiante: z
      .object({
        nombre: z.string().min(2, 'El nombre del estudiante es obligatorio'),
        apellido: z.string().optional().nullable(),
        fechaNacimiento: z.coerce.date().optional().nullable(),
        courseIds: z.array(z.string()).min(1, 'Debes asignarle al menos un curso'),
      })
      .optional(),
  })
  .refine((datos) => datos.rol !== 'ESTUDIANTE' || Boolean(datos.estudiante), {
    message: 'Una cuenta de estudiante necesita los datos del nino y su curso',
    path: ['estudiante'],
  });

const updateUserSchema = z.object({
  nombre: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  rol: z.enum(['ADMIN', 'TUTOR', 'VENDEDOR', 'ESTUDIANTE']).optional(),
  telefono: z.string().optional().nullable(),
  activo: z.boolean().optional(),
});

const listQuerySchema = z.object({
  rol: z.enum(['ADMIN', 'TUTOR', 'VENDEDOR', 'ESTUDIANTE']).optional(),
  search: z.string().optional(),
  activo: z.enum(['true', 'false']).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

router.get(
  '/',
  validate(listQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const q = req.validatedQuery;
    const { page, limit, skip } = parsePagination(q);

    const where = {
      ...(q.rol ? { rol: q.rol } : {}),
      ...(q.activo ? { activo: q.activo === 'true' } : {}),
      ...(q.search
        ? {
            OR: [
              { nombre: { contains: q.search, mode: 'insensitive' } },
              { email: { contains: q.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ rol: 'asc' }, { nombre: 'asc' }],
        include: {
          _count: { select: { gruposComoTutor: true, estudiantes: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json(paginated(users.map(publicUser), total, { page, limit }));
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        gruposComoTutor: { select: { id: true, nombre: true } },
        estudiantes: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            // Solo los cursos completos: el modal edita ese nivel, y los modulos
            // o clases sueltos llegarian aqui como courseId null.
            accesos: { where: { courseId: { not: null } }, select: { courseId: true } },
            inscripciones: {
              where: { estado: 'ACTIVO' },
              select: { group: { select: { courseId: true, nombre: true } } },
            },
          },
        },
      },
    });
    if (!user) throw ApiError.notFound('Usuario no encontrado');
    res.json(publicUser(user));
  }),
);

router.post(
  '/',
  validate(createUserSchema),
  asyncHandler(async (req, res) => {
    const { password, email, estudiante, ...rest } = req.body;

    if (estudiante) {
      const cursos = await prisma.course.count({ where: { id: { in: estudiante.courseIds } } });
      if (cursos !== new Set(estudiante.courseIds).size) {
        throw ApiError.badRequest('Alguno de los cursos indicados no existe');
      }
    }

    const user = await prisma.user.create({
      data: {
        ...rest,
        email: email.trim().toLowerCase(),
        passwordHash: await bcrypt.hash(password, 10),
      },
    });

    // La ficha del nino se crea en el mismo paso que su cuenta de acceso.
    if (estudiante) {
      const { courseIds, ...datosEstudiante } = estudiante;
      const student = await prisma.student.create({
        data: { ...datosEstudiante, userId: user.id, acudienteNombre: rest.nombre },
      });
      await sincronizarAccesos(student.id, courseIds, req.user.id);
    }

    const creado = await prisma.user.findUnique({
      where: { id: user.id },
      include: { estudiantes: { select: { id: true, nombre: true, apellido: true } } },
    });
    res.status(201).json(publicUser(creado));
  }),
);

router.patch(
  '/:id',
  validate(updateUserSchema),
  asyncHandler(async (req, res) => {
    const { password, email, ...rest } = req.body;

    // Evitamos que el admin se bloquee a si mismo o se quite el rol.
    if (req.params.id === req.user.id) {
      if (rest.activo === false) throw ApiError.badRequest('No puedes desactivar tu propia cuenta');
      if (rest.rol && rest.rol !== 'ADMIN') throw ApiError.badRequest('No puedes cambiar tu propio rol');
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...rest,
        ...(email ? { email: email.toLowerCase() } : {}),
        ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
      },
    });
    res.json(publicUser(user));
  }),
);

/** Baja logica: conserva el historial (asistencias, pagos, sugerencias). */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user.id) {
      throw ApiError.badRequest('No puedes eliminar tu propia cuenta');
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { activo: false },
    });
    res.json({ mensaje: 'Usuario dado de baja', user: publicUser(user) });
  }),
);

export default router;
