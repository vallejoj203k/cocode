import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../hooks/useApi.js';
import {
  Badge,
  Cargando,
  Confirmacion,
  EncabezadoPagina,
  EstadoVacio,
  MensajeError,
} from '../components/ui.jsx';
import { FormularioCurso } from '../components/curriculo/index.jsx';
import Icono from '../components/Icono.jsx';

/**
 * Catalogo de cursos. El plan de cada uno (modulos y clases) vive en su propia
 * pagina: con varios cursos, mostrarlo todo junto aqui obligaba a desplazarse
 * cientos de lineas para llegar al que interesa.
 */
export default function Curriculo() {
  const { esAdmin } = useAuth();
  const { data: cursos, cargando, error, recargar } = useFetch('/curriculum/courses');

  const [modalCurso, setModalCurso] = useState(null);
  const [porEliminar, setPorEliminar] = useState(null);
  const [errorAccion, setErrorAccion] = useState(null);

  const eliminar = async () => {
    setErrorAccion(null);
    try {
      await api.del(
        `/curriculum/courses/${porEliminar.id}`,
        porEliminar.forzar ? { force: 'true' } : undefined,
      );
      setPorEliminar(null);
      recargar();
    } catch (err) {
      // El backend pide confirmacion extra si el curso ya tiene contenido.
      if (err.status === 409) setPorEliminar({ ...porEliminar, forzar: true, aviso: err.message });
      else {
        setErrorAccion(err);
        setPorEliminar(null);
      }
    }
  };

  if (cargando) return <Cargando />;
  if (error) return <MensajeError error={error} onReintentar={recargar} />;

  return (
    <>
      <EncabezadoPagina
        titulo="Cursos"
        descripcion={
          esAdmin
            ? 'Cada curso enseña un lenguaje distinto y tiene su propio plan de clases. Abre uno para verlo o editarlo.'
            : 'Tus cursos. Abre uno para ver sus módulos y clases.'
        }
        acciones={
          esAdmin && (
            <button type="button" className="btn-primary" onClick={() => setModalCurso({ valorInicial: null })}>
              + Nuevo curso
            </button>
          )
        }
      />

      <MensajeError error={errorAccion} />

      {cursos.length === 0 ? (
        <EstadoVacio
          titulo={esAdmin ? 'Todavía no hay cursos' : 'Aún no tienes cursos'}
          descripcion={
            esAdmin
              ? 'Crea el primer curso para empezar a construir su plan de módulos y clases.'
              : 'Cuando el administrador te habilite un curso aparecerá aquí.'
          }
          icono="curriculo"
          accion={
            esAdmin && (
              <button type="button" className="btn-primary" onClick={() => setModalCurso({ valorInicial: null })}>
                + Nuevo curso
              </button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cursos.map((curso) => (
            <article key={curso.id} className="card flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-marca-500 text-white">
                  <Icono nombre="curriculo" size={22} />
                </span>
                {!curso.activo && <Badge tono="rojo">Archivado</Badge>}
              </div>

              <h2 className="mt-4 text-lg font-bold text-slate-900">{curso.nombre}</h2>
              {curso.descripcion && (
                <p className="mt-1 line-clamp-3 text-sm text-slate-500">{curso.descripcion}</p>
              )}

              <dl className="mt-4 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Contenido</dt>
                  <dd className="font-medium text-slate-700">
                    {curso._count.modulos} módulos · {curso.totalClases} clases
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Grupos</dt>
                  <dd className="font-medium text-slate-700">{curso._count.grupos}</dd>
                </div>
                {curso.duracionMeses && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Duración</dt>
                    <dd className="font-medium text-slate-700">{curso.duracionMeses} meses</dd>
                  </div>
                )}
                {curso.edadSugerida && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Edad</dt>
                    <dd className="font-medium text-slate-700">{curso.edadSugerida}</dd>
                  </div>
                )}
              </dl>

              {/* El boton principal queda abajo aunque las tarjetas midan distinto. */}
              <div className="mt-auto pt-4">
                <Link to={`/curriculo/${curso.id}`} className="btn-primary w-full">
                  Ver el plan de clases
                </Link>

                {esAdmin && (
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      className="btn-secondary flex-1 text-xs"
                      onClick={() => setModalCurso({ valorInicial: curso })}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn flex-1 text-xs text-rose-600 hover:bg-rose-50"
                      onClick={() => setPorEliminar({ id: curso.id, nombre: curso.nombre })}
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {modalCurso && (
        <FormularioCurso
          valorInicial={modalCurso.valorInicial}
          onCerrar={() => setModalCurso(null)}
          onGuardado={() => {
            setModalCurso(null);
            recargar();
          }}
        />
      )}

      <Confirmacion
        abierto={Boolean(porEliminar)}
        titulo="Eliminar curso"
        mensaje={
          porEliminar?.aviso ??
          `¿Seguro que quieres eliminar "${porEliminar?.nombre}"? Se borra junto con sus módulos y clases.`
        }
        textoConfirmar={porEliminar?.forzar ? 'Eliminar de todos modos' : 'Eliminar'}
        onConfirmar={eliminar}
        onCancelar={() => setPorEliminar(null)}
      />
    </>
  );
}
