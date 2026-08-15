import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';

/**
 * Estado de pago de un estudiante en el esquema mensual.
 *
 * Vencer NO bloquea el acceso: solo avisa a la familia y marca al estudiante en
 * cartera. Dejar a un nino sin material por un pago registrado con retraso hace
 * mas dano que el atraso mismo.
 */
export async function estadoPagoEstudiante(studentId, hoy = new Date()) {
  const diasGracia = Number(process.env.DIAS_GRACIA_PAGO ?? 10);

  const ultimo = await prisma.payment.findFirst({
    where: { studentId, tipo: 'MENSUALIDAD', periodoCubierto: { not: null } },
    orderBy: { periodoCubierto: 'desc' },
    select: { periodoCubierto: true, fecha: true },
  });

  // Sin mensualidades no aplica: puede haber comprado clases sueltas.
  if (!ultimo) return { aplica: false, estado: 'SIN_MENSUALIDAD', diasGracia };

  const [anio, mes] = ultimo.periodoCubierto.split('-').map(Number);
  // El acceso cubre hasta el final del mes pagado mas los dias de gracia.
  const limite = new Date(Date.UTC(anio, mes, 1 + diasGracia));

  const diasDeAtraso = Math.max(0, Math.floor((hoy - limite) / 86400000));
  const finDelMesPagado = new Date(Date.UTC(anio, mes, 1));

  let estado = 'AL_DIA';
  if (hoy >= limite) estado = 'VENCIDO';
  else if (hoy >= finDelMesPagado) estado = 'EN_GRACIA';

  return {
    aplica: true,
    estado,
    diasGracia,
    diasDeAtraso,
    ultimoPeriodo: ultimo.periodoCubierto,
    cubiertoHasta: limite.toISOString(),
  };
}

/** "YYYY-MM" del periodo actual. */
export function periodoActual(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function claveMes(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Lista de meses "YYYY-MM" entre dos fechas, inclusive. */
function mesesEntre(desde, hasta) {
  const meses = [];
  const cursor = new Date(Date.UTC(desde.getUTCFullYear(), desde.getUTCMonth(), 1));
  const fin = new Date(Date.UTC(hasta.getUTCFullYear(), hasta.getUTCMonth(), 1));
  while (cursor <= fin) {
    meses.push(claveMes(cursor));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return meses;
}

/**
 * Ingresos, gastos y balance agregados por mes dentro del rango indicado.
 * Se agrupa por la fecha del movimiento (no por el periodo que cubre el pago).
 */
export async function resumenFinanciero({ desde, hasta }) {
  const [pagos, gastos] = await Promise.all([
    prisma.payment.findMany({
      where: { fecha: { gte: desde, lte: hasta } },
      select: { monto: true, fecha: true },
    }),
    prisma.expense.findMany({
      where: { fecha: { gte: desde, lte: hasta } },
      select: { monto: true, fecha: true, categoria: true },
    }),
  ]);

  const base = new Map(mesesEntre(desde, hasta).map((m) => [m, { mes: m, ingresos: 0, gastos: 0, balance: 0 }]));

  for (const p of pagos) {
    const fila = base.get(claveMes(p.fecha));
    if (fila) fila.ingresos += Number(p.monto);
  }
  for (const g of gastos) {
    const fila = base.get(claveMes(g.fecha));
    if (fila) fila.gastos += Number(g.monto);
  }

  const porMes = [...base.values()].map((f) => ({ ...f, balance: f.ingresos - f.gastos }));

  const porCategoria = {};
  for (const g of gastos) {
    porCategoria[g.categoria] = (porCategoria[g.categoria] ?? 0) + Number(g.monto);
  }

  const totalIngresos = porMes.reduce((acc, f) => acc + f.ingresos, 0);
  const totalGastos = porMes.reduce((acc, f) => acc + f.gastos, 0);

  return {
    rango: { desde: desde.toISOString(), hasta: hasta.toISOString() },
    totales: {
      ingresos: totalIngresos,
      gastos: totalGastos,
      balance: totalIngresos - totalGastos,
      registros: { pagos: pagos.length, gastos: gastos.length },
    },
    porMes,
    gastosPorCategoria: Object.entries(porCategoria)
      .map(([categoria, monto]) => ({ categoria, monto }))
      .sort((a, b) => b.monto - a.monto),
  };
}

/**
 * Estado de cartera del periodo: cuanto ha pagado cada estudiante activo frente
 * al valor de la mensualidad configurada.
 */
export async function estadoCartera(periodo = periodoActual(), valorMensualidad = env.mensualidad) {
  const [students, pagos] = await Promise.all([
    prisma.student.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
      include: {
        inscripciones: {
          where: { estado: 'ACTIVO' },
          include: { group: { select: { id: true, nombre: true } } },
        },
      },
    }),
    prisma.payment.findMany({
      where: { periodoCubierto: periodo },
      select: { studentId: true, monto: true, fecha: true },
    }),
  ]);

  const pagadoPorEstudiante = new Map();
  for (const p of pagos) {
    const previo = pagadoPorEstudiante.get(p.studentId) ?? { total: 0, ultimoPago: null };
    previo.total += Number(p.monto);
    if (!previo.ultimoPago || p.fecha > previo.ultimoPago) previo.ultimoPago = p.fecha;
    pagadoPorEstudiante.set(p.studentId, previo);
  }

  const detalle = students.map((s) => {
    const info = pagadoPorEstudiante.get(s.id) ?? { total: 0, ultimoPago: null };
    const saldo = Math.max(0, valorMensualidad - info.total);
    let estado = 'PENDIENTE';
    if (info.total >= valorMensualidad) estado = 'AL_DIA';
    else if (info.total > 0) estado = 'PARCIAL';

    return {
      studentId: s.id,
      nombre: [s.nombre, s.apellido].filter(Boolean).join(' '),
      acudiente: s.acudienteNombre,
      telefono: s.acudienteTelefono,
      grupos: s.inscripciones.map((i) => i.group.nombre),
      pagado: info.total,
      saldo,
      estado,
      ultimoPago: info.ultimoPago ? info.ultimoPago.toISOString() : null,
    };
  });

  return {
    periodo,
    valorMensualidad,
    resumen: {
      estudiantes: detalle.length,
      alDia: detalle.filter((d) => d.estado === 'AL_DIA').length,
      parcial: detalle.filter((d) => d.estado === 'PARCIAL').length,
      pendiente: detalle.filter((d) => d.estado === 'PENDIENTE').length,
      recaudado: detalle.reduce((acc, d) => acc + d.pagado, 0),
      porRecaudar: detalle.reduce((acc, d) => acc + d.saldo, 0),
    },
    detalle,
  };
}

/** Serializa filas a CSV escapando comillas y separadores. */
export function toCSV(rows, columns) {
  const escape = (value) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    return /[";\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };

  const header = columns.map((c) => escape(c.label)).join(';');
  const body = rows.map((row) => columns.map((c) => escape(c.value(row))).join(';'));
  // BOM para que Excel abra los acentos correctamente.
  return `﻿${[header, ...body].join('\n')}`;
}
