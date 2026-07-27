import { describe, it, expect } from 'vitest';
import { extraerMensaje } from './payload';

const payloadTexto = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: '215589313241560883',
      changes: [
        {
          value: {
            messaging_product: 'whatsapp',
            metadata: { display_phone_number: '15551797781', phone_number_id: '7794189252778687' },
            contacts: [{ profile: { name: 'Jessica Laverde' }, wa_id: '51976799578' }],
            messages: [
              {
                from: '51976799578',
                id: 'wamid.ABC123',
                timestamp: '1758254144',
                text: { body: '¿Cómo va mi proyecto?' },
                type: 'text',
              },
            ],
          },
          field: 'messages',
        },
      ],
    },
  ],
};

describe('extraerMensaje', () => {
  it('extrae remitente, id, texto y nombre de un mensaje de texto', () => {
    expect(extraerMensaje(payloadTexto)).toEqual({
      de: '51976799578',
      id: 'wamid.ABC123',
      texto: '¿Cómo va mi proyecto?',
      nombre: 'Jessica Laverde',
    });
  });

  it('deja el nombre indefinido cuando Meta no envía contacts', () => {
    const sinContacto = structuredClone(payloadTexto) as typeof payloadTexto;
    delete (sinContacto.entry[0]!.changes[0]!.value as { contacts?: unknown }).contacts;
    expect(extraerMensaje(sinContacto)?.nombre).toBeUndefined();
  });

  it('ignora las notificaciones de estado (entregado/leído)', () => {
    const estado = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: '1',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                statuses: [{ id: 'wamid.ABC123', status: 'delivered' }],
              },
              field: 'messages',
            },
          ],
        },
      ],
    };
    expect(extraerMensaje(estado)).toBeNull();
  });

  it('ignora los mensajes que no son de texto', () => {
    const imagen = structuredClone(payloadTexto) as typeof payloadTexto;
    const mensaje = imagen.entry[0]!.changes[0]!.value.messages[0]! as Record<string, unknown>;
    mensaje.type = 'image';
    delete mensaje.text;
    expect(extraerMensaje(imagen)).toBeNull();
  });

  it('devuelve null ante un cuerpo vacío o con otra forma', () => {
    expect(extraerMensaje(null)).toBeNull();
    expect(extraerMensaje({})).toBeNull();
    expect(extraerMensaje({ entry: [] })).toBeNull();
  });
});
