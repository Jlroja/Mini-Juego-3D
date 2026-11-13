import { PALETA, PARTES } from '../config/colores.js';

// Interfaz HTML del menú: JUGAR, PERSONALIZAR y CONTROLES.
export function iniciarMenuUI({ colores, alCambiarColor, alAleatorio, alJugar }) {
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

  document.querySelectorAll('.pestana').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.pestana').forEach((t) => t.classList.toggle('activa', t === tab));
      parteActiva = tab.dataset.parte;
      pintarPaleta();
    });
  });

  colorLibre.addEventListener('input', () => { alCambiarColor(parteActiva, colorLibre.value); pintarPaleta(); });

  $('btnAleatorio').addEventListener('click', () => {
    PARTES.forEach((p) => alCambiarColor(p, PALETA[Math.floor(Math.random() * PALETA.length)]));
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
      const texto = tr.querySelector('.transicion__texto');
      tr.hidden = false;
      setTimeout(() => {
        // Aquí se cargará el nivel del juego cuando exista.
        texto.textContent = '¡PRÓXIMAMENTE!';
        setTimeout(() => { tr.hidden = true; texto.textContent = '¡PREPARADOS!'; }, 1400);
      }, 1200);
    }, 700);
  });
}
