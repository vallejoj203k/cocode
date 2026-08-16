/**
 * El nombre de la plataforma, en un solo sitio.
 *
 * La escuela no enseña un unico lenguaje: Python fue el primer curso, pero
 * conviven varios (Scratch, y los que vengan), cada uno con su propio
 * curriculo. Por eso ni el nombre ni los textos hablan de "el curso" en
 * singular ni mencionan un lenguaje concreto: eso lo dice cada curso.
 */
export const MARCA = 'Logic Plus';

export const LEMA = 'Cursos de programación para niños';

/** Titulo de la pestaña del navegador: "Currículo · Logic Plus". */
export function tituloDocumento(seccion) {
  return seccion ? `${seccion} · ${MARCA}` : MARCA;
}
