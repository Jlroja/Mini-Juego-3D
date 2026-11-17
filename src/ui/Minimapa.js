import { MUNDO } from '../config/mundo.js';

const CHICO = 172;          // lado del mapa pequeño, en píxeles

// El mapita de la esquina: el camino, las cabañas numeradas, el tablero de instrucciones,
// el carro y el jugador (la flecha). Con un clic (o la tecla M) se agranda y muestra la lista de temas.
export class Minimapa {
  constructor(contenedor, { terreno, cabanas, tablero }) {
    Object.assign(this, { contenedor, terreno, cabanas, tablero });
    this.lienzo = contenedor.querySelector('canvas');
    this.c = this.lienzo.getContext('2d');
    this.fondo = document.createElement('canvas');      // lo que no cambia se dibuja una sola vez
    this.grande = false;

    contenedor.querySelector('.minimapa__lista').innerHTML = cabanas.sitios.map((s) =>
      `<li><span class="numero" style="background:${s.datos.color}">${s.numero}</span>${s.datos.titulo}</li>`).join('');
    contenedor.addEventListener('click', () => this.alternar());
    window.addEventListener('resize', () => this.#medir());
    this.#medir();
    document.fonts?.ready.then(() => this.#dibujarFondo());
  }

  alternar(grande = !this.grande) {
    this.grande = grande;
    this.contenedor.classList.toggle('grande', grande);
    this.contenedor.title = grande ? 'Clic para achicar el mapa' : 'Clic para agrandar el mapa';
    this.#medir();
  }

  #medir() {
    this.lado = this.grande ? Math.round(Math.min(window.innerHeight * 0.74, window.innerWidth * 0.6, 640)) : CHICO;
    const nitidez = Math.min(window.devicePixelRatio || 1, 2);
    for (const l of [this.lienzo, this.fondo]) l.width = l.height = this.lado * nitidez;
    this.lienzo.style.width = this.lienzo.style.height = `${this.lado}px`;
    this.nitidez = nitidez;
    this.escala = (this.lado / 2 - 5) / (MUNDO.radioJugable + 3);     // píxeles por metro
    this.#dibujarFondo();
  }

  // metros del mundo -> píxeles del mapa (x hacia la derecha, z hacia abajo, como visto desde arriba)
  #px(metros) { return this.lado / 2 + metros * this.escala; }

  #dibujarFondo() {
    const c = this.fondo.getContext('2d'), L = this.lado, g = this.grande;
    c.setTransform(this.nitidez, 0, 0, this.nitidez, 0, 0);
    c.clearRect(0, 0, L, L);

    c.beginPath(); c.arc(L / 2, L / 2, L / 2 - 3, 0, Math.PI * 2);    // el mundo es redondo
    c.fillStyle = g ? 'rgba(74, 150, 62, 0.92)' : 'rgba(74, 150, 62, 0.6)';
    c.fill();
    c.lineWidth = 3; c.strokeStyle = 'rgba(255, 255, 255, 0.9)'; c.stroke();

    c.lineCap = c.lineJoin = 'round';
    c.strokeStyle = '#e2c08a';
    c.lineWidth = Math.max(2, MUNDO.anchoCamino * this.escala * 0.5);
    for (const s of this.cabanas.sitios) {                            // senderos a las cabañas
      c.beginPath(); c.moveTo(this.#px(s.x), this.#px(s.z)); c.lineTo(this.#px(s.camino.x), this.#px(s.camino.z)); c.stroke();
    }
    c.lineWidth = Math.max(3, MUNDO.anchoCamino * this.escala);
    c.beginPath();                                                    // el camino
    this.terreno.puntosCamino.forEach((p, i) => (i ? c.lineTo(this.#px(p.x), this.#px(p.z)) : c.moveTo(this.#px(p.x), this.#px(p.z))));
    c.closePath(); c.stroke();

    const r = g ? 15 : 8.5;
    const ficha = (x, z, color, texto) => {
      c.beginPath(); c.arc(this.#px(x), this.#px(z), r, 0, Math.PI * 2);
      c.fillStyle = color; c.fill();
      c.lineWidth = g ? 3 : 2; c.strokeStyle = '#fff'; c.stroke();
      c.fillStyle = color === '#ffd23f' ? '#1d1442' : '#fff';
      c.font = `${r * 1.3}px "Lilita One", "Arial Black", sans-serif`;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(texto, this.#px(x), this.#px(z) + r * 0.08);
    };
    for (const s of this.cabanas.sitios) ficha(s.x, s.z, s.datos.color, String(s.numero));
    ficha(this.tablero.posicion.x, this.tablero.posicion.z, '#ffd23f', '?');
  }

  // jugador = { x, z, angulo } · carro = { x, z } o null (cuando va conduciendo, la flecha ya es el carro)
  actualizar(jugador, carro) {
    const c = this.c, L = this.lado;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, this.lienzo.width, this.lienzo.height);
    c.drawImage(this.fondo, 0, 0);
    c.setTransform(this.nitidez, 0, 0, this.nitidez, 0, 0);
    const t = this.grande ? 1.7 : 1;

    if (carro) {
      c.fillStyle = '#fff'; c.strokeStyle = '#1d1442'; c.lineWidth = 1.5;
      c.beginPath(); c.rect(this.#px(carro.x) - 3.5 * t, this.#px(carro.z) - 3.5 * t, 7 * t, 7 * t);
      c.fill(); c.stroke();
    }
    c.save();                                                         // la flecha apunta hacia donde mira el jugador
    c.translate(Math.min(L - 8, Math.max(8, this.#px(jugador.x))), Math.min(L - 8, Math.max(8, this.#px(jugador.z))));
    c.rotate(-jugador.angulo);
    c.beginPath(); c.moveTo(0, 9 * t); c.lineTo(6 * t, -6 * t); c.lineTo(0, -2.5 * t); c.lineTo(-6 * t, -6 * t); c.closePath();
    c.fillStyle = '#ff3b4f'; c.fill();
    c.lineWidth = 2; c.strokeStyle = '#fff'; c.stroke();
    c.restore();
  }
}
