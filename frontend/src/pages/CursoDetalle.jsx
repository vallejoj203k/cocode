import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../hooks/useApi.js';
import {
  Cargando,
  Confirmacion,
  EncabezadoPagina,
  EstadoVacio,
  MensajeError,
} from '../components/ui.jsx';
import {
  Clase,
  FormularioClase,
  FormularioCurso,
  FormularioModulo,
} from '../components/curriculo/index.jsx';
import Icono from '../components/Icono.jsx';

/** Plan de clases de un curso: sus modulos y, dentro, sus clases. */
export default function CursoDetalle() {
  const { courseId } = useParams();
  const { esAdmin } = useAuth();
  const navigate = useNavigate();

  const { data: cursos, cargando: cargandoCursos, recargar: recargarCursos } =
    useFetch('/curriculum/courses');
  const curso = cursos?.find((c) => c.id === courseId);

  const {
    data: modulos,
    cargando,
    error,
    recargar,
  } = useFetch('/curriculum/modules', { courseId });

  const [modalCurso, setModalCurso] = useState(null);
  const [modalModulo, setModalModulo] = useState(null);
  const [modalClase, setModalClase] = useState(null);
  const [porEliminar, setPorEliminar] = useState(null);
  const [errorAccion, setErrorAccion] = useState(null);

  const recargarTodo = () => {
    recargarCursos();
    recargar();
  };

  const eliminar = async () => {
    setErrorAccion(null);
    try {
      const ruta =
        porEliminar.tipo === 'curso'
          ? `/curriculum/courses/${porEliminar.id}`
          : porEliminar.tipo === 'modulo'
            ? `/curriculum/modules/${porEliminar.id}`
            : `/curriculum/classes/${porEliminar.id}`;

      await api.del(ruta, porEliminar.forzar ? { force: 'true' } : undefined);
      setPorEliminar(null);

      // Al borrar el curso ya no hay nada que mostrar aqui.
      if (porEliminar.tipo === 'curso') navigate('/curriculo');
      else recargarTodo();
    } catch (err) {
      if (err.status === 409) setPorEliminar({ ...porEliminar, forzar: true, aviso: err.message });
      else {
        setErrorAccion(err);
        setPorEliminar(null);
      }
    }
  };

  if (cargando || cargandoCursos) return <Cargando />;

  // Un curso al que no se tiene acceso responde 404 igual que uno inexistente,
  // a proposito. Se comprueba antes que el error para dar una salida clara en
  // lugar de una caja de error cruda.
  if (!curso) {
    return (
      <EstadoVacio
        titulo="Curso no encontrado"
        descripcion="Puede que se haya eliminado o que no tengas acceso a él."
        icono="curriculo"
        accion={
          <Link to="/curriculo" className="btn-primary">
            Ver todos los cursos
          </Link>
        }
      />
    );
  }

  if (error) return <MensajeError error={error} onReintentar={recargar} />;

  const totalClases = (modulos ?? []).reduce((acc, m) => acc + m.clases.length, 0);

  return (
    <>
      <EncabezadoPagina
        titulo={curso.nombre}
        descripcion={[
          `${(modulos ?? []).length} módulos`,
          `${totalClases} clases`,
          curso.duracionMeses && `${curso.duracionMeses} meses`,
          curso.edadSugerida,
        ]
          .filter(Boolean)
          .join(' · ')}
        acciones={
          <>
            {esAdmin && (
              <>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setModalModulo({ valorInicial: null })}
                >
                  + Nuevo módulo
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setModalCurso({ valorInicial: curso })}
                >
                  Editar curso
                </button>
              </>
            )}
            <Link to="/curriculo" className="btn-secondary gap-1.5">
              <Icono nombre="volver" size={16} />
              Cursos
            </Link>
          </>
        }
      />

      {curso.descripcion && (
        <p className="mb-6 max-w-3xl text-sm text-slate-500">{curso.descripcion}</p>
      )}

      <MensajeError error={errorAccion} />

      {(modulos ?? []).length === 0 ? (
        <EstadoVacio
          titulo="Este curso todavía no tiene módulos"
          descripcion={
            esAdmin
              ? 'Crea el primer módulo para empezar a construir su plan de clases.'
              : 'El equipo todavía está preparando el contenido.'
          }
          icono="curriculo"
        />
      ) : (
        <div className="space-y-4">
          {modulos.map((m) => (
            <section key={m.id} className="card overflow-hidden">
              <header className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-marca-500 text-sm font-bold text-white">
                    M{m.numero}
                  </span>
                  <div>
                    <h2 className="font-semibold text-slate-900">{m.nombre}</h2>
                    <p className="text-sm text-slate-500">{m.objetivo}</p>
                    <p className="mt-1 text-xs text-slate-400">{m.clases.length} clases</p>
                  </div>
                </div>

                {esAdmin && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn-secondary text-xs"
                      onClick={() => setModalClase({ moduleId: m.id, valorInicial: null })}
                    >
                      + Clase
                    </button>
                    <button
                      type="button"
                      className="btn-secondary text-xs"
                      onClick={() => setModalModulo({ valorInicial: m })}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn text-xs text-rose-600 hover:bg-rose-50"
                      onClick={() => setPorEliminar({ tipo: 'modulo', id: m.id, nombre: m.nombre })}
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </header>

              <ul>
                {m.clases.map((c) => (
                  <Clase
                    key={c.id}
                    clase={c}
                    esAdmin={esAdmin}
                    onEditar={() => setModalClase({ moduleId: m.id, valorInicial: c })}
                    onEliminar={() => setPorEliminar({ tipo: 'clase', id: c.id, nombre: c.nombre })}
                  />
                ))}
                {m.clases.length === 0 && (
                  <li className="border-t border-slate-100 px-5 py-4 text-sm text-slate-400">
                    Este módulo todavía no tiene clases.
                  </li>
                )}
              </ul>
            </section>
          ))}
        </div>
      )}

      {modalCurso && (
        <FormularioCurso
          valorInicial={modalCurso.valorInicial}
          onCerrar={() => setModalCurso(null)}
          onGuardado={() => {
            setModalCurso(null);
            recargarCursos();
          }}
        />
      )}

      {modalModulo && (
        <FormularioModulo
          abierto
          courseId={courseId}
          valorInicial={modalModulo.valorInicial}
          onCerrar={() => setModalModulo(null)}
          onGuardado={() => {
            setModalModulo(null);
            recargarTodo();
          }}
        />
      )}

      {modalClase && (
        <FormularioClase
          abierto
          moduleId={modalClase.moduleId}
          valorInicial={modalClase.valorInicial}
          onCerrar={() => setModalClase(null)}
          onGuardado={() => {
            setModalClase(null);
            recargarTodo();
          }}
        />
      )}

      <Confirmacion
        abierto={Boolean(porEliminar)}
        titulo={
          porEliminar?.tipo === 'curso'
            ? 'Eliminar curso'
            : porEliminar?.tipo === 'modulo'
              ? 'Eliminar módulo'
              : 'Eliminar clase'
        }
        mensaje={
          porEliminar?.aviso ??
          `¿Seguro que quieres eliminar "${porEliminar?.nombre}"? Esta acción no se puede deshacer.`
        }
        textoConfirmar={porEliminar?.forzar ? 'Eliminar de todos modos' : 'Eliminar'}
        onConfirmar={eliminar}
        onCancelar={() => setPorEliminar(null)}
      />
    </>
  );
}
