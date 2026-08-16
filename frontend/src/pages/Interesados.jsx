import { useState } from 'react';
import { api } from '../api/client.js';
import { useFetch } from '../hooks/useApi.js';
import {
  Badge,
  Campo,
  Cargando,
  EncabezadoPagina,
  EstadoVacio,
  MensajeError,
  Modal,
  Tarjeta,
} from '../components/ui.jsx';
import { formatoFecha } from '../lib/format.js';
import SelectorCursos from '../components/SelectorCursos.jsx';

const ESTADOS = [
  { id: 'NUEVO', etiqueta: 'Nuevos', tono: 'rojo', ayuda: 'Todavía nadie los ha llamado' },
  { id: 'CONTACTADO', etiqueta: 'Contactados', tono: 'ambar', ayuda: 'Ya se habló con ellos' },
  { id: 'INSCRITO', etiqueta: 'Inscritos', tono: 'verde', ayuda: 'Pagaron y tienen cuenta' },
  { id: 'DESCARTADO', etiqueta: 'Descartados', tono: 'gris', ayuda: 'No siguieron adelante' },
];

const tono = (estado) => ESTADOS.find((e) => e.id === estado)?.tono ?? 'gris';
const etiqueta = (estado) => ESTADOS.find((e) => e.id === estado)?.etiqueta ?? estado;

/** Ficha del interesado: estado, notas y el paso de crear su cuenta. */
function FichaInteresado({ lead, cursos, onCerrar, onGuardado }) {
  const [notas, setNotas] = useState(lead.notas ?? '');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [creandoCuenta, setCreandoCuenta] = useState(false);

  // Se propone lo que dejó en el formulario para no teclearlo otra vez.
  const [cuenta, setCuenta] = useState({
    nombre: lead.nombre,
    email: lead.email ?? '',
    password: '',
    estudianteNombre: lead.nombreEstudiante ?? '',
    estudianteApellido: '',
    courseIds: lead.courseId ? [lead.courseId] : [],
  });

  const guardar = async (estado) => {
    setEnviando(true);
    setError(null);
    try {
      await api.patch(`/leads/${lead.id}`, { estado, notas: notas || null });
      onGuardado();
    } catch (err) {
      setError(err);
      setEnviando(false);
    }
  };

  const crearCuenta = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await api.post(`/leads/${lead.id}/convertir`, {
        nombre: cuenta.nombre,
        email: cuenta.email,
        password: cuenta.password,
        estudiante: {
          nombre: cuenta.estudianteNombre,
          apellido: cuenta.estudianteApellido || null,
          courseIds: cuenta.courseIds,
        },
      });
      onGuardado();
    } catch (err) {
      setError(err);
      setEnviando(false);
    }
  };

  return (
    <Modal abierto titulo={lead.nombre} onCerrar={onCerrar} ancho="max-w-2xl">
      <div className="space-y-5">
        <dl className="grid gap-3 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-slate-500">Teléfono</dt>
            <dd className="font-medium text-slate-800">
              <a href={`tel:${lead.telefono}`} className="text-marca-600 hover:underline">
                {lead.telefono}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Correo</dt>
            <dd className="font-medium text-slate-800">{lead.email ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Curso de interés</dt>
            <dd className="font-medium text-slate-800">{lead.course?.nombre ?? 'No indicó'}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Niño o niña</dt>
            <dd className="font-medium text-slate-800">
              {lead.nombreEstudiante ?? '—'}
              {lead.edadEstudiante ? ` (${lead.edadEstudiante} años)` : ''}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-slate-500">Llegó</dt>
            <dd className="font-medium text-slate-800">{formatoFecha(lead.createdAt)}</dd>
          </div>
          {lead.mensaje && (
            <div className="sm:col-span-2">
              <dt className="text-xs text-slate-500">Su mensaje</dt>
              <dd className="whitespace-pre-line text-slate-700">{lead.mensaje}</dd>
            </div>
          )}
        </dl>

        <MensajeError error={error} />

        {lead.user ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            <strong>Ya tiene cuenta:</strong> {lead.user.email}. Su acceso está listo.
          </p>
        ) : creandoCuenta ? (
          <form onSubmit={crearCuenta} className="space-y-4 rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-800">Crear la cuenta de la familia</h3>

            <Campo etiqueta="Nombre de la cuenta" requerido>
              <input
                className="input"
                value={cuenta.nombre}
                onChange={(e) => setCuenta({ ...cuenta, nombre: e.target.value })}
                required
              />
            </Campo>

            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Correo para entrar" requerido>
                <input
                  type="email"
                  className="input"
                  value={cuenta.email}
                  onChange={(e) => setCuenta({ ...cuenta, email: e.target.value })}
                  required
                />
              </Campo>
              <Campo etiqueta="Contraseña" requerido ayuda="Mínimo 8 caracteres. Dísela por teléfono.">
                <input
                  className="input"
                  value={cuenta.password}
                  onChange={(e) => setCuenta({ ...cuenta, password: e.target.value })}
                  minLength={8}
                  required
                />
              </Campo>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Nombre del niño" requerido>
                <input
                  className="input"
                  value={cuenta.estudianteNombre}
                  onChange={(e) => setCuenta({ ...cuenta, estudianteNombre: e.target.value })}
                  required
                />
              </Campo>
              <Campo etiqueta="Apellido">
                <input
                  className="input"
                  value={cuenta.estudianteApellido}
                  onChange={(e) => setCuenta({ ...cuenta, estudianteApellido: e.target.value })}
                />
              </Campo>
            </div>

            <div>
              <p className="label">
                Cursos que pagó <span className="text-rose-500">*</span>
              </p>
              <SelectorCursos
                cursos={cursos ?? []}
                seleccion={cuenta.courseIds}
                onCambio={(courseIds) => setCuenta({ ...cuenta, courseIds })}
                requerido
              />
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setCreandoCuenta(false)}>
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={enviando || cuenta.courseIds.length === 0}
              >
                {enviando ? 'Creando…' : 'Crear cuenta y marcar inscrito'}
              </button>
            </div>
          </form>
        ) : (
          <>
            <Campo etiqueta="Notas de la gestión" ayuda="Qué se habló, cuándo volver a llamar…">
              <textarea
                className="input"
                rows={3}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
              />
            </Campo>

            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="btn text-rose-600 hover:bg-rose-50"
                onClick={() => guardar('DESCARTADO')}
                disabled={enviando}
              >
                Descartar
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => guardar('CONTACTADO')}
                disabled={enviando}
              >
                Guardar como contactado
              </button>
              <button type="button" className="btn-primary" onClick={() => setCreandoCuenta(true)}>
                Confirmó el pago → crear cuenta
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

export default function Interesados() {
  const [filtro, setFiltro] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const { data, cargando, error, recargar } = useFetch('/leads', {
    estado: filtro,
    search: busqueda,
    limit: 100,
  });
  const { data: cursos } = useFetch('/curriculum/courses', { activo: 'true' });
  const [abierto, setAbierto] = useState(null);

  if (cargando) return <Cargando />;
  if (error) return <MensajeError error={error} onReintentar={recargar} />;

  const leads = data?.items ?? [];
  const resumen = data?.resumen ?? {};

  return (
    <>
      <EncabezadoPagina
        titulo="Interesados"
        descripcion="Personas que dejaron sus datos en la página pública. Llámalas, y cuando confirmen el pago créales la cuenta desde aquí."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ESTADOS.map((e) => (
          <button key={e.id} type="button" onClick={() => setFiltro(filtro === e.id ? '' : e.id)} className="text-left">
            <Tarjeta
              titulo={e.etiqueta}
              valor={resumen[e.id] ?? 0}
              detalle={filtro === e.id ? 'Filtrando por este estado' : e.ayuda}
              icono={e.id === 'NUEVO' ? '🔔' : e.id === 'CONTACTADO' ? '📞' : e.id === 'INSCRITO' ? '✅' : '🚫'}
              tono={e.tono === 'gris' ? undefined : e.tono}
            />
          </button>
        ))}
      </div>

      <input
        className="input mt-6 max-w-md"
        placeholder="Buscar por nombre, teléfono o correo..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      {leads.length === 0 ? (
        <div className="mt-6">
          <EstadoVacio
            titulo={filtro || busqueda ? 'Sin resultados' : 'Todavía no hay interesados'}
            descripcion={
              filtro || busqueda
                ? 'Prueba quitando el filtro o buscando otra cosa.'
                : 'Cuando alguien deje sus datos en la página pública aparecerá aquí.'
            }
            icono="📇"
          />
        </div>
      ) : (
        <div className="card mt-6 overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Interesado</th>
                <th>Teléfono</th>
                <th>Curso</th>
                <th>Estado</th>
                <th>Llegó</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id}>
                  <td>
                    <span className="font-medium text-slate-900">{l.nombre}</span>
                    {l.nombreEstudiante && (
                      <span className="block text-xs text-slate-500">
                        Niño: {l.nombreEstudiante}
                        {l.edadEstudiante ? ` (${l.edadEstudiante})` : ''}
                      </span>
                    )}
                  </td>
                  <td className="text-slate-600">
                    <a href={`tel:${l.telefono}`} className="text-marca-600 hover:underline">
                      {l.telefono}
                    </a>
                  </td>
                  <td className="text-slate-600">{l.course?.nombre ?? '—'}</td>
                  <td>
                    <Badge tono={tono(l.estado)}>{etiqueta(l.estado)}</Badge>
                  </td>
                  <td className="text-xs text-slate-500">{formatoFecha(l.createdAt)}</td>
                  <td>
                    <button type="button" className="btn-secondary text-xs" onClick={() => setAbierto(l)}>
                      Atender
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {abierto && (
        <FichaInteresado
          lead={abierto}
          cursos={cursos}
          onCerrar={() => setAbierto(null)}
          onGuardado={() => {
            setAbierto(null);
            recargar();
          }}
        />
      )}
    </>
  );
}
