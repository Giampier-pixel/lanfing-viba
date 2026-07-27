import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import { resolverHandshake, firmaValida } from './firma';

const SECRETO = 'secreto-de-prueba';
const firmar = (cuerpo: string) =>
  'sha256=' + createHmac('sha256', SECRETO).update(cuerpo, 'utf8').digest('hex');

describe('resolverHandshake', () => {
  const params = (extra: Record<string, string>) =>
    new URLSearchParams({ 'hub.mode': 'subscribe', 'hub.challenge': '123456', ...extra });

  it('devuelve el challenge cuando el verify token coincide', () => {
    expect(resolverHandshake(params({ 'hub.verify_token': 'token-viba' }), 'token-viba')).toBe(
      '123456',
    );
  });

  it('rechaza un verify token distinto', () => {
    expect(resolverHandshake(params({ 'hub.verify_token': 'otro' }), 'token-viba')).toBeNull();
  });

  it('rechaza un modo distinto de subscribe', () => {
    const p = new URLSearchParams({
      'hub.mode': 'unsubscribe',
      'hub.verify_token': 'token-viba',
      'hub.challenge': '123456',
    });
    expect(resolverHandshake(p, 'token-viba')).toBeNull();
  });

  it('rechaza una petición sin challenge', () => {
    const p = new URLSearchParams({ 'hub.mode': 'subscribe', 'hub.verify_token': 'token-viba' });
    expect(resolverHandshake(p, 'token-viba')).toBeNull();
  });
});

describe('firmaValida', () => {
  const cuerpo = '{"object":"whatsapp_business_account"}';

  it('acepta una firma correcta', () => {
    expect(firmaValida(cuerpo, firmar(cuerpo), SECRETO)).toBe(true);
  });

  it('rechaza la firma si el cuerpo fue alterado', () => {
    expect(firmaValida(cuerpo + ' ', firmar(cuerpo), SECRETO)).toBe(false);
  });

  it('rechaza una firma hecha con otro secreto', () => {
    const otra =
      'sha256=' + createHmac('sha256', 'otro-secreto').update(cuerpo, 'utf8').digest('hex');
    expect(firmaValida(cuerpo, otra, SECRETO)).toBe(false);
  });

  it('rechaza cuando falta la cabecera', () => {
    expect(firmaValida(cuerpo, null, SECRETO)).toBe(false);
  });

  it('rechaza una cabecera sin el prefijo sha256=', () => {
    expect(firmaValida(cuerpo, 'abcdef', SECRETO)).toBe(false);
  });

  it('rechaza un hex de longitud distinta sin lanzar excepción', () => {
    expect(firmaValida(cuerpo, 'sha256=aabb', SECRETO)).toBe(false);
  });
});
