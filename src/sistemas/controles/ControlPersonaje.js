import { JUGADOR, MUNDO } from '../../config/mundo.js';
import { suavizar } from '../azar.js';

// Mueve al personaje por el mundo según el teclado: caminar, correr (Shift) y saltar (Espacio).
// Lo mantiene pegado al suelo, lo frena contra árboles y rocas y no lo deja salir del mundo.
export class ControlPersonaje {
  constructor({ personaje, terreno, obstaculos, teclado }) {
    Object.assign(this, { personaje, terreno, obstaculos, teclado });
    this.pos = personaje.grupo.position;
    this.velX = 0; this.velZ = 0; this.velY = 0;
    this.angulo = 0;
    this.enSuelo = true;
    this.rapidez = 0;
  }

  colocar(x, z, angulo) {
    this.pos.set(x, this.terreno.altura(x, z), z);
    this.velX = this.velZ = this.velY = 0;
    this.enSuelo = true;
    this.angulo = angulo;
    this.personaje.grupo.rotation.set(0, angulo, 0);
  }

  // anguloCamara: hacia dónde mira la cámara, para que "adelante" sea alejarse de ella
  actualizar(dt, anguloCamara) {
    const t = this.teclado, p = this.pos;
    const lado = (t.derecha ? 1 : 0) - (t.izquierda ? 1 : 0);
    const frente = (t.adelante ? 1 : 0) - (t.atras ? 1 : 0);
    const sen = Math.sin(anguloCamara), cos = Math.cos(anguloCamara);
    let dx = -sen * frente + cos * lado;
    let dz = -cos * frente - sen * lado;
    const largo = Math.hypot(dx, dz);
    const vel = largo ? (t.correr ? JUGADOR.velCorrer : JUGADOR.velCaminar) / largo : 0;
    this.velX = suavizar(this.velX, dx * vel, 10, dt);
    this.velZ = suavizar(this.velZ, dz * vel, 10, dt);
    p.x += this.velX * dt;
    p.z += this.velZ * dt;

    // Choques con árboles y rocas: empuja al personaje hacia fuera del obstáculo
    for (const o of this.obstaculos) {
      const ox = p.x - o.x, oz = p.z - o.z, min = o.r + JUGADOR.radio;
      const d2 = ox * ox + oz * oz;
      if (d2 < min * min && d2 > 1e-6) {
        const d = Math.sqrt(d2);
        p.x = o.x + (ox / d) * min;
        p.z = o.z + (oz / d) * min;
      }
    }
    // Límite del mundo
    const r = Math.hypot(p.x, p.z);
    if (r > MUNDO.radioJugable) {
      p.x *= MUNDO.radioJugable / r;
      p.z *= MUNDO.radioJugable / r;
    }

    // Suelo y salto
    const suelo = this.terreno.altura(p.x, p.z);
    if (this.enSuelo) {
      p.y = suelo;
      if (t.saltar) { this.velY = JUGADOR.salto; this.enSuelo = false; }
    } else {
      this.velY -= JUGADOR.gravedad * dt;
      p.y += this.velY * dt;
      if (p.y <= suelo) { p.y = suelo; this.velY = 0; this.enSuelo = true; }
    }

    // Girar hacia donde camina (por el lado más corto)
    this.rapidez = Math.hypot(this.velX, this.velZ);
    if (this.rapidez > 0.3) {
      const objetivo = Math.atan2(this.velX, this.velZ);
      const dif = Math.atan2(Math.sin(objetivo - this.angulo), Math.cos(objetivo - this.angulo));
      this.angulo += dif * (1 - Math.exp(-12 * dt));
    }
    this.personaje.grupo.rotation.y = this.angulo;
    this.personaje.animar(dt, { rapidez: this.rapidez, enSuelo: this.enSuelo });
  }
}
