/**
 * Lo unico que se sirve sin sesion: la informacion de venta de los cursos y el
 * formulario de interesados.
 *
 * Nada de aqui expone contenido del curriculo. Un desconocido puede ver que
 * cursos existen y de que van, pero no sus modulos ni sus clases: eso es lo que
 * se vende.
 */
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../lib/http.js';
import { toJSON } from '../lib/serialize.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const leadSchema = z.object({
  nombre: z.string().trim().min(2, 'Escribe tu nombre'),
  telefono: z
    .string()
    .trim()
    .min(7, 'Escribe un telefono de contacto')
    .max(30, 'Ese telefono es demasiado largo'),
  email: z.string().trim().email('Ese correo no parece valido').optional().or(z.literal('')),
  nombreEstudiante: z.string().trim().max(120).optional().or(z.literal('')),
  edadEstudiante: z.coerce
    .number()
    .int()
    .min(3, 'Revisa la edad')
    .max(18, 'Este curso es para ninos')
    .optional()
    .nullable(),
  mensaje: z.string().trim().max(1000).optional().or(z.literal('')),
  courseId: z.string().min(1, 'Elige el curso que te interesa'),
  /// Campo trampa: invisible en el formulario, solo lo rellenan los bots. Se
  /// acepta cualquier valor a proposito; rechazarlo aqui le diria al bot que
  /// campo lo delato y volveria ajustado.
  web: z.string().max(200).optional(),
});

// Un formulario abierto a internet necesita freno. Es generoso para una familia
// que se equivoca y lo reenvia, y estrecho para un bot.
const limiteInteresados = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Hemos recibido varias solicitudes desde aqui. Intenta de nuevo en un rato o escribenos por telefono.',
  },
});

/** Cursos que se ofrecen, con lo justo para decidir si interesan. */
router.get(
  '/courses',
  asyncHandler(async (_req, res) => {
    const courses = await prisma.course.findMany({
      where: { activo: true },
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        duracionMeses: true,
        edadSugerida: true,
        _count: { select: { modulos: true } },
      },
    });

    res.json(
      toJSON(
        courses.map(({ _count, ...curso }) => ({ ...curso, modulos: _count.modulos })),
      ),
    );
  }),
);

router.post(
  '/leads',
  limiteInteresados,
  validate(leadSchema),
  asyncHandler(async (req, res) => {
    const { web, email, nombreEstudiante, mensaje, courseId, ...datos } = req.body;

    // Un bot que rellena el campo trampa recibe la misma respuesta que una
    // persona: si le dijeramos que fue rechazado, ajustaria y volveria.
    if (web) return res.status(201).json({ mensaje: 'Recibido' });

    // Un curso archivado o inexistente no invalida el interes: se guarda sin
    // curso y el vendedor lo aclara en la llamada.
    const curso = await prisma.course.findFirst({ where: { id: courseId, activo: true } });

    await prisma.lead.create({
      data: {
        ...datos,
        email: email || null,
        nombreEstudiante: nombreEstudiante || null,
        mensaje: mensaje || null,
        courseId: curso?.id ?? null,
      },
    });

    // No se devuelve el registro creado: nada de lo que hay dentro le sirve a
    // quien envia el formulario, y menos su id.
    res.status(201).json({ mensaje: 'Recibido' });
  }),
);

export default router;
