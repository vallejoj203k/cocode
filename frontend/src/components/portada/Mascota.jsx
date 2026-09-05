import { useEffect, useRef } from 'react';

/**
 * El monigote de la esquina. Va haciendo acrobacias segun se baja la pagina y,
 * al pulsarlo, da una voltereta hacia atras.
 *
 * Se dibuja manipulando atributos del SVG dentro de un `requestAnimationFrame`
 * en vez de con estado de React: son ~60 cambios por segundo y pasarlos por el
 * ciclo de renderizado volveria a dibujar media portada en cada fotograma.
 *
 * Quien tenga activado "reducir movimiento" en su sistema no lo ve: un monigote
 * dando vueltas es justo lo que marea a quien pide que nada se mueva.
 */

/** Cada pose: [giro del cuerpo, brazo izq, brazo der, pierna izq, pierna der, altura]. */
const POSES = [
  [0, -150, 25, 8, -8, 0], // saludo
  [-14, -165, -160, 26, -26, 20], // salto
  [95, -175, 170, 40, -40, 34], // rueda
  [185, -8, 8, 34, -34, 40], // parada de manos
  [285, -70, 70, 118, 100, 30], // mortal recogido
  [365, -95, -95, 22, -22, 6], // aterrizaje
  [368, -150, 40, 12, -30, 0], // pose final
  [360, -160, -160, 16, -16, 16], // celebracion
];

const entre = (a, b, t) => a + (b - a) * t;
const suave = (t) => t * t * (3 - 2 * t);

export default function Mascota({ onProgreso }) {
  const caja = useRef(null);
  const volteretaEn = useRef(0);

  useEffect(() => {
    const raiz = caja.current;
    if (!raiz) return undefined;

    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (quieto) return undefined;

    const q = (id) => raiz.querySelector(`#${id}`);
    const cuerpo = q('mono-cuerpo');
    const sombra = q('mono-sombra');
    const brazoI = q('mono-brazoI');
    const brazoD = q('mono-brazoD');
    const piernaI = q('mono-piernaI');
    const piernaD = q('mono-piernaD');
    if (!cuerpo) return undefined;

    let raf = 0;
    let actual = 0;
    let objetivo = 0;

    const medirScroll = () => {
      const doc = document.documentElement;
      const alto = doc.scrollHeight - doc.clientHeight;
      const arriba = window.scrollY || doc.scrollTop || 0;
      objetivo = alto > 0 ? Math.min(1, Math.max(0, arriba / alto)) : 0;
      onProgreso?.(objetivo);
    };

    const pintar = () => {
      medirScroll();
      // Se persigue el objetivo con retraso: el movimiento queda blando en vez
      // de saltar de golpe con cada rueda del raton.
      actual += (objetivo - actual) * 0.12;

      const tramo = actual * (POSES.length - 1);
      const i = Math.min(POSES.length - 2, Math.floor(tramo));
      const f = suave(tramo - i);
      const [a, b] = [POSES[i], POSES[i + 1]];

      const t = Date.now() / 1000;
      let giro = entre(a[0], b[0], f);
      let altura = entre(a[5], b[5], f) + Math.sin(t * 2) * 3;

      // La voltereta del clic se suma a la pose que toque por scroll.
      const dt = (Date.now() - volteretaEn.current) / 900;
      const volteando = volteretaEn.current && dt < 1;
      if (volteando) {
        const k = suave(dt);
        giro -= 360 * k;
        altura += Math.sin(Math.PI * dt) * 62;
        const recoge = 118 * Math.sin(Math.PI * dt);
        brazoI.setAttribute('transform', `rotate(${-70 - 40 * Math.sin(Math.PI * dt)},0,-18)`);
        brazoD.setAttribute('transform', `rotate(${70 + 40 * Math.sin(Math.PI * dt)},0,-18)`);
        piernaI.setAttribute('transform', `rotate(${recoge.toFixed(1)},0,14)`);
        piernaD.setAttribute('transform', `rotate(${(-recoge * 0.85).toFixed(1)},0,14)`);
      } else {
        brazoI.setAttribute('transform', `rotate(${entre(a[1], b[1], f).toFixed(1)},0,-18)`);
        brazoD.setAttribute('transform', `rotate(${entre(a[2], b[2], f).toFixed(1)},0,-18)`);
        piernaI.setAttribute('transform', `rotate(${entre(a[3], b[3], f).toFixed(1)},0,14)`);
        piernaD.setAttribute('transform', `rotate(${entre(a[4], b[4], f).toFixed(1)},0,14)`);
      }

      cuerpo.setAttribute('transform', `translate(66,${(80 - altura).toFixed(1)}) rotate(${giro.toFixed(1)})`);
      // La sombra encoge cuando salta: es lo que vende que esta en el aire.
      const pegado = Math.max(0.45, 1 - altura / 90);
      sombra.setAttribute('rx', (26 * pegado).toFixed(1));
      sombra.setAttribute('opacity', (0.16 * Math.max(0.3, pegado)).toFixed(3));

      raf = requestAnimationFrame(pintar);
    };

    raf = requestAnimationFrame(pintar);
    return () => cancelAnimationFrame(raf);
  }, [onProgreso]);

  return (
    <button
      type="button"
      ref={caja}
      onClick={() => {
        volteretaEn.current = Date.now();
      }}
      title="¡Haz clic para verlo dar una vuelta!"
      aria-label="Mascota de Logic Plus: haz clic para verla dar una voltereta"
      className="fixed bottom-5 right-5 z-40 hidden h-[150px] w-[132px] cursor-pointer sm:block"
    >
      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-mascota/75">
        Logic Plus
      </span>
      <svg
        viewBox="0 0 132 150"
        width="132"
        height="150"
        aria-hidden="true"
        className="overflow-visible drop-shadow-[0_2px_3px_rgba(0,0,0,0.28)]"
      >
        <ellipse id="mono-sombra" cx="66" cy="132" rx="26" ry="6" fill="#FF6B2C" opacity="0.16" />
        <g id="mono-cuerpo" transform="translate(66,80)">
          <g stroke="#FF6B2C" strokeWidth="5.5" strokeLinecap="round" fill="none">
            <line x1="0" y1="-26" x2="0" y2="14" />
            <g id="mono-brazoI">
              <line x1="0" y1="-18" x2="0" y2="10" />
            </g>
            <g id="mono-brazoD">
              <line x1="0" y1="-18" x2="0" y2="10" />
            </g>
            <g id="mono-piernaI">
              <line x1="0" y1="14" x2="0" y2="46" />
            </g>
            <g id="mono-piernaD">
              <line x1="0" y1="14" x2="0" y2="46" />
            </g>
          </g>
          <circle cx="0" cy="-38" r="12" fill="#FF6B2C" />
          <circle cx="-4.5" cy="-40" r="2.1" fill="#fff" />
          <circle cx="4.5" cy="-40" r="2.1" fill="#fff" />
        </g>
      </svg>
    </button>
  );
}
