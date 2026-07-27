/**
 * Adaptador de red hacia WhatsApp Cloud API.
 * La configuración se inyecta (no se lee del entorno) para que este módulo
 * funcione igual en Vercel, en un VPS o en un test.
 */

const VERSION_POR_DEFECTO = 'v23.0';

export interface ConfigCloudApi {
  /** ID del número de WhatsApp Business que envía (no es el número en sí). */
  phoneId: string;
  /** Token de acceso permanente del usuario de sistema. */
  token: string;
  /** Versión de Graph API; por defecto v23.0. */
  version?: string;
}

/** Envía un mensaje de texto simple. Lanza si Meta responde con error. */
export async function enviarTexto(
  config: ConfigCloudApi,
  para: string,
  texto: string,
): Promise<void> {
  const version = config.version ?? VERSION_POR_DEFECTO;
  const url = `https://graph.facebook.com/${version}/${config.phoneId}/messages`;

  const respuesta = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.token}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: para,
      type: 'text',
      text: { preview_url: false, body: texto },
    }),
  });

  if (!respuesta.ok) {
    // Se incluye el cuerpo de Meta (útil para depurar) pero nunca el token.
    const detalle = await respuesta.text();
    throw new Error(`Cloud API respondió ${respuesta.status}: ${detalle}`);
  }
}
