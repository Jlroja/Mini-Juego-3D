import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PARTES_CARRO } from '../config/colores.js';
import { VEHICULO } from '../config/mundo.js';

const RUEDAS = ['Rueda_FL', 'Rueda_FR', 'Rueda_RL', 'Rueda_RR'];   // F = delantera, R = trasera · L = izquierda, R = derecha
const EJE_VOLANTE = new THREE.Vector3(0, 1, 0);
const giro = new THREE.Quaternion();

// El carrito descapotable: carga el modelo, permite cambiarle el color
// y mueve sus ruedas y su volante. (Conducirlo es trabajo de ControlVehiculo.)
export class Vehiculo {
  constructor() {
    this.grupo = new THREE.Group();
    this.colores = {};
    this.materiales = Object.fromEntries(PARTES_CARRO.map((p) => [p, new Set()]));
    this.ruedas = [];
    this.volante = null;
    this.asiento = new THREE.Vector3(0, 0.36, -0.12);   // dónde va la cadera del conductor
    this.vuelta = 0;                                    // cuánto han rodado las ruedas
  }

  cargar(url) {
    return new Promise((resolver, rechazar) => {
      new GLTFLoader().load(url, (gltf) => {
        gltf.scene.traverse((o) => {
          if (!o.isMesh) return;
          const lista = Array.isArray(o.material) ? o.material : [o.material];
          const vidrio = lista.some((m) => m.name === 'vidrio');
          o.castShadow = !vidrio;
          o.receiveShadow = !vidrio;
          lista.forEach((m) => {
            this.materiales[m.name]?.add(m);
            if (m.name === 'vidrio') { m.transparent = true; m.opacity = 0.35; m.depthWrite = false; }
          });
        });
        this.ruedas = RUEDAS.map((nombre) => gltf.scene.getObjectByName(nombre)).filter(Boolean);
        this.ruedas.forEach((r) => { r.rotation.order = 'YXZ'; });
        const volante = gltf.scene.getObjectByName('Volante');
        if (volante) this.volante = { objeto: volante, q0: volante.quaternion.clone() };
        const punto = gltf.scene.getObjectByName('Punto_Asiento');
        if (punto) this.asiento.copy(punto.position);
        this.grupo.add(gltf.scene);
        Object.entries(this.colores).forEach(([parte, hex]) => this.aplicarColor(parte, hex));
        resolver(this);
      }, undefined, rechazar);
    });
  }

  aplicarColor(parte, hex) {
    this.colores[parte] = hex;
    this.materiales[parte]?.forEach((m) => m.color.set(hex));
  }

  aplicarColores(colores) {
    PARTES_CARRO.forEach((parte) => colores[parte] && this.aplicarColor(parte, colores[parte]));
  }

  // velocidad en m/s (negativa = marcha atrás) · direccion = ángulo de las ruedas delanteras (+ izquierda)
  animar(dt, velocidad, direccion) {
    this.vuelta += (velocidad * dt) / VEHICULO.radioRueda;
    this.ruedas.forEach((rueda, i) => rueda.rotation.set(this.vuelta, i < 2 ? direccion : 0, 0));
    if (this.volante) {
      this.volante.objeto.quaternion.copy(this.volante.q0)
        .multiply(giro.setFromAxisAngle(EJE_VOLANTE, direccion * 2.5));
    }
  }
}
