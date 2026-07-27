/**
 * Memoria corta de mensajes ya atendidos.
 * Meta reintenta el webhook si no recibe 200 a tiempo; sin esto el cliente
 * recibiría la misma respuesta varias veces.
 */

const MAXIMO = 300;
const vistos = new Set<string>();

/** true si el mensaje ya se atendió en esta instancia; si es nuevo, lo registra. */
export function yaProcesado(id: string): boolean {
  if (vistos.has(id)) return true;

  vistos.add(id);
  // Set conserva el orden de inserción: el primero es el más antiguo.
  if (vistos.size > MAXIMO) {
    const masAntiguo = vistos.values().next().value;
    if (masAntiguo !== undefined) vistos.delete(masAntiguo);
  }
  return false;
}

/** Vacía la memoria. Solo para tests. */
export function limpiarProcesados(): void {
  vistos.clear();
}
