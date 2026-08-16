/**
 * Marca de agua de fondo, a partir de `public/background.svg`.
 *
 * Va en una capa propia y no como fondo del contenedor, por tres razones:
 *
 * - La opacidad se aplica solo a la imagen. Si se pusiera en el contenedor,
 *   arrastraria tambien al texto y a los formularios.
 * - `pointer-events: none` garantiza que jamas intercepte un clic, por muy
 *   grande que sea el dibujo.
 * - `aria-hidden` la deja fuera de los lectores de pantalla: es decoracion, no
 *   informacion.
 *
 * Los dos ajustes que se tocan al cambiar el dibujo estan aqui arriba.
 */

/** Cuanto se ve. Por debajo de 0.10 el texto encima se lee sin esfuerzo. */
const OPACIDAD = 0.07;

/**
 * Un logo suele venir con colores de marca a plena saturacion, que como fondo
 * cansan la vista y compiten con el contenido. Se rebajan sin volverlo gris del
 * todo, para que la marca siga reconociendose.
 */
const SATURACION = 0.55;

export default function Fondo({ variante = 'unico', opacidad = OPACIDAD }) {
  const repetido = variante === 'repetido';

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{
        backgroundImage: 'url(/background.svg)',
        backgroundRepeat: repetido ? 'repeat' : 'no-repeat',
        // Un motivo pequeno se repite en mosaico; un logo entero se coloca una
        // sola vez, grande y centrado.
        backgroundSize: repetido ? '240px' : 'min(820px, 85vw)',
        backgroundPosition: 'center',
        // Se queda quieto al desplazar la pagina: un fondo que se mueve con el
        // texto distrae justo mientras se lee.
        backgroundAttachment: 'fixed',
        opacity: opacidad,
        filter: `saturate(${SATURACION})`,
      }}
    />
  );
}
