import { useEffect, useRef, useState } from 'react';

/**
 * Paso de agenda: incrusta el calendario de Calendly ya prellenado con los
 * datos que la persona acaba de dejar en el formulario.
 *
 * - El script de Calendly se carga *bajo demanda* (solo al llegar a este paso),
 *   para no penalizar la carga inicial de la landing ni cargar un tercero a
 *   quien nunca llega a agendar.
 * - Si `PUBLIC_CALENDLY_URL` no está configurada, el componente no renderiza
 *   nada y el formulario se queda con su mensaje de agradecimiento normal.
 */

const URL_CALENDLY = import.meta.env.PUBLIC_CALENDLY_URL as string | undefined;
const SRC_WIDGET = 'https://assets.calendly.com/assets/external/widget.js';

/** ¿Hay agenda configurada? Lo usa también el formulario para decidir el copy. */
export const HAY_AGENDA = Boolean(URL_CALENDLY);

type Estado = 'cargando' | 'listo' | 'error' | 'agendado';

/** Carga el widget una sola vez, aunque se monte varias veces. */
let cargaEnCurso: Promise<void> | null = null;
function cargarWidget(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if ((window as unknown as { Calendly?: unknown }).Calendly) return Promise.resolve();
  if (cargaEnCurso) return cargaEnCurso;

  cargaEnCurso = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SRC_WIDGET;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      cargaEnCurso = null; // permite reintentar en un montaje posterior
      reject(new Error('No se pudo cargar el widget de Calendly'));
    };
    document.head.appendChild(script);
  });
  return cargaEnCurso;
}

/**
 * Construye la URL del calendario: tema oscuro + datos prellenados.
 *
 * El prefill se manda por DOS vías a propósito: como parámetros de URL
 * (`name`, `email`) y como objeto `prefill` en initInlineWidget. En las
 * pruebas, el widget no volcaba el objeto `prefill` a la URL del iframe, así
 * que los parámetros de URL —el método documentado— garantizan el prellenado
 * pase lo que pase. Pasar ambos no genera conflicto.
 */
function urlDeAgenda(base: string, datos: Props): string {
  const url = new URL(base);

  // Parte de los parámetros que ya traiga la URL configurada.
  const params = new Map<string, string>();
  url.searchParams.forEach((valor, clave) => params.set(clave, valor));

  // Tema, para que el calendario no salga blanco sobre la landing negra.
  params.set('hide_gdpr_banner', '1');
  params.set('background_color', '0d0d0d');
  params.set('text_color', 'f8f8f8');
  params.set('primary_color', 'b5f400');

  // Prellenado.
  if (datos.nombre) params.set('name', datos.nombre);
  if (datos.correo) params.set('email', datos.correo);
  // No se manda `a1`: el tipo de evento no tiene preguntas personalizadas, así
  // que ese slot lo ocupa la pregunta libre por defecto de Calendly y el
  // teléfono acabaría dentro de ella. El WhatsApp ya viaja a la hoja de
  // cálculo desde el formulario (`/api/lead`).

  // OJO: no se usa URLSearchParams.toString() porque codifica los espacios
  // como "+", y el widget de Calendly vuelve a codificar ese "+" como %2B.
  // El nombre acabaría mostrándose como "Ana+Torres". Con encodeURIComponent
  // los espacios salen como %20 y llegan bien.
  const query = [...params]
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  return `${url.origin}${url.pathname}?${query}`;
}

interface Props {
  nombre: string;
  correo: string;
}

export default function AgendaCalendly({ nombre, correo }: Props) {
  const contenedor = useRef<HTMLDivElement>(null);
  const [estado, setEstado] = useState<Estado>('cargando');

  // Monta el widget con los datos ya prellenados.
  useEffect(() => {
    if (!URL_CALENDLY) return;
    let vivo = true;

    cargarWidget()
      .then(() => {
        if (!vivo || !contenedor.current) return;
        const Calendly = (
          window as unknown as {
            Calendly: {
              initInlineWidget: (opciones: Record<string, unknown>) => void;
            };
          }
        ).Calendly;

        Calendly.initInlineWidget({
          url: urlDeAgenda(URL_CALENDLY, { nombre, correo }),
          parentElement: contenedor.current,
          prefill: {
            name: nombre,
            email: correo,
          },
        });
        setEstado('listo');
      })
      .catch(() => {
        if (vivo) setEstado('error');
      });

    return () => {
      vivo = false;
    };
  }, [nombre, correo]);

  // Calendly avisa por postMessage cuando la reserva se completa.
  useEffect(() => {
    function alRecibir(ev: MessageEvent) {
      if (!/(^|\.)calendly\.com$/.test(new URL(ev.origin).hostname)) return;
      if (ev.data?.event === 'calendly.event_scheduled') setEstado('agendado');
    }
    window.addEventListener('message', alRecibir);
    return () => window.removeEventListener('message', alRecibir);
  }, []);

  if (!URL_CALENDLY) return null;

  if (estado === 'agendado') {
    return (
      <div role="status" aria-live="polite" className="py-6 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-lima text-negro">
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
        <h3 className="mt-4 font-display text-2xl font-bold uppercase tracking-tight text-blanco">
          ¡Listo! Ya tienes tu hora
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-hueso/60">
          Te llegó la invitación a <strong className="text-lima">{correo}</strong>{' '}
          con el enlace de la videollamada. Nos vemos ahí.
        </p>
      </div>
    );
  }

  if (estado === 'error') {
    return (
      <p
        role="alert"
        className="rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm leading-relaxed text-coral"
      >
        No pudimos cargar el calendario. No te preocupes: ya tenemos tus datos y
        te escribiremos para coordinar la hora.
      </p>
    );
  }

  return (
    <div>
      {estado === 'cargando' && (
        <p className="py-8 text-center text-sm text-hueso/50">
          Cargando horarios disponibles…
        </p>
      )}
      {/* Calendly inyecta aquí su iframe y controla el alto */}
      <div ref={contenedor} className="min-h-[640px] [&_iframe]:rounded-xl" />
    </div>
  );
}
