import * as THREE from 'three';
import { CABANA, INSTRUCCIONES, INTERIOR } from '../../config/mundo.js';

// Lo que pasa al llegar a un lugar a pie:
//  - Tablero de instrucciones: se abre al acercarse, con Enter o haciéndole clic.
//  - Cabañas: frente a la puerta, Enter pide el nombre del estudiante y el personaje entra.
//  - Dentro de la cabaña: clic en el libro de la mesa (o Enter junto a ella) para exponer la
//    reflexión del tema; Enter junto a la puerta para salir.
export class InteraccionLugares {
  constructor({ personaje, cabanas, tablero, interior, controlFuera, controlDentro, teclado, camara, lienzo, ui, alAviso, alCambiarLugar }) {
    Object.assign(this, { personaje, cabanas, tablero, interior, controlFuera, controlDentro, teclado, camara, ui, alAviso, alCambiarLugar });
    this.aviso = null;
    this.dentro = null;                     // la cabaña en la que está el personaje (o null si está fuera)
    this.estudiante = '';
    this.juntoAlTablero = false;
    this.clic = null;                       // último clic sobre el mundo (sin arrastrar), pendiente de revisar
    this.rayo = new THREE.Raycaster();

    let abajo = null;
    lienzo.addEventListener('pointerdown', (e) => { abajo = { x: e.clientX, y: e.clientY }; });
    lienzo.addEventListener('pointerup', (e) => {
      if (abajo && Math.hypot(e.clientX - abajo.x, e.clientY - abajo.y) < 6) {
        const caja = lienzo.getBoundingClientRect();
        this.clic = new THREE.Vector2(((e.clientX - caja.left) / caja.width) * 2 - 1,
          -((e.clientY - caja.top) / caja.height) * 2 + 1);
      }
      abajo = null;
    });
  }

  actualizar(conduciendo) {
    const clic = this.clic;
    this.clic = null;
    if (this.ui.abierto) return;
    const tocado = (objeto) => {
      if (!clic || !objeto) return false;
      this.rayo.setFromCamera(clic, this.camara);
      return this.rayo.intersectObject(objeto, true).length > 0;
    };
    const p = this.personaje.grupo.position;
    const enter = this.teclado.recienPulsada('Enter');

    // ---------- Dentro de una cabaña ----------
    if (this.dentro) {
      if (tocado(this.interior.libro) || tocado(this.interior.pista)) { this.#exponer(); return; }
      if (Math.hypot(p.x, p.z) < INTERIOR.distanciaLibro) {
        this.#avisar('Haz clic en el <b>libro</b> (o pulsa <kbd>Enter</kbd>) para exponer');
        if (enter) this.#exponer();
      } else if (Math.hypot(p.x, p.z - INTERIOR.fondo / 2) < INTERIOR.distanciaSalir) {
        this.#avisar('Pulsa <kbd>Enter</kbd> para salir de la cabaña');
        if (enter) this.#salir();
      } else this.#avisar('Ve a la mesa y haz clic en el <b>libro</b>');
      return;
    }

    // ---------- Fuera ----------
    if (tocado(this.tablero.grupo)) { this.#instrucciones(); return; }
    if (conduciendo) { this.#avisar(null); this.juntoAlTablero = false; return; }

    const t = this.tablero.posicion;
    const junto = Math.hypot(p.x - t.x, p.z - t.z) < INSTRUCCIONES.distanciaAbrir;
    const acabaDeLlegar = junto && !this.juntoAlTablero;
    this.juntoAlTablero = junto;
    if (junto) {
      this.#avisar('Pulsa <kbd>Enter</kbd> para ver las instrucciones');
      if (acabaDeLlegar || enter) this.#instrucciones();
      return;
    }

    const sitio = this.cabanas.sitios.find((s) => Math.hypot(p.x - s.entrada.x, p.z - s.entrada.z) < CABANA.distanciaEntrar);
    this.#avisar(sitio ? `Pulsa <kbd>Enter</kbd> para entrar a la cabaña «${sitio.datos.titulo}»` : null);
    if (sitio && enter) this.#entrar(sitio);
  }

  #instrucciones() {
    this.#avisar(null);
    this.ui.mostrarInstrucciones();
  }

  // Pide el nombre; si lo dan, se abre la puerta y el personaje pasa al cuarto de dentro
  async #entrar(sitio) {
    this.#avisar(null);
    const nombre = await this.ui.pedirNombre(sitio.datos, sitio.numero);
    if (!nombre) return;
    this.estudiante = nombre;
    sitio.abierta = true;
    await this.ui.fundir(() => {
      this.dentro = sitio;
      this.interior.preparar(sitio);
      this.controlDentro.colocar(0, INTERIOR.fondo / 2 - INTERIOR.llegada, Math.PI);   // recién entrado, mirando a la mesa
      this.alCambiarLugar?.(sitio, Math.PI);
    });
  }

  // Vuelve afuera: queda frente a las escaleras, de espaldas a la cabaña
  async #salir() {
    this.#avisar(null);
    const sitio = this.dentro;
    await this.ui.fundir(() => {
      this.dentro = null;
      this.controlFuera.colocar(sitio.entrada.x, sitio.entrada.z, sitio.angulo);
      this.alCambiarLugar?.(null, sitio.angulo);
    });
    sitio.abierta = false;
  }

  #exponer() {
    this.#avisar(null);
    this.ui.mostrarCabana(this.dentro.datos, this.dentro.numero, this.estudiante);
  }

  #avisar(texto) {
    if (texto === this.aviso) return;
    this.aviso = texto;
    this.alAviso?.(texto);
  }
}
