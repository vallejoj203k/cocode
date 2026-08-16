import { useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Campo, EncabezadoPagina, MensajeError } from '../components/ui.jsx';
import { ETIQUETAS_ROL } from '../lib/format.js';

export default function MiCuenta() {
  const { user } = useAuth();
  const [form, setForm] = useState({ passwordActual: '', passwordNueva: '', confirmacion: '' });
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setError(null);
    setExito(false);

    if (form.passwordNueva !== form.confirmacion) {
      setError({ message: 'La nueva contraseña y su confirmación no coinciden' });
      return;
    }

    setEnviando(true);
    try {
      await api.post('/auth/change-password', {
        passwordActual: form.passwordActual,
        passwordNueva: form.passwordNueva,
      });
      setForm({ passwordActual: '', passwordNueva: '', confirmacion: '' });
      setExito(true);
    } catch (err) {
      setError(err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <EncabezadoPagina titulo="Mi cuenta" descripcion="Tus datos de acceso a la plataforma." />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-base font-semibold text-slate-900">Datos</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Nombre</dt>
              <dd className="font-medium text-slate-800">{user.nombre}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Correo</dt>
              <dd className="font-medium text-slate-800">{user.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Rol</dt>
              <dd className="font-medium text-slate-800">{ETIQUETAS_ROL[user.rol]}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-slate-400">
            Para cambiar tu nombre o correo, pídeselo al administrador de la plataforma.
          </p>
        </div>

        <form onSubmit={enviar} className="card space-y-4 p-6">
          <h2 className="text-base font-semibold text-slate-900">Cambiar contraseña</h2>

          <Campo etiqueta="Contraseña actual" requerido>
            <input
              type="password"
              className="input"
              value={form.passwordActual}
              onChange={(e) => setForm({ ...form, passwordActual: e.target.value })}
              autoComplete="current-password"
              required
            />
          </Campo>

          <Campo etiqueta="Nueva contraseña" requerido ayuda="Mínimo 8 caracteres">
            <input
              type="password"
              className="input"
              value={form.passwordNueva}
              onChange={(e) => setForm({ ...form, passwordNueva: e.target.value })}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </Campo>

          <Campo etiqueta="Confirmar nueva contraseña" requerido>
            <input
              type="password"
              className="input"
              value={form.confirmacion}
              onChange={(e) => setForm({ ...form, confirmacion: e.target.value })}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </Campo>

          <MensajeError error={error} />
          {exito && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              Contraseña actualizada correctamente.
            </p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={enviando}>
            {enviando ? 'Guardando...' : 'Actualizar contraseña'}
          </button>
        </form>
      </div>
    </>
  );
}
