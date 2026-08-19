const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/**
 * Genera un ULID en el cliente (26 caracteres). El backend exige que el ID
 * del pedido lo cree el celular del mesero antes de tener conexión: así, si
 * la red falla justo después de crearlo, reintentar con el mismo ID no
 * duplica el pedido (ver `parse_ulid` / idempotencia en el backend).
 */
export function newUlid(): string {
  const time = Date.now();
  let timePart = "";
  let t = time;
  for (let i = 0; i < 10; i++) {
    timePart = CROCKFORD[t % 32] + timePart;
    t = Math.floor(t / 32);
  }

  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let randomPart = "";
  for (let i = 0; i < 16; i++) {
    randomPart += CROCKFORD[bytes[i] % 32];
  }

  return timePart + randomPart;
}
