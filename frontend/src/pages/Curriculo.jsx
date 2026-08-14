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

function FormularioModulo({ abierto, valorInicial, onCerrar, onGuardado }) {
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
        <Campo etiqueta="Número de módulo" requerido>
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
  const { data: modulos, cargando, error, recargar } = useFetch('/curriculum/modules');

  const [modalModulo, setModalModulo] = useState(null); // {valorInicial} | null
  const [modalClase, setModalClase] = useState(null); // {moduleId, valorInicial} | null
  const [porEliminar, setPorEliminar] = useState(null); // {tipo, id, nombre}
  const [errorAccion, setErrorAccion] = useState(null);

  const eliminar = async () => {
    setErrorAccion(null);
    try {
      const ruta =
        porEliminar.tipo === 'modulo'
          ? `/curriculum/modules/${porEliminar.id}`
          : `/curriculum/classes/${porEliminar.id}`;
      await api.del(ruta, porEliminar.forzar ? { force: 'true' } : undefined);
      setPorEliminar(null);
      recargar();
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

  if (cargando) return <Cargando />;
  if (error) return <MensajeError error={error} onReintentar={recargar} />;

  const totalClases = modulos.reduce((acc, m) => acc + m.clases.length, 0);

  return (
    <>
      <EncabezadoPagina
        titulo="Currículo del curso"
        descripcion={`${modulos.length} módulos · ${totalClases} clases · 1 clase por semana`}
        acciones={
          esAdmin && (
            <button type="button" className="btn-primary" onClick={() => setModalModulo({ valorInicial: null })}>
              + Nuevo módulo
            </button>
          )
        }
      />

      <MensajeError error={errorAccion} />

      {modulos.length === 0 ? (
        <EstadoVacio
          titulo="El currículo está vacío"
          descripcion="Crea el primer módulo para empezar a construir el plan del curso."
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

      {modalModulo && (
        <FormularioModulo
          abierto
          valorInicial={modalModulo.valorInicial}
          onCerrar={() => setModalModulo(null)}
          onGuardado={() => {
            setModalModulo(null);
            recargar();
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
            recargar();
          }}
        />
      )}

      <Confirmacion
        abierto={Boolean(porEliminar)}
        titulo={porEliminar?.tipo === 'modulo' ? 'Eliminar módulo' : 'Eliminar clase'}
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
