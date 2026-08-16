import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner } from '../components/ui.jsx';
import Icono from '../components/Icono.jsx';
import Fondo from '../components/Fondo.jsx';

/**
 * Entrada de los estudiantes. La usa el propio nino (8-10 anos), asi que todo
 * es mas grande, con menos texto y en su lenguaje: campos amplios, boton de
 * "ver mi contrasena" (a esa edad se equivocan mucho al escribirla) y mensajes
 * de error que explican que hacer en vez de dar un codigo.
 */
export default function LoginEstudiante() {
  const { user, iniciarSesion, cargando } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  if (cargando) return null;
  if (user) return <Navigate to="/" replace />;

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await iniciarSesion(email.trim(), password, 'estudiantes');
      navigate('/', { replace: true });
    } catch (err) {
      // Mensajes en lenguaje de nino: que paso y que hacer ahora. Se escriben
      // aqui y no se muestra el del servidor, que esta redactado para el equipo.
      if (err.status === 401) {
        setError('El correo o la contraseña no son correctos. Revísalos y prueba otra vez.');
      } else if (err.status === 403) {
        setError(
          'Esta entrada es solo para estudiantes. Si eres tutor o administrador, entra por la página del equipo (abajo).',
        );
      } else {
        setError('No pudimos entrar ahora mismo. Inténtalo en un momento.');
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-acento-400/30 via-marca-50 to-marca-200 px-4 py-10">
      <Fondo />
      <div className="relative w-full max-w-lg">
        <div className="mb-8 text-center">
          <img
            src="/logo.svg"
            alt="Python Kids"
            className="logo-img mx-auto rounded-2xl lg:rounded-3xl"
            style={{ '--logo-sm': '88px', '--logo-lg': '120px' }}
          />
          <h1 className="mt-4 text-4xl font-extrabold text-marca-800">¡Hola!</h1>
          <p className="mt-2 text-lg text-marca-900/70">Entra para ver tu curso de Python</p>
        </div>

        <form onSubmit={enviar} className="card space-y-6 p-8">
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-lg font-bold text-slate-800">
              <Icono nombre="correo" size={22} />
              Tu correo
            </span>
            <input
              type="email"
              className="input h-14 text-lg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="el correo de tu cuenta"
              autoComplete="username"
              required
              autoFocus
            />
            <span className="mt-2 block text-sm text-slate-500">
              Es el correo que registró tu familia en el curso.
            </span>
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-lg font-bold text-slate-800">
              <Icono nombre="usuarios" size={22} />
              Tu contraseña
            </span>
            <div className="relative">
              <input
                type={verPassword ? 'text' : 'password'}
                className="input h-14 pr-28 text-lg"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setVerPassword((v) => !v)}
                className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-marca-600 hover:bg-marca-50"
              >
                <Icono nombre={verPassword ? 'ocultar' : 'ver'} size={18} />
                {verPassword ? 'Ocultar' : 'Ver'}
              </button>
            </div>
          </label>

          {error && (
            <p className="rounded-xl border-2 border-rose-200 bg-rose-50 p-4 text-base font-medium text-rose-800">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn-primary h-14 w-full text-xl"
            disabled={enviando}
          >
            {enviando ? <Spinner className="h-5 w-5" /> : null}
            {enviando ? 'Entrando...' : '¡Entrar!'}
          </button>

          <p className="text-center text-sm text-slate-500">
            ¿No puedes entrar? Pídele ayuda a tu papá, mamá o acudiente.
          </p>
        </form>

        <p className="mt-6 text-center text-sm text-marca-900/60">
          ¿Eres tutor o administrador?{' '}
          <Link to="/login" className="font-semibold text-marca-700 underline">
            Entra por aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
