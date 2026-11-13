import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MUNDO } from '../config/mundo.js';
import { crearAzar } from '../sistemas/azar.js';

export const COLOR_HORIZONTE = 0xc4e6ff;
const COLOR_CENIT = 0x2f7fe6;
const LIMITE = 260;   // las nubes que pasan de aquí reaparecen por el otro lado

// Cielo azul (cúpula con degradado y sol) y nubes que se mueven despacio.
export class Cielo {
  constructor(direccionSol) {
    this.grupo = new THREE.Group();

    const cupula = new THREE.Mesh(
      new THREE.SphereGeometry(450, 32, 16),
      new THREE.ShaderMaterial({
        side: THREE.BackSide, depthWrite: false, fog: false,
        uniforms: {
          cenit: { value: new THREE.Color(COLOR_CENIT) },
          horizonte: { value: new THREE.Color(COLOR_HORIZONTE) },
          sol: { value: direccionSol.clone().normalize() },
        },
        vertexShader: `
          varying vec3 vDir;
          void main() {
            vDir = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: `
          uniform vec3 cenit, horizonte, sol;
          varying vec3 vDir;
          void main() {
            vec3 d = normalize(vDir);
            vec3 color = mix(horizonte, cenit, pow(max(d.y, 0.0), 0.5));
            float s = max(dot(d, sol), 0.0);
            color += vec3(1.0, 0.95, 0.8) * (pow(s, 600.0) * 2.0 + pow(s, 14.0) * 0.18);
            gl_FragColor = vec4(color, 1.0);
            #include <colorspace_fragment>
          }`,
      }));
    cupula.frustumCulled = false;
    this.cupula = cupula;
    this.grupo.add(cupula);

    // Nubes: grupos de bolas blancas aplastadas
    const azar = crearAzar(MUNDO.semilla + 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: 1, emissive: 0xdfeaff, emissiveIntensity: 0.35, fog: false,
    });
    const formas = [0, 1, 2, 3].map(() => {
      const bolas = [];
      const cuantas = 5 + Math.floor(azar() * 4);
      for (let i = 0; i < cuantas; i++) {
        const r = azar.entre(4, 8);
        const g = new THREE.IcosahedronGeometry(r, 2);
        g.scale(1.3, 0.62, 1);
        g.translate((i - cuantas / 2) * azar.entre(4.5, 6.5), azar.entre(-1, 2), azar.entre(-4, 4));
        bolas.push(g);
      }
      return mergeGeometries(bolas);
    });
    this.nubes = [];
    for (let i = 0; i < MUNDO.nubes; i++) {
      const nube = new THREE.Mesh(azar.elegir(formas), material);
      nube.position.set(azar.entre(-LIMITE, LIMITE), azar.entre(55, 95), azar.entre(-LIMITE, LIMITE));
      nube.scale.setScalar(azar.entre(0.8, 1.9));
      nube.rotation.y = azar() * Math.PI;
      nube.userData.velocidad = azar.entre(0.6, 1.6);
      this.nubes.push(nube);
      this.grupo.add(nube);
    }
  }

  actualizar(dt, centro) {
    this.cupula.position.copy(centro);        // el cielo siempre rodea a la cámara
    for (const nube of this.nubes) {
      nube.position.x += nube.userData.velocidad * dt;
      if (nube.position.x > LIMITE) nube.position.x = -LIMITE;
    }
  }
}
