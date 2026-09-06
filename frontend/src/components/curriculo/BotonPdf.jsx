import { useState } from 'react';
import { api } from '../../api/client.js';
import Icono from '../Icono.jsx';

/**
 * Boton que descarga el plan de un curso en PDF, para entregarselo a una
 * familia interesada.
 *
 * Esta suelto en su propio componente porque aparece en dos sitios: en cada
 * tarjeta del catalogo y en la cabecera del curso abierto. Quien lo usa desde
 * el catalogo no tiene los modulos cargados —la lista solo trae contadores—,
 * asi que si no se los pasan los pide al pulsar. Un curso vale menos de 50 kB
 * de JSON: no compensa cargar el plan de todos los cursos por si acaso.
 *
 * La libreria del PDF tambien se carga aqui y no arriba: son cientos de
 * kilobytes que no tiene por que descargar quien solo entra a consultar el
 * curriculo.
 */
export default function BotonPdf({ curso, modulos, className = 'btn-secondary', onError }) {
  const [generando, setGenerando] = useState(false);

  // Si nos pasan los modulos sabemos si hay algo que imprimir; si no, nos fiamos
  // del contador que ya trae la lista de cursos.
  const vacio = modulos ? modulos.length === 0 : curso._count?.modulos === 0;

  const descargar = async () => {
    setGenerando(true);
    onError?.(null);
    try {
      const plan = modulos ?? (await api.get('/curriculum/modules', { courseId: curso.id }));
      const { descargarPlanDeCurso } = await import('../../lib/pdfCurso.js');
      await descargarPlanDeCurso(curso, plan);
    } catch (err) {
      onError?.(new Error('No se pudo generar el PDF. Vuelve a intentarlo.'));
      console.error('[pdf]', err);
    } finally {
      setGenerando(false);
    }
  };

  return (
    <button
      type="button"
      className={`${className} gap-1.5`}
      onClick={descargar}
      disabled={generando || vacio}
      title={
        vacio
          ? 'Este curso todavía no tiene clases que imprimir'
          : 'Descarga el plan de clases para entregarlo a una familia interesada'
      }
    >
      <Icono nombre="descargar" size={16} />
      {generando ? 'Generando…' : 'PDF'}
    </button>
  );
}
