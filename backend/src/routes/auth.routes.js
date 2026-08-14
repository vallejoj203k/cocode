import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { ApiError, asyncHandler } from '../lib/http.js';
import { publicUser } from '../lib/serialize.js';
import { authenticate, signToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(1, 'La contrasena es obligatoria'),
});

const changePasswordSchema = z.object({
  passwordActual: z.string().min(1, 'Debes ingresar tu contrasena actual'),
  passwordNueva: z.string().min(8, 'La nueva contrasena debe tener al menos 8 caracteres'),
});

router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Mensaje generico para no revelar si el email existe.
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw ApiError.unauthorized('Email o contrasena incorrectos');
    }
    if (!user.activo) throw ApiError.forbidden('La cuenta esta desactivada');

    res.json({ token: signToken(user), user: publicUser(user) });
  }),
);

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const estudiantes =
      req.user.rol === 'ESTUDIANTE'
        ? await prisma.student.findMany({
            where: { userId: req.user.id },
            select: { id: true, nombre: true, apellido: true },
            orderBy: { nombre: 'asc' },
          })
        : [];

    const grupos =
      req.user.rol === 'TUTOR'
        ? await prisma.group.findMany({
            where: { tutorId: req.user.id },
            select: { id: true, nombre: true },
            orderBy: { nombre: 'asc' },
          })
        : [];

    res.json({ user: publicUser(req.user), estudiantes, grupos });
  }),
);

router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  asyncHandler(async (req, res) => {
    const { passwordActual, passwordNueva } = req.body;
    const ok = await bcrypt.compare(passwordActual, req.user.passwordHash);
    if (!ok) throw ApiError.badRequest('La contrasena actual no es correcta');

    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: await bcrypt.hash(passwordNueva, 10) },
    });

    res.json({ mensaje: 'Contrasena actualizada' });
  }),
);

export default router;
