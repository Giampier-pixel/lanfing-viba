import type { APIRoute } from 'astro';
import { clienteSheets, idHoja } from '../../lib/sheets';
import { validarLead, esBot, construirFila, type LeadEntrante } from '../../lib/leads';

// Este endpoint corre bajo demanda (función serverless de Vercel);
// el resto del sitio sigue siendo estático.
export const prerender = false;

async function guardarEnHoja(lead: LeadEntrante): Promise<void> {
  const sheets = clienteSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: idHoja(),
    // Sin nombre de pestaña, Sheets escribe en la PRIMERA hoja (la de leads).
    // Por eso "Proyectos" debe agregarse siempre al final del documento.
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
