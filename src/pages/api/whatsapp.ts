import type { APIRoute } from 'astro';
import { firmaValida, resolverHandshake } from '../../lib/whatsapp/firma';
import { extraerMensaje } from '../../lib/whatsapp/payload';
import { enviarTexto, type ConfigCloudApi } from '../../lib/whatsapp/cloud-api';
import { yaProcesado } from '../../lib/bot/dedupe';
import { leerProyectos } from '../../lib/bot/proyectos-sheet';
import { responder } from '../../lib/bot/orquestador';

// Función serverless bajo demanda; el resto del sitio sigue siendo estático.
export const prerender = false;

const VERIFY_TOKEN = import.meta.env.WHATSAPP_VERIFY_TOKEN ?? process.env.WHATSAPP_VERIFY_TOKEN;
const APP_SECRET = import.meta.env.WHATSAPP_APP_SECRET ?? process.env.WHATSAPP_APP_SECRET;
const TOKEN = import.meta.env.WHATSAPP_TOKEN ?? process.env.WHATSAPP_TOKEN;
const PHONE_ID = import.meta.env.WHATSAPP_PHONE_ID ?? process.env.WHATSAPP_PHONE_ID;
const API_VERSION = import.meta.env.WHATSAPP_API_VERSION ?? process.env.WHATSAPP_API_VERSION;

/** Handshake de verificación que Meta hace una sola vez al guardar el webhook. */
export const GET: APIRoute = ({ url }) => {
  if (!VERIFY_TOKEN) {
    console.error('Falta WHATSAPP_VERIFY_TOKEN');
    return new Response('config', { status: 500 });
  }
  const reto = resolverHandshake(url.searchParams, VERIFY_TOKEN);
  if (reto === null) return new Response('forbidden', { status: 403 });
  return new Response(reto, { status: 200, headers: { 'Content-Type': 'text/plain' } });
};

export const POST: APIRoute = async ({ request }) => {
  if (!APP_SECRET || !TOKEN || !PHONE_ID) {
    console.error('Faltan variables de entorno de WhatsApp');
    // 200 igual: si devolviéramos 5xx, Meta reintentaría en bucle.
    return new Response('ok', { status: 200 });
  }

  // El cuerpo CRUDO es lo que se firma: no re-serializar antes de validar.
  const cuerpoCrudo = await request.text();
  if (!firmaValida(cuerpoCrudo, request.headers.get('x-hub-signature-256'), APP_SECRET)) {
    return new Response('forbidden', { status: 403 });
  }

  let cuerpo: unknown;
  try {
    cuerpo = JSON.parse(cuerpoCrudo);
  } catch {
    return new Response('ok', { status: 200 });
  }

  const mensaje = extraerMensaje(cuerpo);
  // Sin mensaje de texto (estados, adjuntos) o reintento de Meta: nada que hacer.
  if (!mensaje || yaProcesado(mensaje.id)) return new Response('ok', { status: 200 });

  const config: ConfigCloudApi = {
    phoneId: PHONE_ID,
    token: TOKEN,
    ...(API_VERSION ? { version: API_VERSION } : {}),
  };

  let texto: string;
  try {
    const proyectos = await leerProyectos();
    texto = responder(
      { telefono: mensaje.de, texto: mensaje.texto, ...(mensaje.nombre ? { nombre: mensaje.nombre } : {}) },
      proyectos,
    );
  } catch (e) {
    console.error('Error leyendo la hoja de proyectos:', e);
    texto =
      'Ahora mismo no puedo consultar el estado de los proyectos. ' +
      'Inténtalo en unos minutos o escríbenos al +51 976 799 578.';
  }

  try {
    await enviarTexto(config, mensaje.de, texto);
  } catch (e) {
    console.error('Error enviando la respuesta por WhatsApp:', e);
  }

  return new Response('ok', { status: 200 });
};
