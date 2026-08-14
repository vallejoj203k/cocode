import { ApiError } from '../lib/http.js';

/**
 * Valida req.body / req.query con un esquema zod y reemplaza el valor por el
 * resultado parseado (con coerciones y defaults aplicados).
 */
export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        campo: issue.path.join('.') || '(raiz)',
        mensaje: issue.message,
      }));
      return next(ApiError.badRequest('Datos invalidos', details));
    }
    if (source === 'query') {
      req.validatedQuery = result.data;
    } else {
      req[source] = result.data;
    }
    return next();
  };
}
