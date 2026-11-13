import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MUNDO } from '../config/mundo.js';
import { crearAzar } from '../sistemas/azar.js';

// Lo que rodea al jugador: árboles, arbustos, rocas y flores.
// Cada tipo se dibuja de una sola vez (InstancedMesh) para que el juego vaya fluido.
export class Vegetacion {
  constructor(terreno, inicio) {
    this.grupo = new THREE.Group();
    this.obstaculos = [];                 // { x, z, r } contra lo que choca el jugador
    const azar = crearAzar(MUNDO.semilla + 2);
    const R = MUNDO.radioJugable;

    // Busca un sitio libre: lejos del camino, del punto de inicio y de otros objetos
    const ocupados = [];
    const buscarSitio = (rMin, rMax, margenCamino, separacion) => {
      for (let intento = 0; intento < 60; intento++) {
        const a = azar() * Math.PI * 2;
        const r = Math.sqrt(azar.entre(rMin * rMin, rMax * rMax));
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (rMin < R && terreno.distanciaAlCamino(x, z) < margenCamino) continue;
        if (Math.hypot(x - inicio.x, z - inicio.z) < margenCamino + 2) continue;
        if (separacion && ocupados.some((o) => Math.hypot(o.x - x, o.z - z) < separacion)) continue;
        if (separacion) ocupados.push({ x, z });
        return { x, z, y: terreno.altura(x, z) };
      }
      return null;
    };

    // ---------- Árboles ----------
    const tronco = new THREE.CylinderGeometry(0.16, 0.24, 2, 7).translate(0, 1, 0);
    const pino = mergeGeometries([
      new THREE.ConeGeometry(1.5, 2.0, 8).translate(0, 2.3, 0),
      new THREE.ConeGeometry(1.15, 1.8, 8).translate(0, 3.4, 0),
      new THREE.ConeGeometry(0.75, 1.5, 8).translate(0, 4.4, 0),
    ]);
    const copa = mergeGeometries([
      new THREE.IcosahedronGeometry(1.35, 1).translate(0, 3.0, 0),
      new THREE.IcosahedronGeometry(0.95, 1).translate(0.85, 2.5, 0.3),
      new THREE.IcosahedronGeometry(0.9, 1).translate(-0.7, 2.6, -0.5),
      new THREE.IcosahedronGeometry(0.8, 1).translate(0.1, 3.9, 0.2),
    ]);
    const arboles = [];
    for (let i = 0; i < MUNDO.arboles; i++) {
      const s = buscarSitio(0, R + 4, MUNDO.anchoCamino / 2 + 2.6, 4);
      if (!s) continue;
      arboles.push(s);
      this.obstaculos.push({ x: s.x, z: s.z, r: 0.3 });
    }
    for (let i = 0; i < MUNDO.arbolesBorde; i++) {
      const s = buscarSitio(R + 6, 122, 0, 3);
      if (s) arboles.push(s);
    }
    const hojas = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true });
    const madera = new THREE.MeshStandardMaterial({ color: 0x7a5232, roughness: 1 });
    const pinos = arboles.filter(() => azar() < 0.55);
    const redondos = arboles.filter((a) => !pinos.includes(a));
    for (const [lista, geo, colores] of [
      [pinos, pino, [0x2f7d3a, 0x2a6e3f, 0x3a8a3e]],
      [redondos, copa, [0x4fa83a, 0x67b83f, 0x3f9a45, 0x7cbf3f]],
    ]) {
      const escalas = lista.map(() => azar.entre(0.85, 1.5));
      this.#instanciar(tronco, madera, lista, (s, i) => [escalas[i], 0, -0.2], null, true);
      this.#instanciar(geo, hojas, lista, (s, i) => [escalas[i], azar() * 6.28, -0.2], () => azar.elegir(colores), true);
    }

    // ---------- Arbustos ----------
    const arbusto = mergeGeometries([
      new THREE.IcosahedronGeometry(0.55, 1).translate(0, 0.35, 0),
      new THREE.IcosahedronGeometry(0.4, 1).translate(0.45, 0.25, 0.1),
      new THREE.IcosahedronGeometry(0.38, 1).translate(-0.4, 0.22, -0.15),
    ]);
    const arbustos = [];
    for (let i = 0; i < MUNDO.arbustos; i++) {
      const s = buscarSitio(0, R + 8, MUNDO.anchoCamino / 2 + 0.9, 0);
      if (s) arbustos.push(s);
    }
    this.#instanciar(arbusto, hojas, arbustos, () => [azar.entre(0.7, 1.4), azar() * 6.28, -0.05],
      () => azar.elegir([0x3f8f3a, 0x4a9d3c, 0x357f3d]), true);

    // ---------- Rocas ----------
    const rocas = [];
    for (let i = 0; i < MUNDO.rocas; i++) {
      const s = buscarSitio(0, R + 8, MUNDO.anchoCamino / 2 + 1.2, 2.5);
      if (!s) continue;
      s.escala = azar.entre(0.35, 1.1);
      rocas.push(s);
      if (s.escala > 0.6) this.obstaculos.push({ x: s.x, z: s.z, r: s.escala * 0.7 });
    }
    this.#instanciar(new THREE.IcosahedronGeometry(0.8, 0).scale(1, 0.7, 0.85),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, flatShading: true }),
      rocas, (s) => [s.escala, azar() * 6.28, -0.1 * s.escala],
      () => azar.elegir([0x9a9c9f, 0x8b8d8a, 0xa8a59c]), true);

    // ---------- Flores ----------
    const flores = [];
    for (let i = 0; i < MUNDO.flores; i++) {
      const s = buscarSitio(0, R + 6, MUNDO.anchoCamino / 2 + 0.3, 0);
      if (s) flores.push(s);
    }
    this.#instanciar(new THREE.IcosahedronGeometry(0.075, 0).scale(1, 0.6, 1),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }),
      flores, () => [azar.entre(0.8, 1.5), 0, 0.11],
      () => azar.elegir([0xffffff, 0xffe14d, 0xff8fc7, 0xffb347, 0xc9a2ff]), false);
  }

  // Crea todas las copias de una pieza. datos(sitio, i) -> [escala, giro, subir]
  #instanciar(geometria, material, sitios, datos, color, sombra) {
    if (!sitios.length) return;
    const malla = new THREE.InstancedMesh(geometria, material, sitios.length);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), arriba = new THREE.Vector3(0, 1, 0);
    const c = new THREE.Color();
    sitios.forEach((s, i) => {
      const [escala, giro, subir] = datos(s, i);
      q.setFromAxisAngle(arriba, giro);
      m.compose(new THREE.Vector3(s.x, s.y + subir, s.z), q, new THREE.Vector3(escala, escala, escala));
      malla.setMatrixAt(i, m);
      if (color) malla.setColorAt(i, c.set(color()));
    });
    malla.castShadow = sombra;
    malla.receiveShadow = true;
    malla.frustumCulled = false;
    this.grupo.add(malla);
  }
}
