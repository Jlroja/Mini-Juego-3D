// Punto de entrada: muestra el menú y, al pulsar JUGAR, pasa al mundo.
import { RUTAS } from './config/rutas.js';
import { cargarColores, guardarColores } from './sistemas/guardado.js';
import { EscenaMenu } from './escenas/EscenaMenu.js';
import { EscenaMundo } from './escenas/EscenaMundo.js';
import { iniciarMenuUI } from './ui/menuUI.js';

const colores = cargarColores();
const lienzo = document.getElementById('escena');
const cargando = document.getElementById('cargando');
const pista = document.getElementById('pistaArrastre');

const menu = new EscenaMenu(lienzo, {
  alArrastrar: () => pista.classList.add('oculta'),
});

menu.personaje.aplicarColores(colores);
const personajeListo = menu.personaje.cargar(RUTAS.modelos.personaje)
  .then(() => cargando.classList.add('oculto'))
  .catch((err) => {
    console.error(err);
    cargando.innerHTML = 'No se pudo cargar el personaje.<br>Abre el juego con <b>npm run runserver</b>.';
  });

// El carro también se carga en el menú, para poder verlo y pintarlo antes de jugar
menu.vehiculo.aplicarColores(colores);
const carroListo = menu.vehiculo.cargar(RUTAS.modelos.carro).catch((err) => console.error(err));

// Aviso flotante del juego ("Pulsa E para subir al carro")
const aviso = document.getElementById('aviso');
function mostrarAviso(texto) {
  aviso.hidden = !texto;
  if (texto) aviso.innerHTML = texto;
}

// Cambia del menú al mundo: mismo lienzo, mismo personaje y mismo carro (con sus colores)
let mundo = null;
function entrarAlMundo() {
  if (mundo) return;
  menu.detener();
  document.body.classList.add('jugando');
  document.getElementById('hud').hidden = false;
  mundo = new EscenaMundo({
    renderer: menu.renderer, lienzo, personaje: menu.personaje, vehiculo: menu.vehiculo,
    entorno: menu.scene.environment, alAviso: mostrarAviso,
  });
}

iniciarMenuUI({
  colores,
  alCambiarColor(parte, hex) {
    colores[parte] = hex;
    menu.personaje.aplicarColor(parte, hex);      // cada uno ignora las partes que no son suyas
    menu.vehiculo.aplicarColor(parte, hex);
    guardarColores(colores);
  },
  alAleatorio: () => menu.saltar(),
  alJugar() {
    guardarColores(colores);
    menu.saltar();
  },
  alEntrarAlMundo: entrarAlMundo,
  alVer: (cual) => menu.mostrar(cual),
});

// Volver al menú: se recarga la página (los colores ya están guardados)
document.getElementById('btnMenu').addEventListener('click', () => {
  location.href = location.pathname;
});

// Para curiosear desde la consola del navegador (F12): juego.mundo, juego.menu
window.juego = { menu, get mundo() { return mundo; } };

// Atajo: abrir con ?jugar al final de la dirección entra directo al mundo
if (new URLSearchParams(location.search).has('jugar')) Promise.all([personajeListo, carroListo]).then(entrarAlMundo);
