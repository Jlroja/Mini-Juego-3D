import * as THREE from 'three';
import { Terreno } from '../entidades/Terreno.js';
import { Cielo, COLOR_HORIZONTE } from '../entidades/Cielo.js';
import { Vegetacion } from '../entidades/Vegetacion.js';
import { Cabanas } from '../entidades/Cabanas.js';
import { TableroInstrucciones } from '../entidades/TableroInstrucciones.js';
import { InteriorCabana } from '../entidades/InteriorCabana.js';
import { Teclado } from '../sistemas/controles/Teclado.js';
import { ControlPersonaje } from '../sistemas/controles/ControlPersonaje.js';
import { ControlVehiculo } from '../sistemas/controles/ControlVehiculo.js';
import { InteraccionVehiculo } from '../sistemas/interaccion/InteraccionVehiculo.js';
import { InteraccionLugares } from '../sistemas/interaccion/InteraccionLugares.js';
import { Minimapa } from '../ui/Minimapa.js';
import { VEHICULO } from '../config/mundo.js';
import { RUTAS } from '../config/rutas.js';
import { CamaraSeguimiento } from '../sistemas/camara/CamaraSeguimiento.js';

const DIRECCION_SOL = new THREE.Vector3(0.45, 0.8, 0.35).normalize();

// El mundo del juego: terreno con colinas y camino, cielo con nubes, vegetación, las cabañas
// de cada tema, el tablero de instrucciones, el personaje con la cámara detrás y el carro.
export class EscenaMundo {
  constructor({ renderer, lienzo, personaje, vehiculo, entorno, alAviso, ui }) {
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
    // Las cabañas van primero: aplanan su pedazo de terreno y reservan sitio antes de sembrar los árboles
    this.cabanas = new Cabanas(this.terreno);
    this.cabanas.cargar(RUTAS.modelos.cabana).catch((err) => console.error(err));
    this.tablero = new TableroInstrucciones(this.terreno, inicio);
    this.vegetacion = new Vegetacion(this.terreno, inicio, [...this.cabanas.zonasLibres, this.tablero.zonaLibre]);
    this.vegetacion.obstaculos.push(...this.cabanas.obstaculos, this.tablero.obstaculo);
    this.interior = new InteriorCabana();           // el cuarto de dentro (escondido bajo el suelo)
    this.interior.cargar(RUTAS.modelos.interiorCabana).catch((err) => console.error(err));
    this.scene.add(this.terreno.malla, this.cielo.grupo, this.vegetacion.grupo, this.cabanas.grupo, this.tablero.grupo,
      this.interior.grupo);
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
    // Dentro de las cabañas manda otro control: piso plano, paredes y muebles
    this.controlInterior = new ControlPersonaje({
      personaje, terreno: this.interior.suelo, obstaculos: this.interior.obstaculos, teclado: this.teclado,
      zona: this.interior.zona,
    });

    // El carro espera estacionado a la derecha del personaje, mirando hacia el mismo lado
    this.controlVehiculo = new ControlVehiculo({
      vehiculo, terreno: this.terreno, obstaculos: this.vegetacion.obstaculos,
    });
    this.controlVehiculo.colocar(
      inicio.x - Math.cos(inicio.angulo) * VEHICULO.ladoInicio,
      inicio.z + Math.sin(inicio.angulo) * VEHICULO.ladoInicio, inicio.angulo);
    // Un solo aviso en pantalla: si hay un lugar cerca (cabaña o tablero) manda sobre el del carro
    const avisos = { lugar: null, carro: null };
    const avisar = (quien) => (texto) => {
      avisos[quien] = texto;
      alAviso?.(avisos.lugar ?? (this.lugares?.dentro ? null : avisos.carro));
    };
    this.interaccion = new InteraccionVehiculo({
      personaje, vehiculo, controlPersonaje: this.control, controlVehiculo: this.controlVehiculo,
      teclado: this.teclado, obstaculos: this.vegetacion.obstaculos, alAviso: avisar('carro'),
    });
    this.camara = new CamaraSeguimiento(this.camera, lienzo, this.terreno);
    this.camara.ponerDetras(inicio.angulo);

    // Instrucciones, cabañas y mapa
    this.ui = ui;
    ui.alCambiar = (abierto) => this.teclado.pausar(abierto);
    this.lugares = new InteraccionLugares({
      personaje, cabanas: this.cabanas, tablero: this.tablero, interior: this.interior,
      controlFuera: this.control, controlDentro: this.controlInterior, teclado: this.teclado,
      camara: this.camera, lienzo, ui, alAviso: avisar('lugar'),
      alCambiarLugar: (sitio, angulo) => this.#cambiarLugar(sitio, angulo),
    });
    this.minimapa = new Minimapa(document.getElementById('minimapa'), {
      terreno: this.terreno, cabanas: this.cabanas, tablero: this.tablero,
    });

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

  // Al entrar a una cabaña (sitio) o salir de ella (null): se enciende o apaga el cuarto de dentro
  #cambiarLugar(sitio, angulo) {
    const dentro = !!sitio;
    this.interior.grupo.visible = dentro;
    this.sol.castShadow = !dentro;                  // bajo tierra no deben caer las sombras de los árboles
    this.minimapa.contenedor.hidden = dentro;
    this.camara.ponerDetras(angulo);
    this.camara.saltar();
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
    const dentro = !!this.lugares.dentro;          // ¿está dentro de una cabaña?
    if (!dentro) this.interaccion.actualizar();
    const conduciendo = this.interaccion.conduciendo;
    this.lugares.actualizar(conduciendo);
    if (this.teclado.recienPulsada('KeyM')) this.minimapa.alternar();
    const cv = this.controlVehiculo;
    cv.actualizar(dt, conduciendo ? this.teclado : null);
    if (conduciendo) this.personaje.animar(dt, { sentado: true, volante: cv.direccion });
    else (dentro ? this.controlInterior : this.control).actualizar(dt, this.camara.angulo);
    this.teclado.finFotograma();

    // La cámara sigue a quien se esté moviendo: el carro o el personaje a pie
    const p = conduciendo ? this.vehiculo.grupo.position : this.personaje.grupo.position;
    this.camara.actualizar(dt, p, conduciendo
      ? { detras: Math.abs(cv.vel) > 0.5 ? cv.rumbo : null, alejar: VEHICULO.camaraLejos }
      : dentro ? { caja: this.interior.cajaCamara } : {});
    this.cielo.actualizar(dt, this.camera.position);
    this.cabanas.actualizar(dt);
    this.tablero.actualizar(dt);
    if (dentro) this.interior.actualizar(dt);
    else this.minimapa.actualizar({ x: p.x, z: p.z, angulo: conduciendo ? cv.rumbo : this.control.angulo },
      conduciendo ? null : this.vehiculo.grupo.position);

    // El sol (y su zona de sombras) acompaña al jugador
    this.sol.target.position.copy(p);
    this.sol.position.copy(p).addScaledVector(DIRECCION_SOL, 70);

    this.renderer.render(this.scene, this.camera);
  }
}
