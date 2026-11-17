import * as THREE from 'three';
import { CAMARA } from '../../config/mundo.js';
import { limitar } from '../azar.js';

// Cámara en tercera persona: sigue al personaje desde atrás.
// Arrastrar con el ratón (o el dedo) la gira; la rueda acerca o aleja.
// Al conducir se aleja un poco y vuelve sola a colocarse detrás del carro.
export class CamaraSeguimiento {
  constructor(camara, lienzo, terreno) {
    this.camara = camara;
    this.terreno = terreno;
    this.angulo = 0;                              // giro alrededor del personaje
    this.inclinacion = CAMARA.inclinacion;        // 0 = a ras del suelo, más = desde arriba
    this.distancia = CAMARA.distancia;
    this.foco = new THREE.Vector3();
    this.listo = false;
    this.alejar = 1;                              // se aleja al conducir
    this.ultimoArrastre = -10;                    // cuándo giró la cámara el jugador por última vez
    this.tiempo = 0;

    let arrastrando = false, ux = 0, uy = 0;
    lienzo.addEventListener('pointerdown', (e) => {
      arrastrando = true; ux = e.clientX; uy = e.clientY;
      lienzo.setPointerCapture(e.pointerId);
      lienzo.classList.add('arrastrando');
    });
    lienzo.addEventListener('pointermove', (e) => {
      if (!arrastrando) return;
      this.angulo -= (e.clientX - ux) * 0.006;
      this.inclinacion = limitar(this.inclinacion + (e.clientY - uy) * 0.005, CAMARA.inclinacionMin, CAMARA.inclinacionMax);
      ux = e.clientX; uy = e.clientY;
      this.ultimoArrastre = this.tiempo;
    });
    const soltar = () => { arrastrando = false; lienzo.classList.remove('arrastrando'); };
    lienzo.addEventListener('pointerup', soltar);
    lienzo.addEventListener('pointercancel', soltar);
    lienzo.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.distancia = limitar(this.distancia * (e.deltaY > 0 ? 1.1 : 0.9), CAMARA.distanciaMin, CAMARA.distanciaMax);
    }, { passive: false });
  }

  // Coloca la cámara justo detrás de alguien que mira hacia "anguloPersonaje"
  ponerDetras(anguloPersonaje) { this.angulo = anguloPersonaje + Math.PI; }

  // Para los cambios de lugar (entrar o salir de una cabaña): la cámara salta en vez de viajar
  saltar() { this.listo = false; }

  // detras: si se da un ángulo (al conducir), la cámara vuelve sola a ponerse detrás.
  // alejar: multiplica la distancia (1 = normal).
  // caja: { minX, maxX, minY, maxY, minZ, maxZ } de la que la cámara no sale (dentro de una cabaña).
  actualizar(dt, pies, { detras = null, alejar = 1, caja = null } = {}) {
    this.tiempo += dt;
    this.alejar += (alejar - this.alejar) * (1 - Math.exp(-3 * dt));
    if (detras !== null && this.tiempo - this.ultimoArrastre > 1.5) {
      const objetivoAng = detras + Math.PI;
      const dif = Math.atan2(Math.sin(objetivoAng - this.angulo), Math.cos(objetivoAng - this.angulo));
      this.angulo += dif * (1 - Math.exp(-2.5 * dt));
    }
    const objetivo = pies.clone();
    objetivo.y += 0.95;                           // mira a la altura del pecho
    if (this.listo) this.foco.lerp(objetivo, 1 - Math.exp(-12 * dt));
    else { this.foco.copy(objetivo); this.listo = true; }

    const distancia = this.distancia * this.alejar;
    const horizontal = Math.cos(this.inclinacion) * distancia;
    const c = this.camara.position;
    c.set(this.foco.x + Math.sin(this.angulo) * horizontal,
      this.foco.y + Math.sin(this.inclinacion) * distancia,
      this.foco.z + Math.cos(this.angulo) * horizontal);
    if (caja) {
      c.set(limitar(c.x, caja.minX, caja.maxX), limitar(c.y, caja.minY, caja.maxY), limitar(c.z, caja.minZ, caja.maxZ));
    } else c.y = Math.max(c.y, this.terreno.altura(c.x, c.z) + 0.35);   // que no se meta bajo tierra
    this.camara.lookAt(this.foco);
  }
}
