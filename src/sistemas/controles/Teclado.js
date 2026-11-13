// Lleva la cuenta de qué teclas están pulsadas y las traduce a acciones del juego.
const TECLAS_JUEGO = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'ShiftLeft', 'ShiftRight', 'Space', 'KeyE'];

export class Teclado {
  constructor() {
    this.pulsadas = new Set();
    this.recientes = new Set();          // teclas pulsadas en este fotograma
    this.activo = true;
    window.addEventListener('keydown', (e) => {
      if (!this.activo || !TECLAS_JUEGO.includes(e.code)) return;
      if (!e.repeat) this.recientes.add(e.code);
      this.pulsadas.add(e.code);
      e.preventDefault();                   // que las flechas y el espacio no muevan la página
    });
    window.addEventListener('keyup', (e) => this.pulsadas.delete(e.code));
    window.addEventListener('blur', () => this.pulsadas.clear());
  }

  // true solo en el momento de pulsar la tecla (no mientras se mantiene)
  recienPulsada(codigo) { return this.recientes.has(codigo); }
  finFotograma() { this.recientes.clear(); }

  #alguna(...codigos) { return codigos.some((c) => this.pulsadas.has(c)); }

  get adelante() { return this.#alguna('KeyW', 'ArrowUp'); }
  get atras() { return this.#alguna('KeyS', 'ArrowDown'); }
  get izquierda() { return this.#alguna('KeyA', 'ArrowLeft'); }
  get derecha() { return this.#alguna('KeyD', 'ArrowRight'); }
  get correr() { return this.#alguna('ShiftLeft', 'ShiftRight'); }
  get saltar() { return this.#alguna('Space'); }
}
