import * as THREE from 'three';
import { MUNDO } from '../config/mundo.js';
import { crearAzar, escalon, mezclar } from '../sistemas/azar.js';

const explanadas = [];                          // zonas aplanadas: { x, z, r, borde, y }

// Altura del suelo en cualquier punto del mundo. La usan el terreno (para dibujarse),
// el personaje (para pisar), la cámara y la vegetación: todos comparten la misma fórmula.
export function alturaTerreno(x, z) {
  let h = alturaNatural(x, z);
  for (const e of explanadas) {                 // bajo las cabañas el suelo es plano
    const d = Math.hypot(x - e.x, z - e.z);
    if (d < e.borde) h = mezclar(e.y, h, escalon(d, e.r, e.borde));
  }
  return h;
}

function alturaNatural(x, z) {
  // Colinas suaves
  let h = 1.5 * Math.sin(x * 0.062 + 1.3) * Math.cos(z * 0.055 - 0.4)
        + 0.9 * Math.sin(x * 0.027 - z * 0.036 + 2.1)
        + 0.5 * Math.sin((x + z) * 0.11) * Math.cos((x - z) * 0.085 + 1.0);
  // Montañas que rodean el mundo
  const r = Math.hypot(x, z);
  const borde = escalon(r, MUNDO.radioJugable + 3, 105);
  if (borde > 0) {
    const ang = Math.atan2(z, x);
    h += borde * (13 + 4.5 * Math.sin(ang * 3 + 1) + 2.5 * Math.sin(ang * 7 + 0.5) + 1.5 * Math.sin(ang * 13));
  }
  return h;
}

// Suelo del mundo: pasto con colinas y un camino de tierra en circuito.
export class Terreno {
  constructor() {
    explanadas.length = 0;
    const n = MUNDO.radiosCamino.length;
    this.camino = new THREE.CatmullRomCurve3(
      MUNDO.radiosCamino.map((radio, i) => {
        const a = (i / n) * Math.PI * 2;
        return new THREE.Vector3(Math.cos(a) * radio, 0, Math.sin(a) * radio);
      }), true, 'catmullrom', 0.5);
    this.puntosCamino = this.camino.getSpacedPoints(500);

    const geo = new THREE.PlaneGeometry(MUNDO.tamano, MUNDO.tamano, MUNDO.segmentos, MUNDO.segmentos);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setY(i, alturaTerreno(pos.getX(i), pos.getZ(i)));
    geo.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({ map: this.#pintarTextura(), roughness: 1, metalness: 0 });
    this.#agregarDetalle(material);
    this.malla = new THREE.Mesh(geo, material);
    this.malla.receiveShadow = true;
  }

  altura(x, z) { return alturaTerreno(x, z); }

  // Deja plano el terreno en cada zona { x, z, r, borde } (para apoyar construcciones)
  // y vuelve a calcular la malla del suelo.
  aplanar(zonas) {
    for (const z of zonas) explanadas.push({ ...z, y: alturaNatural(z.x, z.z) });
    const pos = this.malla.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setY(i, alturaTerreno(pos.getX(i), pos.getZ(i)));
    pos.needsUpdate = true;
    this.malla.geometry.computeVertexNormals();
  }

  // Pinta un sendero de tierra recto entre dos puntos (del camino a la puerta de una cabaña)
  pintarSendero(x1, z1, x2, z2, ancho = 1.3) {
    const { c, px, esc } = this.pincel;
    c.lineCap = 'round';
    for (const [color, grosor, difuso] of [['rgba(96,120,50,0.8)', 1.5, 4], ['#a9824f', 1, 2], ['rgba(200,165,110,0.55)', 0.45, 3]]) {
      c.filter = `blur(${difuso}px)`;
      c.strokeStyle = color;
      c.lineWidth = ancho * esc * grosor;
      c.beginPath(); c.moveTo(px(x1), px(z1)); c.lineTo(px(x2), px(z2)); c.stroke();
    }
    c.filter = 'none';
    this.textura.needsUpdate = true;
  }

  // Distancia (en metros) desde un punto hasta el centro del camino
  distanciaAlCamino(x, z) {
    let min = Infinity;
    for (const p of this.puntosCamino) {
      const d = (p.x - x) ** 2 + (p.z - z) ** 2;
      if (d < min) min = d;
    }
    return Math.sqrt(min);
  }

  // Punto del camino (t de 0 a 1) y hacia dónde apunta ahí
  puntoCamino(t) {
    const p = this.camino.getPointAt(t), d = this.camino.getTangentAt(t);
    return { x: p.x, z: p.z, angulo: Math.atan2(d.x, d.z) };
  }

  // Imagen vista desde arriba: pasto, manchas, zona de montañas y el camino de tierra
  #pintarTextura() {
    const T = 2048, lienzo = document.createElement('canvas');
    lienzo.width = lienzo.height = T;
    const c = lienzo.getContext('2d'), azar = crearAzar(MUNDO.semilla);
    const px = (m) => (m / MUNDO.tamano + 0.5) * T;      // metros -> píxeles
    const esc = T / MUNDO.tamano;

    c.fillStyle = '#62b33f';
    c.fillRect(0, 0, T, T);
    for (let i = 0; i < 900; i++) {                      // manchas de pasto claro y oscuro
      const x = azar() * T, y = azar() * T, r = azar.entre(20, 110);
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      const color = azar.elegir(['120,200,70', '60,150,50', '150,205,80', '70,165,60']);
      g.addColorStop(0, `rgba(${color},0.22)`);
      g.addColorStop(1, `rgba(${color},0)`);
      c.fillStyle = g;
      c.fillRect(x - r, y - r, r * 2, r * 2);
    }
    const lejos = c.createRadialGradient(T / 2, T / 2, 60 * esc, T / 2, T / 2, 110 * esc);
    lejos.addColorStop(0, 'rgba(30,95,45,0)');           // las montañas, más oscuras
    lejos.addColorStop(1, 'rgba(30,95,45,0.55)');
    c.fillStyle = lejos;
    c.fillRect(0, 0, T, T);

    const trazar = () => {
      c.beginPath();
      this.puntosCamino.forEach((p, i) => (i ? c.lineTo(px(p.x), px(p.z)) : c.moveTo(px(p.x), px(p.z))));
      c.closePath();
    };
    c.lineJoin = c.lineCap = 'round';
    const ancho = MUNDO.anchoCamino * esc;
    trazar(); c.filter = 'blur(5px)';
    c.strokeStyle = 'rgba(96,120,50,0.8)'; c.lineWidth = ancho * 1.35; c.stroke();   // orilla
    trazar(); c.filter = 'blur(2.5px)';
    c.strokeStyle = '#a9824f'; c.lineWidth = ancho; c.stroke();                      // tierra
    trazar(); c.filter = 'blur(4px)';
    c.strokeStyle = 'rgba(200,165,110,0.55)'; c.lineWidth = ancho * 0.45; c.stroke(); // centro pisado
    c.filter = 'none';
    for (let i = 0; i < 9000; i++) {                     // piedritas y manchas de tierra
      const p = azar.elegir(this.puntosCamino), a = azar() * 6.283, d = azar() * ancho * 0.5;
      c.fillStyle = azar.elegir(['rgba(120,88,50,0.5)', 'rgba(215,185,135,0.5)', 'rgba(150,150,140,0.55)']);
      c.beginPath();
      c.arc(px(p.x) + Math.cos(a) * d, px(p.z) + Math.sin(a) * d, azar.entre(0.6, 2.2), 0, 6.283);
      c.fill();
    }

    const tex = new THREE.CanvasTexture(lienzo);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    this.pincel = { c, px, esc };              // para seguir pintando después (senderos)
    this.textura = tex;
    return tex;
  }

  // Grano fino repetido muchas veces para que el suelo no se vea liso de cerca
  #agregarDetalle(material) {
    const T = 128, lienzo = document.createElement('canvas');
    lienzo.width = lienzo.height = T;
    const c = lienzo.getContext('2d'), azar = crearAzar(7), img = c.createImageData(T, T);
    for (let i = 0; i < T * T; i++) {
      const v = 150 + azar() * 105;
      img.data.set([v, v, v, 255], i * 4);
    }
    c.putImageData(img, 0, 0);
    const detalle = new THREE.CanvasTexture(lienzo);
    detalle.wrapS = detalle.wrapT = THREE.RepeatWrapping;
    material.onBeforeCompile = (sh) => {
      sh.uniforms.detalle = { value: detalle };
      sh.fragmentShader = sh.fragmentShader
        .replace('void main() {', 'uniform sampler2D detalle;\nvoid main() {')
        .replace('#include <map_fragment>',
          '#include <map_fragment>\n  diffuseColor.rgb *= 0.62 + 0.5 * texture2D(detalle, vMapUv * 90.0).r;');
    };
  }
}
