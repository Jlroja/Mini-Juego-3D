import { MUNDO, VEHICULO } from '../../config/mundo.js';
import { limitar, mezclar, suavizar } from '../azar.js';

// Conduce el carro: W acelera, S frena y luego va marcha atrás, A y D giran.
// Lo apoya sobre el terreno (se inclina en las subidas), lo frena contra árboles y rocas
// y no lo deja salir del mundo.
export class ControlVehiculo {
  constructor({ vehiculo, terreno, obstaculos }) {
    Object.assign(this, { vehiculo, terreno, obstaculos });
    this.pos = vehiculo.grupo.position;
    this.rumbo = 0;          // hacia dónde apunta el carro
    this.vel = 0;            // m/s; negativa = marcha atrás
    this.direccion = 0;      // giro de las ruedas delanteras (+ izquierda)
    this.cabeceo = 0;        // inclinación adelante/atrás
    this.balanceo = 0;       // inclinación hacia los lados
    // El carro ocupa dos círculos (delante y detrás) para que el personaje a pie choque con él
    this.circulos = [{ x: 0, z: 0, r: 0.55 }, { x: 0, z: 0, r: 0.55 }];
    obstaculos.push(...this.circulos);
  }

  colocar(x, z, rumbo) {
    this.pos.set(x, 0, z);
    this.rumbo = rumbo;
    this.vel = 0;
    this.#apoyar(1);
    this.#moverCirculos();
  }

  // teclado = null cuando nadie conduce (el carro solo se va frenando)
  actualizar(dt, teclado) {
    const V = VEHICULO;
    const pedal = teclado ? (teclado.adelante ? 1 : 0) - (teclado.atras ? 1 : 0) : 0;
    const timon = teclado ? (teclado.izquierda ? 1 : 0) - (teclado.derecha ? 1 : 0) : 0;

    if (pedal > 0) this.vel += (this.vel < 0 ? V.frenado : V.aceleracion) * dt;
    else if (pedal < 0) this.vel -= (this.vel > 0 ? V.frenado : V.aceleracionReversa) * dt;
    else this.vel -= Math.sign(this.vel) * Math.min(Math.abs(this.vel), V.rozamiento * dt);
    this.vel = limitar(this.vel, -V.velReversa, V.velMax);

    // A más velocidad, menos giran las ruedas (para que no dé trompos)
    const giroMax = mezclar(V.giroMax, V.giroMaxRapido, Math.abs(this.vel) / V.velMax);
    this.direccion = suavizar(this.direccion, timon * giroMax, 8, dt);
    this.rumbo += (this.vel / V.distEjes) * Math.tan(this.direccion) * dt;
    this.pos.x += Math.sin(this.rumbo) * this.vel * dt;
    this.pos.z += Math.cos(this.rumbo) * this.vel * dt;

    this.#chocar();
    this.#apoyar(1 - Math.exp(-10 * dt));
    this.#moverCirculos();
    this.vehiculo.animar(dt, this.vel, this.direccion);
  }

  #chocar() {
    const p = this.pos, sen = Math.sin(this.rumbo), cos = Math.cos(this.rumbo);
    let choque = false;
    for (const lado of [1, -1]) {                       // círculo delantero y trasero
      for (const o of this.obstaculos) {
        if (this.circulos.includes(o)) continue;
        const cx = p.x + sen * 0.55 * lado, cz = p.z + cos * 0.55 * lado;
        const dx = cx - o.x, dz = cz - o.z, min = o.r + 0.5;
        const d2 = dx * dx + dz * dz;
        if (d2 < min * min && d2 > 1e-6) {
          const d = Math.sqrt(d2);
          p.x += (dx / d) * (min - d);
          p.z += (dz / d) * (min - d);
          choque = true;
        }
      }
    }
    const limite = MUNDO.radioJugable - 1, r = Math.hypot(p.x, p.z);
    if (r > limite) { p.x *= limite / r; p.z *= limite / r; choque = true; }
    if (choque) this.vel *= 0.85;
  }

  // Mide la altura del suelo bajo cada rueda para subir, bajar e inclinar el carro
  #apoyar(k) {
    const p = this.pos, V = VEHICULO, mitad = V.distEjes / 2;
    const fx = Math.sin(this.rumbo), fz = Math.cos(this.rumbo);      // hacia delante
    const ix = Math.cos(this.rumbo), iz = -Math.sin(this.rumbo);     // hacia la izquierda
    const h = (a, b) => this.terreno.altura(p.x + fx * a + ix * b, p.z + fz * a + iz * b);
    const dI = h(mitad, V.ejeX), dD = h(mitad, -V.ejeX), tI = h(-mitad, V.ejeX), tD = h(-mitad, -V.ejeX);
    p.y = (dI + dD + tI + tD) / 4;
    const cabeceo = -Math.atan2((dI + dD - tI - tD) / 2, V.distEjes);
    const balanceo = Math.atan2((dI + tI - dD - tD) / 2, V.ejeX * 2);
    this.cabeceo += (cabeceo - this.cabeceo) * k;
    this.balanceo += (balanceo - this.balanceo) * k;
    this.vehiculo.grupo.rotation.set(this.cabeceo, this.rumbo, this.balanceo, 'YXZ');
  }

  #moverCirculos() {
    const sen = Math.sin(this.rumbo), cos = Math.cos(this.rumbo);
    this.circulos.forEach((c, i) => {
      const lado = i ? -1 : 1;
      c.x = this.pos.x + sen * 0.55 * lado;
      c.z = this.pos.z + cos * 0.55 * lado;
    });
  }
}
