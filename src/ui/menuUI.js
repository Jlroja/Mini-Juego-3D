import { PALETA, PARTES, PARTES_CARRO } from '../config/colores.js';

// Interfaz HTML del menú: JUGAR, PERSONALIZAR y CONTROLES.
export function iniciarMenuUI({ colores, alCambiarColor, alAleatorio, alJugar, alEntrarAlMundo, alVer }) {
  const $ = (id) => document.getElementById(id);

  // ---------- Personalizar ----------
  const btnPersonalizar = $('btnPersonalizar');
  const panel = $('panelPersonalizar');
  const paletaEl = $('paleta');
  const colorLibre = $('colorLibre');
  let parteActiva = PARTES[0];

  btnPersonalizar.addEventListener('click', () => {
    const abrir = panel.hidden;
    panel.hidden = !abrir;
    btnPersonalizar.setAttribute('aria-expanded', String(abrir));
  });

  function pintarPaleta() {
    paletaEl.innerHTML = '';
    PALETA.forEach((hex) => {
      const b = document.createElement('button');
      b.className = 'muestra' + (hex.toLowerCase() === colores[parteActiva].toLowerCase() ? ' activa' : '');
      b.style.background = hex;
      b.title = hex;
      b.setAttribute('aria-label', `Color ${hex}`);
      b.addEventListener('click', () => { alCambiarColor(parteActiva, hex); pintarPaleta(); });
      paletaEl.appendChild(b);
    });
    colorLibre.value = colores[parteActiva];
  }

  // Al elegir una pestaña del carro se muestra el carro; al elegir una del personaje, el personaje
  const esCarro = (parte) => PARTES_CARRO.includes(parte);
  const btnVer = $('btnVer');
  function elegirParte(parte) {
    parteActiva = parte;
    document.querySelectorAll('.pestana').forEach((t) => t.classList.toggle('activa', t.dataset.parte === parte));
    btnVer.innerHTML = esCarro(parte) ? '🧍 Ver personaje' : '🚗 Ver carro';
    alVer?.(esCarro(parte) ? 'carro' : 'personaje');
    pintarPaleta();
  }
  document.querySelectorAll('.pestana').forEach((tab) => {
    tab.addEventListener('click', () => elegirParte(tab.dataset.parte));
  });
  btnVer.addEventListener('click', () => elegirParte(esCarro(parteActiva) ? PARTES[0] : PARTES_CARRO[0]));

  colorLibre.addEventListener('input', () => { alCambiarColor(parteActiva, colorLibre.value); pintarPaleta(); });

  $('btnAleatorio').addEventListener('click', () => {
    const grupo = esCarro(parteActiva) ? PARTES_CARRO : PARTES;        // solo lo que se está viendo
    grupo.forEach((p) => alCambiarColor(p, PALETA[Math.floor(Math.random() * PALETA.length)]));
    pintarPaleta();
    alAleatorio?.();
  });

  pintarPaleta();

  // ---------- Controles ----------
  const modal = $('modalControles');
  const btnControles = $('btnControles');
  const cerrar = () => { modal.hidden = true; btnControles.focus(); };
  btnControles.addEventListener('click', () => { modal.hidden = false; $('cerrarControles').focus(); });
  $('cerrarControles').addEventListener('click', cerrar);
  modal.addEventListener('click', (e) => { if (e.target === modal) cerrar(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) cerrar(); });

  // ---------- Jugar ----------
  $('btnJugar').addEventListener('click', () => {
    alJugar?.();
    setTimeout(() => {
      const tr = $('transicion');
      tr.hidden = false;
      setTimeout(() => {
        alEntrarAlMundo?.();                       // detrás de la cortina se cambia al mundo
        setTimeout(() => { tr.hidden = true; }, 500);
      }, 1200);
    }, 700);
  });
}
