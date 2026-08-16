import { useEffect } from 'react';
import { tituloDocumento } from '../lib/marca.js';

/**
 * Pone el titulo de la pestaña del navegador.
 *
 * Con una sola aplicacion de pagina el titulo no cambia solo al navegar, asi que
 * todas las pestañas abiertas se llamarian igual. Importa mas de lo que parece:
 * quien trabaja con la plataforma suele tener varias abiertas a la vez.
 */
export function useTitulo(seccion) {
  useEffect(() => {
    document.title = tituloDocumento(seccion);
  }, [seccion]);
}
