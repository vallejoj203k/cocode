const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';
const TOKEN_KEY = 'pythonkids.token';
const PORTAL_KEY = 'pythonkids.portal';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

/**
 * Recuerda por que entrada inicio sesion el usuario, para devolverlo ahi al
 * cerrar sesion o cuando caduque el token. Un nino no deberia acabar en la
 * pantalla del equipo.
 */
export const portalStore = {
  get: () => localStorage.getItem(PORTAL_KEY) ?? 'equipo',
  set: (portal) => localStorage.setItem(PORTAL_KEY, portal ?? 'equipo'),
};

export const rutaDeEntrada = (portal = portalStore.get()) =>
  portal === 'estudiantes' ? '/soy-estudiante' : '/login';

/** Error de API con el status y los detalles de validacion del backend. */
export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/** Se dispara cuando el token deja de ser valido, para cerrar sesion. */
const onUnauthorized = new Set();
export function subscribeUnauthorized(fn) {
  onUnauthorized.add(fn);
  return () => onUnauthorized.delete(fn);
}

function buildUrl(path, params) {
  const url = `${BASE_URL}${path}`;
  if (!params) return url;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.append(key, value);
  }
  const qs = search.toString();
  return qs ? `${url}?${qs}` : url;
}

async function request(method, path, { body, params, raw } = {}) {
  const token = tokenStore.get();
  const response = await fetch(buildUrl(path, params), {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (response.status === 401) {
    tokenStore.clear();
    onUnauthorized.forEach((fn) => fn());
  }

  if (raw) {
    if (!response.ok) throw new ApiError(response.status, 'No se pudo descargar el archivo');
    return response.blob();
  }

  const texto = await response.text();
  const data = texto ? JSON.parse(texto) : null;

  if (!response.ok) {
    throw new ApiError(response.status, data?.error ?? 'Error inesperado', data?.details);
  }
  return data;
}

export const api = {
  get: (path, params) => request('GET', path, { params }),
  post: (path, body) => request('POST', path, { body }),
  put: (path, body) => request('PUT', path, { body }),
  patch: (path, body) => request('PATCH', path, { body }),
  del: (path, params) => request('DELETE', path, { params }),
  download: (path, params) => request('GET', path, { params, raw: true }),
};

/** Descarga un blob del API como archivo. */
export async function descargarArchivo(path, params, nombreArchivo) {
  const blob = await api.download(path, params);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
