/**
 * Clasificación de intención por palabras clave.
 * Deliberadamente sin IA: es la ruta más usada y así cuesta 0 tokens.
 */

export type Intencion = 'estado' | 'humano' | 'saludo' | 'otro';

/**
 * Palabras que por sí solas piden un asesor. Se evita `\b` al final: en JS no
 * reconoce vocales acentuadas y "asesoría" haría match con "asesor".
 */
const RE_HUMANO_DIRECTO = /\b(humanos?|asesor(?:a|es|as)?)(?![\wáéíóúñ])/i;

/**
 * Verbo de contacto + a quién: "hablar con una persona", "pásame con alguien".
 * Sin "equipo" en la lista de sustantivos: "mi equipo" es del propio cliente,
 * no un pedido de asesor. La ventana no cruza fin de oración (`[^.!?\n]`)
 * para no unir dos frases sin relación.
 */
const RE_HUMANO_CONTACTO =
  /\b(hablar|conversar|comunicarme|comunicarnos|contactar|p[aá]same|pasarme|atienda)\b[^.!?\n]{0,25}\b(persona|alguien|agente|ejecutiv[oa]|encargad[oa])\b/i;

const RE_ESTADO =
  /\b(estado|avance|progreso|novedad(?:es)?|actualizaci[oó]n)\b|\bc[oó]mo (?:va|van|est[aá])(?![\wáéíóúñ])/i;

const RE_SALUDO =
  /^\s*[¿¡!]*\s*(hola|buenas|buen d[ií]a|buenos d[ií]as|hey|qu[eé] tal|c[oó]mo est[aá]s)\b/i;

/** Prioridad: humano > estado > saludo > otro. */
export function detectarIntencion(texto: string): Intencion {
  if (RE_HUMANO_DIRECTO.test(texto) || RE_HUMANO_CONTACTO.test(texto)) return 'humano';
  if (RE_ESTADO.test(texto)) return 'estado';
  if (RE_SALUDO.test(texto)) return 'saludo';
  return 'otro';
}
