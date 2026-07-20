import type { APIRoute } from 'astro';
import { google } from 'googleapis';
import { validarLead, esBot, construirFila, type LeadEntrante } from '../../lib/leads';

// Este endpoint corre bajo demanda (función serverless de Vercel);
// el resto del sitio sigue siendo estático.
export const prerender = false;

const SHEET_ID = import.meta.env.GOOGLE_SHEET_ID ?? process.env.GOOGLE_SHEET_ID;
const SA_JSON_B64 =
  import.meta.env.GOOGLE_SERVICE_ACCOUNT_JSON ?? process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

async function guardarEnHoja(lead: LeadEntrante): Promise<void> {
  if (!SHEET_ID || !SA_JSON_B64) {
    throw new Error('Faltan GOOGLE_SHEET_ID o GOOGLE_SERVICE_ACCOUNT_JSON');
  }
  const credenciales = JSON.parse(Buffer.from(SA_JSON_B64, 'base64').toString('utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials: credenciales,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'A:H',
    // RAW (texto literal): evita inyección de fórmulas desde entrada pública y
    // preserva valores como el WhatsApp "+51 999" sin que Sheets los reinterprete.
    valueInputOption: 'RAW',
    requestBody: { values: [construirFila(lead)] },
  });
}

export const POST: APIRoute = async ({ request }) => {
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return Response.json({ ok: false, error: 'formato' }, { status: 400 });
  }

  let lead: LeadEntrante;
  try {
    lead = (await request.json()) as LeadEntrante;
  } catch {
    return Response.json({ ok: false, error: 'json' }, { status: 400 });
  }

  if (typeof lead !== 'object' || lead === null) {
    return Response.json({ ok: false, error: 'json' }, { status: 400 });
  }

  // Bot detectado por el honeypot: respondemos éxito en silencio, sin escribir.
  if (esBot(lead)) return Response.json({ ok: true });

  const errores = validarLead(lead);
  if (errores.length > 0) {
    return Response.json({ ok: false, error: 'validacion', campos: errores }, { status: 400 });
  }

  try {
    await guardarEnHoja(lead);
    return Response.json({ ok: true });
  } catch (e) {
    console.error('Error guardando el lead en Google Sheets:', e);
    return Response.json({ ok: false, error: 'servidor' }, { status: 500 });
  }
};
