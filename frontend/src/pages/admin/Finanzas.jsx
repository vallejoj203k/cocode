import { useState } from 'react';
import { api, descargarArchivo } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFetch } from '../../hooks/useApi.js';
import {
  Badge,
  Campo,
  Cargando,
  Confirmacion,
  EncabezadoPagina,
  EstadoVacio,
  MensajeError,
  Modal,
  Tarjeta,
} from '../../components/ui.jsx';
import {
  ETIQUETAS_CATEGORIA,
  ETIQUETAS_ESTADO_PAGO,
  ETIQUETAS_METODO,
  ETIQUETAS_TIPO_PAGO,
  TONO_ESTADO_PAGO,
  aInputFecha,
  formatoFecha,
  formatoMoneda,
  formatoPeriodo,
  hoyISO,
  nombreCompleto,
  periodoActual,
} from '../../lib/format.js';

const PESTANAS = [
  { id: 'balance', etiqueta: 'Balance' },
  { id: 'ingresos', etiqueta: 'Ingresos' },
  { id: 'gastos', etiqueta: 'Gastos' },
  { id: 'cartera', etiqueta: 'Cartera' },
];

// --- Balance -------------------------------------------------------------

function Balance() {
  const { data, cargando, error, recargar } = useFetch('/finance/summary');

  if (cargando) return <Cargando />;
  if (error) return <MensajeError error={error} onReintentar={recargar} />;

  const { totales, porMes, gastosPorCategoria } = data;
  const maximo = Math.max(1, ...porMes.flatMap((m) => [m.ingresos, m.gastos]));
  const totalGastos = gastosPorCategoria.reduce((acc, g) => acc + g.monto, 0);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <Tarjeta titulo="Ingresos (12 meses)" valor={formatoMoneda(totales.ingresos)} icono="ingresos" tono="verde" />
        <Tarjeta titulo="Gastos (12 meses)" valor={formatoMoneda(totales.gastos)} icono="gastos" tono="rojo" />
        <Tarjeta
          titulo="Balance"
          valor={formatoMoneda(totales.balance)}
          detalle={totales.balance >= 0 ? 'Resultado positivo' : 'Resultado negativo'}
          icono="balance"
          tono={totales.balance >= 0 ? 'verde' : 'rojo'}
        />
      </div>

      <div className="card mt-6 p-5">
        <h2 className="text-base font-semibold text-slate-900">Evolución mensual</h2>
        <div className="mt-5 flex items-end gap-3 overflow-x-auto pb-2">
          {porMes.map((m) => (
            <div key={m.mes} className="flex min-w-[52px] flex-1 flex-col items-center gap-2">
              <div className="flex h-40 w-full items-end justify-center gap-1">
                <div
                  className="w-4 rounded-t bg-emerald-500"
                  style={{ height: `${(m.ingresos / maximo) * 100}%` }}
                  title={`Ingresos: ${formatoMoneda(m.ingresos)}`}
                />
                <div
                  className="w-4 rounded-t bg-rose-400"
                  style={{ height: `${(m.gastos / maximo) * 100}%` }}
                  title={`Gastos: ${formatoMoneda(m.gastos)}`}
                />
              </div>
              <span className="text-[11px] font-medium text-slate-500">{m.mes.slice(5)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-4 text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Ingresos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-rose-400" /> Gastos
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="card overflow-x-auto">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">Detalle por mes</h2>
          </div>
          <table className="table-base">
            <thead>
              <tr>
                <th>Mes</th>
                <th className="text-right">Ingresos</th>
                <th className="text-right">Gastos</th>
                <th className="text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {[...porMes].reverse().map((m) => (
                <tr key={m.mes}>
                  <td className="capitalize text-slate-700">{formatoPeriodo(m.mes)}</td>
                  <td className="text-right text-emerald-600">{formatoMoneda(m.ingresos)}</td>
                  <td className="text-right text-rose-600">{formatoMoneda(m.gastos)}</td>
                  <td
                    className={`text-right font-semibold ${m.balance >= 0 ? 'text-slate-800' : 'text-rose-600'}`}
                  >
                    {formatoMoneda(m.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card p-5">
          <h2 className="text-base font-semibold text-slate-900">Gastos por categoría</h2>
          {gastosPorCategoria.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Todavía no hay gastos registrados.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {gastosPorCategoria.map((g) => (
                <li key={g.categoria}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{ETIQUETAS_CATEGORIA[g.categoria]}</span>
                    <span className="font-semibold text-slate-800">{formatoMoneda(g.monto)}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-marca-400"
                      style={{ width: `${(g.monto / totalGastos) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

// --- Ingresos ------------------------------------------------------------

function FormularioPago({ valorInicial, estudiantes, cursos, onCerrar, onGuardado }) {
  const editando = Boolean(valorInicial?.id);
  const [form, setForm] = useState({
    studentId: valorInicial?.studentId ?? '',
    monto: valorInicial?.monto ?? '',
    fecha: aInputFecha(valorInicial?.fecha) || hoyISO(),
    metodoPago: valorInicial?.metodoPago ?? 'TRANSFERENCIA',
    tipo: valorInicial?.tipo ?? 'MENSUALIDAD',
    periodoCubierto: valorInicial?.periodoCubierto ?? periodoActual(),
    courseId: valorInicial?.courseId ?? '',
    moduleId: valorInicial?.moduleId ?? '',
    classId: valorInicial?.classId ?? '',
    concepto: valorInicial?.concepto ?? '',
    nota: valorInicial?.nota ?? '',
  });

  // Para vender un modulo o una clase hay que poder elegirlos del curso.
  const { data: modulos } = useFetch(
    '/curriculum/modules',
    { courseId: form.courseId },
    { skip: !form.courseId || form.tipo === 'MENSUALIDAD' || form.tipo === 'CURSO_COMPLETO' },
  );
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      // Solo se envia lo que corresponde al tipo, para no dejar referencias
      // sueltas de un tipo anterior.
      const cuerpo = {
        studentId: form.studentId,
        monto: Number(form.monto),
        fecha: form.fecha,
        metodoPago: form.metodoPago,
        tipo: form.tipo,
        periodoCubierto: form.tipo === 'MENSUALIDAD' ? form.periodoCubierto : null,
        courseId: form.tipo === 'CURSO_COMPLETO' ? form.courseId : null,
        moduleId: form.tipo === 'MODULO' ? form.moduleId : null,
        classId: form.tipo === 'CLASE' ? form.classId : null,
        concepto: form.concepto || null,
        nota: form.nota || null,
      };
      if (editando) await api.patch(`/finance/payments/${valorInicial.id}`, cuerpo);
      else await api.post('/finance/payments', cuerpo);
      onGuardado();
    } catch (err) {
      setError(err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal abierto titulo={editando ? 'Editar pago' : 'Registrar pago'} onCerrar={onCerrar}>
      <form onSubmit={enviar} className="space-y-4">
        <Campo etiqueta="Estudiante" requerido>
          <select
            className="input"
            value={form.studentId}
            onChange={(e) => setForm({ ...form, studentId: e.target.value })}
            required
          >
            <option value="">Selecciona un estudiante</option>
            {estudiantes.map((s) => (
              <option key={s.id} value={s.id}>
                {nombreCompleto(s)}
              </option>
            ))}
          </select>
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Monto" requerido>
            <input
              type="number"
              min="1"
              step="0.01"
              className="input"
              value={form.monto}
              onChange={(e) => setForm({ ...form, monto: e.target.value })}
              required
            />
          </Campo>
          <Campo etiqueta="Fecha del pago" requerido>
            <input
              type="date"
              className="input"
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              required
            />
          </Campo>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Método de pago" requerido>
            <select
              className="input"
              value={form.metodoPago}
              onChange={(e) => setForm({ ...form, metodoPago: e.target.value })}
            >
              {Object.entries(ETIQUETAS_METODO).map(([valor, etiqueta]) => (
                <option key={valor} value={valor}>
                  {etiqueta}
                </option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Qué compra" requerido>
            <select
              className="input"
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            >
              {Object.entries(ETIQUETAS_TIPO_PAGO).map(([valor, etiqueta]) => (
                <option key={valor} value={valor}>
                  {etiqueta}
                </option>
              ))}
            </select>
          </Campo>
        </div>

        {form.tipo === 'MENSUALIDAD' && (
          <Campo etiqueta="Periodo que cubre" requerido ayuda="Mes de la mensualidad">
            <input
              type="month"
              className="input"
              value={form.periodoCubierto}
              onChange={(e) => setForm({ ...form, periodoCubierto: e.target.value })}
              required
            />
          </Campo>
        )}

        {form.tipo !== 'MENSUALIDAD' && (
          <Campo etiqueta="Curso" requerido ayuda="Al guardar, el estudiante queda habilitado.">
            <select
              className="input"
              value={form.courseId}
              onChange={(e) => setForm({ ...form, courseId: e.target.value, moduleId: '', classId: '' })}
              required
            >
              <option value="">Selecciona un curso</option>
              {cursos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </Campo>
        )}

        {form.tipo === 'MODULO' && (
          <Campo etiqueta="Módulo" requerido>
            <select
              className="input"
              value={form.moduleId}
              onChange={(e) => setForm({ ...form, moduleId: e.target.value })}
              required
            >
              <option value="">Selecciona un módulo</option>
              {(modulos ?? []).map((m) => (
                <option key={m.id} value={m.id}>
                  M{m.numero} · {m.nombre}
                </option>
              ))}
            </select>
          </Campo>
        )}

        {form.tipo === 'CLASE' && (
          <Campo etiqueta="Clase" requerido>
            <select
              className="input"
              value={form.classId}
              onChange={(e) => setForm({ ...form, classId: e.target.value })}
              required
            >
              <option value="">Selecciona una clase</option>
              {(modulos ?? []).flatMap((m) =>
                m.clases.map((c) => (
                  <option key={c.id} value={c.id}>
                    M{m.numero} · Clase {c.numeroClase}: {c.nombre}
                  </option>
                )),
              )}
            </select>
          </Campo>
        )}

        <Campo etiqueta="Concepto">
          <input
            className="input"
            value={form.concepto}
            onChange={(e) => setForm({ ...form, concepto: e.target.value })}
            placeholder="Mensualidad, matrícula..."
          />
        </Campo>

        <MensajeError error={error} />

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onCerrar}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={enviando}>
            {enviando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Ingresos() {
  const { data, cargando, error, recargar } = useFetch('/finance/payments', { limit: 100 });
  const { data: estudiantesResp } = useFetch('/students', { activo: 'true', limit: 200 });
  const { data: cursos } = useFetch('/curriculum/courses', { activo: 'true' });
  const [modal, setModal] = useState(null);
  const [porEliminar, setPorEliminar] = useState(null);
  const [errorAccion, setErrorAccion] = useState(null);

  const eliminar = async () => {
    setErrorAccion(null);
    try {
      await api.del(`/finance/payments/${porEliminar.id}`);
      setPorEliminar(null);
      recargar();
    } catch (err) {
      setErrorAccion(err);
      setPorEliminar(null);
    }
  };

  const pagos = data?.items ?? [];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {data?.meta.total ?? 0} pagos · Total: <strong>{formatoMoneda(data?.totalMonto)}</strong>
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => descargarArchivo('/finance/export', { tipo: 'payments' }, 'ingresos.csv')}
          >
            Exportar CSV
          </button>
          <button type="button" className="btn-primary" onClick={() => setModal({ valorInicial: null })}>
            + Registrar pago
          </button>
        </div>
      </div>

      <MensajeError error={errorAccion} />
      {error && <MensajeError error={error} onReintentar={recargar} />}

      {cargando ? (
        <Cargando />
      ) : pagos.length === 0 ? (
        <EstadoVacio
          titulo="Sin pagos registrados"
          descripcion="Registra el primer pago para empezar a llevar el control de ingresos."
          icono="finanzas"
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Estudiante</th>
                <th>Concepto</th>
                <th>Método</th>
                <th className="text-right">Monto</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pagos.map((p) => (
                <tr key={p.id}>
                  <td className="whitespace-nowrap text-slate-600">{formatoFecha(p.fecha)}</td>
                  <td className="font-medium text-slate-800">{nombreCompleto(p.student)}</td>
                  <td className="text-slate-600">
                    <Badge tono={p.tipo === 'MENSUALIDAD' ? 'neutro' : 'violeta'}>
                      {ETIQUETAS_TIPO_PAGO[p.tipo] ?? p.tipo}
                    </Badge>
                    <span className="mt-0.5 block text-xs capitalize text-slate-400">
                      {p.tipo === 'MENSUALIDAD'
                        ? formatoPeriodo(p.periodoCubierto)
                        : (p.clase?.nombre ?? p.module?.nombre ?? p.course?.nombre ?? '—')}
                    </span>
                  </td>
                  <td className="text-slate-600">{ETIQUETAS_METODO[p.metodoPago]}</td>
                  <td className="text-right font-semibold text-emerald-600">{formatoMoneda(p.monto)}</td>
                  <td className="text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        className="btn-secondary text-xs"
                        onClick={() => setModal({ valorInicial: p })}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn text-xs text-rose-600 hover:bg-rose-50"
                        onClick={() => setPorEliminar(p)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <FormularioPago
          valorInicial={modal.valorInicial}
          estudiantes={estudiantesResp?.items ?? []}
          cursos={cursos ?? []}
          onCerrar={() => setModal(null)}
          onGuardado={() => {
            setModal(null);
            recargar();
          }}
        />
      )}

      <Confirmacion
        abierto={Boolean(porEliminar)}
        titulo="Eliminar pago"
        mensaje="El pago se eliminará del historial y del balance. Esta acción no se puede deshacer."
        textoConfirmar="Eliminar"
        onConfirmar={eliminar}
        onCancelar={() => setPorEliminar(null)}
      />
    </>
  );
}

// --- Gastos --------------------------------------------------------------

function FormularioGasto({ valorInicial, onCerrar, onGuardado }) {
  const editando = Boolean(valorInicial?.id);
  const [form, setForm] = useState({
    categoria: valorInicial?.categoria ?? 'OTRO',
    descripcion: valorInicial?.descripcion ?? '',
    monto: valorInicial?.monto ?? '',
    fecha: aInputFecha(valorInicial?.fecha) || hoyISO(),
    proveedor: valorInicial?.proveedor ?? '',
  });
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const cuerpo = {
        categoria: form.categoria,
        descripcion: form.descripcion,
        monto: Number(form.monto),
        fecha: form.fecha,
        proveedor: form.proveedor || null,
      };
      if (editando) await api.patch(`/finance/expenses/${valorInicial.id}`, cuerpo);
      else await api.post('/finance/expenses', cuerpo);
      onGuardado();
    } catch (err) {
      setError(err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal abierto titulo={editando ? 'Editar gasto' : 'Registrar gasto'} onCerrar={onCerrar}>
      <form onSubmit={enviar} className="space-y-4">
        <Campo etiqueta="Categoría" requerido>
          <select
            className="input"
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
          >
            {Object.entries(ETIQUETAS_CATEGORIA).map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </select>
        </Campo>

        <Campo etiqueta="Descripción" requerido>
          <input
            className="input"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            required
          />
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Monto" requerido>
            <input
              type="number"
              min="1"
              step="0.01"
              className="input"
              value={form.monto}
              onChange={(e) => setForm({ ...form, monto: e.target.value })}
              required
            />
          </Campo>
          <Campo etiqueta="Fecha" requerido>
            <input
              type="date"
              className="input"
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              required
            />
          </Campo>
        </div>

        <Campo etiqueta="Proveedor">
          <input
            className="input"
            value={form.proveedor}
            onChange={(e) => setForm({ ...form, proveedor: e.target.value })}
          />
        </Campo>

        <MensajeError error={error} />

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onCerrar}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={enviando}>
            {enviando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Gastos() {
  const { data, cargando, error, recargar } = useFetch('/finance/expenses', { limit: 100 });
  const [modal, setModal] = useState(null);
  const [porEliminar, setPorEliminar] = useState(null);
  const [errorAccion, setErrorAccion] = useState(null);

  const eliminar = async () => {
    setErrorAccion(null);
    try {
      await api.del(`/finance/expenses/${porEliminar.id}`);
      setPorEliminar(null);
      recargar();
    } catch (err) {
      setErrorAccion(err);
      setPorEliminar(null);
    }
  };

  const gastos = data?.items ?? [];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {data?.meta.total ?? 0} gastos · Total: <strong>{formatoMoneda(data?.totalMonto)}</strong>
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => descargarArchivo('/finance/export', { tipo: 'expenses' }, 'gastos.csv')}
          >
            Exportar CSV
          </button>
          <button type="button" className="btn-primary" onClick={() => setModal({ valorInicial: null })}>
            + Registrar gasto
          </button>
        </div>
      </div>

      <MensajeError error={errorAccion} />
      {error && <MensajeError error={error} onReintentar={recargar} />}

      {cargando ? (
        <Cargando />
      ) : gastos.length === 0 ? (
        <EstadoVacio titulo="Sin gastos registrados" descripcion="Registra los gastos operativos de la escuela." icono="recibo" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Categoría</th>
                <th>Descripción</th>
                <th>Proveedor</th>
                <th className="text-right">Monto</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {gastos.map((g) => (
                <tr key={g.id}>
                  <td className="whitespace-nowrap text-slate-600">{formatoFecha(g.fecha)}</td>
                  <td>
                    <Badge tono="ambar">{ETIQUETAS_CATEGORIA[g.categoria]}</Badge>
                  </td>
                  <td className="font-medium text-slate-800">{g.descripcion}</td>
                  <td className="text-slate-600">{g.proveedor ?? '—'}</td>
                  <td className="text-right font-semibold text-rose-600">{formatoMoneda(g.monto)}</td>
                  <td className="text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        className="btn-secondary text-xs"
                        onClick={() => setModal({ valorInicial: g })}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn text-xs text-rose-600 hover:bg-rose-50"
                        onClick={() => setPorEliminar(g)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <FormularioGasto
          valorInicial={modal.valorInicial}
          onCerrar={() => setModal(null)}
          onGuardado={() => {
            setModal(null);
            recargar();
          }}
        />
      )}

      <Confirmacion
        abierto={Boolean(porEliminar)}
        titulo="Eliminar gasto"
        mensaje="El gasto se eliminará del historial y del balance."
        textoConfirmar="Eliminar"
        onConfirmar={eliminar}
        onCancelar={() => setPorEliminar(null)}
      />
    </>
  );
}

// --- Cartera -------------------------------------------------------------

const TONO_CARTERA = { AL_DIA: 'verde', PARCIAL: 'ambar', PENDIENTE: 'rojo' };
const ETIQUETA_CARTERA = { AL_DIA: 'Al día', PARCIAL: 'Pago parcial', PENDIENTE: 'Pendiente' };

function Cartera() {
  const [periodo, setPeriodo] = useState(periodoActual());
  const { data, cargando, error, recargar } = useFetch('/finance/cartera', { periodo });

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <Campo etiqueta="Periodo">
          <input
            type="month"
            className="input max-w-[200px]"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
          />
        </Campo>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => descargarArchivo('/finance/export', { tipo: 'cartera', periodo }, `cartera-${periodo}.csv`)}
        >
          Exportar CSV
        </button>
      </div>

      {error && <MensajeError error={error} onReintentar={recargar} />}
      {cargando && <Cargando />}

      {data && !cargando && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Tarjeta titulo="Al día" valor={data.resumen.alDia} icono="hecho" tono="verde" />
            <Tarjeta titulo="Pago parcial" valor={data.resumen.parcial} icono="aviso" tono="ambar" />
            <Tarjeta titulo="Pendientes" valor={data.resumen.pendiente} icono="pendiente" tono="rojo" />
            <Tarjeta
              titulo="Por recaudar"
              valor={formatoMoneda(data.resumen.porRecaudar)}
              detalle={`Recaudado: ${formatoMoneda(data.resumen.recaudado)}`}
              icono="dinero"
            />
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Mensualidad de referencia: <strong>{formatoMoneda(data.valorMensualidad)}</strong> (se configura con la
            variable de entorno VALOR_MENSUALIDAD).
          </p>

          <div className="card mt-4 overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Acudiente</th>
                  <th>Grupos</th>
                  <th className="text-right">Pagado</th>
                  <th className="text-right">Saldo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.detalle.map((d) => (
                  <tr key={d.studentId}>
                    <td className="font-medium text-slate-800">{d.nombre}</td>
                    <td className="text-slate-600">
                      {d.acudiente ?? '—'}
                      {d.telefono && <span className="block text-xs text-slate-400">{d.telefono}</span>}
                    </td>
                    <td className="text-xs text-slate-500">{d.grupos.join(', ') || 'Sin grupo'}</td>
                    <td className="text-right text-slate-700">{formatoMoneda(d.pagado)}</td>
                    <td className={`text-right font-semibold ${d.saldo > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                      {formatoMoneda(d.saldo)}
                    </td>
                    <td>
                      <Badge tono={TONO_CARTERA[d.estado]}>{ETIQUETA_CARTERA[d.estado]}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

export default function Finanzas() {
  const { esAdmin } = useAuth();
  // El vendedor registra pagos, pero el balance, los gastos y la cartera son
  // del admin. El backend ya lo impide; aqui se evita ofrecerle pestanas que
  // solo le devolverian un error.
  const pestanas = esAdmin ? PESTANAS : PESTANAS.filter((t) => t.id === 'ingresos');
  const [pestana, setPestana] = useState(esAdmin ? 'balance' : 'ingresos');

  return (
    <>
      <EncabezadoPagina
        titulo={esAdmin ? 'Módulo financiero' : 'Pagos'}
        descripcion={
          esAdmin
            ? 'Ingresos, gastos, balance y estado de cartera de la escuela.'
            : 'Registra los pagos de las familias que matriculas.'
        }
      />

      <div className="mb-5 flex gap-2 overflow-x-auto border-b border-slate-200">
        {pestanas.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setPestana(t.id)}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-semibold transition ${
              pestana === t.id
                ? 'border-marca-500 text-marca-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.etiqueta}
          </button>
        ))}
      </div>

      {pestana === 'balance' && <Balance />}
      {pestana === 'ingresos' && <Ingresos />}
      {pestana === 'gastos' && <Gastos />}
      {pestana === 'cartera' && <Cartera />}
    </>
  );
}
