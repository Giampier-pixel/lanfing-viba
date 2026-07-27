import { describe, it, expect, beforeEach } from 'vitest';
import { yaProcesado, limpiarProcesados } from './dedupe';

beforeEach(() => {
  limpiarProcesados();
});

describe('yaProcesado', () => {
  it('deja pasar un id nuevo', () => {
    expect(yaProcesado('wamid.A')).toBe(false);
  });

  it('bloquea el mismo id la segunda vez', () => {
    yaProcesado('wamid.A');
    expect(yaProcesado('wamid.A')).toBe(true);
  });

  it('no confunde ids distintos', () => {
    yaProcesado('wamid.A');
    expect(yaProcesado('wamid.B')).toBe(false);
  });

  it('olvida los ids más antiguos y no crece sin límite', () => {
    for (let i = 0; i < 400; i++) yaProcesado(`wamid.${i}`);
    expect(yaProcesado('wamid.0')).toBe(false); // ya se olvidó
    expect(yaProcesado('wamid.399')).toBe(true); // el reciente sigue recordado
  });
});
