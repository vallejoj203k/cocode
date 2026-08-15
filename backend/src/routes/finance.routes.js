import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { ApiError, asyncHandler, paginated, parsePagination } from '../lib/http.js';
import { toJSON } from '../lib/serialize.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { estadoCartera, periodoActual, resumenFinanciero, toCSV } from '../services/finance.service.js';
import { concederAccesoPorPago } from '../services/access.service.js';

const router = Router();

// El modulo financiero es exclusivo del Admin.
router.use(authenticate, authorize('ADMIN'));

const METODOS = ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'NEQUI', 'DAVIPLATA', 'OTRO'];
const CATEGORIAS = ['PLATAFORMA', 'MATERIALES', 'PAGO_TUTORES', 'MARKETING', 'ADMINISTRATIVO', 'OTRO'];

const TIPOS_PAGO = ['MENSUALIDAD', 'CURSO_COMPLETO', 'MODULO', 'CLASE'];

const paymentBase = z.object({
    studentId: z.string().min(1, 'Debes seleccionar un estudiante'),
    monto: z.coerce.number().positive('El monto debe ser mayor a cero'),
    fecha: z.coerce.date(),
    metodoPago: z.enum(METODOS),
    tipo: z.enum(TIPOS_PAGO).default('MENSUALIDAD'),
    periodoCubierto: z
      .string()
      .regex(/^\d{4}-\d{2}$/, 'El periodo debe tener formato YYYY-MM')
      .optional()
      .nullable(),
    courseId: z.string().optional().nullable(),
    moduleId: z.string().optional().nullable(),
    classId: z.string().optional().nullable(),
  concepto: z.string().optional().nullable(),
  nota: z.string().optional().nullable(),
});

// Cada tipo de pago necesita saber que habilita. Se aplica solo al alta: en la
// edicion parcial no siempre viaja el tipo.
const paymentSchema = paymentBase
  .refine((p) => p.tipo !== 'MENSUALIDAD' || Boolean(p.periodoCubierto), {
    message: 'Una mensualidad necesita el periodo que cubre',
    path: ['periodoCubierto'],
  })
  .refine((p) => p.tipo !== 'CURSO_COMPLETO' || Boolean(p.courseId), {
    message: 'Indica que curso compra',
    path: ['courseId'],
  })
  .refine((p) => p.tipo !== 'MODULO' || Boolean(p.moduleId), {
    message: 'Indica que modulo compra',
    path: ['moduleId'],
  })
  .refine((p) => p.tipo !== 'CLASE' || Boolean(p.classId), {
    message: 'Indica que clase compra',
    path: ['classId'],
  });

const expenseSchema = z.object({
  categoria: z.enum(CATEGORIAS),
  descripcion: z.string().min(2, 'La descripcion es obligatoria'),
  monto: z.coerce.number().positive('El monto debe ser mayor a cero'),
  fecha: z.coerce.date(),
  proveedor: z.string().optional().nullable(),
});

/** Rango por defecto: los ultimos 12 meses. */
function parseRango(query) {
  const hasta = query.hasta ? new Date(query.hasta) : new Date();
  const desde = query.desde
    ? new Date(query.desde)
    : new Date(Date.UTC(hasta.getUTCFullYear(), hasta.getUTCMonth() - 11, 1));
  if (Number.isNaN(desde.getTime()) || Number.isNaN(hasta.getTime())) {
    throw ApiError.badRequest('Fechas invalidas en el rango');
  }
  return { desde, hasta };
}

// --- Ingresos (pagos) ----------------------------------------------------

router.get(
  '/payments',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query);
    const where = {
      ...(req.query.studentId ? { studentId: req.query.studentId } : {}),
      ...(req.query.periodo ? { periodoCubierto: req.query.periodo } : {}),
      ...(req.query.desde || req.query.hasta
        ? {
            fecha: {
              ...(req.query.desde ? { gte: new Date(req.query.desde) } : {}),
              ...(req.query.hasta ? { lte: new Date(req.query.hasta) } : {}),
            },
          }
        : {}),
    };

    const [items, total, agregado] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fecha: 'desc' },
        include: {
          student: { select: { id: true, nombre: true, apellido: true } },
          course: { select: { id: true, nombre: true } },
          module: { select: { id: true, nombre: true, numero: true } },
          clase: { select: { id: true, nombre: true, numeroClase: true } },
        },
      }),
      prisma.payment.count({ where }),
      prisma.payment.aggregate({ where, _sum: { monto: true } }),
    ]);

    res.json({
      ...paginated(toJSON(items), total, { page, limit }),
      totalMonto: Number(agregado._sum.monto ?? 0),
    });
  }),
);

router.post(
  '/payments',
  validate(paymentSchema),
  asyncHandler(async (req, res) => {
    const student = await prisma.student.findUnique({ where: { id: req.body.studentId } });
    if (!student) throw ApiError.notFound('Estudiante no encontrado');

    const payment = await prisma.payment.create({
      data: { ...req.body, registradoPorId: req.user.id },
      include: { student: { select: { id: true, nombre: true, apellido: true } } },
    });

    // Registrar el pago habilita de una vez lo que compro.
    const acceso = await concederAccesoPorPago(payment, req.user.id);

    res.status(201).json({ ...toJSON(payment), accesoConcedido: Boolean(acceso) });
  }),
);

router.patch(
  '/payments/:id',
  validate(paymentBase.partial()),
  asyncHandler(async (req, res) => {
    const payment = await prisma.payment.update({
      where: { id: req.params.id },
      data: req.body,
      include: { student: { select: { id: true, nombre: true, apellido: true } } },
    });
    res.json(toJSON(payment));
  }),
);

router.delete(
  '/payments/:id',
  asyncHandler(async (req, res) => {
    await prisma.payment.delete({ where: { id: req.params.id } });
    res.json({ mensaje: 'Pago eliminado' });
  }),
);

// --- Gastos --------------------------------------------------------------

router.get(
  '/expenses',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query);
    const where = {
      ...(req.query.categoria ? { categoria: req.query.categoria } : {}),
      ...(req.query.desde || req.query.hasta
        ? {
            fecha: {
              ...(req.query.desde ? { gte: new Date(req.query.desde) } : {}),
              ...(req.query.hasta ? { lte: new Date(req.query.hasta) } : {}),
            },
          }
        : {}),
    };

    const [items, total, agregado] = await Promise.all([
      prisma.expense.findMany({ where, skip, take: limit, orderBy: { fecha: 'desc' } }),
      prisma.expense.count({ where }),
      prisma.expense.aggregate({ where, _sum: { monto: true } }),
    ]);

    res.json({
      ...paginated(toJSON(items), total, { page, limit }),
      totalMonto: Number(agregado._sum.monto ?? 0),
    });
  }),
);

router.post(
  '/expenses',
  validate(expenseSchema),
  asyncHandler(async (req, res) => {
    const expense = await prisma.expense.create({
      data: { ...req.body, registradoPorId: req.user.id },
    });
    res.status(201).json(toJSON(expense));
  }),
);

router.patch(
  '/expenses/:id',
  validate(expenseSchema.partial()),
  asyncHandler(async (req, res) => {
    const expense = await prisma.expense.update({ where: { id: req.params.id }, data: req.body });
    res.json(toJSON(expense));
  }),
);

router.delete(
  '/expenses/:id',
  asyncHandler(async (req, res) => {
    await prisma.expense.delete({ where: { id: req.params.id } });
    res.json({ mensaje: 'Gasto eliminado' });
  }),
);

// --- Balance y cartera ---------------------------------------------------

router.get(
  '/summary',
  asyncHandler(async (req, res) => {
    res.json(await resumenFinanciero(parseRango(req.query)));
  }),
);

router.get(
  '/cartera',
  asyncHandler(async (req, res) => {
    const periodo = req.query.periodo ?? periodoActual();
    if (!/^\d{4}-\d{2}$/.test(periodo)) {
      throw ApiError.badRequest('El periodo debe tener formato YYYY-MM');
    }
    const valor = req.query.valorMensualidad ? Number(req.query.valorMensualidad) : undefined;
    res.json(await estadoCartera(periodo, valor));
  }),
);

// --- Exportacion CSV -----------------------------------------------------

router.get(
  '/export',
  asyncHandler(async (req, res) => {
    const tipo = req.query.tipo ?? 'payments';
    const fecha = new Date().toISOString().slice(0, 10);

    if (tipo === 'payments') {
      const pagos = await prisma.payment.findMany({
        orderBy: { fecha: 'desc' },
        include: { student: true },
      });
      const csv = toCSV(pagos, [
        { label: 'Fecha', value: (p) => p.fecha.toISOString().slice(0, 10) },
        { label: 'Estudiante', value: (p) => [p.student.nombre, p.student.apellido].filter(Boolean).join(' ') },
        { label: 'Periodo cubierto', value: (p) => p.periodoCubierto },
        { label: 'Monto', value: (p) => Number(p.monto).toFixed(2) },
        { label: 'Metodo', value: (p) => p.metodoPago },
        { label: 'Concepto', value: (p) => p.concepto },
        { label: 'Nota', value: (p) => p.nota },
      ]);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="ingresos-${fecha}.csv"`);
      return res.send(csv);
    }

    if (tipo === 'expenses') {
      const gastos = await prisma.expense.findMany({ orderBy: { fecha: 'desc' } });
      const csv = toCSV(gastos, [
        { label: 'Fecha', value: (g) => g.fecha.toISOString().slice(0, 10) },
        { label: 'Categoria', value: (g) => g.categoria },
        { label: 'Descripcion', value: (g) => g.descripcion },
        { label: 'Proveedor', value: (g) => g.proveedor },
        { label: 'Monto', value: (g) => Number(g.monto).toFixed(2) },
      ]);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="gastos-${fecha}.csv"`);
      return res.send(csv);
    }

    if (tipo === 'cartera') {
      const { detalle, periodo } = await estadoCartera(req.query.periodo ?? periodoActual());
      const csv = toCSV(detalle, [
        { label: 'Estudiante', value: (d) => d.nombre },
        { label: 'Acudiente', value: (d) => d.acudiente },
        { label: 'Telefono', value: (d) => d.telefono },
        { label: 'Grupos', value: (d) => d.grupos.join(' / ') },
        { label: 'Pagado', value: (d) => d.pagado.toFixed(2) },
        { label: 'Saldo', value: (d) => d.saldo.toFixed(2) },
        { label: 'Estado', value: (d) => d.estado },
      ]);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="cartera-${periodo}.csv"`);
      return res.send(csv);
    }

    throw ApiError.badRequest('Tipo de exportacion invalido. Usa: payments, expenses o cartera');
  }),
);

export default router;
