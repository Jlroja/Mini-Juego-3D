import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Personaje } from '../entidades/Personaje.js';

// Escena 3D de la pantalla de inicio: personaje sobre una plataforma iluminada.
export class EscenaMenu {
  constructor(canvas, { alArrastrar } = {}) {
    this.canvas = canvas;
    this.alArrastrar = alArrastrar;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.45;

    this.camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
    this.camera.position.set(0, 1.2, 3.9);
    this.camera.lookAt(0, 0.56, 0);

    this.#crearLuces();
    this.#crearPlataforma();

    // pivote: giro por arrastre · cuerpo: respiración / rebote / salto
    this.pivote = new THREE.Group();
    this.cuerpo = new THREE.Group();
    this.personaje = new Personaje();
    this.cuerpo.add(this.personaje.grupo);
    this.pivote.add(this.cuerpo);
    this.scene.add(this.pivote);

    this.rotacion = -0.35;
    this.velocidad = 0;
    this.arrastrando = false;
    this.salto = null;
    this.reloj = new THREE.Clock();

    this.#activarArrastre();
    window.addEventListener('resize', () => this.ajustarTamano());
    this.ajustarTamano();
    this.renderer.setAnimationLoop(() => this.#actualizar());
  }

  saltar() {
    this.salto = { inicio: this.reloj.elapsedTime };
  }

  // Personaje a la izquierda (o arriba en pantallas estrechas)
  ajustarTamano() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    const estrecha = w <= 760 || w / h <= 1;
    if (estrecha) {
      this.camera.fov = THREE.MathUtils.clamp(30 / Math.max(w / h, 0.45) * 0.75, 32, 52);
      this.camera.setViewOffset(w, h, 0, h * 0.1, w, h);
    } else {
      this.camera.fov = 32;
      this.camera.setViewOffset(w, h, w * 0.2, 0, w, h);
    }
    this.camera.updateProjectionMatrix();
  }

  #crearLuces() {
    this.scene.add(new THREE.HemisphereLight(0xbfe6ff, 0x6a4bd8, 0.5));

    const sol = new THREE.DirectionalLight(0xffffff, 1.6);
    sol.position.set(2, 4, 3);
    sol.castShadow = true;
    sol.shadow.mapSize.set(1024, 1024);
    sol.shadow.camera.left = -1.5; sol.shadow.camera.right = 1.5;
    sol.shadow.camera.top = 1.5; sol.shadow.camera.bottom = -1.5;
    sol.shadow.radius = 4;
    sol.shadow.bias = -0.0005;
    this.scene.add(sol);

    const contra = new THREE.DirectionalLight(0xffd6ff, 0.8);
    contra.position.set(-3, 2, -2);
    this.scene.add(contra);

    const foco = new THREE.SpotLight(0xfff4d6, 6, 7, Math.PI / 7, 0.7, 1.5);
    foco.position.set(0, 3.2, 1.2);
    foco.target.position.set(0, 0, 0);
    this.scene.add(foco, foco.target);
  }

  #crearPlataforma() {
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.66, 0.16, 64),
      new THREE.MeshStandardMaterial({ color: 0x6b4dff, roughness: 0.45, metalness: 0.1 })
    );
    base.position.y = -0.09;
    base.receiveShadow = true;

    const tapa = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.55, 0.02, 64),
      new THREE.MeshStandardMaterial({ color: 0xe9e4ff, roughness: 0.4 })
    );
    tapa.receiveShadow = true;

    this.anilloMat = new THREE.MeshStandardMaterial({ color: 0x7ff3ff, emissive: 0x2fe6ff, emissiveIntensity: 2 });
    const anillo = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.02, 16, 96), this.anilloMat);
    anillo.rotation.x = Math.PI / 2;

    this.halo = new THREE.Mesh(
      new THREE.RingGeometry(0.66, 1.15, 96),
      new THREE.MeshBasicMaterial({ color: 0x9ff7ff, transparent: true, opacity: 0.25, depthWrite: false, side: THREE.DoubleSide })
    );
    this.halo.rotation.x = -Math.PI / 2;
    this.halo.position.y = -0.17;

    const plataforma = new THREE.Group();
    plataforma.add(base, tapa, anillo, this.halo);
    this.scene.add(plataforma);
  }

  // Rotación arrastrando con el ratón o el dedo
  #activarArrastre() {
    const c = this.canvas;
    let ultimoX = 0;
    c.addEventListener('pointerdown', (e) => {
      this.arrastrando = true; ultimoX = e.clientX; this.velocidad = 0;
      c.setPointerCapture(e.pointerId);
      c.classList.add('arrastrando');
      this.alArrastrar?.();
    });
    c.addEventListener('pointermove', (e) => {
      if (!this.arrastrando) return;
      this.velocidad = (e.clientX - ultimoX) * 0.012;
      ultimoX = e.clientX;
      this.rotacion += this.velocidad;
    });
    const soltar = () => { this.arrastrando = false; c.classList.remove('arrastrando'); };
    c.addEventListener('pointerup', soltar);
    c.addEventListener('pointercancel', soltar);
  }

  #actualizar() {
    const dt = Math.min(this.reloj.getDelta(), 0.05);
    const t = this.reloj.elapsedTime;

    // Inercia del giro
    if (!this.arrastrando) {
      this.rotacion += this.velocidad;
      this.velocidad *= Math.pow(0.04, dt);
    }
    this.pivote.rotation.y = this.rotacion;

    // Respiración + pequeño rebote
    const resp = Math.sin(t * 2.6);
    let y = Math.max(0, resp) * 0.035;
    let sy = 1 + resp * 0.025;
    let sxz = 1 - resp * 0.012;

    // Salto con voltereta
    if (this.salto) {
      const p = (t - this.salto.inicio) / 0.9;
      if (p >= 1) {
        this.salto = null;
      } else {
        y = Math.sin(p * Math.PI) * 0.55;
        this.pivote.rotation.y = this.rotacion + p * Math.PI * 2;
        const aplastar = p < 0.12 ? 1 - Math.sin(p / 0.12 * Math.PI) * 0.15 : 1;
        sy *= aplastar; sxz *= 2 - aplastar;
      }
    }
    this.cuerpo.position.y = y;
    this.cuerpo.scale.set(sxz, sy, sxz);

    // Brillo pulsante de la plataforma
    this.anilloMat.emissiveIntensity = 1.6 + Math.sin(t * 3) * 0.6;
    this.halo.material.opacity = 0.18 + Math.sin(t * 3) * 0.08;

    this.renderer.render(this.scene, this.camera);
  }
}
