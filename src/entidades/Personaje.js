import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PARTES } from '../config/colores.js';

// Personaje principal: carga el modelo y permite recolorear sus partes.
export class Personaje {
  constructor() {
    this.grupo = new THREE.Group();
    this.colores = {};
    this.materiales = Object.fromEntries(PARTES.map((p) => [p, new Set()]));
  }

  cargar(url) {
    return new Promise((resolver, rechazar) => {
      new GLTFLoader().load(url, (gltf) => {
        gltf.scene.traverse((o) => {
          if (!o.isMesh) return;
          o.castShadow = true;
          o.receiveShadow = true;
          const lista = Array.isArray(o.material) ? o.material : [o.material];
          lista.forEach((m) => this.materiales[m.name]?.add(m));
        });
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
    Object.entries(colores).forEach(([parte, hex]) => this.aplicarColor(parte, hex));
  }
}
