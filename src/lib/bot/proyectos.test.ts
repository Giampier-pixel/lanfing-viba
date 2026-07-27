import { describe, it, expect } from 'vitest';
import {
  filaAProyecto,
  normalizarCodigo,
  extraerCodigo,
  mismoTelefono,
  buscarPorTelefono,
  buscarPorCodigo,
  formatearEstado,
  type Proyecto,
} from './proyectos';

const base: Proyecto = {
  codigo: 'VIBA-023',
  cliente: 'Ana Torres',
  whatsapp: '+51 976 799 578',
  proyecto: 'Plan de comunicación interna',
  estado: 'Desarrollo',
  avance: '60%',
  notaPublica: 'Esta semana entregamos el primer borrador.',
  actualizado: '2026-07-20',
};

describe('filaAProyecto', () => {
  it('mapea las 8 columnas en orden y recorta espacios', () => {
    const fila = [
      ' VIBA-023 ',
      'Ana Torres',
      '+51 976 799 578',
      'Plan de comunicación interna',
      'Desarrollo',
      '60%',
      'Esta semana entregamos el primer borrador.',
      '2026-07-20',
    ];
    expect(filaAProyecto(fila)).toEqual(base);
  });

  it('rellena con cadena vacía las columnas que faltan', () => {
    const p = filaAProyecto(['VIBA-001', 'Luis']);
    expect(p.codigo).toBe('VIBA-001');
    expect(p.cliente).toBe('Luis');
    expect(p.whatsapp).toBe('');
    expect(p.actualizado).toBe('');
  });
});

describe('normalizarCodigo', () => {
  it('ignora mayúsculas, guiones y espacios', () => {
    expect(normalizarCodigo('viba - 023')).toBe('VIBA023');
    expect(normalizarCodigo('VIBA-023')).toBe('VIBA023');
  });
});

describe('extraerCodigo', () => {
  it('encuentra el código dentro de una frase', () => {
    expect(extraerCodigo('hola, cómo va el VIBA-023?')).toBe('VIBA-023');
  });

  it('acepta el código sin guion y en minúsculas', () => {
    expect(extraerCodigo('mi codigo es viba 7')).toBe('VIBA-7');
  });

  it('devuelve null cuando no hay código', () => {
    expect(extraerCodigo('¿cómo va mi proyecto?')).toBeNull();
  });

  it('devuelve null cuando hay más de 4 dígitos consecutivos', () => {
    expect(extraerCodigo('mi codigo es VIBA-12345')).toBeNull();
  });

  it('sigue capturando correctamente un código de 4 dígitos', () => {
    expect(extraerCodigo('consulta por VIBA-1234')).toBe('VIBA-1234');
  });
});

describe('mismoTelefono', () => {
  it('iguala el número de Meta con el formato escrito a mano', () => {
    expect(mismoTelefono('51976799578', '+51 976 799 578')).toBe(true);
  });

  it('iguala aunque falte el prefijo de país en la hoja', () => {
    expect(mismoTelefono('51976799578', '976799578')).toBe(true);
  });

  it('distingue números diferentes', () => {
    expect(mismoTelefono('51976799578', '51999888777')).toBe(false);
  });

  it('no considera coincidencia una celda vacía o basura corta', () => {
    expect(mismoTelefono('51976799578', '')).toBe(false);
    expect(mismoTelefono('51976799578', '578')).toBe(false);
  });
});

describe('buscarPorTelefono', () => {
  const otro: Proyecto = { ...base, codigo: 'VIBA-024', proyecto: 'Endomarketing' };
  const ajeno: Proyecto = { ...base, codigo: 'VIBA-999', whatsapp: '51999888777' };

  it('devuelve todos los proyectos del remitente', () => {
    const r = buscarPorTelefono([base, otro, ajeno], '51976799578');
    expect(r.map((p) => p.codigo)).toEqual(['VIBA-023', 'VIBA-024']);
  });

  it('no devuelve proyectos de otros clientes', () => {
    expect(buscarPorTelefono([ajeno], '51976799578')).toEqual([]);
  });
});

describe('buscarPorCodigo', () => {
  it('encuentra el proyecto ignorando formato del código', () => {
    expect(buscarPorCodigo([base], 'viba023')?.codigo).toBe('VIBA-023');
  });

  it('devuelve null si no existe', () => {
    expect(buscarPorCodigo([base], 'VIBA-999')).toBeNull();
  });
});

describe('formatearEstado', () => {
  it('incluye proyecto, estado, avance y nota', () => {
    const texto = formatearEstado(base);
    expect(texto).toContain('Plan de comunicación interna');
    expect(texto).toContain('Desarrollo');
    expect(texto).toContain('60%');
    expect(texto).toContain('Esta semana entregamos el primer borrador.');
    expect(texto).toContain('2026-07-20');
  });

  it('omite las líneas vacías y no muestra "undefined"', () => {
    const texto = formatearEstado({ ...base, avance: '', notaPublica: '', actualizado: '' });
    expect(texto).not.toContain('undefined');
    expect(texto).not.toContain('Avance:');
    expect(texto.split('\n').filter((l) => l.trim() === '')).toHaveLength(0);
  });

  it('usa el código cuando no hay nombre de proyecto', () => {
    expect(formatearEstado({ ...base, proyecto: '' })).toContain('VIBA-023');
  });

  it('muestra un estado por defecto cuando la celda está vacía', () => {
    expect(formatearEstado({ ...base, estado: '' })).toContain('sin registrar');
  });
});
