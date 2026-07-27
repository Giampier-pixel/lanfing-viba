/** Lectura de la pestaña "Proyectos" del Google Sheet de VIBA. */

import { clienteSheets, idHoja } from '../sheets';
import { filaAProyecto, type Proyecto } from './proyectos';

// A2:H — se salta la fila de encabezados.
const RANGO = 'Proyectos!A2:H';

/** Todos los proyectos del tracker. El filtrado por cliente ocurre en el orquestador. */
export async function leerProyectos(): Promise<Proyecto[]> {
  const sheets = clienteSheets();
  const respuesta = await sheets.spreadsheets.values.get({
    spreadsheetId: idHoja(),
    range: RANGO,
  });
  const filas = respuesta.data.values ?? [];
  return filas
    .map((fila) => filaAProyecto(fila.map((c) => String(c ?? ''))))
    .filter((p) => p.codigo !== '');
}
