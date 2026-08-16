/**
 * La marca, en un solo sitio.
 *
 * La imagen sale de `public/logo.svg`: para cambiar el logo basta con sustituir
 * ese fichero, sin tocar codigo. Aqui solo se decide el tamano y si va con el
 * nombre al lado.
 *
 * El tamano es distinto en movil y en escritorio, donde sobra sitio y una marca
 * pequena se pierde. Los dos valores viajan como variables CSS y el salto lo da
 * la clase `.logo-img` en index.css: con clases de Tailwind no se puede, porque
 * las genera leyendo el codigo y aqui los numeros son parametros.
 */
export default function Logo({
  tamano = 36,
  tamanoEscritorio,
  conNombre = true,
  subtitulo,
  className = '',
}) {
  const escritorio = tamanoEscritorio ?? Math.round(tamano * 1.35);

  return (
    <span className={`flex items-center gap-2.5 lg:gap-3 ${className}`}>
      <img
        src="/logo.svg"
        alt="Python Kids"
        className="logo-img shrink-0 rounded-lg lg:rounded-xl"
        style={{ '--logo-sm': `${tamano}px`, '--logo-lg': `${escritorio}px` }}
      />
      {conNombre && (
        <span className="leading-tight">
          <span className="block font-bold text-slate-900 lg:text-lg">Python Kids</span>
          {subtitulo && <span className="block text-xs text-slate-500 lg:text-sm">{subtitulo}</span>}
        </span>
      )}
    </span>
  );
}
