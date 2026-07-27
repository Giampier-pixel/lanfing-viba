/** Lectura del payload de webhook de WhatsApp Cloud API (lógica pura). */

export interface MensajeEntrante {
  /** Número del cliente en E.164 sin '+', tal como lo envía Meta (ej. '51976799578'). */
  de: string;
  /** Identificador único del mensaje ('wamid...'), usado para no responder dos veces. */
  id: string;
  /** Texto plano del mensaje. */
  texto: string;
  /** Nombre del perfil de WhatsApp, cuando Meta lo incluye. */
  nombre?: string;
}

/**
 * Devuelve el mensaje de texto del payload, o null si el webhook trae otra
 * cosa (cambios de estado, imágenes, audios, forma inesperada).
 * El JSON viene de fuera: se navega defensivamente, sin confiar en su forma.
 */
export function extraerMensaje(cuerpo: unknown): MensajeEntrante | null {
  // `any` a propósito: es JSON externo, se navega defensivamente y cada campo
  // se valida por tipo antes de usarse.
  const valor = (cuerpo as any)?.entry?.[0]?.changes?.[0]?.value;
  const mensaje = valor?.messages?.[0];
  if (!mensaje || mensaje.type !== 'text') return null;

  const de = mensaje.from;
  const id = mensaje.id;
  const texto = mensaje.text?.body;
  if (typeof de !== 'string' || typeof id !== 'string' || typeof texto !== 'string') return null;

  const nombre = valor?.contacts?.[0]?.profile?.name;
  return {
    de,
    id,
    texto,
    ...(typeof nombre === 'string' ? { nombre } : {}),
  };
}
