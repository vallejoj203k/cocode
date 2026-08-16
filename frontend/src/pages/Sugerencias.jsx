import { useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../hooks/useApi.js';
import {
  Badge,
  Campo,
  Cargando,
  EncabezadoPagina,
  EstadoVacio,
  MensajeError,
  Modal,
} from '../components/ui.jsx';
import { ETIQUETAS_ROL, formatoFecha } from '../lib/format.js';

const TONO_ESTADO = { NUEVA: 'rojo', LEIDA: 'ambar', ATENDIDA: 'verde' };
const ETIQUETA_ESTADO = { NUEVA: 'Nueva', LEIDA: 'Leída', ATENDIDA: 'Atendida' };

function ModalResponder({ sugerencia, onCerrar, onGuardado }) {
  const [respuesta, setRespuesta] = useState(sugerencia.respuesta ?? '');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await api.patch(`/suggestions/${sugerencia.id}`, { respuesta });
      onGuardado();
    } catch (err) {
      setError(err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal abierto titulo="Responder sugerencia" onCerrar={onCerrar}>
      <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
        <p className="text-xs font-semibold text-slate-500">
          {sugerencia.autor?.nombre ?? 'Anónimo'} · {formatoFecha(sugerencia.createdAt)}
        </p>
        <p className="mt-1 whitespace-pre-line">{sugerencia.mensaje}</p>
      </div>

      <form onSubmit={enviar} className="mt-4 space-y-4">
        <Campo etiqueta="Respuesta" requerido>
          <textarea
            className="input"
            rows={4}
            value={respuesta}
            onChange={(e) => setRespuesta(e.target.value)}
            required
          />
        </Campo>

        <MensajeError error={error} />

        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onCerrar}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={enviando}>
            {enviando ? 'Enviando...' : 'Responder y marcar atendida'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function FormularioNueva({ onEnviada }) {
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    setExito(false);
    try {
      await api.post('/suggestions', { mensaje });
      setMensaje('');
      setExito(true);
      onEnviada();
    } catch (err) {
      setError(err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={enviar} className="card mb-6 space-y-4 p-6">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Deja tu sugerencia</h2>
        <p className="text-sm text-slate-500">
          Cuéntanos qué podemos mejorar del curso. Leemos todos los mensajes.
        </p>
      </div>

      <textarea
        className="input"
        rows={4}
        value={mensaje}
        onChange={(e) => setMensaje(e.target.value)}
        placeholder="Escribe aquí tu idea, comentario o inquietud..."
        minLength={5}
        maxLength={2000}
        required
      />

      <MensajeError error={error} />
      {exito && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          ¡Gracias! Recibimos tu sugerencia.
        </p>
      )}

      <div className="flex justify-end">
        <button type="submit" className="btn-primary" disabled={enviando || mensaje.trim().length < 5}>
          {enviando ? 'Enviando...' : 'Enviar sugerencia'}
        </button>
      </div>
    </form>
  );
}

export default function Sugerencias() {
  const { esAdmin } = useAuth();
  const [filtro, setFiltro] = useState('');
  const { data, cargando, error, recargar } = useFetch('/suggestions', { estado: filtro, limit: 100 });
  const [respondiendo, setRespondiendo] = useState(null);
  const [errorAccion, setErrorAccion] = useState(null);

  const cambiarEstado = async (id, estado) => {
    setErrorAccion(null);
    try {
      await api.patch(`/suggestions/${id}`, { estado });
      recargar();
    } catch (err) {
      setErrorAccion(err);
    }
  };

  const sugerencias = data?.items ?? [];

  return (
    <>
      <EncabezadoPagina
        titulo="Buzón de sugerencias"
        descripcion={
          esAdmin
            ? `${data?.noLeidas ?? 0} sugerencias sin leer.`
            : 'Tus mensajes y las respuestas del equipo del curso.'
        }
      />

      {!esAdmin && <FormularioNueva onEnviada={recargar} />}

      {esAdmin && (
        <div className="mb-4 flex flex-wrap gap-2">
          {[
            { valor: '', etiqueta: 'Todas' },
            { valor: 'NUEVA', etiqueta: 'Nuevas' },
            { valor: 'LEIDA', etiqueta: 'Leídas' },
            { valor: 'ATENDIDA', etiqueta: 'Atendidas' },
          ].map((f) => (
            <button
              key={f.valor}
              type="button"
              onClick={() => setFiltro(f.valor)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                filtro === f.valor ? 'bg-marca-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f.etiqueta}
            </button>
          ))}
        </div>
      )}

      <MensajeError error={errorAccion} />
      {error && <MensajeError error={error} onReintentar={recargar} />}

      {cargando ? (
        <Cargando />
      ) : sugerencias.length === 0 ? (
        <EstadoVacio
          titulo="No hay sugerencias"
          descripcion={esAdmin ? 'Cuando alguien escriba, aparecerá aquí.' : 'Todavía no has enviado ninguna.'}
          icono="sugerencias"
        />
      ) : (
        <div className="space-y-3">
          {sugerencias.map((s) => (
            <article key={s.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {s.autor?.nombre ?? 'Usuario eliminado'}
                    {esAdmin && s.autor && (
                      <span className="ml-2 text-xs font-normal text-slate-400">{ETIQUETAS_ROL[s.autor.rol]}</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400">{formatoFecha(s.createdAt)}</p>
                </div>
                <Badge tono={TONO_ESTADO[s.estado]}>{ETIQUETA_ESTADO[s.estado]}</Badge>
              </div>

              <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{s.mensaje}</p>

              {s.respuesta && (
                <div className="mt-4 rounded-lg border-l-4 border-marca-400 bg-marca-50 p-3">
                  <p className="text-xs font-semibold text-marca-700">
                    Respuesta del equipo
                    {s.respondidaEn ? ` · ${formatoFecha(s.respondidaEn)}` : ''}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm text-marca-900">{s.respuesta}</p>
                </div>
              )}

              {esAdmin && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {s.estado === 'NUEVA' && (
                    <button
                      type="button"
                      className="btn-secondary text-xs"
                      onClick={() => cambiarEstado(s.id, 'LEIDA')}
                    >
                      Marcar como leída
                    </button>
                  )}
                  {s.estado !== 'ATENDIDA' && (
                    <button
                      type="button"
                      className="btn-secondary text-xs"
                      onClick={() => cambiarEstado(s.id, 'ATENDIDA')}
                    >
                      Marcar como atendida
                    </button>
                  )}
                  <button type="button" className="btn-primary text-xs" onClick={() => setRespondiendo(s)}>
                    {s.respuesta ? 'Editar respuesta' : 'Responder'}
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {respondiendo && (
        <ModalResponder
          sugerencia={respondiendo}
          onCerrar={() => setRespondiendo(null)}
          onGuardado={() => {
            setRespondiendo(null);
            recargar();
          }}
        />
      )}
    </>
  );
}
