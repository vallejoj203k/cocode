import { useEffect } from 'react';
import Icono from './Icono.jsx';
import { useTitulo } from '../hooks/useTitulo.js';

export function Spinner({ className = 'h-6 w-6' }) {
  return (
    <svg className={`animate-spin text-marca-500 ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function Cargando({ texto = 'Cargando...' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-slate-500">
      <Spinner />
      <span>{texto}</span>
    </div>
  );
}

export function MensajeError({ error, onReintentar }) {
  if (!error) return null;
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
      <p className="font-semibold">{error.message ?? 'Ocurrio un error'}</p>
      {error.details?.length > 0 && (
        <ul className="mt-2 list-inside list-disc space-y-1">
          {error.details.map((d, i) => (
            <li key={i}>
              {d.campo ? `${d.campo}: ` : ''}
              {d.mensaje}
            </li>
          ))}
        </ul>
      )}
      {onReintentar && (
        <button type="button" onClick={onReintentar} className="mt-3 text-sm font-semibold underline">
          Reintentar
        </button>
      )}
    </div>
  );
}

export function EstadoVacio({ titulo, descripcion, accion, icono = 'vacio' }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Icono nombre={icono} size={26} />
      </span>
      <h3 className="mt-3 text-base font-semibold text-slate-700">{titulo}</h3>
      {descripcion && <p className="mt-1 max-w-md text-sm text-slate-500">{descripcion}</p>}
      {accion && <div className="mt-4">{accion}</div>}
    </div>
  );
}

const TONOS = {
  neutro: 'bg-slate-100 text-slate-700',
  azul: 'bg-marca-100 text-marca-700',
  verde: 'bg-emerald-100 text-emerald-700',
  ambar: 'bg-amber-100 text-amber-800',
  rojo: 'bg-rose-100 text-rose-700',
  violeta: 'bg-violet-100 text-violet-700',
};

export function Badge({ children, tono = 'neutro' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONOS[tono]}`}>
      {children}
    </span>
  );
}

/**
 * Cabecera de una pagina. Ademas del titulo visible pone el de la pestaña del
 * navegador, porque toda pagina pasa por aqui: hacerlo en cada una se olvidaria
 * en la siguiente que se añada.
 *
 * `tituloPestana` sirve cuando el titulo visible no funciona fuera de la
 * pantalla — "Hola, Ana" no dice nada en una pestaña.
 */
export function EncabezadoPagina({ titulo, descripcion, acciones, tituloPestana }) {
  useTitulo(tituloPestana ?? (typeof titulo === 'string' ? titulo : undefined));

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{titulo}</h1>
        {descripcion && <p className="mt-1 text-sm text-slate-500">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
    </div>
  );
}

export function Tarjeta({ titulo, valor, detalle, icono, tono = 'azul' }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">{titulo}</p>
        {icono && (
          <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${TONOS[tono]}`}>
            <Icono nombre={icono} size={18} />
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900">{valor}</p>
      {detalle && <p className="mt-1 text-xs text-slate-500">{detalle}</p>}
    </div>
  );
}

export function BarraProgreso({ valor, etiqueta }) {
  const pct = Math.min(100, Math.max(0, valor ?? 0));
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{etiqueta ?? 'Avance'}</span>
        <span className="font-semibold text-slate-700">{pct}%</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-marca-500 transition-all"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

export function Modal({ abierto, titulo, onCerrar, children, ancho = 'max-w-lg' }) {
  // Cerrar con Escape y bloquear el scroll del fondo mientras esta abierto.
  useEffect(() => {
    if (!abierto) return undefined;
    const onKey = (e) => e.key === 'Escape' && onCerrar();
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:items-center">
      <div className={`card w-full ${ancho} my-8`} role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{titulo}</h2>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar"
          >
            <Icono nombre="cerrar" size={18} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

/**
 * El control va dentro del <label> para quedar asociado a su texto sin
 * necesidad de ids: mejora lectores de pantalla y permite hacer clic en la
 * etiqueta para enfocar el campo.
 */
export function Campo({ etiqueta, children, requerido, ayuda }) {
  return (
    <label className="block">
      <span className="label">
        {etiqueta} {requerido && <span className="text-rose-500">*</span>}
      </span>
      {children}
      {ayuda && <span className="mt-1 block text-xs text-slate-500">{ayuda}</span>}
    </label>
  );
}

export function Confirmacion({ abierto, titulo, mensaje, onConfirmar, onCancelar, textoConfirmar = 'Confirmar' }) {
  return (
    <Modal abierto={abierto} titulo={titulo} onCerrar={onCancelar} ancho="max-w-md">
      <p className="text-sm text-slate-600">{mensaje}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="button" className="btn-danger" onClick={onConfirmar}>
          {textoConfirmar}
        </button>
      </div>
    </Modal>
  );
}
