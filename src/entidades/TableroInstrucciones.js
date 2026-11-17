import * as THREE from 'three';
import { INSTRUCCIONES } from '../config/mundo.js';

// El tablero de madera que está junto al punto de inicio. Al acercarse o hacerle clic
// se abren las instrucciones del juego. Encima flota un signo "?" para que se note.
export class TableroInstrucciones {
  constructor(terreno, inicio) {
    // A la izquierda del personaje (el carro está a la derecha) y un poco adelante
    const sen = Math.sin(inicio.angulo), cos = Math.cos(inicio.angulo);
    const x = inicio.x + cos * INSTRUCCIONES.lado + sen * INSTRUCCIONES.adelante;
    const z = inicio.z - sen * INSTRUCCIONES.lado + cos * INSTRUCCIONES.adelante;
    this.posicion = { x, z };
    this.obstaculo = { x, z, r: 0.55 };
    this.zonaLibre = { x, z, r: 1.6 };

    this.grupo = new THREE.Group();
    this.grupo.position.set(x, terreno.altura(x, z), z);
    this.grupo.rotation.y = Math.atan2(inicio.x - x, inicio.z - z);     // mira hacia donde aparece el jugador

    const madera = new THREE.MeshStandardMaterial({ color: 0x7a5232, roughness: 0.9 });
    const oscura = new THREE.MeshStandardMaterial({ color: 0x553521, roughness: 0.9 });
    const teja = new THREE.MeshStandardMaterial({ color: 0xa23f30, roughness: 0.8 });
    const pieza = (geometria, material, px, py, pz, giroX = 0) => {
      const m = new THREE.Mesh(geometria, material);
      m.position.set(px, py, pz);
      m.rotation.x = giroX;
      m.castShadow = m.receiveShadow = true;
      this.grupo.add(m);
      return m;
    };
    const poste = new THREE.CylinderGeometry(0.07, 0.085, 2.3, 8);
    pieza(poste, madera, -0.82, 0.95, 0);
    pieza(poste, madera, 0.82, 0.95, 0);
    pieza(new THREE.BoxGeometry(1.86, 1.12, 0.08), oscura, 0, 1.3, 0);
    const tejado = new THREE.BoxGeometry(2.1, 0.06, 0.42);
    pieza(tejado, teja, 0, 2.08, 0.17, 0.5);
    pieza(tejado, teja, 0, 2.08, -0.17, -0.5);
    const cartel = pieza(new THREE.PlaneGeometry(1.7, 0.96),
      new THREE.MeshStandardMaterial({ map: texturaCartel(), roughness: 0.85 }), 0, 1.3, 0.045);
    cartel.castShadow = false;

    this.signo = new THREE.Sprite(new THREE.SpriteMaterial({ map: texturaSigno(), transparent: true, depthWrite: false }));
    this.signo.scale.set(0.75, 0.75, 1);
    this.grupo.add(this.signo);
    this.tiempo = 0;
    this.actualizar(0);
  }

  actualizar(dt) {
    this.tiempo += dt;
    this.signo.position.y = 2.95 + Math.sin(this.tiempo * 2.4) * 0.12;
  }
}

function lienzoNuevo(ancho, alto) {
  const lienzo = document.createElement('canvas');
  lienzo.width = ancho; lienzo.height = alto;
  return [lienzo, lienzo.getContext('2d')];
}

function comoTextura(lienzo, pintar) {
  const textura = new THREE.CanvasTexture(lienzo);
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.anisotropy = 8;
  pintar();
  document.fonts?.load('40px "Lilita One"').then(() => { pintar(); textura.needsUpdate = true; }).catch(() => {});
  return textura;
}

function texturaCartel() {
  const [lienzo, c] = lienzoNuevo(680, 384);
  return comoTextura(lienzo, () => {
    c.fillStyle = '#f7e9c6';
    c.fillRect(0, 0, 680, 384);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = '#7b5cff';
    c.font = '84px "Lilita One", "Arial Black", sans-serif';
    c.fillText('INSTRUCCIONES', 340, 92, 620);
    c.fillStyle = '#3b2414';
    c.font = '46px "Lilita One", "Arial Black", sans-serif';
    c.fillText('¿Qué hay que hacer?', 340, 200);
    c.fillStyle = '#8a5a35';
    c.font = '38px "Lilita One", "Arial Black", sans-serif';
    c.fillText('Acércate o haz clic aquí', 340, 300);
  });
}

function texturaSigno() {
  const [lienzo, c] = lienzoNuevo(128, 128);
  return comoTextura(lienzo, () => {
    c.clearRect(0, 0, 128, 128);
    c.beginPath(); c.arc(64, 64, 56, 0, Math.PI * 2);
    c.fillStyle = '#ffd23f'; c.fill();
    c.lineWidth = 8; c.strokeStyle = '#1d1442'; c.stroke();
    c.fillStyle = '#1d1442'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = '84px "Lilita One", "Arial Black", sans-serif';
    c.fillText('?', 64, 70);
  });
}
