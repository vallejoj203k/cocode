import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../hooks/useApi.js';
import { Badge, Campo, Cargando, EncabezadoPagina, EstadoVacio, MensajeError, Modal } from '../components/ui.jsx';
import { DIAS_SEMANA, aInputFecha, capitalizar, formatoFecha, hoyISO } from '../lib/format.js';
import Icono from '../components/Icono.jsx';

function FormularioGrupo({ valorInicial, tutores, cursos, onCerrar, onGuardado }) {
  const editando = Boolean(valorInicial?.id);
  const [form, setForm] = useState({
    nombre: valorInicial?.nombre ?? '',
    courseId: valorInicial?.courseId ?? cursos[0]?.id ?? '',
    diaSemana: valorInicial?.diaSemana ?? 'SABADO',
    hora: valorInicial?.hora ?? '09:00',
    fechaInicio: aInputFecha(valorInicial?.fechaInicio) || hoyISO(),
    tutorId: valorInicial?.tutorId ?? '',
    cupoMaximo: valorInicial?.cupoMaximo ?? '',
    enlaceReunion: valorInicial?.enlaceReunion ?? '',
    notas: valorInicial?.notas ?? '',
  });
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const cuerpo = {
        nombre: form.nombre,
        courseId: form.courseId,
        diaSemana: form.diaSemana,
        hora: form.hora,
        fechaInicio: form.fechaInicio,
        tutorId: form.tutorId || null,
        cupoMaximo: form.cupoMaximo === '' ? null : Number(form.cupoMaximo),
        enlaceReunion: form.enlaceReunion.trim(),
        notas: form.notas || null,
      };
      if (editando) await api.patch(`/groups/${valorInicial.id}`, cuerpo);
      else await api.post('/groups', cuerpo);
      onGuardado();
    } catch (err) {
      setError(err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal abierto titulo={editando ? 'Editar grupo' : 'Nuevo grupo'} onCerrar={onCerrar}>
      <form onSubmit={enviar} className="space-y-4">
        <Campo etiqueta="Nombre del grupo" requerido>
          <input
            className="input"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Ej: Grupo Serpientes"
            required
          />
        </Campo>

        <Campo
          etiqueta="Curso"
          requerido
          ayuda={
            editando
              ? 'Cambiar el curso reinicia la referencia del avance: el historial ya registrado queda ligado a las clases del curso anterior.'
              : 'El grupo avanza por el currículo de este curso.'
          }
        >
          <select
            className="input"
            value={form.courseId}
            onChange={(e) => setForm({ ...form, courseId: e.target.value })}
            required
          >
            <option value="">Selecciona un curso</option>
            {cursos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Día de clase" requerido>
            <select
              className="input"
              value={form.diaSemana}
              onChange={(e) => setForm({ ...form, diaSemana: e.target.value })}
            >
              {DIAS_SEMANA.map((d) => (
                <option key={d} value={d}>
                  {capitalizar(d)}
                </option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Hora" requerido>
            <input
              type="time"
              className="input"
              value={form.hora}
              onChange={(e) => setForm({ ...form, hora: e.target.value })}
              required
            />
          </Campo>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Fecha de inicio" requerido>
            <input
              type="date"
              className="input"
              value={form.fechaInicio}
              onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
              required
            />
          </Campo>
          <Campo etiqueta="Cupo máximo">
            <input
              type="number"
              min="1"
              className="input"
              value={form.cupoMaximo}
              onChange={(e) => setForm({ ...form, cupoMaximo: e.target.value })}
              placeholder="Sin límite"
            />
          </Campo>
        </div>

        <Campo
          etiqueta="Enlace de la clase virtual"
          ayuda="La sala fija de Meet o Zoom del grupo. Los estudiantes verán un botón para entrar."
        >
          <input
            type="url"
            className="input"
            value={form.enlaceReunion}
            onChange={(e) => setForm({ ...form, enlaceReunion: e.target.value })}
            placeholder="https://meet.google.com/abc-defg-hij"
          />
        </Campo>

        <Campo etiqueta="Tutor asignado">
          <select
            className="input"
            value={form.tutorId}
            onChange={(e) => setForm({ ...form, tutorId: e.target.value })}
          >
            <option value="">Sin tutor</option>
            {tutores.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
        </Campo>

        <Campo etiqueta="Notas">
          <textarea
            className="input"
            rows={2}
            value={form.notas}
            onChange={(e) => setForm({ ...form, notas: e.target.value })}
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

export default function Grupos() {
  const { esAdmin } = useAuth();
  const { data: grupos, cargando, error, recargar } = useFetch('/groups');
  const { data: tutoresResp } = useFetch('/users', { rol: 'TUTOR', activo: 'true', limit: 100 }, { skip: !esAdmin });
  const { data: cursos } = useFetch('/curriculum/courses', { activo: 'true' }, { skip: !esAdmin });
  const [modal, setModal] = useState(null);

  if (cargando) return <Cargando />;
  if (error) return <MensajeError error={error} onReintentar={recargar} />;

  const tutores = tutoresResp?.items ?? [];
  const listaCursos = cursos ?? [];

  return (
    <>
      <EncabezadoPagina
        titulo="Grupos"
        descripcion={
          esAdmin ? 'Cohortes en marcha. Cada una sigue el currículo de su curso.' : 'Los grupos que tienes asignados.'
        }
        acciones={
          esAdmin && (
            <button type="button" className="btn-primary" onClick={() => setModal({ valorInicial: null })}>
              + Nuevo grupo
            </button>
          )
        }
      />

      {grupos.length === 0 ? (
        <EstadoVacio
          titulo={esAdmin ? 'Todavía no hay grupos' : 'No tienes grupos asignados'}
          descripcion={
            esAdmin
              ? 'Crea un grupo, asígnale un tutor e inscribe estudiantes para empezar.'
              : 'Cuando el administrador te asigne un grupo aparecerá aquí.'
          }
          icono="grupos"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {grupos.map((g) => (
            <article key={g.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-slate-900">{g.nombre}</h2>
                    {!g.activo && <Badge tono="rojo">Archivado</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {capitalizar(g.diaSemana)} · {g.hora}
                  </p>
                  <p className="mt-1">
                    <Badge tono="azul">{g.course?.nombre ?? 'Sin curso'}</Badge>
                  </p>
                </div>
                {esAdmin && (
                  <button
                    type="button"
                    className="btn-secondary text-xs"
                    onClick={() => setModal({ valorInicial: g })}
                  >
                    Editar
                  </button>
                )}
              </div>

              <dl className="mt-4 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Tutor</dt>
                  <dd className="font-medium text-slate-700">{g.tutor?.nombre ?? 'Sin asignar'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Estudiantes</dt>
                  <dd className="font-medium text-slate-700">
                    {g._count.inscripciones}
                    {g.cupoMaximo ? ` / ${g.cupoMaximo}` : ''}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Inicio</dt>
                  <dd className="font-medium text-slate-700">{formatoFecha(g.fechaInicio)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Última clase</dt>
                  <dd className="max-w-[60%] truncate text-right font-medium text-slate-700">
                    {g.ultimaClase ? g.ultimaClase.clase.nombre : 'Sin registro'}
                  </dd>
                </div>
              </dl>

              {g.enlaceReunion && (
                <a
                  href={g.enlaceReunion}
                  target="_blank"
                  rel="noreferrer"
                  className="btn mt-4 w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <Icono nombre="clase" size={18} />
                  Entrar a la clase
                </a>
              )}

              <Link to={`/grupos/${g.id}`} className="btn-primary mt-2 w-full">
                Abrir grupo
              </Link>
            </article>
          ))}
        </div>
      )}

      {modal && (
        <FormularioGrupo
          valorInicial={modal.valorInicial}
          tutores={tutores}
          cursos={listaCursos}
          onCerrar={() => setModal(null)}
          onGuardado={() => {
            setModal(null);
            recargar();
          }}
        />
      )}
    </>
  );
}
