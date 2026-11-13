// Números al azar "repetibles": con la misma semilla salen siempre los mismos,
// así el mundo queda igual cada vez que se abre el juego.
export function crearAzar(semilla) {
  let a = semilla >>> 0;
  const azar = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  azar.entre = (min, max) => min + azar() * (max - min);
  azar.elegir = (lista) => lista[Math.floor(azar() * lista.length)];
  return azar;
}

// Funciones matemáticas de uso común
export const limitar = (x, min, max) => Math.min(max, Math.max(min, x));
export const mezclar = (a, b, t) => a + (b - a) * t;
export function escalon(x, a, b) {          // 0 antes de a, 1 después de b, suave en medio
  const t = limitar((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}
// Acerca "actual" a "objetivo" con suavidad, igual a cualquier velocidad de fotogramas
export const suavizar = (actual, objetivo, rapidez, dt) =>
  actual + (objetivo - actual) * (1 - Math.exp(-rapidez * dt));
