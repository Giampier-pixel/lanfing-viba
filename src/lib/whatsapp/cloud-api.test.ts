import { describe, it, expect, vi, afterEach } from 'vitest';
import { enviarTexto } from './cloud-api';

const CONFIG = { phoneId: '7794189252778687', token: 'token-falso' };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('enviarTexto', () => {
  it('llama al endpoint de Graph API con el cuerpo que espera Meta', async () => {
    const fetchFalso = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchFalso);

    await enviarTexto(CONFIG, '51976799578', 'Hola');

    expect(fetchFalso).toHaveBeenCalledTimes(1);
    const [url, opciones] = fetchFalso.mock.calls[0]!;
    expect(url).toBe('https://graph.facebook.com/v23.0/7794189252778687/messages');
    expect(opciones.method).toBe('POST');
    expect(opciones.headers.Authorization).toBe('Bearer token-falso');
    expect(opciones.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(opciones.body)).toEqual({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '51976799578',
      type: 'text',
      text: { preview_url: false, body: 'Hola' },
    });
  });

  it('respeta una versión de API distinta', async () => {
    const fetchFalso = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchFalso);

    await enviarTexto({ ...CONFIG, version: 'v24.0' }, '51976799578', 'Hola');

    expect(fetchFalso.mock.calls[0]![0]).toContain('/v24.0/');
  });

  it('lanza un error con el estado cuando Meta responde mal', async () => {
    const fetchFalso = vi
      .fn()
      .mockResolvedValue(new Response('{"error":{"message":"token vencido"}}', { status: 401 }));
    vi.stubGlobal('fetch', fetchFalso);

    await expect(enviarTexto(CONFIG, '51976799578', 'Hola')).rejects.toThrow(/401/);
  });

  it('no incluye el token en el mensaje de error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status: 500 })));

    const error = await enviarTexto(CONFIG, '51976799578', 'Hola').catch((e: unknown) => e);
    expect(String(error)).toContain('500');
    expect(String(error)).not.toContain('token-falso');
  });
});
