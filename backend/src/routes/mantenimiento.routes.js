/**
 * Tareas de mantenimiento que hace el admin desde la propia plataforma.
 *
 * Borrar los datos de ejemplo ya se podia por linea de comandos y con variables
 * de entorno, pero ambas cosas exigen un despliegue y saber que existen. Es algo
 * que se hace una vez, justo al empezar a usarla de verdad, y en ese momento lo
 * util es un boton.
 */
import { Router } from 'express';
import { asyncHandler } from '../lib/http.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { limpiar } from '../../prisma/limpiar.js';

const router = Router();

// Solo el admin: esto borra datos y no tiene vuelta atras.
router.use(authenticate, authorize('ADMIN'));

/** Que datos de ejemplo quedan, sin tocar nada. */
router.get(
  '/datos-demo',
  asyncHandler(async (_req, res) => {
    const { resumen } = await limpiar({ silencioso: true, cerrarConexion: false });
    res.json({ resumen, hay: Object.values(resumen).some((n) => n > 0) });
  }),
);

/**
 * Los borra. Exige `confirmar: true` en el cuerpo: un DELETE que se dispara por
 * llegar a la ruta es demasiado facil de invocar sin querer.
 */
router.post(
  '/datos-demo/borrar',
  asyncHandler(async (req, res) => {
    if (req.body?.confirmar !== true) {
      return res.status(400).json({ error: 'Falta confirmar la operacion' });
    }

    const resultado = await limpiar({ confirmar: true, silencioso: true, cerrarConexion: false });
    console.log('[mantenimiento] datos de ejemplo borrados por', req.user.email, resultado.resumen);
    return res.json(resultado);
  }),
);

export default router;
