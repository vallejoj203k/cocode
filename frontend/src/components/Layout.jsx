import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ETIQUETAS_ROL } from '../lib/format.js';

/** Menu lateral por rol: cada entrada declara quien puede verla. */
const NAVEGACION = [
  { to: '/', etiqueta: 'Inicio', icono: '🏠', roles: ['ADMIN', 'TUTOR', 'ESTUDIANTE'], exact: true },
  { to: '/curriculo', etiqueta: 'Currículo', icono: '📚', roles: ['ADMIN', 'TUTOR', 'ESTUDIANTE'] },
  { to: '/grupos', etiqueta: 'Grupos', icono: '👥', roles: ['ADMIN', 'TUTOR'] },
  { to: '/estudiantes', etiqueta: 'Estudiantes', icono: '🧒', roles: ['ADMIN', 'TUTOR'] },
  { to: '/usuarios', etiqueta: 'Usuarios', icono: '🔑', roles: ['ADMIN'] },
  { to: '/finanzas', etiqueta: 'Finanzas', icono: '💰', roles: ['ADMIN'] },
  { to: '/sugerencias', etiqueta: 'Sugerencias', icono: '💡', roles: ['ADMIN', 'TUTOR', 'ESTUDIANTE'] },
  { to: '/mi-cuenta', etiqueta: 'Mi cuenta', icono: '⚙️', roles: ['ADMIN', 'TUTOR', 'ESTUDIANTE'] },
];

function Enlaces({ rol, onNavegar }) {
  return (
    <nav className="space-y-1">
      {NAVEGACION.filter((item) => item.roles.includes(rol)).map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.exact}
          onClick={onNavegar}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              isActive ? 'bg-marca-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`
          }
        >
          <span aria-hidden="true">{item.icono}</span>
          {item.etiqueta}
        </NavLink>
      ))}
    </nav>
  );
}

export default function Layout() {
  const { user, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const salir = () => {
    cerrarSesion();
    navigate('/login');
  };

  return (
    <div className="min-h-screen lg:flex">
      {/* Barra superior (movil) */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setMenuAbierto((v) => !v)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Abrir menu"
          aria-expanded={menuAbierto}
        >
          ☰
        </button>
        <span className="font-bold text-marca-700">🐍 Python Kids</span>
        <button type="button" onClick={salir} className="text-sm font-medium text-slate-500">
          Salir
        </button>
      </header>

      {menuAbierto && (
        <div className="border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <Enlaces rol={user.rol} onNavegar={() => setMenuAbierto(false)} />
        </div>
      )}

      {/* Menu lateral (escritorio) */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:min-h-screen lg:flex-col">
        <div className="border-b border-slate-200 px-5 py-5">
          <p className="text-lg font-bold text-marca-700">🐍 Python Kids</p>
          <p className="text-xs text-slate-500">Plataforma del curso</p>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <Enlaces rol={user.rol} />
        </div>
        <div className="border-t border-slate-200 px-5 py-4">
          <p className="truncate text-sm font-semibold text-slate-800">{user.nombre}</p>
          <p className="truncate text-xs text-slate-500">{ETIQUETAS_ROL[user.rol]}</p>
          <button type="button" onClick={salir} className="mt-3 text-sm font-medium text-rose-600 hover:underline">
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
