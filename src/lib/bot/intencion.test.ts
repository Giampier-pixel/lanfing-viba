import { describe, it, expect } from 'vitest';
import { detectarIntencion } from './intencion';

describe('detectarIntencion', () => {
  it.each([
    'cómo va mi proyecto',
    'como va mi proyecto',
    '¿cuál es el estado?',
    'quiero saber el avance',
    'hay alguna novedad del progreso',
    'me das una actualización',
  ])('reconoce la consulta de estado: %s', (texto) => {
    expect(detectarIntencion(texto)).toBe('estado');
  });

  it.each([
    'quiero hablar con una persona',
    'necesito un asesor',
    'pásame con un humano',
    'quiero hablar con alguien del equipo',
  ])('reconoce la petición de humano: %s', (texto) => {
    expect(detectarIntencion(texto)).toBe('humano');
  });

  it('prioriza la petición de humano sobre la de estado', () => {
    expect(detectarIntencion('quiero un asesor que me diga el estado')).toBe('humano');
  });

  it.each([
    '¿cuál es el estado de mi asesoría?',
    'quiero saber el avance de la asesoría de marketing',
    'quiero contactar al equipo para ver el avance',
  ])('reconoce la consulta de estado aunque mencione "asesoría" o "equipo": %s', (texto) => {
    expect(detectarIntencion(texto)).toBe('estado');
  });

  it.each(['hola', 'Hola!', 'buenas tardes', 'buen día', 'qué tal'])(
    'reconoce el saludo: %s',
    (texto) => {
      expect(detectarIntencion(texto)).toBe('saludo');
    },
  );

  it.each(['hola, cómo estás', 'cómo estás', '¿hola?'])(
    'reconoce el saludo de cortesía sin confundirlo con estado: %s',
    (texto) => {
      expect(detectarIntencion(texto)).toBe('saludo');
    },
  );

  it('un saludo seguido de consulta de estado cuenta como estado', () => {
    expect(detectarIntencion('hola, cómo va mi proyecto')).toBe('estado');
  });

  it('devuelve otro cuando no reconoce nada', () => {
    expect(detectarIntencion('quiero cotizar una campaña de radio')).toBe('otro');
  });

  it.each([
    'mi persona de contacto cambió',
    'esa persona ya no trabaja aqui',
    'quiero ver el resumen ejecutivo del proyecto',
  ])('no confunde un sustantivo suelto con petición de humano: %s', (texto) => {
    expect(detectarIntencion(texto)).toBe('otro');
  });

  it.each(['¿cuánto cuesta la asesoría?', 'voy a hablar con mi equipo y te digo'])(
    'no confunde "asesoría" con "asesor" ni el equipo propio con petición de humano: %s',
    (texto) => {
      expect(detectarIntencion(texto)).toBe('otro');
    },
  );

  it('tolera texto vacío', () => {
    expect(detectarIntencion('')).toBe('otro');
  });
});
