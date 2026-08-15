/**
 * Catalogo de cursos en casillas. Los cursos que vienen de un grupo se marcan
 * como heredados: no se pueden desmarcar porque el acceso lo da la inscripcion,
 * y desmarcarlos daria la falsa impresion de haber quitado el permiso.
 */
export default function SelectorCursos({ cursos, seleccion, onCambio, heredados = [], requerido }) {
  const alternar = (id) => {
    if (heredados.includes(id)) return;
    onCambio(seleccion.includes(id) ? seleccion.filter((c) => c !== id) : [...seleccion, id]);
  };

  if (cursos.length === 0) {
    return (
      <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
        Todavía no hay cursos creados. Crea uno en la sección Currículo antes de asignarlo.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {cursos.map((curso) => {
        const heredado = heredados.includes(curso.id);
        const marcado = heredado || seleccion.includes(curso.id);

        return (
          <label
            key={curso.id}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
              marcado ? 'border-marca-400 bg-marca-50' : 'border-slate-200 hover:border-slate-300'
            } ${heredado ? 'cursor-not-allowed opacity-80' : ''}`}
          >
            <input
              type="checkbox"
              className="mt-0.5 h-5 w-5 rounded border-slate-300 text-marca-500 focus:ring-marca-400"
              checked={marcado}
              disabled={heredado}
              onChange={() => alternar(curso.id)}
            />
            <span className="flex-1">
              <span className="block text-sm font-semibold text-slate-800">{curso.nombre}</span>
              <span className="block text-xs text-slate-500">
                {curso._count?.modulos ?? 0} módulos · {curso.totalClases ?? 0} clases
                {curso.edadSugerida ? ` · ${curso.edadSugerida}` : ''}
              </span>
              {heredado && (
                <span className="mt-1 block text-xs font-medium text-marca-600">
                  Incluido porque está inscrito en un grupo de este curso
                </span>
              )}
            </span>
          </label>
        );
      })}

      {requerido && seleccion.length === 0 && heredados.length === 0 && (
        <p className="text-xs font-medium text-rose-600">Debes asignar al menos un curso.</p>
      )}
    </div>
  );
}
