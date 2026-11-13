import * as THREE from 'three';
import { Terreno } from '../entidades/Terreno.js';
import { Cielo, COLOR_HORIZONTE } from '../entidades/Cielo.js';
import { Vegetacion } from '../entidades/Vegetacion.js';
import { Teclado } from '../sistemas/controles/Teclado.js';
import { ControlPersonaje } from '../sistemas/controles/ControlPersonaje.js';
import { ControlVehiculo } from '../sistemas/controles/ControlVehiculo.js';
import { InteraccionVehiculo } from '../sistemas/interaccion/InteraccionVehiculo.js';
import { VEHICULO } from '../config/mundo.js';
import { CamaraSeguimiento } from '../sistemas/camara/CamaraSeguimiento.js';

const DIRECCION_SOL = new THREE.Vector3(0.45, 0.8, 0.35).normalize();

// El mundo del juego: terreno con colinas y camino, cielo con nubes, vegetación,
// el personaje caminando con la cámara detrás y el carro para conducir.
export class EscenaMundo {
  constructor({ renderer, lienzo, personaje, vehiculo, entorno, alAviso }) {
    this.renderer = renderer;
    this.personaje = personaje;
    this.vehiculo = vehiculo;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(COLOR_HORIZONTE, 70, 330);     // lo lejano se aclara
    this.scene.environment = entorno ?? null;
    this.scene.environmentIntensity = 0.35;

    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 1000);

    this.terreno = new Terreno();
    const inicio = this.terreno.puntoCamino(0);
    this.cielo = new Cielo(DIRECCION_SOL);
    this.vegetacion = new Vegetacion(this.terreno, inicio);
    this.scene.add(this.terreno.malla, this.cielo.grupo, this.vegetacion.grupo);
    this.#crearLuces();

    // El personaje llega del menú: se limpia su postura y se pone en el camino
    personaje.grupo.position.set(0, 0, 0);
    personaje.grupo.scale.set(1, 1, 1);
    personaje.grupo.visible = true;
    this.scene.add(personaje.grupo);
    vehiculo.grupo.visible = true;
    this.scene.add(vehiculo.grupo);

    this.teclado = new Teclado();
    this.control = new ControlPersonaje({
      personaje, terreno: this.terreno, obstaculos: this.vegetacion.obstaculos, teclado: this.teclado,
    });
    this.control.colocar(inicio.x, inicio.z, inicio.angulo);

    // El carro espera estacionado a la derecha del personaje, mirando hacia el mismo lado
    this.controlVehiculo = new ControlVehiculo({
      vehiculo, terreno: this.terreno, obstaculos: this.vegetacion.obstaculos,
    });
    this.controlVehiculo.colocar(
      inicio.x - Math.cos(inicio.angulo) * VEHICULO.ladoInicio,
      inicio.z + Math.sin(inicio.angulo) * VEHICULO.ladoInicio, inicio.angulo);
    this.interaccion = new InteraccionVehiculo({
      personaje, vehiculo, controlPersonaje: this.control, controlVehiculo: this.controlVehiculo,
      teclado: this.teclado, obstaculos: this.vegetacion.obstaculos, alAviso,
    });
    this.camara = new CamaraSeguimiento(this.camera, lienzo, this.terreno);
    this.camara.ponerDetras(inicio.angulo);

    this.reloj = new THREE.Clock();
    window.addEventListener('resize', () => this.ajustarTamano());
    this.ajustarTamano();
    this.renderer.setAnimationLoop(() => this.#actualizar());
  }

  ajustarTamano() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  #crearLuces() {
    this.scene.add(new THREE.HemisphereLight(0xd6ecff, 0x5f8f45, 1.1));   // luz del cielo y rebote del pasto

    this.sol = new THREE.DirectionalLight(0xfff1d6, 2.4);
    this.sol.castShadow = true;
    this.sol.shadow.mapSize.set(2048, 2048);
    const s = this.sol.shadow.camera;
    s.left = s.bottom = -28; s.right = s.top = 28; s.near = 1; s.far = 160;
    this.sol.shadow.bias = -0.0004;
    this.sol.shadow.normalBias = 0.04;
    this.scene.add(this.sol, this.sol.target);
  }

  #actualizar() {
    this.paso(Math.min(this.reloj.getDelta(), 0.05));
  }

  // Avanza el mundo "dt" segundos y lo dibuja
  paso(dt) {
    this.interaccion.actualizar();
    const conduciendo = this.interaccion.conduciendo;
    const cv = this.controlVehiculo;
    cv.actualizar(dt, conduciendo ? this.teclado : null);
    if (conduciendo) this.personaje.animar(dt, { sentado: true, volante: cv.direccion });
    else this.control.actualizar(dt, this.camara.angulo);
    this.teclado.finFotograma();

    // La cámara sigue a quien se esté moviendo: el carro o el personaje a pie
    const p = conduciendo ? this.vehiculo.grupo.position : this.personaje.grupo.position;
    this.camara.actualizar(dt, p, conduciendo
      ? { detras: Math.abs(cv.vel) > 0.5 ? cv.rumbo : null, alejar: VEHICULO.camaraLejos }
      : {});
    this.cielo.actualizar(dt, this.camera.position);

    // El sol (y su zona de sombras) acompaña al jugador
    this.sol.target.position.copy(p);
    this.sol.position.copy(p).addScaledVector(DIRECCION_SOL, 70);

    this.renderer.render(this.scene, this.camera);
  }
}
