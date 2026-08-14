import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, portalStore, rutaDeEntrada, subscribeUnauthorized, tokenStore } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cerrarSesion = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  // Un 401 en cualquier peticion cierra la sesion en toda la app.
  useEffect(() => subscribeUnauthorized(() => setUser(null)), []);

  // Al cargar la app recuperamos la sesion guardada en localStorage.
  useEffect(() => {
    let activo = true;
    async function cargar() {
      if (!tokenStore.get()) {
        setCargando(false);
        return;
      }
      try {
        const data = await api.get('/auth/me');
        if (activo) setUser(data.user);
      } catch {
        tokenStore.clear();
      } finally {
        if (activo) setCargando(false);
      }
    }
    cargar();
    return () => {
      activo = false;
    };
  }, []);

  /**
   * `portal` indica por que entrada se inicia sesion ('equipo' o 'estudiantes').
   * El backend rechaza la combinacion que no corresponde al rol.
   */
  const iniciarSesion = useCallback(async (email, password, portal) => {
    const data = await api.post('/auth/login', { email, password, portal });
    tokenStore.set(data.token);
    portalStore.set(portal);
    setUser(data.user);
    return data.user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      cargando,
      iniciarSesion,
      cerrarSesion,
      // Puerta por la que entro, para volver a ella al salir.
      rutaDeEntrada: rutaDeEntrada(),
      esAdmin: user?.rol === 'ADMIN',
      esTutor: user?.rol === 'TUTOR',
      esEstudiante: user?.rol === 'ESTUDIANTE',
    }),
    [user, cargando, iniciarSesion, cerrarSesion],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
