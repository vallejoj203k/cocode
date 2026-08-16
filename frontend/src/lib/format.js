const moneda = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: import.meta.env.VITE_MONEDA ?? 'COP',
  maximumFractionDigits: 0,
});

export const formatoMoneda = (valor) => moneda.format(Number(valor ?? 0));

export function formatoFecha(valor, opciones = {}) {
  if (!valor) return '—';
  return new Date(valor).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
    ...opciones,
  });
}

/** "2026-08" -> "agosto 2026" */
export function formatoPeriodo(periodo) {
  if (!periodo) return '—';
  const [anio, mes] = periodo.split('-');
  const fecha = new Date(Date.UTC(Number(anio), Number(mes) - 1, 1));
  return fecha.toLocaleDateString('es-CO', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** Periodo "YYYY-MM" de hoy, usado como valor por defecto en formularios. */
export function periodoActual() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
}

export const hoyISO = () => new Date().toISOString().slice(0, 10);

/** Recorta un ISO date-time a "YYYY-MM-DD" para inputs de tipo date. */
export const aInputFecha = (valor) => (valor ? new Date(valor).toISOString().slice(0, 10) : '');

export const nombreCompleto = (persona) =>
  [persona?.nombre, persona?.apellido].filter(Boolean).join(' ') || '—';

export const ETIQUETAS_ROL = {
  ADMIN: 'Administrador',
  TUTOR: 'Tutor',
  VENDEDOR: 'Vendedor',
  ESTUDIANTE: 'Estudiante / Acudiente',
};

export const ETIQUETAS_ESTADO_CLASE = {
  PENDIENTE: 'Pendiente',
  DICTADA: 'Dictada',
  CANCELADA: 'Cancelada',
};

export const TONO_ESTADO_CLASE = {
  PENDIENTE: 'neutro',
  DICTADA: 'verde',
  CANCELADA: 'rojo',
};

export const ETIQUETAS_CATEGORIA = {
  PLATAFORMA: 'Plataforma',
  MATERIALES: 'Materiales',
  PAGO_TUTORES: 'Pago a tutores',
  MARKETING: 'Marketing',
  ADMINISTRATIVO: 'Administrativo',
  OTRO: 'Otro',
};

export const ETIQUETAS_METODO = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  TARJETA: 'Tarjeta',
  NEQUI: 'Nequi',
  DAVIPLATA: 'Daviplata',
  OTRO: 'Otro',
};

export const ETIQUETAS_TIPO_PAGO = {
  MENSUALIDAD: 'Mensualidad',
  CURSO_COMPLETO: 'Curso completo',
  MODULO: 'Módulo suelto',
  CLASE: 'Clase suelta',
};

export const ETIQUETAS_ESTADO_PAGO = {
  AL_DIA: 'Al día',
  EN_GRACIA: 'Por vencer',
  VENCIDO: 'Pago pendiente',
  SIN_MENSUALIDAD: 'Sin mensualidad',
};

export const TONO_ESTADO_PAGO = {
  AL_DIA: 'verde',
  EN_GRACIA: 'ambar',
  VENCIDO: 'rojo',
  SIN_MENSUALIDAD: 'neutro',
};

export const DIAS_SEMANA = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];

export const capitalizar = (texto) =>
  texto ? texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase() : '';
