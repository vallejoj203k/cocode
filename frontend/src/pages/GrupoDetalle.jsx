import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../hooks/useApi.js';
import {
  Badge,
  BarraProgreso,
  Campo,
  Cargando,
  Confirmacion,
  EncabezadoPagina,
  EstadoVacio,
  MensajeError,
  Modal,
} from '../components/ui.jsx';
import {
  ETIQUETAS_ESTADO_CLASE,
  TONO_ESTADO_CLASE,
  aInputFecha,
  capitalizar,
  formatoFecha,
  hoyISO,
  nombreCompleto,
} from '../lib/format.js';
import Icono from '../components/Icono.jsx';

/** Hoja de asistencia de una clase concreta. */
function ModalAsistencia({ groupId, clase, puedeEditar, onCerrar, onGuardado }) {
  const { data, cargando, error } = useFetch(`/groups/${groupId}/progress/${clase.id}/attendance`);
  const [filas, setFilas] = useState(null);
  const [errorGuardar, setErrorGuardar] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // La primera carga define el estado editable de la tabla.
  const registros = filas ?? data?.asistencias ?? [];

  const actualizar = (studentId, cambios) =>
    setFilas(registros.map((r) => (r.studentId === studentId ? { ...r, ...cambios } : r)));

  const marcarTodos = (asistio) => setFilas(registros.map((r) => ({ ...r, asistio })));

  const guardar = async () => {
    setGuardando(true);
    setErrorGuardar(null);
    try {
      await api.put(`/groups/${groupId}/progress/${clase.id}/attendance`, {
        asistencias: registros.map((r) => ({
          studentId: r.studentId,
          asistio: r.asistio,
          nota: r.nota || null,
        })),
      });
      onGuardado();
    } catch (err) {
      setErrorGuardar(err);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal abierto titulo={`Asistencia · ${clase.nombre}`} onCerrar={onCerrar} ancho="max-w-3xl">
      {cargando && <Cargando />}
      <MensajeError error={error} />

      {!cargando && !error && (
        <>
          {registros.length === 0 ? (
            <EstadoVacio
              titulo="El grupo no tiene estudiantes activos"
              descripcion="Inscribe estudiantes en el grupo para poder tomar asistencia."
              icono="estudiantes"
            />
          ) : (
            <>
              {puedeEditar && (
                <div className="mb-3 flex flex-wrap gap-2">
                  <button type="button" className="btn-secondary text-xs" onClick={() => marcarTodos(true)}>
                    Marcar todos presentes
                  </button>
                  <button type="button" className="btn-secondary text-xs" onClick={() => marcarTodos(false)}>
                    Marcar todos ausentes
                  </button>
                </div>
              )}

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Estudiante</th>
                      <th className="w-28 text-center">Asistió</th>
                      <th>Observación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registros.map((r) => (
                      <tr key={r.studentId}>
                        <td className="font-medium text-slate-700">{r.nombre}</td>
                        <td className="text-center">
                          <input
                            type="checkbox"
                            className="h-5 w-5 rounded border-slate-300 text-marca-500 focus:ring-marca-400"
                            checked={r.asistio}
                            disabled={!puedeEditar}
                            onChange={(e) => actualizar(r.studentId, { asistio: e.target.checked })}
                            aria-label={`Asistencia de ${r.nombre}`}
                          />
                        </td>
                        <td>
                          <input
                            className="input py-1.5 text-xs"
                            value={r.nota ?? ''}
                            disabled={!puedeEditar}
                            placeholder="Comportamiento, progreso, dificultades..."
                            onChange={(e) => actualizar(r.studentId, { nota: e.target.value })}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <MensajeError error={errorGuardar} />

              <div className="mt-5 flex justify-end gap-2">
                <button type="button" className="btn-secondary" onClick={onCerrar}>
                  {puedeEditar ? 'Cancelar' : 'Cerrar'}
                </button>
                {puedeEditar && (
                  <button type="button" className="btn-primary" onClick={guardar} disabled={guardando}>
                    {guardando ? 'Guardando...' : 'Guardar asistencia'}
                  </button>
                )}
              </div>
            </>
          )}
        </>
      )}
    </Modal>
  );
}

/** Cambiar estado de una clase (pendiente / dictada / cancelada) y su fecha. */
function ModalEstadoClase({ groupId, clase, onCerrar, onGuardado }) {
  const progreso = clase.progreso;
  const [estado, setEstado] = useState(progreso?.estado ?? 'DICTADA');
  const [fecha, setFecha] = useState(aInputFecha(progreso?.fechaDictada) || hoyISO());
  const [notas, setNotas] = useState(progreso?.notas ?? '');
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      await api.put(`/groups/${groupId}/progress/${clase.id}`, {
        estado,
        fechaDictada: estado === 'DICTADA' ? fecha : null,
        notas: notas || null,
      });
      onGuardado();
    } catch (err) {
      setError(err);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal abierto titulo={`Estado · ${clase.nombre}`} onCerrar={onCerrar}>
      <form onSubmit={guardar} className="space-y-4">
        <Campo etiqueta="Estado de la clase" requerido>
          <select className="input" value={estado} onChange={(e) => setEstado(e.target.value)}>
            {Object.entries(ETIQUETAS_ESTADO_CLASE).map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </select>
        </Campo>

        {estado === 'DICTADA' && (
          <Campo etiqueta="Fecha en que se dictó" requerido>
            <input type="date" className="input" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
          </Campo>
        )}

        <Campo etiqueta="Notas de la clase" ayuda="Cómo salió la clase, qué quedó pendiente, etc.">
          <textarea className="input" rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} />
        </Campo>

        <MensajeError error={error} />

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onCerrar}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function PestanaAvance({ groupId, puedeEditar }) {
  const { data, cargando, error, recargar } = useFetch(`/groups/${groupId}/progress`);
  const [modalEstado, setModalEstado] = useState(null);
  const [modalAsistencia, setModalAsistencia] = useState(null);
  const [moduloAbierto, setModuloAbierto] = useState(null);

  const resumen = useMemo(() => {
    if (!data) return { total: 0, dictadas: 0 };
    const clases = data.modulos.flatMap((m) => m.clases);
    return {
      total: clases.length,
      dictadas: clases.filter((c) => c.progreso?.estado === 'DICTADA').length,
    };
  }, [data]);

  if (cargando) return <Cargando />;
  if (error) return <MensajeError error={error} onReintentar={recargar} />;

  return (
    <>
      <div className="card mb-4 p-5">
        <BarraProgreso
          valor={resumen.total ? Math.round((resumen.dictadas / resumen.total) * 100) : 0}
          etiqueta={`${resumen.dictadas} de ${resumen.total} clases dictadas`}
        />
      </div>

      <div className="space-y-3">
        {data.modulos.map((m) => {
          const dictadas = m.clases.filter((c) => c.progreso?.estado === 'DICTADA').length;
          const abierto = moduloAbierto === m.id || (moduloAbierto === null && dictadas > 0 && dictadas < m.clases.length);

          return (
            <section key={m.id} className="card overflow-hidden">
              <button
                type="button"
                onClick={() => setModuloAbierto(abierto ? '' : m.id)}
                className="flex w-full items-center gap-3 px-5 py-4 text-left"
                aria-expanded={abierto}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-marca-500 text-xs font-bold text-white">
                  M{m.numero}
                </span>
                <span className="flex-1">
                  <span className="block font-semibold text-slate-900">{m.nombre}</span>
                  <span className="block text-xs text-slate-500">
                    {dictadas} de {m.clases.length} clases dictadas
                  </span>
                </span>
                {dictadas === m.clases.length && m.clases.length > 0 && <Badge tono="verde">Completo</Badge>}
                <span className="text-slate-400" aria-hidden="true">
                  <Icono nombre={abierto ? 'plegar' : 'desplegar'} size={16} />
                </span>
              </button>

              {abierto && (
                <ul className="border-t border-slate-100">
                  {m.clases.map((c) => (
                    <li
                      key={c.id}
                      className="flex flex-wrap items-center gap-3 border-b border-slate-50 px-5 py-3 last:border-0"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                        {c.numeroClase}
                      </span>
                      <div className="min-w-[180px] flex-1">
                        <p className="text-sm font-medium text-slate-800">{c.nombre}</p>
                        <p className="text-xs text-slate-500">
                          {c.progreso?.fechaDictada ? formatoFecha(c.progreso.fechaDictada) : 'Sin fecha'}
                          {c.progreso?.notas ? ` · ${c.progreso.notas}` : ''}
                        </p>
                      </div>
                      <Badge tono={TONO_ESTADO_CLASE[c.progreso?.estado ?? 'PENDIENTE']}>
                        {ETIQUETAS_ESTADO_CLASE[c.progreso?.estado ?? 'PENDIENTE']}
                      </Badge>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="btn-secondary text-xs"
                          onClick={() => setModalAsistencia(c)}
                        >
                          Asistencia
                        </button>
                        {puedeEditar && (
                          <button
                            type="button"
                            className="btn-secondary text-xs"
                            onClick={() => setModalEstado(c)}
                          >
                            Estado
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      {modalEstado && (
        <ModalEstadoClase
          groupId={groupId}
          clase={modalEstado}
          onCerrar={() => setModalEstado(null)}
          onGuardado={() => {
            setModalEstado(null);
            recargar();
          }}
        />
      )}

      {modalAsistencia && (
        <ModalAsistencia
          groupId={groupId}
          clase={modalAsistencia}
          puedeEditar={puedeEditar}
          onCerrar={() => setModalAsistencia(null)}
          onGuardado={() => {
            setModalAsistencia(null);
            recargar();
          }}
        />
      )}
    </>
  );
}

function PestanaEstudiantes({ grupo, esAdmin, onCambio }) {
  const [modalInscribir, setModalInscribir] = useState(false);
  const [porRetirar, setPorRetirar] = useState(null);
  const [error, setError] = useState(null);

  const activos = grupo.inscripciones.filter((i) => i.estado === 'ACTIVO');
  const retirados = grupo.inscripciones.filter((i) => i.estado !== 'ACTIVO');

  const retirar = async () => {
    setError(null);
    try {
      await api.del(`/groups/${grupo.id}/students/${porRetirar.studentId}`);
      setPorRetirar(null);
      onCambio();
    } catch (err) {
      setError(err);
      setPorRetirar(null);
    }
  };

  return (
    <>
      <MensajeError error={error} />

      {esAdmin && (
        <div className="mb-4 flex justify-end">
          <button type="button" className="btn-primary" onClick={() => setModalInscribir(true)}>
            + Inscribir estudiante
          </button>
        </div>
      )}

      {activos.length === 0 ? (
        <EstadoVacio
          titulo="El grupo no tiene estudiantes"
          descripcion={esAdmin ? 'Inscribe estudiantes para empezar a tomar asistencia.' : 'Aún no hay inscritos.'}
          icono="estudiantes"
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Acudiente</th>
                <th>Contacto</th>
                <th>Ingreso</th>
                {esAdmin && <th />}
              </tr>
            </thead>
            <tbody>
              {activos.map((i) => (
                <tr key={i.id}>
                  <td>
                    <Link to={`/estudiantes/${i.student.id}`} className="font-semibold text-marca-600 hover:underline">
                      {nombreCompleto(i.student)}
                    </Link>
                  </td>
                  <td className="text-slate-600">{i.student.acudienteNombre ?? '—'}</td>
                  <td className="text-slate-600">{i.student.acudienteTelefono ?? '—'}</td>
                  <td className="text-slate-600">{formatoFecha(i.fechaIngreso)}</td>
                  {esAdmin && (
                    <td className="text-right">
                      <button
                        type="button"
                        className="btn text-xs text-rose-600 hover:bg-rose-50"
                        onClick={() => setPorRetirar({ studentId: i.student.id, nombre: nombreCompleto(i.student) })}
                      >
                        Retirar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {retirados.length > 0 && (
        <p className="mt-3 text-xs text-slate-400">
          Retirados: {retirados.map((i) => nombreCompleto(i.student)).join(', ')}
        </p>
      )}

      {modalInscribir && (
        <ModalInscribir
          grupo={grupo}
          onCerrar={() => setModalInscribir(false)}
          onGuardado={() => {
            setModalInscribir(false);
            onCambio();
          }}
        />
      )}

      <Confirmacion
        abierto={Boolean(porRetirar)}
        titulo="Retirar del grupo"
        mensaje={`¿Retirar a ${porRetirar?.nombre} de este grupo? Se conserva su historial de asistencia.`}
        textoConfirmar="Retirar"
        onConfirmar={retirar}
        onCancelar={() => setPorRetirar(null)}
      />
    </>
  );
}

function ModalInscribir({ grupo, onCerrar, onGuardado }) {
  const { data } = useFetch('/students', { activo: 'true', limit: 200 });
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const yaInscritos = new Set(grupo.inscripciones.filter((i) => i.estado === 'ACTIVO').map((i) => i.student.id));
  const disponibles = (data?.items ?? []).filter((s) => !yaInscritos.has(s.id));

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await api.post(`/groups/${grupo.id}/students`, { studentId });
      onGuardado();
    } catch (err) {
      setError(err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal abierto titulo="Inscribir estudiante" onCerrar={onCerrar}>
      <form onSubmit={enviar} className="space-y-4">
        <Campo etiqueta="Estudiante" requerido>
          <select className="input" value={studentId} onChange={(e) => setStudentId(e.target.value)} required>
            <option value="">Selecciona un estudiante</option>
            {disponibles.map((s) => (
              <option key={s.id} value={s.id}>
                {nombreCompleto(s)}
              </option>
            ))}
          </select>
        </Campo>

        {disponibles.length === 0 && (
          <p className="text-sm text-slate-500">
            No hay estudiantes disponibles. Crea uno nuevo desde la sección Estudiantes.
          </p>
        )}

        <MensajeError error={error} />

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onCerrar}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={enviando || !studentId}>
            {enviando ? 'Inscribiendo...' : 'Inscribir'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function GrupoDetalle() {
  const { id } = useParams();
  const { user, esAdmin } = useAuth();
  const { data: grupo, cargando, error, recargar } = useFetch(`/groups/${id}`);
  const [pestana, setPestana] = useState('avance');

  if (cargando) return <Cargando />;
  if (error) return <MensajeError error={error} onReintentar={recargar} />;

  // Solo el admin o el tutor asignado pueden registrar avance y asistencia.
  const puedeEditar = esAdmin || grupo.tutorId === user.id;

  return (
    <>
      <EncabezadoPagina
        titulo={grupo.nombre}
        descripcion={`${grupo.course?.nombre ?? 'Sin curso'} · ${capitalizar(grupo.diaSemana)} ${grupo.hora} · Tutor: ${
          grupo.tutor?.nombre ?? 'sin asignar'
        } · ${grupo.resumen.estudiantesActivos} estudiantes`}
        acciones={
          <>
            {grupo.enlaceReunion && (
              <a
                href={grupo.enlaceReunion}
                target="_blank"
                rel="noreferrer"
                className="btn bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <Icono nombre="clase" size={18} />
                Entrar a la clase
              </a>
            )}
            <Link to="/grupos" className="btn-secondary gap-1.5">
              <Icono nombre="volver" size={16} />
              Volver
            </Link>
          </>
        }
      />

      <div className="mb-5 flex gap-2 border-b border-slate-200">
        {[
          { id: 'avance', etiqueta: 'Avance y asistencia' },
          { id: 'estudiantes', etiqueta: `Estudiantes (${grupo.resumen.estudiantesActivos})` },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setPestana(t.id)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition ${
              pestana === t.id
                ? 'border-marca-500 text-marca-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.etiqueta}
          </button>
        ))}
      </div>

      {pestana === 'avance' && <PestanaAvance groupId={grupo.id} puedeEditar={puedeEditar} />}
      {pestana === 'estudiantes' && (
        <PestanaEstudiantes grupo={grupo} esAdmin={esAdmin} onCambio={recargar} />
      )}
    </>
  );
}
