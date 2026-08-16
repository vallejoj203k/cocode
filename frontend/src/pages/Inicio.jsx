import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../hooks/useApi.js';
import {
  Badge,
  BarraProgreso,
  Cargando,
  EncabezadoPagina,
  EstadoVacio,
  MensajeError,
  Tarjeta,
} from '../components/ui.jsx';
import {
  ETIQUETAS_ESTADO_PAGO,
  TONO_ESTADO_PAGO,
  capitalizar,
  formatoFecha,
  formatoMoneda,
  formatoPeriodo,
} from '../lib/format.js';

/** Grafico de barras ingresos vs gastos, sin dependencias externas. */
function GraficoBalance({ porMes }) {
  const maximo = Math.max(1, ...porMes.flatMap((m) => [m.ingresos, m.gastos]));

  return (
    <div className="card p-5">
      <h2 className="text-base font-semibold text-slate-900">Ingresos vs gastos</h2>
      <p className="text-xs text-slate-500">Últimos {porMes.length} meses</p>

      <div className="mt-5 flex items-end gap-4 overflow-x-auto pb-2">
        {porMes.map((m) => (
          <div key={m.mes} className="flex min-w-[56px] flex-1 flex-col items-center gap-2">
            <div className="flex h-36 w-full items-end justify-center gap-1">
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
            <span className="text-[11px] font-medium text-slate-500">{m.mes.slice(5)}/{m.mes.slice(2, 4)}</span>
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
  );
}

/**
 * Avisos de cosas a medio hacer. No son errores (la plataforma funciona), pero
 * dejan a una familia entrando a una pantalla vacia sin que nada lo delate.
 */
function AvisosRevision({ revision }) {
  if (!revision) return null;

  const pendientes = [
    revision.ninosSinCuenta && {
      texto:
        revision.ninosSinCuenta === 1
          ? '1 niño no tiene cuenta de acceso: nadie puede entrar a ver sus cursos.'
          : `${revision.ninosSinCuenta} niños no tienen cuenta de acceso: nadie puede entrar a ver sus cursos.`,
      enlace: '/estudiantes',
      accion: 'Vincular cuenta',
    },
    revision.cuentasSinNino && {
      texto:
        revision.cuentasSinNino === 1
          ? '1 cuenta de estudiante no tiene ningún niño vinculado: al entrar no ve nada.'
          : `${revision.cuentasSinNino} cuentas de estudiante no tienen niño vinculado: al entrar no ven nada.`,
      enlace: '/usuarios',
      accion: 'Vincular niño',
    },
    revision.ninosSinCurso && {
      texto:
        revision.ninosSinCurso === 1
          ? '1 niño no tiene ningún curso habilitado ni grupo.'
          : `${revision.ninosSinCurso} niños no tienen ningún curso habilitado ni grupo.`,
      enlace: '/estudiantes',
      accion: 'Habilitar curso',
    },
  ].filter(Boolean);

  if (pendientes.length === 0) return null;

  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <h2 className="text-sm font-semibold text-amber-900">Cosas por revisar</h2>
      <ul className="mt-2 space-y-2">
        {pendientes.map((p) => (
          <li key={p.texto} className="flex flex-wrap items-center gap-2 text-sm text-amber-800">
            <span className="flex-1">{p.texto}</span>
            <Link to={p.enlace} className="btn bg-white text-xs text-amber-900 hover:bg-amber-100">
              {p.accion}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function InicioAdmin({ data }) {
  const { tarjetas, finanzas, grupos } = data;

  return (
    <>
      <AvisosRevision revision={data.revision} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tarjeta titulo="Estudiantes activos" valor={tarjetas.estudiantesActivos} icono="🧒" />
        <Tarjeta titulo="Grupos activos" valor={tarjetas.gruposActivos} icono="👥" tono="violeta" />
        <Tarjeta
          titulo="Cursos"
          valor={tarjetas.cursos}
          detalle={`${tarjetas.modulos} módulos · ${tarjetas.totalClases} clases`}
          icono="📚"
          tono="ambar"
        />
        <Tarjeta
          titulo="Interesados nuevos"
          valor={tarjetas.interesadosNuevos ?? 0}
          detalle={tarjetas.interesadosNuevos ? 'Sin llamar todavía' : 'Todos atendidos'}
          icono="📇"
          tono={tarjetas.interesadosNuevos ? 'rojo' : 'verde'}
        />
        <Tarjeta
          titulo="Sugerencias nuevas"
          valor={tarjetas.sugerenciasNuevas}
          detalle={tarjetas.sugerenciasNuevas ? 'Pendientes de revisar' : 'Todo al día'}
          icono="💡"
          tono={tarjetas.sugerenciasNuevas ? 'rojo' : 'verde'}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <GraficoBalance porMes={finanzas.porMes} />
        </div>

        <div className="card p-5">
          <h2 className="text-base font-semibold text-slate-900">Mes en curso</h2>
          <p className="text-xs text-slate-500">{formatoPeriodo(finanzas.mesActual?.mes)}</p>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Ingresos</dt>
              <dd className="font-semibold text-emerald-600">{formatoMoneda(finanzas.mesActual?.ingresos)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Gastos</dt>
              <dd className="font-semibold text-rose-600">{formatoMoneda(finanzas.mesActual?.gastos)}</dd>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-3">
              <dt className="font-medium text-slate-700">Balance</dt>
              <dd
                className={`text-base font-bold ${
                  (finanzas.mesActual?.balance ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {formatoMoneda(finanzas.mesActual?.balance)}
              </dd>
            </div>
          </dl>

          <div className="mt-5 rounded-lg bg-slate-50 p-3 text-sm">
            <p className="font-medium text-slate-700">Cartera del mes</p>
            <p className="mt-1 text-xs text-slate-500">
              {finanzas.cartera.alDia} al día · {finanzas.cartera.parcial} parcial ·{' '}
              <span className="font-semibold text-rose-600">{finanzas.cartera.pendiente} pendiente</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Por recaudar: <strong>{formatoMoneda(finanzas.cartera.porRecaudar)}</strong>
            </p>
            <Link to="/finanzas" className="mt-2 inline-block text-xs font-semibold text-marca-600 hover:underline">
              Ver módulo financiero →
            </Link>
          </div>
        </div>
      </div>

      <div className="card mt-6 overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Avance por grupo</h2>
        </div>
        {grupos.length === 0 ? (
          <div className="p-5">
            <EstadoVacio
              titulo="Todavía no hay grupos"
              descripcion="Crea el primer grupo para empezar a registrar clases y asistencia."
              icono="👥"
              accion={
                <Link to="/grupos" className="btn-primary">
                  Ir a grupos
                </Link>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Grupo</th>
                  <th>Curso</th>
                  <th>Tutor</th>
                  <th>Estudiantes</th>
                  <th className="w-64">Avance del curso</th>
                </tr>
              </thead>
              <tbody>
                {grupos.map((g) => (
                  <tr key={g.id}>
                    <td>
                      <Link to={`/grupos/${g.id}`} className="font-semibold text-marca-600 hover:underline">
                        {g.nombre}
                      </Link>
                    </td>
                    <td>
                      <Badge tono="azul">{g.curso}</Badge>
                    </td>
                    <td className="text-slate-600">{g.tutor}</td>
                    <td className="text-slate-600">{g.estudiantes}</td>
                    <td>
                      <BarraProgreso valor={g.avance} etiqueta={`${g.clasesDictadas} de ${g.totalClases} clases`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function InicioTutor({ data }) {
  const { tarjetas, grupos } = data;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tarjeta titulo="Mis grupos" valor={tarjetas.gruposAsignados} icono="👥" />
        <Tarjeta titulo="Mis estudiantes" valor={tarjetas.estudiantes} icono="🧒" tono="violeta" />
        <Tarjeta titulo="Clases dictadas" valor={tarjetas.clasesDictadas} icono="✅" tono="verde" />
        <Tarjeta titulo="Cursos que dictas" valor={tarjetas.cursos} icono="📚" tono="ambar" />
      </div>

      <h2 className="mt-8 text-lg font-semibold text-slate-900">Mis grupos</h2>
      {grupos.length === 0 ? (
        <div className="mt-3">
          <EstadoVacio
            titulo="Aún no tienes grupos asignados"
            descripcion="Cuando el administrador te asigne un grupo aparecerá aquí."
            icono="👥"
          />
        </div>
      ) : (
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {grupos.map((g) => (
            <div key={g.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">{g.nombre}</h3>
                  <p className="text-xs text-slate-500">
                    {capitalizar(g.diaSemana)} · {g.hora} · {g.estudiantes} estudiantes
                  </p>
                  <p className="mt-1">
                    <Badge tono="azul">{g.curso}</Badge>
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {g.enlaceReunion && (
                    <a
                      href={g.enlaceReunion}
                      target="_blank"
                      rel="noreferrer"
                      className="btn bg-emerald-600 px-3 py-1.5 text-xs text-white hover:bg-emerald-700"
                    >
                      🎥 Entrar a la clase
                    </a>
                  )}
                  <Link to={`/grupos/${g.id}`} className="btn-ghost text-xs">
                    Abrir
                  </Link>
                </div>
              </div>

              <div className="mt-4">
                <BarraProgreso
                  valor={g.avance}
                  etiqueta={`${g.clasesDictadas} de ${g.totalClases} clases dictadas`}
                />
              </div>

              <dl className="mt-4 space-y-1 text-xs text-slate-500">
                <div>
                  <dt className="inline font-medium text-slate-600">Última clase: </dt>
                  <dd className="inline">
                    {g.ultimaClase
                      ? `M${g.ultimaClase.modulo} · ${g.ultimaClase.nombre} (${formatoFecha(g.ultimaClase.fecha)})`
                      : 'Sin registro'}
                  </dd>
                </div>
                <div>
                  <dt className="inline font-medium text-slate-600">Próxima: </dt>
                  <dd className="inline">
                    {g.proximaClase ? `M${g.proximaClase.modulo} · ${g.proximaClase.nombre}` : 'Curso completado 🎉'}
                  </dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/** Panel de ventas: a quien llamar hoy y como va la conversion. */
function InicioVendedor({ data }) {
  const { tarjetas, pendientes } = data;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tarjeta
          titulo="Sin llamar"
          valor={tarjetas.nuevos}
          detalle={tarjetas.nuevos ? 'Llámalos hoy' : 'Todos atendidos'}
          icono="🔔"
          tono={tarjetas.nuevos ? 'rojo' : 'verde'}
        />
        <Tarjeta titulo="Contactados" valor={tarjetas.contactados} detalle="En seguimiento" icono="📞" tono="ambar" />
        <Tarjeta
          titulo="Inscritos este mes"
          valor={tarjetas.inscritosMes}
          detalle={`${tarjetas.inscritos} en total`}
          icono="✅"
          tono="verde"
        />
        <Tarjeta titulo="A tu cargo" valor={tarjetas.mios} detalle="Pendientes que atiendes tú" icono="🙋" />
      </div>

      <h2 className="mt-8 text-lg font-semibold text-slate-900">Por llamar</h2>
      {pendientes.length === 0 ? (
        <div className="mt-3">
          <EstadoVacio
            titulo="No hay nadie esperando"
            descripcion="Cuando alguien deje sus datos en la página pública aparecerá aquí."
            icono="📇"
          />
        </div>
      ) : (
        <div className="card mt-3 divide-y divide-slate-100">
          {pendientes.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
              <div>
                <p className="font-medium text-slate-900">{p.nombre}</p>
                <p className="text-xs text-slate-500">
                  {p.curso} · llegó el {formatoFecha(p.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tono={p.estado === 'NUEVO' ? 'rojo' : 'ambar'}>
                  {p.estado === 'NUEVO' ? 'Sin llamar' : 'Contactado'}
                </Badge>
                <a href={`tel:${p.telefono}`} className="btn-secondary text-xs">
                  📞 {p.telefono}
                </a>
              </div>
            </div>
          ))}
          <div className="px-5 py-3">
            <Link to="/interesados" className="text-sm font-semibold text-marca-600 hover:underline">
              Ver todos los interesados →
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

function InicioEstudiante({ data }) {
  const { estudiantes } = data;

  if (estudiantes.length === 0) {
    return (
      <EstadoVacio
        titulo="Todavía no hay estudiantes vinculados a tu cuenta"
        descripcion="Comunícate con el administrador del curso para que vincule a tu hijo o hija con esta cuenta."
        icono="🧒"
      />
    );
  }

  return (
    <div className="space-y-6">
      {estudiantes.map((e) => (
        <div key={e.id} className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{e.nombre}</h2>
              <p className="text-sm text-slate-500">
                Asistencia general:{' '}
                <strong>
                  {e.asistencia.porcentaje === null ? '—' : `${e.asistencia.porcentaje}%`}
                </strong>{' '}
                ({e.asistencia.presentes} de {e.asistencia.registradas} clases)
              </p>
            </div>
            <Link to={`/estudiantes/${e.id}`} className="btn-secondary text-xs">
              Ver detalle
            </Link>
          </div>

          {/* Un pago atrasado avisa pero no corta el acceso. */}
          {e.pago?.estado === 'VENCIDO' && (
            <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              <strong>Pago pendiente.</strong> El último mes cubierto fue{' '}
              {formatoPeriodo(e.pago.ultimoPeriodo)}. Sigues teniendo acceso a todo; avísale a tu
              acudiente para ponerse al día.
            </p>
          )}
          {e.pago?.estado === 'EN_GRACIA' && (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              La mensualidad de este mes está por vencer. Quedan {e.pago.diasGracia} días de plazo.
            </p>
          )}

          {e.cursos.length === 0 ? (
            <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
              Todavía no tiene ningún curso habilitado. Pídeselo al administrador del curso.
            </p>
          ) : (
            /* Un bloque por curso: cada uno avanza a su propio ritmo. */
            <div className="mt-5 space-y-4">
              {e.cursos.map((c) =>
                /* Curso habilitado al que aun no le han asignado grupo: no hay
                   horario, tutor ni avance que mostrar, pero el plan de clases
                   ya se puede leer. */
                c.sinGrupo ? (
                  <div key={c.cursoId} className="rounded-lg border border-slate-200 p-4">
                    <p className="font-semibold text-slate-800">{c.cursoNombre}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Ya tienes este curso habilitado. Todavía no te han asignado un grupo, así que
                      aún no hay horario ni videollamada; mientras tanto puedes ir leyendo el plan
                      de clases.
                    </p>
                    <Link to={`/curriculo/${c.cursoId}`} className="btn-secondary mt-3 text-xs">
                      Ver el plan de clases
                    </Link>
                  </div>
                ) : (
                <div key={c.grupoId} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-800">{c.cursoNombre}</p>
                      <p className="text-xs text-slate-500">
                        {c.grupoNombre} · {capitalizar(c.diaSemana)} {c.hora} · Tutor: {c.tutor}
                      </p>
                    </div>
                    <Badge tono="azul">
                      {c.clasesVistas} de {c.totalClases} clases
                    </Badge>
                  </div>

                  {/* La clase es online: el nino entra desde aqui, sin depender
                      de que alguien le reenvie el enlace cada semana. */}
                  {c.enlaceReunion ? (
                    <a
                      href={c.enlaceReunion}
                      target="_blank"
                      rel="noreferrer"
                      className="btn mt-3 h-12 w-full bg-emerald-600 text-base text-white hover:bg-emerald-700"
                    >
                      🎥 Entrar a mi clase
                    </a>
                  ) : (
                    <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
                      Tu tutor todavía no ha publicado el enlace de la videollamada.
                    </p>
                  )}

                  <div className="mt-3">
                    <BarraProgreso valor={c.avance} etiqueta="Avance" />
                  </div>

                  <p className="mt-3 text-xs text-slate-500">
                    {c.ultimaClase ? (
                      <>
                        Última clase vista: <strong className="text-slate-700">{c.ultimaClase.nombre}</strong> (módulo{' '}
                        {c.ultimaClase.modulo} · {formatoFecha(c.ultimaClase.fecha)})
                      </>
                    ) : (
                      'El curso aún no comienza.'
                    )}
                  </p>
                </div>
                ),
              )}
            </div>
          )}
        </div>
      ))}

      <div className="rounded-xl bg-marca-500 p-6 text-white">
        <h3 className="text-base font-semibold">¿Tienes una idea para mejorar el curso?</h3>
        <p className="mt-1 text-sm text-marca-50">Cuéntanos por el buzón de sugerencias, leemos todos los mensajes.</p>
        <Link to="/sugerencias" className="btn mt-4 bg-white text-marca-700 hover:bg-marca-50">
          Escribir una sugerencia
        </Link>
      </div>
    </div>
  );
}

export default function Inicio() {
  const { user } = useAuth();
  const { data, cargando, error, recargar } = useFetch('/dashboard');

  if (cargando) return <Cargando />;
  if (error) return <MensajeError error={error} onReintentar={recargar} />;

  return (
    <>
      <EncabezadoPagina
        titulo={`Hola, ${user.nombre.split(' ')[0]} 👋`}
        descripcion={
          user.rol === 'ADMIN'
            ? 'Resumen general del curso y del negocio.'
            : user.rol === 'TUTOR'
              ? 'Este es el estado de tus grupos.'
              : user.rol === 'VENDEDOR'
                ? 'Estos son los interesados que están esperando.'
                : 'Así va el curso de tus estudiantes.'
        }
      />
      {user.rol === 'ADMIN' && <InicioAdmin data={data} />}
      {user.rol === 'TUTOR' && <InicioTutor data={data} />}
      {user.rol === 'VENDEDOR' && <InicioVendedor data={data} />}
      {user.rol === 'ESTUDIANTE' && <InicioEstudiante data={data} />}
    </>
  );
}
