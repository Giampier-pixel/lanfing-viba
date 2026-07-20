import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { LeadEntrante } from '../lib/leads';

/**
 * Isla React: formulario de captación de VIBA.
 * - Campos: nombre + correo (obligatorios) + WhatsApp (opcional).
 * - Validación en cliente y estados: idle → enviando → éxito / error.
 * - Honeypot anti-bot (campo trampa oculto).
 * - Envío real al endpoint /api/lead, incluyendo los UTM capturados de la URL.
 */

type Estado = 'idle' | 'enviando' | 'exito' | 'error';
type Campos = { nombre: string; correo: string; whatsapp: string };
type Errores = Partial<Record<keyof Campos, string>>;

const VACIO: Campos = { nombre: '', correo: '', whatsapp: '' };
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validar(c: Campos): Errores {
  const e: Errores = {};
  if (c.nombre.trim().length < 2) e.nombre = 'Escribe tu nombre para poder saludarte.';
  if (!RE_EMAIL.test(c.correo.trim())) e.correo = 'Revisa tu correo: parece que falta algo.';
  return e;
}

async function enviarLead(datos: LeadEntrante): Promise<void> {
  const res = await fetch('/api/lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
  const data = await res.json().catch(() => ({ ok: false }));
  if (!res.ok || !data.ok) throw new Error('Envío fallido');
}

export default function Formulario() {
  const [campos, setCampos] = useState<Campos>(VACIO);
  const [errores, setErrores] = useState<Errores>({});
  const [estado, setEstado] = useState<Estado>('idle');
  const [trampa, setTrampa] = useState(''); // honeypot: si se llena, es bot
  const meta = useRef<Pick<LeadEntrante, 'utm_source' | 'utm_medium' | 'utm_campaign' | 'pagina'>>({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    meta.current = {
      utm_source: params.get('utm_source') ?? undefined,
      utm_medium: params.get('utm_medium') ?? undefined,
      utm_campaign: params.get('utm_campaign') ?? undefined,
      pagina: window.location.pathname,
    };
  }, []);

  function actualizar(campo: keyof Campos, valor: string) {
    setCampos((c) => ({ ...c, [campo]: valor }));
    if (errores[campo]) setErrores((e) => ({ ...e, [campo]: undefined }));
    if (estado === 'error') setEstado('idle');
  }

  async function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (trampa) return; // envío de bot: lo ignoramos en silencio
    const errs = validar(campos);
    if (Object.keys(errs).length > 0) {
      setErrores(errs);
      const primero = Object.keys(errs)[0] as keyof Campos;
      document.getElementById(`campo-${primero}`)?.focus();
      return;
    }
    setEstado('enviando');
    try {
      await enviarLead({ ...campos, empresa_web: trampa, ...meta.current });
      setEstado('exito');
    } catch {
      setEstado('error');
    }
  }

  function reiniciar() {
    setCampos(VACIO);
    setErrores({});
    setEstado('idle');
  }

  if (estado === 'exito') {
    return (
      <div role="status" aria-live="polite" className="text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-salvia text-crema">
          <svg
            className="size-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m4 12 5 5L20 6" />
          </svg>
        </span>
        <h3 className="mt-4 font-serif text-2xl font-semibold text-charcoal">
          ¡Gracias! Te contactaremos pronto
        </h3>
        <p className="mt-2 text-sm text-charcoal/60">
          Recibimos tus datos. Un consultor de VIBA se pondrá en contacto contigo
          muy pronto.
        </p>
        <button
          type="button"
          onClick={reiniciar}
          className="mt-5 text-sm font-semibold text-terracota underline underline-offset-4 transition hover:text-terracota-600"
        >
          Enviar otra solicitud
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Campo
        id="campo-nombre"
        etiqueta="Nombre"
        valor={campos.nombre}
        onChange={(v) => actualizar('nombre', v)}
        error={errores.nombre}
        placeholder="Ana Torres"
        autoComplete="name"
      />
      <Campo
        id="campo-correo"
        etiqueta="Correo"
        tipo="email"
        inputMode="email"
        valor={campos.correo}
        onChange={(v) => actualizar('correo', v)}
        error={errores.correo}
        placeholder="ana@empresa.com"
        autoComplete="email"
      />
      <Campo
        id="campo-whatsapp"
        etiqueta="WhatsApp"
        tipo="tel"
        inputMode="tel"
        valor={campos.whatsapp}
        onChange={(v) => actualizar('whatsapp', v)}
        error={errores.whatsapp}
        placeholder="+51 999 888 777"
        autoComplete="tel"
        opcional
      />

      {/* Honeypot: invisible para personas, tentador para bots */}
      <input
        type="text"
        name="empresa_web"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={trampa}
        onChange={(e) => setTrampa(e.target.value)}
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      {estado === 'error' && (
        <p
          role="alert"
          className="rounded-md border border-terracota-700/30 bg-terracota/5 px-4 py-3 text-sm text-terracota-700"
        >
          No pudimos enviar tus datos. Revisa tu conexión e inténtalo otra vez.
        </p>
      )}

      <button
        type="submit"
        disabled={estado === 'enviando'}
        className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-full bg-terracota px-6 py-3 text-sm font-semibold text-crema shadow-[0_10px_24px_-10px_rgba(178,107,82,0.75)] transition hover:bg-terracota-600 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {estado === 'enviando' ? (
          <>
            <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-90"
                fill="currentColor"
                d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4z"
              />
            </svg>
            Enviando…
          </>
        ) : (
          'Enviar mis datos'
        )}
      </button>

      <p className="text-center text-xs text-charcoal/45">
        Al enviar aceptas que te contactemos. Sin spam ·{' '}
        <a href="#" className="underline underline-offset-2 hover:text-charcoal/70">
          Política de privacidad
        </a>
      </p>
    </form>
  );
}

interface CampoProps {
  id: string;
  etiqueta: string;
  valor: string;
  onChange: (valor: string) => void;
  error?: string;
  tipo?: string;
  placeholder?: string;
  inputMode?: 'text' | 'tel' | 'email';
  autoComplete?: string;
  opcional?: boolean;
}

function Campo({
  id,
  etiqueta,
  valor,
  onChange,
  error,
  tipo = 'text',
  placeholder,
  inputMode,
  autoComplete,
  opcional = false,
}: CampoProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-charcoal">
        {etiqueta}
        {opcional && (
          <span className="font-normal text-charcoal/45"> (opcional)</span>
        )}
      </label>
      <input
        id={id}
        name={id}
        type={tipo}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        required={!opcional}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`mt-1.5 w-full rounded-xl border bg-crema px-4 py-3 text-charcoal transition placeholder:text-charcoal/35 focus:outline-none focus:ring-4 ${
          error
            ? 'border-terracota-700 focus:border-terracota-700 focus:ring-terracota-700/20'
            : 'border-taupe/60 focus:border-salvia focus:ring-salvia/25'
        }`}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-terracota-700">
          {error}
        </p>
      )}
    </div>
  );
}
