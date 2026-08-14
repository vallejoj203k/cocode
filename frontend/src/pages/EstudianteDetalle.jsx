import { Link, useParams } from 'react-router-dom';
import { useFetch } from '../hooks/useApi.js';
import { Badge, Cargando, EncabezadoPagina, EstadoVacio, MensajeError, Tarjeta } from '../components/ui.jsx';
import { capitalizar, formatoFecha, nombreCompleto } from '../lib/format.js';

export default function EstudianteDetalle() {
  const { id } = useParams();
  const { data: estudiante, cargando, error, recargar } = useFetch(`/students/${id}`);

  if (cargando) return <Cargando />;
  if (error) return <MensajeError error={error} onReintentar={recargar} />;

  const { resumen, asistencias } = estudiante;

  return (
    <>
      <EncabezadoPagina
        titulo={nombreCompleto(estudiante)}
        descripcion={
          estudiante.acudienteNombre
            ? `Acudiente: ${estudiante.acudienteNombre}${
                estudiante.acudienteTelefono ? ` · ${estudiante.acudienteTelefono}` : ''
              }`
            : 'Sin datos de acudiente'
        }
        acciones={
          <Link to="/" className="btn-secondary">
            ← Volver
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Tarjeta
          titulo="Asistencia"
          valor={resumen.porcentajeAsistencia === null ? '—' : `${resumen.porcentajeAsistencia}%`}
          detalle={`${resumen.asistencias} de ${resumen.clasesRegistradas} clases`}
          icono="✅"
          tono="verde"
        />
        <Tarjeta titulo="Inasistencias" valor={resumen.inasistencias} icono="⚠️" tono="ambar" />
        <Tarjeta
          titulo="Grupos"
          valor={estudiante.inscripciones.filter((i) => i.estado === 'ACTIVO').length}
          detalle={
            estudiante.inscripciones
              .filter((i) => i.estado === 'ACTIVO')
              .map((i) => `${i.group.nombre} (${capitalizar(i.group.diaSemana)} ${i.group.hora})`)
              .join(' · ') || 'Sin grupo asignado'
          }
          icono="👥"
          tono="violeta"
        />
      </div>

      {estudiante.notas && (
        <div className="card mt-6 p-5">
          <h2 className="text-sm font-semibold text-slate-700">Notas generales</h2>
          <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{estudiante.notas}</p>
        </div>
      )}

      <h2 className="mt-8 text-lg font-semibold text-slate-900">Historial de clases</h2>
      {asistencias.length === 0 ? (
        <div className="mt-3">
          <EstadoVacio
            titulo="Todavía no hay clases registradas"
            descripcion="Cuando el tutor tome asistencia, el historial aparecerá aquí."
            icono="📋"
          />
        </div>
      ) : (
        <div className="card mt-3 overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Módulo</th>
                <th>Clase</th>
                <th>Asistencia</th>
                <th>Observación del tutor</th>
              </tr>
            </thead>
            <tbody>
              {asistencias.map((a) => (
                <tr key={a.id}>
                  <td className="whitespace-nowrap text-slate-600">{formatoFecha(a.groupProgress.fechaDictada)}</td>
                  <td className="text-slate-600">M{a.groupProgress.clase.module.numero}</td>
                  <td className="font-medium text-slate-800">{a.groupProgress.clase.nombre}</td>
                  <td>
                    <Badge tono={a.asistio ? 'verde' : 'rojo'}>{a.asistio ? 'Asistió' : 'No asistió'}</Badge>
                  </td>
                  <td className="text-sm text-slate-600">{a.nota ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
