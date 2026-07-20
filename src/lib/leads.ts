/** Tipos y lógica pura de los leads de VIBA (sin dependencias de Astro ni de red). */

export interface LeadEntrante {
  nombre?: string;
  correo?: string;
  whatsapp?: string;
  empresa_web?: string; // honeypot anti-bot: si viene con texto, es un bot
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  pagina?: string;
}

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** true si el honeypot fue rellenado (envío de bot). */
export function esBot(lead: LeadEntrante): boolean {
  return typeof lead.empresa_web === 'string' && lead.empresa_web.trim().length > 0;
}

/** Lista de campos inválidos ('nombre', 'correo'). Vacío = válido. */
export function validarLead(lead: LeadEntrante): string[] {
  const errores: string[] = [];
  if (!lead.nombre || lead.nombre.trim().length < 2) errores.push('nombre');
  if (!lead.correo || !RE_EMAIL.test(lead.correo.trim())) errores.push('correo');
  return errores;
}

/** Construye la fila para la hoja, en el orden de los encabezados. */
export function construirFila(lead: LeadEntrante): string[] {
  return [
    new Date().toISOString(),
    (lead.nombre ?? '').trim(),
    (lead.correo ?? '').trim(),
    (lead.whatsapp ?? '').trim(),
    lead.utm_source ?? '',
    lead.utm_medium ?? '',
    lead.utm_campaign ?? '',
    lead.pagina ?? '',
  ];
}
