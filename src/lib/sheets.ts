/**
 * Acceso autenticado al Google Sheet de VIBA (leads y proyectos).
 * Único punto donde se leen las credenciales de la cuenta de servicio.
 */

import { google, type sheets_v4 } from 'googleapis';

const SHEET_ID = import.meta.env.GOOGLE_SHEET_ID ?? process.env.GOOGLE_SHEET_ID;
const SA_JSON_B64 =
  import.meta.env.GOOGLE_SERVICE_ACCOUNT_JSON ?? process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

/** ID del spreadsheet. Lanza si falta la variable de entorno. */
export function idHoja(): string {
  if (!SHEET_ID) throw new Error('Falta GOOGLE_SHEET_ID');
  return SHEET_ID;
}

/** Cliente de Sheets autenticado con la cuenta de servicio. */
export function clienteSheets(): sheets_v4.Sheets {
  if (!SA_JSON_B64) throw new Error('Falta GOOGLE_SERVICE_ACCOUNT_JSON');
  const credenciales = JSON.parse(Buffer.from(SA_JSON_B64, 'base64').toString('utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials: credenciales,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}
