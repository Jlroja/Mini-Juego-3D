// Ventanas que aparecen durante el juego: las instrucciones, el cuadro que pide el nombre
// del estudiante y el panel con la reflexión de cada cabaña.
import { CABANAS } from '../datos/cabanas.js';
import { RUTAS } from '../config/rutas.js';

const CLAVE_NOMBRE = 'minijuego3d.estudiante';

export function crearJuegoUI() {
  const $ = (id) => document.getElementById(id);
  const ui = {
    abierto: false,          // true mientras hay alguna ventana abierta
    alCambiar: null,         // el mundo lo usa para dejar de escuchar el teclado mientras tanto
  };
  let cerrarActual = null;

  function abrir(modal, alCerrar) {
    cerrarActual?.();
    modal.hidden = false;
    ui.abierto = true;
    ui.alCambiar?.(true);
    cerrarActual = () => {
      cerrarActual = null;
      modal.hidden = true;
      ui.abierto = false;
      ui.alCambiar?.(false);
      alCerrar?.();
    };
  }

  // Se cierra con Esc, con los botones marcados con data-cerrar o haciendo clic fuera de la caja
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && cerrarActual) { e.preventDefault(); cerrarActual(); }
  });
  for (const modal of document.querySelectorAll('.modal--juego')) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.closest('[data-cerrar]')) cerrarActual?.();
    });
  }

  // ---------- Instrucciones ----------
  $('listaTemas').innerHTML = CABANAS.map((c, i) =>
    `<li><span class="numero" style="background:${c.color}">${i + 1}</span>${c.titulo}</li>`).join('');
  ui.mostrarInstrucciones = () => abrir($('modalInstrucciones'));

  // ---------- Nombre del estudiante ----------
  const campo = $('campoNombre'), formulario = $('formNombre');
  campo.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.repeat) e.preventDefault(); });
  campo.addEventListener('input', () => campo.classList.remove('falta'));

  // Devuelve una promesa con el nombre escrito, o null si se cancela
  ui.pedirNombre = (datos, numero) => new Promise((resolver) => {
    let nombre = null;
    $('nombreCabana').innerHTML = `<span class="numero" style="background:${datos.color}">${numero}</span>${datos.titulo}`;
    try { campo.value = localStorage.getItem(CLAVE_NOMBRE) ?? ''; } catch (e) { campo.value = ''; }
    campo.classList.remove('falta');
    formulario.onsubmit = (e) => {
      e.preventDefault();
      const escrito = campo.value.trim();
      if (!escrito) { campo.classList.add('falta'); campo.focus(); return; }
      nombre = escrito;
      try { localStorage.setItem(CLAVE_NOMBRE, nombre); } catch (err) { /* ignorar */ }
      cerrarActual();
    };
    abrir($('modalNombre'), () => resolver(nombre));
    setTimeout(() => { campo.focus(); campo.select(); }, 40);
  });

  // ---------- Cortina para entrar y salir de las cabañas ----------
  // Oscurece la pantalla, ejecuta enMedio() (el cambio de lugar) cuando no se ve nada y vuelve a aclarar
  const cortina = $('fundido');
  ui.fundir = (enMedio) => new Promise((resolver) => {
    ui.abierto = true;
    ui.alCambiar?.(true);
    cortina.hidden = false;
    void cortina.offsetWidth;                // para que el navegador note el cambio y haga la transición
    cortina.classList.add('activo');
    setTimeout(() => { enMedio(); cortina.classList.remove('activo'); }, 380);
    setTimeout(() => {
      cortina.hidden = true;
      ui.abierto = false;
      ui.alCambiar?.(false);
      resolver();
    }, 760);
  });

  // ---------- El libro: reflexión del tema de la cabaña ----------
  const textos = {};        // reflexiones ya descargadas
  ui.mostrarCabana = (datos, numero, nombre) => new Promise((resolver) => {
    $('cabanaTitulo').textContent = datos.titulo;
    $('cabanaTitulo').style.color = datos.color;
    $('cabanaNumero').textContent = `Cabaña ${numero}`;
    $('cabanaNumero').style.background = datos.color;
    $('cabanaEstudiante').textContent = nombre;
    const cuerpo = $('cabanaTexto');
    cuerpo.innerHTML = '<p>Cargando…</p>';
    textos[datos.id] ??= fetch(`${RUTAS.contenidos}/${datos.id}.md`)
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); });
    textos[datos.id]
      .then((md) => { cuerpo.innerHTML = aHtml(md); })
      .catch(() => {
        delete textos[datos.id];
        cuerpo.innerHTML = `<p>No se encontró el texto de este tema. Debe estar en <b>${RUTAS.contenidos}/${datos.id}.md</b></p>`;
      });
    abrir($('modalCabana'), resolver);
    cuerpo.scrollTop = 0;
  });

  return ui;
}

// Convierte el texto de una reflexión en HTML. Entiende lo básico:
// "# título", "- punto de lista", **negrita** y párrafos separados por una línea en blanco.
function aHtml(texto) {
  const limpiar = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  let html = '', enLista = false, parrafo = [];
  const cerrar = () => {
    if (parrafo.length) { html += `<p>${parrafo.join(' ')}</p>`; parrafo = []; }
    if (enLista) { html += '</ul>'; enLista = false; }
  };
  for (const cruda of texto.split(/\r?\n/)) {
    const linea = cruda.trim();
    if (!linea) cerrar();
    else if (linea.startsWith('#')) { cerrar(); html += `<h3>${limpiar(linea.replace(/^#+\s*/, ''))}</h3>`; }
    else if (/^[-*]\s+/.test(linea)) {
      if (!enLista) { cerrar(); html += '<ul>'; enLista = true; }
      html += `<li>${limpiar(linea.replace(/^[-*]\s+/, ''))}</li>`;
    } else {
      if (enLista) cerrar();
      parrafo.push(limpiar(linea));
    }
  }
  cerrar();
  return html;
}
