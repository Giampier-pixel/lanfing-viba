import { describe, it, expect } from 'vitest';
import { responder } from './orquestador';
import type { Proyecto } from './proyectos';

const ana: Proyecto = {
  codigo: 'VIBA-023',
  cliente: 'Ana Torres',
  whatsapp: '+51 976 799 578',
  proyecto: 'Plan de comunicación interna',
  estado: 'Desarrollo',
  avance: '60%',
  notaPublica: 'Esta semana entregamos el primer borrador.',
  actualizado: '2026-07-20',
};

const anaSegundo: Proyecto = { ...ana, codigo: 'VIBA-024', proyecto: 'Endomarketing' };

const luis: Proyecto = {
  ...ana,
  codigo: 'VIBA-050',
  cliente: 'Luis Paredes',
  whatsapp: '51999888777',
  proyecto: 'Rebranding',
};

const DE_ANA = { telefono: '51976799578', texto: '', nombre: 'Ana Torres' };

describe('responder', () => {
  it('devuelve el estado del único proyecto del remitente', () => {
    const texto = responder({ ...DE_ANA, texto: '¿cómo va mi proyecto?' }, [ana, luis]);
    expect(texto).toContain('Plan de comunicación interna');
    expect(texto).toContain('Desarrollo');
  });

  it('nunca filtra el proyecto de otro cliente', () => {
    const texto = responder({ ...DE_ANA, texto: '¿cómo va mi proyecto?' }, [ana, luis]);
    expect(texto).not.toContain('Rebranding');
    expect(texto).not.toContain('Luis');
  });

  it('pide elegir cuando el remitente tiene varios proyectos', () => {
    const texto = responder({ ...DE_ANA, texto: 'estado' }, [ana, anaSegundo]);
    expect(texto).toContain('VIBA-023');
    expect(texto).toContain('VIBA-024');
    expect(texto.toLowerCase()).toContain('código');
  });

  it('pide el código cuando no ubica el número', () => {
    const texto = responder({ telefono: '51900000000', texto: 'estado' }, [ana]);
    expect(texto).toContain('VIBA-');
    expect(texto).not.toContain('Plan de comunicación interna');
  });

  it('resuelve por código aunque el número no esté registrado', () => {
    const texto = responder({ telefono: '51900000000', texto: 'mi codigo es VIBA-023' }, [ana]);
    expect(texto).toContain('Plan de comunicación interna');
  });

  it('avisa cuando el código no existe', () => {
    const texto = responder({ ...DE_ANA, texto: 'VIBA-999' }, [ana]);
    expect(texto).toContain('VIBA-999');
    expect(texto).not.toContain('Plan de comunicación interna');
  });

  it('entrega el contacto humano cuando lo piden', () => {
    const texto = responder({ ...DE_ANA, texto: 'quiero hablar con un asesor' }, [ana]);
    expect(texto).toContain('+51 976 799 578');
  });

  it('saluda por el primer nombre y explica qué puede hacer', () => {
    const texto = responder({ ...DE_ANA, texto: 'hola' }, [ana]);
    expect(texto).toContain('Ana');
    expect(texto.toLowerCase()).toContain('estado');
  });

  it('saluda sin nombre cuando Meta no lo envía', () => {
    const texto = responder({ telefono: '51976799578', texto: 'hola' }, [ana]);
    expect(texto).toContain('¡Hola!');
  });

  it('no deja espacio colgante cuando el nombre viene solo con espacios', () => {
    const texto = responder({ telefono: '51976799578', texto: 'hola', nombre: '   ' }, [ana]);
    expect(texto).toContain('¡Hola!');
    expect(texto).not.toContain('¡Hola !');
  });

  it('ofrece ayuda ante un mensaje que no entiende', () => {
    const texto = responder({ ...DE_ANA, texto: 'quiero cotizar radio' }, [ana]);
    expect(texto.toLowerCase()).toContain('estado');
  });

  it('funciona con la lista de proyectos vacía', () => {
    const texto = responder({ ...DE_ANA, texto: 'estado' }, []);
    expect(texto).toContain('VIBA-');
  });
});
