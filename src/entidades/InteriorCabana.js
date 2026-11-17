import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { INTERIOR } from '../config/mundo.js';
import { crearTexturaLetrero } from './Cabanas.js';

// El cuarto de dentro de las cabañas: mesa con el libro, chimenea, estante…
// Hay uno solo para todas: está escondido muy por debajo del suelo del mundo y, al entrar
// a una cabaña, se "viste" con su tema (cartel de la pared, color del libro y de la puerta).
// Medidas respecto al centro del cuarto: x hacia los lados, z+ hacia la puerta de salida.
export class InteriorCabana {
  constructor() {
    const { y, ancho, fondo, alto, margen } = INTERIOR;
    this.grupo = new THREE.Group();
    this.grupo.position.y = y;
    this.grupo.visible = false;

    this.suelo = { altura: () => y };                                  // piso plano (hace de "terreno" para el control)
    this.zona = { minX: -ancho / 2 + margen, maxX: ancho / 2 - margen, minZ: -fondo / 2 + margen, maxZ: fondo / 2 - margen };
    this.cajaCamara = {                                                // la cámara no sale del cuarto
      minX: -ancho / 2 + 0.4, maxX: ancho / 2 - 0.4, minZ: -fondo / 2 + 0.4, maxZ: fondo / 2 - 0.4,
      minY: y + 0.3, maxY: y + alto - 0.35,
    };
    this.obstaculos = [
      { x: -0.45, z: 0, r: 0.55 }, { x: 0.45, z: 0, r: 0.55 },         // mesa
      { x: 1.3, z: 0, r: 0.3 }, { x: -1.3, z: 0, r: 0.3 },             // sillas
      { x: -3.75, z: 0, r: 1.1 },                                      // chimenea
    ];

    this.libro = null;
    this.pinturas = [];                                                // materiales que toman el color de la cabaña
    this.cartel = null;
    this.carteles = new Map();                                         // textura del cartel de cada cabaña

    const luz = new THREE.PointLight(0xffdcaa, 28, 18, 1.6);           // la lámpara sobre la mesa
    luz.position.set(0, 2.2, 0);
    const fuego = new THREE.PointLight(0xff8a3a, 9, 9, 1.6);           // el resplandor de la chimenea
    fuego.position.set(-2.9, 0.5, 0);
    this.fuego = fuego;
    this.grupo.add(luz, fuego);

    this.pista = new THREE.Sprite(new THREE.SpriteMaterial({ map: texturaPista(), transparent: true, depthTest: false }));
    this.pista.scale.set(0.9, 0.45, 1);
    this.grupo.add(this.pista);
    this.tiempo = 0;
  }

  cargar(url) {
    return new Promise((resolver, rechazar) => {
      new GLTFLoader().load(url, (gltf) => {
        gltf.scene.traverse((o) => {
          if (!o.isMesh) return;
          if (['puerta', 'libro_tapa'].includes(o.material.name) && !this.pinturas.includes(o.material)) this.pinturas.push(o.material);
        });
        this.libro = gltf.scene.getObjectByName('Libro') ?? null;
        const punto = gltf.scene.getObjectByName('Punto_Cartel');
        if (punto) {
          this.cartel = new THREE.Mesh(new THREE.PlaneGeometry(3.86, 0.72), new THREE.MeshStandardMaterial({ roughness: 0.85 }));
          this.cartel.position.copy(punto.position);
          gltf.scene.add(this.cartel);
        }
        this.grupo.add(gltf.scene);
        if (this.sitio) this.preparar(this.sitio);
        resolver(this);
      }, undefined, rechazar);
    });
  }

  // Viste el cuarto con el tema de la cabaña a la que se entra
  preparar(sitio) {
    this.sitio = sitio;
    this.pinturas.forEach((m) => m.color.set(sitio.datos.color));
    if (this.cartel) {
      if (!this.carteles.has(sitio)) this.carteles.set(sitio, crearTexturaLetrero(sitio));
      this.cartel.material.map = this.carteles.get(sitio);
      this.cartel.material.needsUpdate = true;
    }
  }

  actualizar(dt) {
    this.tiempo += dt;
    this.pista.position.set(0, 1.25 + Math.sin(this.tiempo * 2.6) * 0.07, 0);
    this.fuego.intensity = 9 + Math.sin(this.tiempo * 9) * 1.2 + Math.sin(this.tiempo * 23) * 0.8;   // el fuego titila
  }
}

// Letrerito que flota sobre el libro
function texturaPista() {
  const lienzo = document.createElement('canvas');
  lienzo.width = 256; lienzo.height = 128;
  const c = lienzo.getContext('2d');
  const textura = new THREE.CanvasTexture(lienzo);
  textura.colorSpace = THREE.SRGBColorSpace;
  const pintar = () => {
    c.clearRect(0, 0, 256, 128);
    c.fillStyle = '#ffd23f'; c.strokeStyle = '#1d1442'; c.lineWidth = 8; c.lineJoin = 'round';
    c.beginPath(); c.roundRect(10, 8, 236, 78, 26); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(104, 88); c.lineTo(128, 120); c.lineTo(152, 88); c.closePath(); c.fill(); c.stroke();
    c.fillRect(100, 78, 56, 12);
    c.fillStyle = '#1d1442'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = '46px "Lilita One", "Arial Black", sans-serif';
    c.fillText('CLIC', 128, 50);
    textura.needsUpdate = true;
  };
  pintar();
  document.fonts?.load('40px "Lilita One"').then(pintar).catch(() => {});
  return textura;
}
