import { JUGADOR, VEHICULO } from '../../config/mundo.js';

// Subir al carro y bajar de él con la tecla E.
// Avisa (alAviso) cuando el personaje está lo bastante cerca para subir, o cuando puede bajar.
export class InteraccionVehiculo {
  constructor({ personaje, vehiculo, controlPersonaje, controlVehiculo, teclado, obstaculos, alAviso }) {
    Object.assign(this, { personaje, vehiculo, controlPersonaje, controlVehiculo, teclado, obstaculos, alAviso });
    this.conduciendo = false;
    this.aviso = null;
  }

  actualizar() {
    const tecla = this.teclado.recienPulsada('KeyE');
    if (this.conduciendo) {
      const lento = Math.abs(this.controlVehiculo.vel) < VEHICULO.velBajar;
      this.#avisar(lento ? 'Pulsa <kbd>E</kbd> para bajar del carro' : null);
      if (tecla && lento) this.bajar();
      return;
    }
    const p = this.personaje.grupo.position, c = this.vehiculo.grupo.position;
    const cerca = Math.hypot(p.x - c.x, p.z - c.z) < VEHICULO.distanciaSubir && this.controlPersonaje.enSuelo;
    this.#avisar(cerca ? 'Pulsa <kbd>E</kbd> para subir al carro' : null);
    if (cerca && tecla) this.subir();
  }

  // El personaje pasa a ser "pasajero" del carro: se mueve y se inclina con él
  subir() {
    const g = this.personaje.grupo, a = this.vehiculo.asiento;
    this.vehiculo.grupo.add(g);
    g.position.set(a.x, a.y - this.personaje.alturaCadera, a.z);
    g.rotation.set(0, 0, 0);
    this.conduciendo = true;
  }

  // Lo deja de pie a un lado del carro (el izquierdo, o el derecho si ese está ocupado)
  bajar() {
    const cv = this.controlVehiculo, c = this.vehiculo.grupo.position;
    const ix = Math.cos(cv.rumbo), iz = -Math.sin(cv.rumbo);
    const sitio = [1, -1].map((lado) => ({ x: c.x + ix * 1.2 * lado, z: c.z + iz * 1.2 * lado }))
      .find((s) => this.obstaculos.every((o) => Math.hypot(s.x - o.x, s.z - o.z) > o.r + JUGADOR.radio));
    if (!sitio) return;                                 // no hay espacio: sigue en el carro
    this.vehiculo.grupo.parent.add(this.personaje.grupo);
    this.controlPersonaje.colocar(sitio.x, sitio.z, cv.rumbo);
    cv.vel = 0;
    this.conduciendo = false;
  }

  #avisar(texto) {
    if (texto === this.aviso) return;
    this.aviso = texto;
    this.alAviso?.(texto);
  }
}
