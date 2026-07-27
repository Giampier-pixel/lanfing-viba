/** Verificación del webhook de WhatsApp Cloud API (sin dependencias de Astro ni de red). */

import { createHmac, timingSafeEqual } from 'node:crypto';

const PREFIJO_FIRMA = 'sha256=';

/**
 * Handshake de suscripción de Meta: devuelve el challenge a repetir en la
 * respuesta, o null si la petición no es legítima.
 */
export function resolverHandshake(params: URLSearchParams, verifyToken: string): string | null {
  const modo = params.get('hub.mode');
  const token = params.get('hub.verify_token');
  const reto = params.get('hub.challenge');
  if (modo === 'subscribe' && token === verifyToken && reto) return reto;
  return null;
}

/**
 * true si la cabecera `x-hub-signature-256` corresponde al HMAC-SHA256 del
 * cuerpo CRUDO (no re-serializado) con el app secret de la app de Meta.
 */
export function firmaValida(
  cuerpoCrudo: string,
  cabecera: string | null,
  appSecret: string,
): boolean {
  if (!cabecera || !cabecera.startsWith(PREFIJO_FIRMA)) return false;

  const recibida = Buffer.from(cabecera.slice(PREFIJO_FIRMA.length), 'hex');
  const esperada = createHmac('sha256', appSecret).update(cuerpoCrudo, 'utf8').digest();

  // timingSafeEqual exige buffers del mismo largo; un hex inválido o truncado
  // produce un buffer más corto y se descarta aquí sin lanzar.
  if (recibida.length !== esperada.length) return false;
  return timingSafeEqual(recibida, esperada);
}
