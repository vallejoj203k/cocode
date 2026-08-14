import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Campo, MensajeError, Spinner } from '../components/ui.jsx';

export default function Login() {
  const { user, iniciarSesion, cargando } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  if (cargando) return null;
  if (user) return <Navigate to={location.state?.from?.pathname ?? '/'} replace />;

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await iniciarSesion(email.trim(), password);
      navigate(location.state?.from?.pathname ?? '/', { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-marca-50 via-slate-50 to-acento-400/20 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="text-5xl" aria-hidden="true">
            🐍
          </p>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">Python Kids</h1>
          <p className="text-sm text-slate-500">Plataforma del curso de Python para niños</p>
        </div>

        <form onSubmit={enviar} className="card space-y-4 p-6">
          <Campo etiqueta="Correo electrónico" requerido>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              autoFocus
            />
          </Campo>

          <Campo etiqueta="Contraseña" requerido>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </Campo>

          <MensajeError error={error} />

          <button type="submit" className="btn-primary w-full" disabled={enviando}>
            {enviando ? <Spinner className="h-4 w-4" /> : null}
            {enviando ? 'Entrando...' : 'Entrar'}
          </button>

          <p className="text-center text-xs text-slate-400">
            ¿Problemas para entrar? Escribe al administrador del curso.
          </p>
        </form>
      </div>
    </div>
  );
}
