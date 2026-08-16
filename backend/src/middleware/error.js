import { Prisma } from '@prisma/client';
import { env } from '../config/env.js';
import { ApiError } from '../lib/http.js';

export function notFoundHandler(req, _res, next) {
  next(new ApiError(404, `Ruta no encontrada: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars -- Express identifica el handler por aridad.
export function errorHandler(err, _req, res, _next) {
  let status = err.status ?? 500;
  let message = err.message ?? 'Error interno del servidor';
  let details = err.details;

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      status = 409;
      const campos = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'campo unico';
      message = `Ya existe un registro con el mismo valor en: ${campos}`;
    } else if (err.code === 'P2025') {
      status = 404;
      message = 'Registro no encontrado';
    } else if (err.code === 'P2003') {
      status = 409;
      message = 'No se puede completar: hay registros relacionados';
    }
  }

  if (status >= 500) {
    console.error('[error]', err);
    // El mensaje de un fallo interno suele traer detalles del servidor (el host
    // y el puerto de la base, rutas del contenedor...). Con la portada abierta a
    // internet eso no puede viajar al navegador: queda en el log y fuera.
    if (env.isProd) message = 'Error interno del servidor. Intentalo de nuevo en un momento.';
  }

  res.status(status).json({
    error: message,
    ...(details ? { details } : {}),
    ...(env.isProd || status < 500 ? {} : { stack: err.stack }),
  });
}
