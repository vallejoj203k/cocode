import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Cargando } from './ui.jsx';

/**
 * Exige sesion activa y, opcionalmente, un rol concreto. Guarda la ruta de
 * origen para volver a ella despues del login.
 */
export default function RutaProtegida({ roles, children }) {
  const { user, cargando, rutaDeEntrada } = useAuth();
  const location = useLocation();

  if (cargando) return <Cargando texto="Verificando sesión..." />;
  if (!user) return <Navigate to={rutaDeEntrada} state={{ from: location }} replace />;

  if (roles && !roles.includes(user.rol)) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
        <p className="text-3xl" aria-hidden="true">
          🚫
        </p>
        <h2 className="mt-2 text-lg font-semibold text-amber-900">Sección no disponible</h2>
        <p className="mt-1 text-sm text-amber-800">Tu rol no tiene acceso a esta parte de la plataforma.</p>
      </div>
    );
  }

  return children;
}
