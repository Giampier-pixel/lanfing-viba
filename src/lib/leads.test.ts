import { describe, it, expect } from 'vitest';
import { validarLead, esBot, construirFila } from './leads';

describe('validarLead', () => {
  it('acepta un lead con nombre y correo válidos', () => {
    expect(validarLead({ nombre: 'Ana Torres', correo: 'ana@empresa.com' })).toEqual([]);
  });

  it('rechaza un nombre demasiado corto', () => {
    expect(validarLead({ nombre: 'A', correo: 'ana@empresa.com' })).toContain('nombre');
  });

  it('rechaza un correo inválido', () => {
    expect(validarLead({ nombre: 'Ana Torres', correo: 'ana-mal' })).toContain('correo');
  });

  it('marca ambos campos cuando faltan del payload', () => {
    expect(validarLead({})).toEqual(['nombre', 'correo']);
  });
});

describe('esBot', () => {
  it('detecta el honeypot relleno', () => {
    expect(esBot({ empresa_web: 'http://spam' })).toBe(true);
  });

  it('deja pasar el honeypot vacío', () => {
    expect(esBot({ empresa_web: '' })).toBe(false);
  });

  it('ignora un honeypot con solo espacios', () => {
    expect(esBot({ empresa_web: '   ' })).toBe(false);
  });
});

describe('construirFila', () => {
  it('coloca los campos en el orden de los encabezados y recorta espacios', () => {
    const fila = construirFila({
      nombre: '  Ana  ',
      correo: ' ana@x.com ',
      whatsapp: '+51 999',
      utm_source: 'facebook',
      utm_medium: 'cpc',
      utm_campaign: 'sorteo',
      pagina: '/',
    });
    expect(fila[1]).toBe('Ana');
    expect(fila[2]).toBe('ana@x.com');
    expect(fila[3]).toBe('+51 999');
    expect(fila[4]).toBe('facebook');
    expect(fila[5]).toBe('cpc');
    expect(fila[6]).toBe('sorteo');
    expect(fila[7]).toBe('/');
  });

  it('rellena con cadenas vacías los campos ausentes', () => {
    const fila = construirFila({ nombre: 'Ana', correo: 'a@b.com' });
    expect(fila[3]).toBe('');
    expect(fila.slice(4)).toEqual(['', '', '', '']);
  });

  it('produce 8 columnas con un timestamp ISO en la primera', () => {
    const fila = construirFila({ nombre: 'Ana', correo: 'a@b.com' });
    expect(fila).toHaveLength(8);
    expect(fila[0]).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
