import { useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../hooks/useApi.js';
import {
  Badge,
  Campo,
  Cargando,
  Confirmacion,
  EncabezadoPagina,
  EstadoVacio,
  MensajeError,
  Modal,
} from '../components/ui.jsx';

const MODULO_VACIO = { numero: '', nombre: '', objetivo: '', descripcion: '' };
const CLASE_VACIA = { numeroClase: '', nombre: '', objetivo: '', contenido: '', conceptosClave: '', recursosUrl: '' };
const CURSO_VACIO = { nombre: '', descripcion: '', duracionMeses: '', edadSugerida: '' };

function FormularioCurso({ valorInicial, onCerrar, onGuardado }) {
  const [form, setForm] = useState(valorInicial ?? CURSO_VACIO);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const editando = Boolean(valorInicial?.id);

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const cuerpo = {
        nombre: form.nombre,
        descripcion: form.descripcion || null,
        duracionMeses: form.duracionMeses === '' ? null : Number(form.duracionMeses),
        edadSugerida: form.edadSugerida || null,
      };
      if (editando) await api.patch(`/curriculum/courses/${valorInicial.id}`, cuerpo);
      else await api.post('/curriculum/courses', cuerpo);
      onGuardado();
    } catch (err) {
      setError(err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal abierto titulo={editando ? 'Editar curso' : 'Nuevo curso'} onCerrar={onCerrar}>
      <form onSubmit={enviar} className="space-y-4">
        <Campo etiqueta="Nombre del curso" requerido>
          <input
            className="input"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Ej: Scratch para principiantes"
            required
          />
        </Campo>

        <Campo etiqueta="Descripción">
          <textarea
            className="input"
            rows={2}
            value={form.descripcion ?? ''}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          />
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Duración en meses">
            <input
              type="number"
              min="1"
              className="input"
              value={form.duracionMeses ?? ''}
              onChange={(e) => setForm({ ...form, duracionMeses: e.target.value })}
            />
          </Campo>
          <Campo etiqueta="Edad sugerida">
            <input
              className="input"
              value={form.edadSugerida ?? ''}
              onChange={(e) => setForm({ ...form, edadSugerida: e.target.value })}
              placeholder="8 a 10 años"
            />
          </Campo>
        </div>

        <MensajeError error={error} />

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onCerrar}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={enviando}>
            {enviando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function FormularioModulo({ abierto, courseId, valorInicial, onCerrar, onGuardado }) {
  const [form, setForm] = useState(valorInicial ?? MODULO_VACIO);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const editando = Boolean(valorInicial?.id);

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const cuerpo = {
        courseId,
        numero: Number(form.numero),
        nombre: form.nombre,
        objetivo: form.objetivo,
        descripcion: form.descripcion || null,
      };
      if (editando) await api.patch(`/curriculum/modules/${valorInicial.id}`, cuerpo);
      else await api.post('/curriculum/modules', cuerpo);
      onGuardado();
    } catch (err) {
      setError(err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal abierto={abierto} titulo={editando ? 'Editar módulo' : 'Nuevo módulo'} onCerrar={onCerrar}>
      <form onSubmit={enviar} className="space-y-4">
        <Campo etiqueta="Número de módulo" requerido ayuda="La numeración es propia de cada curso.">
          <input
            type="number"
            min="1"
            className="input"
            value={form.numero}
            onChange={(e) => setForm({ ...form, numero: e.target.value })}
            required
          />
        </Campo>
        <Campo etiqueta="Nombre" requerido>
          <input
            className="input"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            required
          />
        </Campo>
        <Campo etiqueta="Objetivo" requerido>
          <textarea
            className="input"
            rows={2}
            value={form.objetivo}
            onChange={(e) => setForm({ ...form, objetivo: e.target.value })}
            required
          />
        </Campo>
        <Campo etiqueta="Descripción">
          <textarea
            className="input"
            rows={2}
            value={form.descripcion ?? ''}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          />
        </Campo>

        <MensajeError error={error} />

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onCerrar}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={enviando}>
            {enviando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function FormularioClase({ abierto, moduleId, valorInicial, onCerrar, onGuardado }) {
  const [form, setForm] = useState(
    valorInicial
      ? { ...valorInicial, conceptosClave: (valorInicial.conceptosClave ?? []).join(', ') }
      : CLASE_VACIA,
  );
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const editando = Boolean(valorInicial?.id);

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const cuerpo = {
        numeroClase: Number(form.numeroClase),
        nombre: form.nombre,
        objetivo: form.objetivo,
        contenido: form.contenido,
        conceptosClave: form.conceptosClave
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean),
        recursosUrl: form.recursosUrl || '',
      };
      if (editando) await api.patch(`/curriculum/classes/${valorInicial.id}`, cuerpo);
      else await api.post(`/curriculum/modules/${moduleId}/classes`, cuerpo);
      onGuardado();
    } catch (err) {
      setError(err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal
      abierto={abierto}
      titulo={editando ? 'Editar clase' : 'Nueva clase'}
      onCerrar={onCerrar}
      ancho="max-w-2xl"
    >
      <form onSubmit={enviar} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
          <Campo etiqueta="N° clase" requerido>
            <input
              type="number"
              min="1"
              className="input"
              value={form.numeroClase}
              onChange={(e) => setForm({ ...form, numeroClase: e.target.value })}
              required
            />
          </Campo>
          <Campo etiqueta="Nombre" requerido>
            <input
              className="input"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              required
            />
          </Campo>
        </div>

        <Campo etiqueta="Objetivo" requerido>
          <textarea
            className="input"
            rows={2}
            value={form.objetivo}
            onChange={(e) => setForm({ ...form, objetivo: e.target.value })}
            required
          />
        </Campo>

        <Campo etiqueta="Contenido / plan de la clase" requerido>
          <textarea
            className="input"
            rows={4}
            value={form.contenido}
            onChange={(e) => setForm({ ...form, contenido: e.target.value })}
            required
          />
        </Campo>

        <Campo etiqueta="Conceptos clave" ayuda="Sepáralos con comas: variable, input, print">
          <input
            className="input"
            value={form.conceptosClave}
            onChange={(e) => setForm({ ...form, conceptosClave: e.target.value })}
          />
        </Campo>

        <Campo etiqueta="Enlace a recursos" ayuda="Opcional: presentación, ejercicios o repositorio">
          <input
            type="url"
            className="input"
            placeholder="https://..."
            value={form.recursosUrl ?? ''}
            onChange={(e) => setForm({ ...form, recursosUrl: e.target.value })}
          />
        </Campo>

        <MensajeError error={error} />

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onCerrar}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={enviando}>
            {enviando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Clase({ clase, esAdmin, onEditar, onEliminar }) {
  const [abierta, setAbierta] = useState(false);
  // El backend marca como no accesible lo que el estudiante no ha comprado, y
  // en ese caso ni siquiera envia el contenido.
  const bloqueada = clase.accesible === false;

  if (bloqueada) {
    return (
      <li className="border-t border-slate-100">
        <div className="flex items-center gap-3 px-5 py-3 opacity-70">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-400">
            {clase.numeroClase}
          </span>
          <span className="flex-1">
            <span className="block font-medium text-slate-500">{clase.nombre}</span>
            <span className="block text-xs text-slate-400">
              Esta clase no está incluida en lo que tienes. Pídesela a tu acudiente.
            </span>
          </span>
          <span title="Clase bloqueada" aria-label="Clase bloqueada">
            🔒
          </span>
        </div>
      </li>
    );
  }

  return (
    <li className="border-t border-slate-100">
      <div className="flex items-start gap-3 px-5 py-3">
        <button
          type="button"
          onClick={() => setAbierta((v) => !v)}
          className="flex flex-1 items-start gap-3 text-left"
          aria-expanded={abierta}
        >
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-marca-100 text-xs font-bold text-marca-700">
            {clase.numeroClase}
          </span>
          <span className="flex-1">
            <span className="block font-medium text-slate-800">{clase.nombre}</span>
            <span className="block text-xs text-slate-500">{clase.objetivo}</span>
          </span>
          <span className="text-slate-400" aria-hidden="true">
            {abierta ? '▾' : '▸'}
          </span>
        </button>

        {esAdmin && (
          <div className="flex gap-1">
            <button type="button" onClick={onEditar} className="btn-ghost px-2 py-1 text-xs" title="Editar clase">
              ✏️
            </button>
            <button
              type="button"
              onClick={onEliminar}
              className="btn px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
              title="Eliminar clase"
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      {abierta && (
        <div className="bg-slate-50/70 px-5 py-4 pl-16 text-sm text-slate-600">
          <p className="whitespace-pre-line">{clase.contenido}</p>
          {clase.conceptosClave?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {clase.conceptosClave.map((c) => (
                <Badge key={c} tono="azul">
                  {c}
                </Badge>
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-slate-400">Duración: {clase.duracionMinutos} minutos</p>
          {clase.recursosUrl && (
            <a
              href={clase.recursosUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-xs font-semibold text-marca-600 hover:underline"
            >
              Abrir recursos →
            </a>
          )}
        </div>
      )}
    </li>
  );
}

export default function Curriculo() {
  const { esAdmin } = useAuth();
  const { data: cursos, cargando: cargandoCursos, error: errorCursos, recargar: recargarCursos } =
    useFetch('/curriculum/courses');

  const [cursoId, setCursoId] = useState(null);
  // Mientras no se elija nada, se muestra el primer curso de la lista.
  const cursoActivo = cursos?.find((c) => c.id === cursoId) ?? cursos?.[0] ?? null;

  const {
    data: modulos,
    cargando,
    error,
    recargar,
  } = useFetch('/curriculum/modules', { courseId: cursoActivo?.id }, { skip: !cursoActivo });

  const [modalCurso, setModalCurso] = useState(null); // {valorInicial} | null
  const [modalModulo, setModalModulo] = useState(null); // {valorInicial} | null
  const [modalClase, setModalClase] = useState(null); // {moduleId, valorInicial} | null
  const [porEliminar, setPorEliminar] = useState(null); // {tipo, id, nombre}
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
      if (porEliminar.tipo === 'curso') setCursoId(null);
      recargarTodo();
    } catch (err) {
      // El backend pide confirmacion extra si ya hay clases dictadas.
      if (err.status === 409) {
        setPorEliminar({ ...porEliminar, forzar: true, aviso: err.message });
      } else {
        setErrorAccion(err);
        setPorEliminar(null);
      }
    }
  };

  if (cargandoCursos) return <Cargando />;
  if (errorCursos) return <MensajeError error={errorCursos} onReintentar={recargarCursos} />;

  if (!cursoActivo) {
    return (
      <>
        <EncabezadoPagina titulo="Currículo" descripcion="Los programas que ofrece la escuela." />
        <EstadoVacio
          titulo="Todavía no hay cursos"
          descripcion={
            esAdmin
              ? 'Crea el primer curso para empezar a construir su plan de módulos y clases.'
              : 'Cuando el administrador cree un curso aparecerá aquí.'
          }
          icono="📚"
          accion={
            esAdmin && (
              <button type="button" className="btn-primary" onClick={() => setModalCurso({ valorInicial: null })}>
                + Nuevo curso
              </button>
            )
          }
        />
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
      </>
    );
  }

  const totalClases = (modulos ?? []).reduce((acc, m) => acc + m.clases.length, 0);

  return (
    <>
      <EncabezadoPagina
        titulo="Currículo"
        descripcion={`${cursos.length} curso${cursos.length === 1 ? '' : 's'} · cada uno con su propio plan de clases.`}
        acciones={
          esAdmin && (
            <button type="button" className="btn-secondary" onClick={() => setModalCurso({ valorInicial: null })}>
              + Nuevo curso
            </button>
          )
        }
      />

      {/* Selector de curso: cada curso tiene su propio currículo independiente. */}
      <div className="mb-5 flex flex-wrap gap-2">
        {cursos.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCursoId(c.id)}
            className={`rounded-lg border px-4 py-2 text-left transition ${
              c.id === cursoActivo.id
                ? 'border-marca-500 bg-marca-50 text-marca-800'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
          >
            <span className="block text-sm font-semibold">{c.nombre}</span>
            <span className="block text-xs text-slate-500">
              {c._count.modulos} módulos · {c.totalClases} clases · {c._count.grupos} grupo
              {c._count.grupos === 1 ? '' : 's'}
            </span>
          </button>
        ))}
      </div>

      <div className="card mb-5 flex flex-wrap items-start justify-between gap-3 p-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{cursoActivo.nombre}</h2>
          {cursoActivo.descripcion && <p className="mt-1 text-sm text-slate-500">{cursoActivo.descripcion}</p>}
          <p className="mt-2 text-xs text-slate-400">
            {(modulos ?? []).length} módulos · {totalClases} clases
            {cursoActivo.duracionMeses ? ` · ${cursoActivo.duracionMeses} meses` : ''}
            {cursoActivo.edadSugerida ? ` · ${cursoActivo.edadSugerida}` : ''}
          </p>
        </div>

        {esAdmin && (
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-primary text-xs" onClick={() => setModalModulo({ valorInicial: null })}>
              + Nuevo módulo
            </button>
            <button
              type="button"
              className="btn-secondary text-xs"
              onClick={() => setModalCurso({ valorInicial: cursoActivo })}
            >
              Editar curso
            </button>
            <button
              type="button"
              className="btn text-xs text-rose-600 hover:bg-rose-50"
              onClick={() => setPorEliminar({ tipo: 'curso', id: cursoActivo.id, nombre: cursoActivo.nombre })}
            >
              Eliminar curso
            </button>
          </div>
        )}
      </div>

      <MensajeError error={errorAccion} />
      {error && <MensajeError error={error} onReintentar={recargar} />}

      {cargando ? (
        <Cargando />
      ) : (modulos ?? []).length === 0 ? (
        <EstadoVacio
          titulo="Este curso todavía no tiene módulos"
          descripcion="Crea el primer módulo para empezar a construir su plan de clases."
          icono="📚"
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
          courseId={cursoActivo.id}
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
