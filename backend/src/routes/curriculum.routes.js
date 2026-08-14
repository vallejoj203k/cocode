import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { ApiError, asyncHandler } from '../lib/http.js';
import { toJSON } from '../lib/serialize.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// El curriculo lo lee cualquier usuario autenticado; solo el admin lo edita.
router.use(authenticate);

const moduleSchema = z.object({
  numero: z.coerce.number().int().positive('El numero de modulo debe ser positivo'),
  nombre: z.string().min(2, 'El nombre es obligatorio'),
  objetivo: z.string().min(2, 'El objetivo es obligatorio'),
  descripcion: z.string().optional().nullable(),
  orden: z.coerce.number().int().positive().optional(),
});

const classSchema = z.object({
  numeroClase: z.coerce.number().int().positive('El numero de clase debe ser positivo'),
  nombre: z.string().min(2, 'El nombre es obligatorio'),
  objetivo: z.string().min(2, 'El objetivo es obligatorio'),
  contenido: z.string().min(2, 'El contenido es obligatorio'),
  conceptosClave: z.array(z.string()).optional(),
  duracionMinutos: z.coerce.number().int().positive().optional(),
  recursosUrl: z.string().url('Debe ser una URL valida').optional().nullable().or(z.literal('')),
});

// --- Modulos -------------------------------------------------------------

router.get(
  '/modules',
  asyncHandler(async (_req, res) => {
    const modules = await prisma.module.findMany({
      orderBy: { orden: 'asc' },
      include: {
        clases: { orderBy: { numeroClase: 'asc' } },
        _count: { select: { clases: true } },
      },
    });
    res.json(toJSON(modules));
  }),
);

router.get(
  '/modules/:id',
  asyncHandler(async (req, res) => {
    const module = await prisma.module.findUnique({
      where: { id: req.params.id },
      include: { clases: { orderBy: { numeroClase: 'asc' } } },
    });
    if (!module) throw ApiError.notFound('Modulo no encontrado');
    res.json(toJSON(module));
  }),
);

router.post(
  '/modules',
  authorize('ADMIN'),
  validate(moduleSchema),
  asyncHandler(async (req, res) => {
    const { orden, numero, ...rest } = req.body;
    const module = await prisma.module.create({
      data: { ...rest, numero, orden: orden ?? numero },
    });
    res.status(201).json(toJSON(module));
  }),
);

router.patch(
  '/modules/:id',
  authorize('ADMIN'),
  validate(moduleSchema.partial()),
  asyncHandler(async (req, res) => {
    const module = await prisma.module.update({ where: { id: req.params.id }, data: req.body });
    res.json(toJSON(module));
  }),
);

router.delete(
  '/modules/:id',
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    // Borrar un modulo elimina sus clases y el avance asociado; avisamos si ya
    // hay grupos que lo dictaron.
    const dictadas = await prisma.groupProgress.count({
      where: { clase: { moduleId: req.params.id }, estado: 'DICTADA' },
    });
    if (dictadas > 0 && req.query.force !== 'true') {
      throw ApiError.conflict(
        `El modulo tiene ${dictadas} clase(s) ya dictadas. Repite con ?force=true para eliminarlo junto con su historial.`,
      );
    }
    await prisma.module.delete({ where: { id: req.params.id } });
    res.json({ mensaje: 'Modulo eliminado' });
  }),
);

// --- Clases --------------------------------------------------------------

router.get(
  '/classes/:id',
  asyncHandler(async (req, res) => {
    const clase = await prisma.class.findUnique({
      where: { id: req.params.id },
      include: { module: true },
    });
    if (!clase) throw ApiError.notFound('Clase no encontrada');
    res.json(toJSON(clase));
  }),
);

router.post(
  '/modules/:moduleId/classes',
  authorize('ADMIN'),
  validate(classSchema),
  asyncHandler(async (req, res) => {
    const module = await prisma.module.findUnique({ where: { id: req.params.moduleId } });
    if (!module) throw ApiError.notFound('Modulo no encontrado');

    const data = { ...req.body, moduleId: module.id };
    if (data.recursosUrl === '') data.recursosUrl = null;

    const clase = await prisma.class.create({ data });
    res.status(201).json(toJSON(clase));
  }),
);

router.patch(
  '/classes/:id',
  authorize('ADMIN'),
  validate(classSchema.partial()),
  asyncHandler(async (req, res) => {
    const data = { ...req.body };
    if (data.recursosUrl === '') data.recursosUrl = null;
    const clase = await prisma.class.update({ where: { id: req.params.id }, data });
    res.json(toJSON(clase));
  }),
);

router.delete(
  '/classes/:id',
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    const dictadas = await prisma.groupProgress.count({
      where: { classId: req.params.id, estado: 'DICTADA' },
    });
    if (dictadas > 0 && req.query.force !== 'true') {
      throw ApiError.conflict(
        'Esta clase ya fue dictada por algun grupo. Repite con ?force=true para eliminarla junto con su historial.',
      );
    }
    await prisma.class.delete({ where: { id: req.params.id } });
    res.json({ mensaje: 'Clase eliminada' });
  }),
);

export default router;
