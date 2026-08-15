import { useState } from 'react';
import { api } from '../../api/client.js';
import { useFetch } from '../../hooks/useApi.js';
import {
  Badge,
  Campo,
  Cargando,
  Confirmacion,
  EncabezadoPagina,
  EstadoVacio,
  MensajeError,
  Modal,
} from '../../components/ui.jsx';
import { ETIQUETAS_ROL } from '../../lib/format.js';
import { useAuth } from '../../context/AuthContext.jsx';
import SelectorCursos from '../../components/SelectorCursos.jsx';

const TONO_ROL = { ADMIN: 'rojo', TUTOR: 'violeta', ESTUDIANTE: 'azul' };

function FormularioUsuario({ valorInicial, cursos, onCerrar, onGuardado }) {
  const editando = Boolean(valorInicial?.id);
  const [form, setForm] = useState({
    nombre: valorInicial?.nombre ?? '',
    email: valorInicial?.email ?? '',
    rol: valorInicial?.rol ?? 'TUTOR',
    telefono: valorInicial?.telefono ?? '',
    password: '',
  });

  // Alta: datos del nino y su curso, en el mismo paso que la cuenta.
  const [nuevoEstudiante, setNuevoEstudiante] = useState({ nombre: '', apellido: '', courseIds: [] });

  // Edicion: cursos de cada hijo ya vinculado a la cuenta.
  const { data: detalle } = useFetch(`/users/${valorInicial?.id}`, undefined, { skip: !editando });
  const [cursosPorHijo, setCursosPorHijo] = useState(null);

  const hijos = detalle?.estudiantes ?? [];
  const seleccionHijos =
    cursosPorHijo ??
    Object.fromEntries(hijos.map((h) => [h.id, h.accesos.map((a) => a.courseId)]));

  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const esEstudiante = form.rol === 'ESTUDIANTE';

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const cuerpo = {
        nombre: form.nombre,
        email: form.email,
        rol: form.rol,
        telefono: form.telefono || null,
        // Al editar, la contrasena solo se envia si se escribio una nueva.
        ...(form.password ? { password: form.password } : {}),
      };

      if (editando) {
        await api.patch(`/users/${valorInicial.id}`, cuerpo);
        // Los cursos viven en el nino, asi que se guardan por estudiante.
        await Promise.all(
          hijos.map((h) => api.patch(`/students/${h.id}`, { courseIds: seleccionHijos[h.id] ?? [] })),
        );
      } else {
        await api.post('/users', {
          ...cuerpo,
          ...(esEstudiante
            ? {
                estudiante: {
                  nombre: nuevoEstudiante.nombre,
                  apellido: nuevoEstudiante.apellido || null,
                  courseIds: nuevoEstudiante.courseIds,
                },
              }
            : {}),
        });
      }
      onGuardado();
    } catch (err) {
      setError(err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal
      abierto
      titulo={editando ? 'Editar usuario' : 'Nuevo usuario'}
      onCerrar={onCerrar}
      ancho="max-w-2xl"
    >
      <form onSubmit={enviar} className="space-y-4">
        <Campo etiqueta="Nombre" requerido>
          <input
            className="input"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            required
          />
        </Campo>

        <Campo etiqueta="Correo electrónico" requerido>
          <input
            type="email"
            className="input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Rol" requerido>
            <select className="input" value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
              {Object.entries(ETIQUETAS_ROL).map(([valor, etiqueta]) => (
                <option key={valor} value={valor}>
                  {etiqueta}
                </option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Teléfono">
            <input
              className="input"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            />
          </Campo>
        </div>

        <Campo
          etiqueta={editando ? 'Nueva contraseña' : 'Contraseña'}
          requerido={!editando}
          ayuda={editando ? 'Déjalo vacío para no cambiarla. Mínimo 8 caracteres.' : 'Mínimo 8 caracteres'}
        >
          <input
            type="password"
            className="input"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            minLength={8}
            required={!editando}
            autoComplete="new-password"
          />
        </Campo>

        {/* Alta de una cuenta de estudiante: el nino y su curso van aqui mismo. */}
        {!editando && esEstudiante && (
          <fieldset className="rounded-lg border border-slate-200 p-4">
            <legend className="px-1 text-sm font-semibold text-slate-700">Estudiante</legend>

            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Nombre del niño" requerido>
                <input
                  className="input"
                  value={nuevoEstudiante.nombre}
                  onChange={(e) => setNuevoEstudiante({ ...nuevoEstudiante, nombre: e.target.value })}
                  required
                />
              </Campo>
              <Campo etiqueta="Apellido">
                <input
                  className="input"
                  value={nuevoEstudiante.apellido}
                  onChange={(e) => setNuevoEstudiante({ ...nuevoEstudiante, apellido: e.target.value })}
                />
              </Campo>
            </div>

            <div className="mt-4">
              <p className="label">
                Cursos a los que tendrá acceso <span className="text-rose-500">*</span>
              </p>
              <SelectorCursos
                cursos={cursos}
                seleccion={nuevoEstudiante.courseIds}
                onCambio={(courseIds) => setNuevoEstudiante({ ...nuevoEstudiante, courseIds })}
                requerido
              />
            </div>
          </fieldset>
        )}

        {/* Edicion: cursos de cada hijo vinculado a la cuenta. */}
        {editando && valorInicial.rol === 'ESTUDIANTE' && (
          <fieldset className="rounded-lg border border-slate-200 p-4">
            <legend className="px-1 text-sm font-semibold text-slate-700">Cursos por estudiante</legend>

            {hijos.length === 0 ? (
              <p className="text-sm text-slate-500">
                Esta cuenta no tiene estudiantes vinculados. Créalos desde la sección Estudiantes.
              </p>
            ) : (
              <div className="space-y-5">
                {hijos.map((hijo) => (
                  <div key={hijo.id}>
                    <p className="mb-2 text-sm font-semibold text-slate-700">
                      {[hijo.nombre, hijo.apellido].filter(Boolean).join(' ')}
                    </p>
                    <SelectorCursos
                      cursos={cursos}
                      seleccion={seleccionHijos[hijo.id] ?? []}
                      heredados={hijo.inscripciones.map((i) => i.group.courseId)}
                      onCambio={(courseIds) =>
                        setCursosPorHijo({ ...seleccionHijos, [hijo.id]: courseIds })
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </fieldset>
        )}

        <MensajeError error={error} />

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onCerrar}>
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={enviando || (!editando && esEstudiante && nuevoEstudiante.courseIds.length === 0)}
          >
            {enviando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function Usuarios() {
  const { user } = useAuth();
  const [filtroRol, setFiltroRol] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const { data, cargando, error, recargar } = useFetch('/users', { rol: filtroRol, search: busqueda, limit: 100 });
  const { data: cursos } = useFetch('/curriculum/courses', { activo: 'true' });

  const [modal, setModal] = useState(null);
  const [porDarBaja, setPorDarBaja] = useState(null);
  const [errorAccion, setErrorAccion] = useState(null);

  const darDeBaja = async () => {
    setErrorAccion(null);
    try {
      await api.del(`/users/${porDarBaja.id}`);
      setPorDarBaja(null);
      recargar();
    } catch (err) {
      setErrorAccion(err);
      setPorDarBaja(null);
    }
  };

  const reactivar = async (id) => {
    setErrorAccion(null);
    try {
      await api.patch(`/users/${id}`, { activo: true });
      recargar();
    } catch (err) {
      setErrorAccion(err);
    }
  };

  const usuarios = data?.items ?? [];

  return (
    <>
      <EncabezadoPagina
        titulo="Usuarios"
        descripcion="Cuentas de acceso a la plataforma: administradores, tutores y familias."
        acciones={
          <button type="button" className="btn-primary" onClick={() => setModal({ valorInicial: null })}>
            + Nuevo usuario
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          className="input max-w-xs"
          placeholder="Buscar por nombre o correo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <select className="input max-w-[200px]" value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}>
          <option value="">Todos los roles</option>
          {Object.entries(ETIQUETAS_ROL).map(([valor, etiqueta]) => (
            <option key={valor} value={valor}>
              {etiqueta}
            </option>
          ))}
        </select>
      </div>

      <MensajeError error={errorAccion} />
      {error && <MensajeError error={error} onReintentar={recargar} />}

      {cargando ? (
        <Cargando />
      ) : usuarios.length === 0 ? (
        <EstadoVacio titulo="Sin resultados" descripcion="Ajusta los filtros de búsqueda." icono="🔑" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Vínculos</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className={u.activo ? '' : 'opacity-60'}>
                  <td className="font-medium text-slate-800">
                    {u.nombre}
                    {u.id === user.id && <span className="ml-2 text-xs text-slate-400">(tú)</span>}
                    {!u.activo && (
                      <span className="ml-2">
                        <Badge tono="rojo">Inactivo</Badge>
                      </span>
                    )}
                  </td>
                  <td className="text-slate-600">{u.email}</td>
                  <td>
                    <Badge tono={TONO_ROL[u.rol]}>{ETIQUETAS_ROL[u.rol]}</Badge>
                  </td>
                  <td className="text-xs text-slate-500">
                    {u.rol === 'TUTOR' && `${u._count?.gruposComoTutor ?? 0} grupo(s)`}
                    {u.rol === 'ESTUDIANTE' && `${u._count?.estudiantes ?? 0} estudiante(s)`}
                    {u.rol === 'ADMIN' && '—'}
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        className="btn-secondary text-xs"
                        onClick={() => setModal({ valorInicial: u })}
                      >
                        Editar
                      </button>
                      {u.id !== user.id &&
                        (u.activo ? (
                          <button
                            type="button"
                            className="btn text-xs text-rose-600 hover:bg-rose-50"
                            onClick={() => setPorDarBaja({ id: u.id, nombre: u.nombre })}
                          >
                            Dar de baja
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn text-xs text-emerald-600 hover:bg-emerald-50"
                            onClick={() => reactivar(u.id)}
                          >
                            Reactivar
                          </button>
                        ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <FormularioUsuario
          valorInicial={modal.valorInicial}
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
        mensaje={`${porDarBaja?.nombre} no podrá volver a entrar a la plataforma. Puedes reactivar la cuenta después.`}
        textoConfirmar="Dar de baja"
        onConfirmar={darDeBaja}
        onCancelar={() => setPorDarBaja(null)}
      />
    </>
  );
}
