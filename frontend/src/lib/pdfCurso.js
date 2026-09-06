import { LEMA, MARCA } from './marca.js';

/**
 * Genera el plan de un curso en PDF, para entregárselo a una familia interesada.
 *
 * **Qué lleva y qué no.** Lleva la portada del curso, sus módulos con el
 * objetivo de cada uno y el listado de clases por título. **No lleva el
 * contenido de las clases**: eso es justo lo que se vende, y este documento se
 * entrega antes de pagar. Un temario convence; el plan de clase entero se
 * regala.
 *
 * La librería se carga sólo al pulsar el botón (`import()` dentro de la
 * función): son unos cientos de kilobytes que no tiene por qué descargar quien
 * entra a mirar el currículo.
 */

const TINTA = [20, 24, 36];
const GRIS = [115, 122, 140];
const AZUL = [46, 56, 201];
const AZUL_CLARO = [238, 240, 255];

const MARGEN = 46;
const ANCHO = 595.28; // A4 en puntos
const ALTO = 841.89;
const UTIL = ANCHO - MARGEN * 2;

/**
 * El logo es un SVG y jsPDF sólo inserta mapas de bits, así que se dibuja en un
 * lienzo y se pasa a PNG. Si algo falla —el fichero no está, el navegador lo
 * bloquea— se devuelve null y el documento sale sin logo: un PDF sin logotipo
 * sigue sirviendo, uno que no se genera no.
 */
async function logoPNG() {
  try {
    const img = new Image();
    img.src = '/logo.svg';
    await new Promise((ok, falla) => {
      img.onload = ok;
      img.onerror = falla;
      setTimeout(falla, 3000);
    });

    const lado = 160;
    const lienzo = document.createElement('canvas');
    lienzo.width = lado;
    lienzo.height = lado;
    lienzo.getContext('2d').drawImage(img, 0, 0, lado, lado);
    return lienzo.toDataURL('image/png');
  } catch {
    return null;
  }
}

export async function descargarPlanDeCurso(curso, modulos) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const logo = await logoPNG();

  const totalClases = modulos.reduce((n, m) => n + m.clases.length, 0);
  let y = 0;

  const texto = (t, x, yy, { tam = 10, estilo = 'normal', color = TINTA, ancho = UTIL } = {}) => {
    doc.setFont('helvetica', estilo);
    doc.setFontSize(tam);
    doc.setTextColor(...color);
    const lineas = doc.splitTextToSize(String(t), ancho);
    doc.text(lineas, x, yy);
    return lineas.length * (tam * 1.35);
  };

  // Cada página lleva la marca arriba y el número abajo: si alguien imprime el
  // documento y se le desordenan las hojas, siguen sabiéndose de dónde salen.
  const marcoPagina = () => {
    doc.setFillColor(...AZUL);
    doc.rect(0, 0, ANCHO, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...GRIS);
    doc.text(MARCA.toUpperCase(), MARGEN, 26);
  };

  const nuevaPagina = () => {
    doc.addPage();
    marcoPagina();
    y = 62;
  };

  const sitio = (alto) => {
    if (y + alto > ALTO - 60) nuevaPagina();
  };

  // --- Portada -----------------------------------------------------------
  doc.setFillColor(...AZUL);
  doc.rect(0, 0, ANCHO, 190, 'F');

  if (logo) doc.addImage(logo, 'PNG', MARGEN, 40, 46, 46);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(255, 255, 255);
  doc.text(MARCA, MARGEN + (logo ? 60 : 0), 62);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(215, 219, 255);
  doc.text(LEMA, MARGEN + (logo ? 60 : 0), 78);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(25);
  doc.setTextColor(255, 255, 255);
  doc.text(doc.splitTextToSize(curso.nombre, UTIL), MARGEN, 132);

  y = 224;
  if (curso.descripcion) {
    y += texto(curso.descripcion, MARGEN, y, { tam: 11.5, color: [82, 90, 110] }) + 16;
  }

  // --- De un vistazo ------------------------------------------------------
  const datos = [
    ['Módulos', String(modulos.length)],
    ['Clases', String(totalClases)],
    curso.duracionMeses && ['Duración', `${curso.duracionMeses} meses`],
    curso.edadSugerida && ['Edad', curso.edadSugerida],
  ].filter(Boolean);

  const anchoCaja = (UTIL - (datos.length - 1) * 10) / datos.length;
  datos.forEach(([etiqueta, valor], i) => {
    const x = MARGEN + i * (anchoCaja + 10);
    doc.setFillColor(...AZUL_CLARO);
    doc.roundedRect(x, y, anchoCaja, 52, 6, 6, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRIS);
    doc.text(etiqueta.toUpperCase(), x + 12, y + 19);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(...TINTA);
    doc.text(valor, x + 12, y + 39);
  });
  y += 84;

  // --- Plan de clases -----------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...TINTA);
  doc.text('Plan de clases', MARGEN, y);
  y += 24;

  modulos.forEach((m) => {
    // Se reserva el modulo entero, no solo su titulo: partir la lista de clases
    // entre dos paginas deja huerfano el encabezado y se lee fatal.
    const altoModulo = 60 + (m.objetivo ? 26 : 0) + m.clases.length * 16 + 20;
    sitio(altoModulo);

    doc.setFillColor(...AZUL);
    doc.roundedRect(MARGEN, y - 11, 34, 20, 4, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`M${m.numero}`, MARGEN + 8, y + 3);

    const x = MARGEN + 46;
    const anchoTexto = UTIL - 46;
    y += texto(m.nombre, x, y + 3, { tam: 12, estilo: 'bold', ancho: anchoTexto }) - 6;
    if (m.objetivo) {
      y += texto(m.objetivo, x, y + 14, { tam: 9.5, color: GRIS, ancho: anchoTexto }) + 6;
    }
    y += 12;

    m.clases.forEach((c) => {
      sitio(20);
      doc.setFillColor(...AZUL);
      doc.circle(x + 4, y - 3, 2, 'F');
      texto(`${c.numeroClase}. ${c.nombre}`, x + 14, y, { tam: 10, color: [61, 68, 87], ancho: anchoTexto - 14 });
      y += 16;
    });

    y += 14;
    doc.setDrawColor(232, 234, 240);
    doc.line(MARGEN, y - 7, ANCHO - MARGEN, y - 7);
  });

  // --- Pies de página -----------------------------------------------------
  const paginas = doc.getNumberOfPages();
  for (let i = 1; i <= paginas; i += 1) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRIS);
    doc.text(`${MARCA} · ${LEMA}`, MARGEN, ALTO - 28);
    doc.text(`${i} de ${paginas}`, ANCHO - MARGEN, ALTO - 28, { align: 'right' });
  }

  // Nombre de fichero legible: es lo que la familia vera en su carpeta de
  // descargas dentro de tres semanas.
  const limpio = curso.nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  doc.save(`${MARCA.replace(/\s+/g, '-')}-${limpio}.pdf`);
}
