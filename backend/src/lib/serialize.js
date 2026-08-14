import { Prisma } from '@prisma/client';

/**
 * Los Decimal de Prisma se serializan como string en JSON. Para el frontend es
 * mas comodo recibir numeros, asi que convertimos recursivamente.
 */
export function toJSON(value) {
  if (value === null || value === undefined) return value;
  if (value instanceof Prisma.Decimal) return Number(value);
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(toJSON);
  if (typeof value === 'object') {
    const out = {};
    for (const [key, val] of Object.entries(value)) out[key] = toJSON(val);
    return out;
  }
  return value;
}

/** Quita el hash de contrasena antes de responder. */
export function publicUser(user) {
  if (!user) return user;
  const { passwordHash, ...rest } = user;
  return toJSON(rest);
}
