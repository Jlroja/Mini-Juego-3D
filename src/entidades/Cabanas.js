import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CABANA } from '../config/mundo.js';
import { CABANAS } from '../datos/cabanas.js';
import { suavizar } from '../sistemas/azar.js';

// Círculos contra los que choca el jugador, medidos desde el centro de la cabaña
// (x = hacia su derecha, z = hacia su frente). Cubren la casa, el porche y las escaleras.
const CHOQUE = [];
for (const x of [-1.25, 0, 1.25]) for (const z of [-0.75, 0.65, 2.05]) CHOQUE.push({ x, z, r: 1.05 });
CHOQUE.push({ x: 0, z: 3.15, r: 0.62 });

// Las cabañas del mundo: una por tema (src/datos/cabanas.js), repartidas a lo largo del camino.
// Todas usan el mismo modelo (cabana.glb); cambian el letrero y el color de la puerta.
export class Cabanas {
  constructor(terreno) {
    this.grupo = new THREE.Group();

    // Dónde va cada una: junto al camino, mirando hacia él, alternando por fuera y por dentro del circuito
    this.sitios = CABANAS.map((datos, i) => {
      const p = terreno.puntoCamino((i + 0.5) / CABANAS.length);
      let lx = Math.cos(p.angulo), lz = -Math.sin(p.angulo);            // hacia un lado del camino
      const haciaFuera = Math.sign(lx * p.x + lz * p.z) || 1;
      const lado = (i % 2 ? -1 : 1) * haciaFuera;
      lx *= lado; lz *= lado;
      const x = p.x + lx * CABANA.distanciaCamino, z = p.z + lz * CABANA.distanciaCamino;
      const fx = -lx, fz = -lz;                                         // su frente
      return {
        datos, numero: i + 1, x, z, y: 0, fx, fz,
        angulo: Math.atan2(fx, fz),
        camino: { x: p.x, z: p.z },                                     // el punto del camino que tiene delante
        entrada: { x: x + fx * CABANA.entrada, z: z + fz * CABANA.entrada },
        centro: { x: x + fx * 1.2, z: z + fz * 1.2 },                   // centro de casa + porche + escaleras
        puerta: null, giroPuerta: 0, apertura: 0, abierta: false,
      };
    });

    terreno.aplanar(this.sitios.map((s) => ({ ...s.centro, r: CABANA.explanada, borde: CABANA.explanadaBorde })));
    for (const s of this.sitios) {
      s.y = terreno.altura(s.x, s.z);
      terreno.pintarSendero(s.x + s.fx * 3.4, s.z + s.fz * 3.4, s.camino.x, s.camino.z);
    }

    this.zonasLibres = this.sitios.map((s) => ({ ...s.centro, r: CABANA.zonaLibre }));
    this.obstaculos = this.sitios.flatMap((s) => CHOQUE.map((c) => ({
      x: s.x + s.fz * c.x + s.fx * c.z,
      z: s.z - s.fx * c.x + s.fz * c.z,
      r: c.r,
    })));
  }

  // Carga el modelo una vez y pone una copia en cada sitio
  cargar(url) {
    return new Promise((resolver, rechazar) => {
      new GLTFLoader().load(url, (gltf) => {
        gltf.scene.traverse((o) => {
          if (!o.isMesh) return;
          o.castShadow = o.material.name !== 'interior';
          o.receiveShadow = true;
        });
        for (const s of this.sitios) {
          const copia = gltf.scene.clone(true);
          copia.position.set(s.x, s.y, s.z);
          copia.rotation.y = s.angulo;

          // Puerta del color de la cabaña
          let pintura = null;
          copia.traverse((o) => {
            if (!o.isMesh || o.material.name !== 'puerta') return;
            pintura ??= o.material.clone();
            pintura.color.set(s.datos.color);
            o.material = pintura;
          });
          s.puerta = copia.getObjectByName('Puerta') ?? null;
          s.giroPuerta = s.puerta?.rotation.y ?? 0;

          // Letrero con el tema
          const punto = copia.getObjectByName('Punto_Letrero');
          if (punto) {
            const letrero = new THREE.Mesh(
              new THREE.PlaneGeometry(CABANA.letrero.ancho, CABANA.letrero.alto),
              new THREE.MeshStandardMaterial({ map: crearTexturaLetrero(s), roughness: 0.85 }));
            letrero.position.copy(punto.position);
            letrero.position.z += 0.012;
            copia.add(letrero);
          }
          this.grupo.add(copia);
        }
        resolver(this);
      }, undefined, rechazar);
    });
  }

  // Abre o cierra poco a poco la puerta de cada cabaña
  actualizar(dt) {
    for (const s of this.sitios) {
      s.apertura = suavizar(s.apertura, s.abierta ? 1 : 0, 5, dt);
      if (s.puerta) s.puerta.rotation.y = s.giroPuerta + s.apertura * CABANA.aperturaPuerta;
    }
  }
}

// Dibuja el letrero: número de la cabaña y su tema (en una o dos líneas, lo que quepa mejor)
export function crearTexturaLetrero(sitio) {
  const W = 1024, H = Math.round(W * CABANA.letrero.alto / CABANA.letrero.ancho);
  const lienzo = document.createElement('canvas');
  lienzo.width = W; lienzo.height = H;
  const c = lienzo.getContext('2d');
  const textura = new THREE.CanvasTexture(lienzo);
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.anisotropy = 8;

  const fuente = (px) => `${px}px "Lilita One", "Arial Black", sans-serif`;
  const pintar = () => {
    c.fillStyle = '#f7e9c6';
    c.fillRect(0, 0, W, H);
    c.fillStyle = sitio.datos.color;
    c.fillRect(0, H - 14, W, 14);

    const r = H * 0.33, cx = r + 26, cy = H / 2 - 5;                    // círculo con el número
    c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = fuente(r * 1.35);
    c.fillText(String(sitio.numero), cx, cy + 4);

    // Título: se prueba en una línea y partido en dos; gana el que permita la letra más grande
    const x0 = cx + r + 24, ancho = W - x0 - 24, palabras = sitio.datos.titulo.split(' ');
    const opciones = [[sitio.datos.titulo]];
    for (let i = 1; i < palabras.length; i++) opciones.push([palabras.slice(0, i).join(' '), palabras.slice(i).join(' ')]);
    let mejor = { px: 0, lineas: opciones[0] };
    for (const lineas of opciones) {
      c.font = fuente(100);
      const masAncha = Math.max(...lineas.map((l) => c.measureText(l).width));
      const px = Math.min(100 * ancho / masAncha, (H - 34) / (lineas.length * 1.12));
      if (px > mejor.px) mejor = { px, lineas };
    }
    c.fillStyle = '#3b2414';
    c.font = fuente(mejor.px);
    mejor.lineas.forEach((l, i) => {
      c.fillText(l, x0 + ancho / 2, cy + (i - (mejor.lineas.length - 1) / 2) * mejor.px * 1.08 + 3);
    });
    textura.needsUpdate = true;
  };
  pintar();
  document.fonts?.load(fuente(40)).then(pintar).catch(() => {});       // repinta cuando la letra del juego esté lista
  return textura;
}
