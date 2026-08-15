import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { ApiError, asyncHandler } from '../lib/http.js';
import { toJSON } from '../lib/serialize.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { cursosVisibles, marcarClasesAccesibles, puedeVerClase } from '../services/access.service.js';

const router = Router();

// El curriculo lo lee cualquier usuario autenticado; solo el admin lo edita.
router.use(authenticate);

const courseSchema = z.object({
  nombre: z.string().min(2, 'El nombre del curso es obligatorio'),
  descripcion: z.string().optional().nullable(),
  duracionMeses: z.coerce.number().int().positive().optional().nullable(),
  edadSugerida: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  orden: z.coerce.number().int().positive().optional(),
  activo: z.boolean().optional(),
});

const moduleSchema = z.object({
  courseId: z.string().min(1, 'Debes indicar el curso'),
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

/**
 * Lanza 404 si el usuario no tiene acceso al curso. Se usa 404 y no 403 para no
 * revelar la existencia de un curso que no le corresponde.
 */
async function assertPuedeVerCurso(user, courseId) {
  const visibles = await cursosVisibles(user);
  if (visibles && !visibles.includes(courseId)) {
    throw ApiError.notFound('Curso no encontrado');
  }
}

// --- Cursos --------------------------------------------------------------

router.get(
  '/courses',
  asyncHandler(async (req, res) => {
    // El estudiante solo ve los cursos a los que tiene acceso.
    const visibles = await cursosVisibles(req.user);

    const courses = await prisma.course.findMany({
      where: {
        ...(req.query.activo !== undefined ? { activo: req.query.activo === 'true' } : {}),
        ...(visibles ? { id: { in: visibles } } : {}),
      },
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
      include: {
        _count: { select: { modulos: true, grupos: true } },
        modulos: { select: { _count: { select: { clases: true } } } },
      },
    });

    res.json(
      toJSON(
        courses.map(({ modulos, ...curso }) => ({
          ...curso,
          totalClases: modulos.reduce((acc, m) => acc + m._count.clases, 0),
        })),
      ),
    );
  }),
);

router.post(
  '/courses',
  authorize('ADMIN'),
  validate(courseSchema),
  asyncHandler(async (req, res) => {
    const { orden, ...rest } = req.body;
    const siguienteOrden = orden ?? (await prisma.course.count()) + 1;
    const course = await prisma.course.create({ data: { ...rest, orden: siguienteOrden } });
    res.status(201).json(toJSON(course));
  }),
);

router.patch(
  '/courses/:id',
  authorize('ADMIN'),
  validate(courseSchema.partial()),
  asyncHandler(async (req, res) => {
    const course = await prisma.course.update({ where: { id: req.params.id }, data: req.body });
    res.json(toJSON(course));
  }),
);

router.delete(
  '/courses/:id',
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    // Un curso con grupos no se borra: se archiva para conservar el historial.
    const grupos = await prisma.group.count({ where: { courseId: req.params.id } });
    if (grupos > 0) {
      throw ApiError.conflict(
        `Este curso tiene ${grupos} grupo(s) asociados. Archívalo en lugar de eliminarlo para conservar su historial.`,
      );
    }

    const clases = await prisma.class.count({ where: { module: { courseId: req.params.id } } });
    if (clases > 0 && req.query.force !== 'true') {
      throw ApiError.conflict(
        `El curso tiene ${clases} clase(s) en su curriculo. Repite con ?force=true para eliminarlo junto con ellas.`,
      );
    }

    await prisma.course.delete({ where: { id: req.params.id } });
    res.json({ mensaje: 'Curso eliminado' });
  }),
);

// --- Modulos -------------------------------------------------------------

router.get(
  '/modules',
  asyncHandler(async (req, res) => {
    const visibles = await cursosVisibles(req.user);
    if (req.query.courseId) await assertPuedeVerCurso(req.user, req.query.courseId);

    // Sin courseId se devuelve el curriculo de todos los cursos accesibles.
    const modules = await prisma.module.findMany({
      where: {
        ...(req.query.courseId ? { courseId: req.query.courseId } : {}),
        ...(visibles && !req.query.courseId ? { courseId: { in: visibles } } : {}),
      },
      orderBy: [{ course: { orden: 'asc' } }, { orden: 'asc' }],
      include: {
        clases: { orderBy: { numeroClase: 'asc' } },
        course: { select: { id: true, nombre: true } },
        _count: { select: { clases: true } },
      },
    });

    // Las clases no compradas viajan sin contenido y marcadas con `accesible`.
    res.json(toJSON(await marcarClasesAccesibles(req.user, modules)));
  }),
);

router.get(
  '/modules/:id',
  asyncHandler(async (req, res) => {
    const module = await prisma.module.findUnique({
      where: { id: req.params.id },
      include: { clases: { orderBy: { numeroClase: 'asc' } }, course: true },
    });
    if (!module) throw ApiError.notFound('Modulo no encontrado');
    await assertPuedeVerCurso(req.user, module.courseId);
    res.json(toJSON(module));
  }),
);

router.post(
  '/modules',
  authorize('ADMIN'),
  validate(moduleSchema),
  asyncHandler(async (req, res) => {
    const { orden, numero, courseId, ...rest } = req.body;
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw ApiError.notFound('Curso no encontrado');

    const module = await prisma.module.create({
      data: { ...rest, courseId, numero, orden: orden ?? numero },
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
    await assertPuedeVerCurso(req.user, clase.module.courseId);
    if (!(await puedeVerClase(req.user, clase))) {
      throw ApiError.forbidden('Esta clase no esta incluida en lo que tienes habilitado');
    }
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
