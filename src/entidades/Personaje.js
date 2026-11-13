import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PARTES } from '../config/colores.js';
import { JUGADOR } from '../config/mundo.js';
import { limitar, mezclar, suavizar } from '../sistemas/azar.js';

const HUESOS = ['Cadera', 'Torso', 'Cabeza', 'Brazo_L', 'Antebrazo_L', 'Brazo_R', 'Antebrazo_R',
  'Muslo_L', 'Pierna_L', 'Muslo_R', 'Pierna_R'];
const EJE_X = new THREE.Vector3(1, 0, 0), EJE_Y = new THREE.Vector3(0, 1, 0), EJE_Z = new THREE.Vector3(0, 0, 1);
const giro = new THREE.Quaternion();

// Personaje principal: carga el modelo, permite recolorear sus partes y lo anima
// (quieto, caminar, correr, saltar y sentado al volante) moviendo los huesos de su esqueleto.
export class Personaje {
  constructor() {
    this.grupo = new THREE.Group();
    this.colores = {};
    this.materiales = Object.fromEntries(PARTES.map((p) => [p, new Set()]));
    this.huesos = {};
    this.anim = { fase: 0, tiempo: 0, mov: 0, correr: 0, aire: 0, sentado: 0 };
  }

  cargar(url) {
    return new Promise((resolver, rechazar) => {
      new GLTFLoader().load(url, (gltf) => {
        gltf.scene.traverse((o) => {
          if (!o.isMesh) return;
          o.castShadow = true;
          o.receiveShadow = true;
          o.frustumCulled = false;
          const lista = Array.isArray(o.material) ? o.material : [o.material];
          lista.forEach((m) => this.materiales[m.name]?.add(m));
        });
        this.#prepararEsqueleto(gltf.scene);
        this.grupo.add(gltf.scene);
        Object.entries(this.colores).forEach(([parte, hex]) => this.aplicarColor(parte, hex));
        resolver(this);
      }, undefined, rechazar);
    });
  }

  // Altura de la cadera sobre los pies (sirve para sentarlo en el carro)
  get alturaCadera() { return this.huesos.Cadera?.y0 ?? 0.47; }

  aplicarColor(parte, hex) {
    this.colores[parte] = hex;
    this.materiales[parte]?.forEach((m) => m.color.set(hex));
  }

  aplicarColores(colores) {
    Object.entries(colores).forEach(([parte, hex]) => this.aplicarColor(parte, hex));
  }

  // Guarda la postura de reposo de cada hueso y hacia dónde quedan, vistos desde el hueso,
  // los tres ejes del personaje: X = su izquierda, Y = arriba, Z = al frente.
  #prepararEsqueleto(raiz) {
    raiz.updateMatrixWorld(true);
    const q = new THREE.Quaternion();
    for (const nombre of HUESOS) {
      const hueso = raiz.getObjectByName(nombre);
      if (!hueso) continue;
      const inv = hueso.getWorldQuaternion(q).clone().invert();
      this.huesos[nombre] = {
        hueso, q0: hueso.quaternion.clone(), y0: hueso.position.y,
        x: EJE_X.clone().applyQuaternion(inv), y: EJE_Y.clone().applyQuaternion(inv), z: EJE_Z.clone().applyQuaternion(inv),
      };
    }
  }

  // Gira un hueso desde su postura de reposo. Ángulos en radianes:
  // rx > 0 lleva la punta del hueso hacia atrás (en brazos y piernas), ry gira sobre sí mismo, rz lo abre de lado.
  #girar(nombre, rx = 0, ry = 0, rz = 0) {
    const h = this.huesos[nombre];
    if (!h) return;
    h.hueso.quaternion.copy(h.q0);
    if (ry) h.hueso.quaternion.multiply(giro.setFromAxisAngle(h.y, ry));
    if (rz) h.hueso.quaternion.multiply(giro.setFromAxisAngle(h.z, rz));
    if (rx) h.hueso.quaternion.multiply(giro.setFromAxisAngle(h.x, rx));
  }

  // Se llama en cada fotograma. rapidez = velocidad horizontal en m/s.
  // sentado = va conduciendo · volante = giro del volante (+ izquierda)
  animar(dt, { rapidez = 0, enSuelo = true, sentado = false, volante = 0 } = {}) {
    const a = this.anim;
    if (!this.huesos.Cadera) return;
    a.mov = suavizar(a.mov, limitar(rapidez / JUGADOR.velCaminar, 0, 1), 10, dt);          // 0 quieto · 1 andando
    a.correr = suavizar(a.correr, limitar((rapidez - JUGADOR.velCaminar) / (JUGADOR.velCorrer - JUGADOR.velCaminar), 0, 1), 8, dt);
    a.aire = suavizar(a.aire, enSuelo ? 0 : 1, 14, dt);
    a.sentado = suavizar(a.sentado, sentado ? 1 : 0, 12, dt);
    a.tiempo += dt;
    a.fase += dt * Math.PI * 2 * mezclar(1.7, 2.5, a.correr) * Math.min(1, a.mov * 3);       // pasos por segundo

    const entre = (caminar, correr) => mezclar(caminar, correr, a.correr);
    const paso = a.mov * (1 - a.aire);
    const quieto = 1 - a.mov;
    const sen = Math.sin(a.fase), cos = Math.cos(a.fase);

    const aMuslo = entre(0.5, 0.95) * paso;
    const aRodilla = entre(0.75, 1.5) * paso;
    const aBrazo = entre(0.45, 1.0) * paso;
    const aCodo = entre(0.2, 1.35) * a.mov;
    const inclinacion = entre(0.03, 0.2) * a.mov;
    const torsion = entre(0.06, 0.13) * paso;
    const bote = entre(0.012, 0.035) * paso;
    const respirar = Math.sin(a.tiempo * 2.2);
    const st = a.sentado, pie = 1 - st;            // st = 1 sentado · pie = 1 de pie

    // Cuerpo
    const cadera = this.huesos.Cadera;
    cadera.hueso.position.y = cadera.y0 + (bote * Math.cos(a.fase * 2) + respirar * 0.004 * quieto) * pie;
    this.#girar('Cadera', 0, -torsion * sen * pie);
    this.#girar('Torso', (inclinacion - a.aire * 0.08) * pie - 0.08 * st, torsion * 2 * sen * pie);
    this.#girar('Cabeza', -inclinacion * 0.6 * pie + 0.05 * st,
      (Math.sin(a.tiempo * 0.6) * 0.12 * quieto - torsion * sen) * pie + volante * 0.5 * st);

    // Piernas y brazos: el lado izquierdo y el derecho van al revés
    for (const [lado, s, c, sentido] of [['L', sen, cos, 1], ['R', -sen, -cos, -1]]) {
      const encoger = a.aire * (lado === 'L' ? 0.75 : 0.2);
      // De pie (caminar, correr, saltar) y, mezclado con st, sentado con las manos al volante
      this.#girar(`Muslo_${lado}`, (-aMuslo * s - encoger) * pie - 1.42 * st, 0, sentido * 0.06 * st);
      this.#girar(`Pierna_${lado}`, (aRodilla * Math.max(0, c) + 0.12 * a.correr * paso + a.aire * 0.9) * pie + 0.45 * st);
      this.#girar(`Brazo_${lado}`, aBrazo * s * pie + (-0.95 + sentido * volante * 0.6) * st,
        0, sentido * ((0.03 * respirar * quieto + a.aire * 0.9 + 0.12 * a.correr * a.mov) * pie - 0.2 * st));
      this.#girar(`Antebrazo_${lado}`, (-aCodo - 0.25 * paso * Math.max(0, -s) - a.aire * 0.3) * pie - 0.55 * st);
    }
  }
}
