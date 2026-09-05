import { useEffect, useRef, useState } from 'react';

/**
 * Envuelve un bloque para que entre en escena al llegar a el.
 *
 * Usa IntersectionObserver y no la posicion del scroll: el navegador ya sabe
 * cuando algo entra en pantalla y avisa, sin recalcular en cada fotograma.
 *
 * Dos decisiones importantes:
 *
 * - Si el navegador no lo soporta, o el usuario pidio reducir el movimiento, el
 *   contenido se muestra sin mas. **Nunca puede quedar invisible**: una
 *   animacion que no arranca no debe esconder el texto de una pagina de venta.
 * - Se deja de observar tras aparecer. Entrar una vez es un detalle; entrar y
 *   salir cada vez que se sube y se baja, un mareo.
 */
export default function Aparece({ desde = 'abajo', retraso = 0, className = '', children, ...resto }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!el || quieto || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }

    // Si la pagina no se puede desplazar —incrustada en un iframe de altura
    // fija, por ejemplo— nada llegara nunca a entrar en pantalla y el contenido
    // se quedaria invisible para siempre. Mejor ensenarlo sin animacion.
    const doc = document.documentElement;
    if (doc.scrollHeight - doc.clientHeight < 40) {
      setVisible(true);
      return undefined;
    }

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return;
        setVisible(true);
        observador.disconnect();
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${visible ? `lp-entra lp-${desde}` : 'opacity-0'} ${className}`}
      style={visible && retraso ? { animationDelay: `${retraso}ms` } : undefined}
      {...resto}
    >
      {children}
    </div>
  );
}
