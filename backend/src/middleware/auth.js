import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { ApiError, asyncHandler } from '../lib/http.js';

export function signToken(user) {
  return jwt.sign({ sub: user.id, rol: user.rol }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });
}

function extractToken(req) {
  const header = req.headers.authorization ?? '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}

/** Exige un token valido y carga el usuario en req.user. */
export const authenticate = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized('Falta el token de acceso');

  let payload;
  try {
    payload = jwt.verify(token, env.jwt.secret);
  } catch {
    throw ApiError.unauthorized('Token invalido o expirado');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw ApiError.unauthorized('El usuario ya no existe');
  if (!user.activo) throw ApiError.forbidden('La cuenta esta desactivada');

  req.user = user;
  next();
});

/** Restringe el acceso a los roles indicados. Usar despues de `authenticate`. */
export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (roles.length && !roles.includes(req.user.rol)) {
      return next(ApiError.forbidden('Tu rol no tiene acceso a este recurso'));
    }
    return next();
  };
}

export const isAdmin = (req) => req.user?.rol === 'ADMIN';
export const isTutor = (req) => req.user?.rol === 'TUTOR';
export const isEstudiante = (req) => req.user?.rol === 'ESTUDIANTE';

/** IDs de los grupos donde el tutor esta asignado. */
export async function tutorGroupIds(userId) {
  const groups = await prisma.group.findMany({
    where: { tutorId: userId },
    select: { id: true },
  });
  return groups.map((g) => g.id);
}

/** IDs de los estudiantes vinculados a una cuenta de acudiente/estudiante. */
export async function accountStudentIds(userId) {
  const students = await prisma.student.findMany({
    where: { userId },
    select: { id: true },
  });
  return students.map((s) => s.id);
}
