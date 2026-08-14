import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';

/**
 * Carga datos de un endpoint y expone estado de carga, error y recarga manual.
 * `params` debe ser estable (memorizado o serializable) para evitar bucles.
 */
export function useFetch(path, params, { skip = false } = {}) {
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(!skip);
  const [error, setError] = useState(null);
  const clave = JSON.stringify(params ?? null);

  const recargar = useCallback(async () => {
    if (skip || !path) return;
    setCargando(true);
    setError(null);
    try {
      setData(await api.get(path, JSON.parse(clave) ?? undefined));
    } catch (err) {
      setError(err);
    } finally {
      setCargando(false);
    }
  }, [path, clave, skip]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { data, cargando, error, recargar, setData };
}
