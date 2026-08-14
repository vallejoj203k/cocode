import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { ApiError, asyncHandler, paginated, parsePagination } from '../lib/http.js';
import { toJSON } from '../lib/serialize.js';
import { authenticate, authorize, isAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

const createSchema = z.object({
  mensaje: z.string().min(5, 'Escribe al menos 5 caracteres').max(2000, 'Maximo 2000 caracteres'),
});

const updateSchema = z.object({
  estado: z.enum(['NUEVA', 'LEIDA', 'ATENDIDA']).optional(),
  respuesta: z.string().max(2000).optional().nullable(),
});

/** Cualquier usuario autenticado puede dejar una sugerencia. */
router.post(
  '/',
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const suggestion = await prisma.suggestion.create({
      data: { mensaje: req.body.mensaje, userId: req.user.id },
    });
    res.status(201).json(toJSON(suggestion));
  }),
);

/** El admin ve todas; el resto solo las propias. */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query);
    const where = {
      ...(isAdmin(req) ? {} : { userId: req.user.id }),
      ...(req.query.estado ? { estado: req.query.estado } : {}),
    };

    const [items, total, noLeidas] = await Promise.all([
      prisma.suggestion.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          autor: { select: { id: true, nombre: true, email: true, rol: true } },
          respondidaPor: { select: { id: true, nombre: true } },
        },
      }),
      prisma.suggestion.count({ where }),
      prisma.suggestion.count({ where: { ...where, estado: 'NUEVA' } }),
    ]);

    res.json({ ...paginated(toJSON(items), total, { page, limit }), noLeidas });
  }),
);

/** Marcar como leida/atendida y responder: solo admin. */
router.patch(
  '/:id',
  authorize('ADMIN'),
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const { estado, respuesta } = req.body;
    const actual = await prisma.suggestion.findUnique({ where: { id: req.params.id } });
    if (!actual) throw ApiError.notFound('Sugerencia no encontrada');

    const suggestion = await prisma.suggestion.update({
      where: { id: req.params.id },
      data: {
        ...(estado ? { estado } : {}),
        ...(respuesta !== undefined
          ? {
              respuesta,
              // Responder implica que quedo atendida.
              estado: estado ?? (respuesta ? 'ATENDIDA' : actual.estado),
              respondidaEn: respuesta ? new Date() : null,
              respondidaPorId: respuesta ? req.user.id : null,
            }
          : {}),
      },
      include: { autor: { select: { id: true, nombre: true, email: true } } },
    });

    res.json(toJSON(suggestion));
  }),
);

router.delete(
  '/:id',
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    await prisma.suggestion.delete({ where: { id: req.params.id } });
    res.json({ mensaje: 'Sugerencia eliminada' });
  }),
);

export default router;
