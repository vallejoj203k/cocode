import { useState } from 'react';
import { Link } from 'react-router-dom';
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
import { aInputFecha, nombreCompleto } from '../lib/format.js';
import SelectorCursos from '../components/SelectorCursos.jsx';

function FormularioEstudiante({ valorInicial, cuentas, cursos, onCerrar, onGuardado }) {
  const editando = Boolean(valorInicial?.id);
  const [courseIds, setCourseIds] = useState((valorInicial?.accesos ?? []).map((a) => a.courseId));
  // Los cursos de sus grupos vienen incluidos y no se pueden desmarcar.
  const heredados = (valorInicial?.inscripciones ?? []).map((i) => i.group.courseId);
  const [form, setForm] = useState({
    nombre: valorInicial?.nombre ?? '',
    apellido: valorInicial?.apellido ?? '',
    fechaNacimiento: aInputFecha(valorInicial?.fechaNacimiento),
    acudienteNombre: valorInicial?.acudienteNombre ?? '',
    acudienteTelefono: valorInicial?.acudienteTelefono ?? '',
    acudienteEmail: valorInicial?.acudienteEmail ?? '',
    userId: valorInicial?.userId ?? '',
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
        apellido: form.apellido || null,
        fechaNacimiento: form.fechaNacimiento || null,
        acudienteNombre: form.acudienteNombre || null,
        acudienteTelefono: form.acudienteTelefono || null,
        acudienteEmail: form.acudienteEmail || '',
        userId: form.userId || null,
        notas: form.notas || null,
        courseIds,
      };
      if (editando) await api.patch(`/students/${valorInicial.id}`, cuerpo);
      else await api.post('/students', cuerpo);
      onGuardado();
    } catch (err) {
      setError(err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal abierto titulo={editando ? 'Editar estudiante' : 'Nuevo estudiante'} onCerrar={onCerrar} ancho="max-w-2xl">
      <form onSubmit={enviar} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Nombre" requerido>
            <input
              className="input"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              required
            />
          </Campo>
          <Campo etiqueta="Apellido">
            <input
              className="input"
              value={form.apellido}
              onChange={(e) => setForm({ ...form, apellido: e.target.value })}
            />
          </Campo>
        </div>

        <Campo etiqueta="Fecha de nacimiento">
          <input
            type="date"
            className="input"
            value={form.fechaNacimiento}
            onChange={(e) => setForm({ ...form, fechaNacimiento: e.target.value })}
          />
        </Campo>

        <fieldset className="rounded-lg border border-slate-200 p-4">
          <legend className="px-1 text-sm font-semibold text-slate-700">Datos del acudiente</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Nombre del acudiente">
              <input
                className="input"
                value={form.acudienteNombre}
                onChange={(e) => setForm({ ...form, acudienteNombre: e.target.value })}
              />
            </Campo>
            <Campo etiqueta="Teléfono">
              <input
                className="input"
                value={form.acudienteTelefono}
                onChange={(e) => setForm({ ...form, acudienteTelefono: e.target.value })}
              />
            </Campo>
          </div>
          <div className="mt-4">
            <Campo etiqueta="Email del acudiente">
              <input
                type="email"
                className="input"
                value={form.acudienteEmail}
                onChange={(e) => setForm({ ...form, acudienteEmail: e.target.value })}
              />
            </Campo>
          </div>
        </fieldset>

        <Campo
          etiqueta="Cuenta de acceso"
          ayuda="Cuenta con la que la familia entra a la plataforma. Una misma cuenta puede tener varios hijos."
        >
          <select className="input" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
            <option value="">Sin cuenta de acceso</option>
            {cuentas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} ({c.email})
              </option>
            ))}
          </select>
        </Campo>

        <fieldset className="rounded-lg border border-slate-200 p-4">
          <legend className="px-1 text-sm font-semibold text-slate-700">
            Cursos a los que tiene acceso
          </legend>
          <p className="mb-3 text-xs text-slate-500">
            Marca los cursos que pagó. Solo verá el currículo de estos.
          </p>
          <SelectorCursos
            cursos={cursos}
            seleccion={courseIds}
            heredados={heredados}
            onCambio={setCourseIds}
          />
        </fieldset>

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

export default function Estudiantes() {
  const { esAdmin } = useAuth();
  const [busqueda, setBusqueda] = useState('');
  const { data, cargando, error, recargar } = useFetch('/students', { search: busqueda, limit: 100 });
  const { data: cuentasResp } = useFetch(
    '/users',
    { rol: 'ESTUDIANTE', activo: 'true', limit: 200 },
    { skip: !esAdmin },
  );
  const { data: cursos } = useFetch('/curriculum/courses', { activo: 'true' }, { skip: !esAdmin });

  const [modal, setModal] = useState(null);
  const [porDarBaja, setPorDarBaja] = useState(null);
  const [errorAccion, setErrorAccion] = useState(null);

  const darDeBaja = async () => {
    setErrorAccion(null);
    try {
      await api.del(`/students/${porDarBaja.id}`);
      setPorDarBaja(null);
      recargar();
    } catch (err) {
      setErrorAccion(err);
      setPorDarBaja(null);
    }
  };

  const estudiantes = data?.items ?? [];

  return (
    <>
      <EncabezadoPagina
        titulo="Estudiantes"
        descripcion={esAdmin ? 'Todos los niños inscritos en el curso.' : 'Los estudiantes de tus grupos.'}
        acciones={
          esAdmin && (
            <button type="button" className="btn-primary" onClick={() => setModal({ valorInicial: null })}>
              + Nuevo estudiante
            </button>
          )
        }
      />

      <div className="mb-4">
        <input
          className="input max-w-sm"
          placeholder="Buscar por nombre o acudiente..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <MensajeError error={errorAccion} />
      {error && <MensajeError error={error} onReintentar={recargar} />}

      {cargando ? (
        <Cargando />
      ) : estudiantes.length === 0 ? (
        <EstadoVacio
          titulo={busqueda ? 'Sin resultados' : 'Todavía no hay estudiantes'}
          descripcion={
            busqueda ? 'Prueba con otro nombre.' : 'Registra al primer estudiante para empezar a organizar los grupos.'
          }
          icono="🧒"
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Cursos</th>
                <th>Grupos</th>
                <th>Acudiente</th>
                <th>Cuenta de acceso</th>
                {esAdmin && <th />}
              </tr>
            </thead>
            <tbody>
              {estudiantes.map((s) => (
                <tr key={s.id}>
                  <td>
                    <Link to={`/estudiantes/${s.id}`} className="font-semibold text-marca-600 hover:underline">
                      {nombreCompleto(s)}
                    </Link>
                    {!s.activo && (
                      <span className="ml-2">
                        <Badge tono="rojo">Inactivo</Badge>
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {s.accesos?.length ? (
                        s.accesos.map((a) => (
                          <Badge key={a.id} tono="azul">
                            {a.course.nombre}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">Sin cursos</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {s.inscripciones.length === 0 ? (
                        <span className="text-xs text-slate-400">Sin grupo</span>
                      ) : (
                        s.inscripciones.map((i) => (
                          <Badge key={i.id} tono="violeta">
                            {i.group.nombre}
                          </Badge>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="text-slate-600">
                    {s.acudienteNombre ?? '—'}
                    {s.acudienteTelefono && <span className="block text-xs text-slate-400">{s.acudienteTelefono}</span>}
                  </td>
                  <td className="text-xs text-slate-500">{s.user?.email ?? 'Sin cuenta'}</td>
                  {esAdmin && (
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          className="btn-secondary text-xs"
                          onClick={() => setModal({ valorInicial: s })}
                        >
                          Editar
                        </button>
                        {s.activo && (
                          <button
                            type="button"
                            className="btn text-xs text-rose-600 hover:bg-rose-50"
                            onClick={() => setPorDarBaja({ id: s.id, nombre: nombreCompleto(s) })}
                          >
                            Dar de baja
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <FormularioEstudiante
          valorInicial={modal.valorInicial}
          cuentas={cuentasResp?.items ?? []}
          cursos={cursos ?? []}
          onCerrar={() => setModal(null)}
          onGuardado={() => {
            setModal(null);
            recargar();
          }}
        />
      )}

      <Confirmacion
        abierto={Boolean(porDarBaja)}
        titulo="Dar de baja"
        mensaje={`${porDarBaja?.nombre} quedará inactivo y saldrá de sus grupos. Se conserva todo su historial de asistencia y pagos.`}
        textoConfirmar="Dar de baja"
        onConfirmar={darDeBaja}
        onCancelar={() => setPorDarBaja(null)}
      />
    </>
  );
}
