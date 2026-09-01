/**
 * Cerebro del bot: decide qué responder.
 * Función pura — recibe el mensaje y los proyectos, devuelve texto.
 * No hace red ni lee variables de entorno.
 */

import { detectarIntencion } from './intencion';
import {
  buscarPorCodigo,
  buscarPorTelefono,
  extraerCodigo,
  formatearEstado,
  type Proyecto,
} from './proyectos';

export interface EntradaBot {
  /** Número del remitente tal como lo envía Meta. */
  telefono: string;
  texto: string;
  /** Nombre del perfil de WhatsApp, si viene. */
  nombre?: string;
}

const TELEFONO_VIBA = '+51 976 799 578';

const AYUDA =
  'Puedo contarte cómo va tu proyecto: escríbeme *estado* o tu código (por ejemplo *VIBA-023*).\n' +
  'Si prefieres hablar con alguien del equipo, escribe *asesor*.';

const CONTACTO_HUMANO =
  `Con gusto. Un asesor de VIBA te escribirá por este mismo chat.\n` +
  `También puedes llamarnos al ${TELEFONO_VIBA}.`;

const PEDIR_CODIGO =
  'No pude ubicar tu proyecto con este número. Envíame tu código ' +
  '(por ejemplo *VIBA-023*) y te digo cómo va.';

const primerNombre = (nombre: string): string => nombre.trim().split(/\s+/)[0] ?? '';

export function responder(entrada: EntradaBot, proyectos: Proyecto[]): string {
  // 1. Si el cliente escribió un código, manda el código.
  const codigo = extraerCodigo(entrada.texto);
  if (codigo) {
    const proyecto = buscarPorCodigo(proyectos, codigo);
    if (proyecto) return formatearEstado(proyecto);
    return (
      `No encontré un proyecto con el código *${codigo}*. ` +
      'Revisa que esté bien escrito o escribe *asesor* para que te ayude una persona.'
    );
  }

  const intencion = detectarIntencion(entrada.texto);

  if (intencion === 'humano') return CONTACTO_HUMANO;

  if (intencion === 'estado') {
    // Solo los proyectos del propio remitente: nunca los de otro cliente.
    const propios = buscarPorTelefono(proyectos, entrada.telefono);
    if (propios.length === 1) return formatearEstado(propios[0]!);
    if (propios.length > 1) {
      const lista = propios.map((p) => `• ${p.codigo} — ${p.proyecto}`).join('\n');
      return (
        `Tienes más de un proyecto con nosotros:\n${lista}\n\n` +
        'Respóndeme con el código del que quieres consultar.'
      );
    }
    return PEDIR_CODIGO;
  }

  if (intencion === 'saludo') {
    // primerNombre(...) sobre un nombre vacío o de solo espacios devuelve '',
    // así evitamos el saludo con espacio colgante ("¡Hola !").
    const nombre = primerNombre(entrada.nombre ?? '');
    const saludo = nombre ? `¡Hola ${nombre}!` : '¡Hola!';
    return `${saludo} Soy el asistente de VIBA TECH.\n\n${AYUDA}`;
  }

  return AYUDA;
}
