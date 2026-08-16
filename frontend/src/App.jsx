import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import RutaProtegida from './components/RutaProtegida.jsx';
import { Cargando } from './components/ui.jsx';
import { useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import LoginEstudiante from './pages/LoginEstudiante.jsx';
import Portada from './pages/Portada.jsx';
import Inicio from './pages/Inicio.jsx';
import Curriculo from './pages/Curriculo.jsx';
import CursoDetalle from './pages/CursoDetalle.jsx';
import Grupos from './pages/Grupos.jsx';
import GrupoDetalle from './pages/GrupoDetalle.jsx';
import Estudiantes from './pages/Estudiantes.jsx';
import EstudianteDetalle from './pages/EstudianteDetalle.jsx';
import Interesados from './pages/Interesados.jsx';
import Usuarios from './pages/admin/Usuarios.jsx';
import Finanzas from './pages/admin/Finanzas.jsx';
import Sugerencias from './pages/Sugerencias.jsx';
import MiCuenta from './pages/MiCuenta.jsx';

/**
 * La raiz sirve dos cosas distintas segun quien llegue: la pagina de venta para
 * un visitante y la plataforma para quien tiene sesion.
 *
 * Se decide aqui y no con dos rutas "/" porque el enrutador no sabria cual de
 * las dos elegir: coinciden igual de bien.
 */
function Raiz() {
  const { user, cargando, rutaDeEntrada } = useAuth();
  const location = useLocation();

  if (cargando) return <Cargando texto="Verificando sesión..." />;
  if (user) return <Layout />;

  // Un visitante en la raiz ve la pagina de venta. En cualquier otra ruta de la
  // plataforma se le manda a entrar, guardando a donde queria ir: si no, una
  // sesion caducada llevaria a la pagina de venta en vez de al login.
  if (location.pathname === '/') return <Portada />;
  return <Navigate to={rutaDeEntrada} state={{ from: location }} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      {/* Entrada propia para los estudiantes, pensada para que el nino entre solo. */}
      <Route path="/soy-estudiante" element={<LoginEstudiante />} />

      <Route path="/" element={<Raiz />}>
        <Route index element={<Inicio />} />
        <Route path="curriculo" element={<Curriculo />} />
        <Route path="curriculo/:courseId" element={<CursoDetalle />} />
        <Route
          path="interesados"
          element={
            <RutaProtegida roles={['ADMIN', 'VENDEDOR']}>
              <Interesados />
            </RutaProtegida>
          }
        />
        <Route
          path="grupos"
          element={
            <RutaProtegida roles={['ADMIN', 'TUTOR']}>
              <Grupos />
            </RutaProtegida>
          }
        />
        <Route
          path="grupos/:id"
          element={
            <RutaProtegida roles={['ADMIN', 'TUTOR']}>
              <GrupoDetalle />
            </RutaProtegida>
          }
        />
        <Route
          path="estudiantes"
          element={
            <RutaProtegida roles={['ADMIN', 'TUTOR', 'VENDEDOR']}>
              <Estudiantes />
            </RutaProtegida>
          }
        />
        <Route path="estudiantes/:id" element={<EstudianteDetalle />} />
        <Route
          path="usuarios"
          element={
            <RutaProtegida roles={['ADMIN']}>
              <Usuarios />
            </RutaProtegida>
          }
        />
        <Route
          path="finanzas"
          element={
            <RutaProtegida roles={['ADMIN', 'VENDEDOR']}>
              <Finanzas />
            </RutaProtegida>
          }
        />
        <Route path="sugerencias" element={<Sugerencias />} />
        <Route path="mi-cuenta" element={<MiCuenta />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
