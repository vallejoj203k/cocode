import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import RutaProtegida from './components/RutaProtegida.jsx';
import Login from './pages/Login.jsx';
import Inicio from './pages/Inicio.jsx';
import Curriculo from './pages/Curriculo.jsx';
import Grupos from './pages/Grupos.jsx';
import GrupoDetalle from './pages/GrupoDetalle.jsx';
import Estudiantes from './pages/Estudiantes.jsx';
import EstudianteDetalle from './pages/EstudianteDetalle.jsx';
import Usuarios from './pages/admin/Usuarios.jsx';
import Finanzas from './pages/admin/Finanzas.jsx';
import Sugerencias from './pages/Sugerencias.jsx';
import MiCuenta from './pages/MiCuenta.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <RutaProtegida>
            <Layout />
          </RutaProtegida>
        }
      >
        <Route index element={<Inicio />} />
        <Route path="curriculo" element={<Curriculo />} />
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
            <RutaProtegida roles={['ADMIN', 'TUTOR']}>
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
            <RutaProtegida roles={['ADMIN']}>
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
