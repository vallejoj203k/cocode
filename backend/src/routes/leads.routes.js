/**
 * Gestion de interesados. La usan el vendedor y el admin.
 *
 * El paso importante es `POST /:id/convertir`: crea la cuenta de la familia, la
 * ficha del nino y su acceso al curso en una sola operacion. Esta aqui y no en
 * `/users` a proposito, porque asi el vendedor puede dar de alta una familia sin
 * que se le abra la gestion de usuarios entera.
 */
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { ApiError, asyncHandler, paginated, parsePagination } from '../lib/http.js';
import { publicUser, toJSON } from '../lib/serialize.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { sincronizarAccesos } from '../services/access.service.js';

const router = Router();
router.use(authenticate, authorize('ADMIN', 'VENDEDOR'));

const ESTADOS = ['NUEVO', 'CONTACTADO', 'INSCRITO', 'DESCARTADO'];

const updateSchema = z.object({
  estado: z.enum(ESTADOS).optional(),
  notas: z.string().max(2000).optional().nullable(),
});

const convertirSchema = z.object({
  nombre: z.string().min(2, 'El nombre de la cuenta es obligatorio'),
  email: z.string().email('Email invalido'),
  password: z.string().min(8, 'La contrasena debe tener al menos 8 caracteres'),
  telefono: z.string().optional().nullable(),
  estudiante: z.object({
    nombre: z.string().min(2, 'El nombre del nino es obligatorio'),
    apellido: z.string().optional().nullable(),
    courseIds: z.array(z.string()).min(1, 'Debes asignarle al menos un curso'),
  }),
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query);
    const { estado, search } = req.query;

    const where = {
      ...(estado && ESTADOS.includes(estado) ? { estado } : {}),
      ...(search
        ? {
            OR: [
              { nombre: { contains: search, mode: 'insensitive' } },
              { telefono: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { nombreEstudiante: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [leads, total, porEstado] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        // Los nuevos primero: son los que hay que llamar hoy.
        orderBy: [{ estado: 'asc' }, { createdAt: 'desc' }],
        include: {
          course: { select: { id: true, nombre: true } },
          atendidoPor: { select: { id: true, nombre: true } },
          user: { select: { id: true, email: true } },
        },
      }),
      prisma.lead.count({ where }),
      prisma.lead.groupBy({ by: ['estado'], _count: { _all: true } }),
    ]);

    res.json({
      ...paginated(toJSON(leads), total, { page, limit }),
      resumen: Object.fromEntries(ESTADOS.map((e) => [
        e,
        porEstado.find((p) => p.estado === e)?._count._all ?? 0,
      ])),
    });
  }),
);

router.patch(
  '/:id',
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const lead = await prisma.lead.findUnique({ where: { id: req.params.id } });
    if (!lead) throw ApiError.notFound('Interesado no encontrado');

    const { estado, notas } = req.body;

    const actualizado = await prisma.lead.update({
      where: { id: lead.id },
      data: {
        ...(estado ? { estado } : {}),
        ...(notas !== undefined ? { notas } : {}),
        // Quien lo mueve se queda como responsable, para saber a quien preguntar.
        atendidoPorId: req.user.id,
        // La fecha del primer contacto no se pisa si vuelve a tocarse.
        ...(estado && estado !== 'NUEVO' && !lead.contactadoEn
          ? { contactadoEn: new Date() }
          : {}),
      },
      include: {
        course: { select: { id: true, nombre: true } },
        atendidoPor: { select: { id: true, nombre: true } },
        user: { select: { id: true, email: true } },
      },
    });

    res.json(toJSON(actualizado));
  }),
);

/** Crea la cuenta de la familia, el nino y sus cursos a partir del interesado. */
router.post(
  '/:id/convertir',
  validate(convertirSchema),
  asyncHandler(async (req, res) => {
    const lead = await prisma.lead.findUnique({ where: { id: req.params.id } });
    if (!lead) throw ApiError.notFound('Interesado no encontrado');
    if (lead.userId) throw ApiError.conflict('Este interesado ya tiene una cuenta creada');

    const { nombre, email, password, telefono, estudiante } = req.body;

    const repetido = await prisma.user.findUnique({ where: { email } });
    if (repetido) throw ApiError.conflict('Ya existe una cuenta con ese correo');

    const cursos = await prisma.course.findMany({
      where: { id: { in: estudiante.courseIds } },
      select: { id: true },
    });
    if (cursos.length !== estudiante.courseIds.length) {
      throw ApiError.badRequest('Alguno de los cursos indicados no existe');
    }

    // La cuenta y el nino se crean juntos: una cuenta sin nino no ve nada, y es
    // justo el estado a medias que hay que evitar.
    const creado = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          nombre,
          email,
          passwordHash: await bcrypt.hash(password, 10),
          rol: 'ESTUDIANTE',
          telefono: telefono || lead.telefono,
        },
      });

      const student = await tx.student.create({
        data: {
          nombre: estudiante.nombre,
          apellido: estudiante.apellido || null,
          userId: user.id,
          acudienteNombre: nombre,
          acudienteTelefono: lead.telefono,
          acudienteEmail: lead.email,
        },
      });

      await tx.lead.update({
        where: { id: lead.id },
        data: {
          estado: 'INSCRITO',
          userId: user.id,
          atendidoPorId: req.user.id,
          contactadoEn: lead.contactadoEn ?? new Date(),
        },
      });

      return { user, student };
    });

    await sincronizarAccesos(creado.student.id, estudiante.courseIds, req.user.id);

    res.status(201).json({
      usuario: publicUser(creado.user),
      estudiante: toJSON(creado.student),
    });
  }),
);

export default router;
