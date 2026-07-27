/** Tipos y lógica pura del tracker de proyectos (sin Astro, sin red, sin Sheets). */

export interface Proyecto {
  codigo: string;
  cliente: string;
  whatsapp: string;
  proyecto: string;
  estado: string;
  avance: string;
  notaPublica: string;
  actualizado: string;
}

/** Dígitos mínimos para considerar que una celda contiene un teléfono. */
const MIN_DIGITOS = 8;
/** Dígitos comparados al final del número (largo de un móvil peruano). */
const DIGITOS_COMPARADOS = 9;

const RE_CODIGO = /viba[\s-]*(\d{1,4})(?!\d)/i;

const celda = (fila: string[], i: number): string => (fila[i] ?? '').trim();

/** Convierte una fila cruda de la hoja "Proyectos" en un Proyecto. */
export function filaAProyecto(fila: string[]): Proyecto {
  return {
    codigo: celda(fila, 0),
    cliente: celda(fila, 1),
    whatsapp: celda(fila, 2),
    proyecto: celda(fila, 3),
    estado: celda(fila, 4),
    avance: celda(fila, 5),
    notaPublica: celda(fila, 6),
    actualizado: celda(fila, 7),
  };
}

/** Forma canónica de un código para comparar: 'viba - 023' → 'VIBA023'. */
export function normalizarCodigo(valor: string): string {
  return valor.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** Busca un código tipo "VIBA-023" dentro del texto del cliente. */
export function extraerCodigo(texto: string): string | null {
  const encontrado = RE_CODIGO.exec(texto);
  return encontrado ? `VIBA-${encontrado[1]}` : null;
}

const soloDigitos = (valor: string): string => valor.replace(/\D/g, '');

/**
 * Compara teléfonos tolerando separadores y prefijo de país: normaliza a
 * dígitos y compara los últimos 9 (o el largo común si es menor).
 */
export function mismoTelefono(a: string, b: string): boolean {
  const na = soloDigitos(a);
  const nb = soloDigitos(b);
  if (na.length < MIN_DIGITOS || nb.length < MIN_DIGITOS) return false;
  const n = Math.min(na.length, nb.length, DIGITOS_COMPARADOS);
  return na.slice(-n) === nb.slice(-n);
}

/** Proyectos cuyo teléfono coincide con el remitente. Puede ser más de uno. */
export function buscarPorTelefono(proyectos: Proyecto[], telefono: string): Proyecto[] {
  return proyectos.filter((p) => mismoTelefono(telefono, p.whatsapp));
}

/** Proyecto con ese código, o null. */
export function buscarPorCodigo(proyectos: Proyecto[], codigo: string): Proyecto | null {
  const buscado = normalizarCodigo(codigo);
  return proyectos.find((p) => normalizarCodigo(p.codigo) === buscado) ?? null;
}

/** Mensaje de estado listo para WhatsApp (los * son negritas en WhatsApp). */
export function formatearEstado(p: Proyecto): string {
  const lineas: string[] = [
    `📌 *${p.proyecto || p.codigo}*`,
    `Estado: ${p.estado || 'sin registrar'}`,
  ];
  if (p.avance) lineas.push(`Avance: ${p.avance}`);
  if (p.notaPublica) lineas.push(p.notaPublica);
  if (p.actualizado) lineas.push(`_Actualizado: ${p.actualizado}_`);
  return lineas.join('\n');
}
