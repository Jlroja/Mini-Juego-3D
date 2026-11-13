// Punto de entrada: une la escena 3D del menú con la interfaz.
import { RUTAS } from './config/rutas.js';
import { cargarColores, guardarColores } from './sistemas/guardado.js';
import { EscenaMenu } from './escenas/EscenaMenu.js';
import { iniciarMenuUI } from './ui/menuUI.js';

const colores = cargarColores();
const cargando = document.getElementById('cargando');
const pista = document.getElementById('pistaArrastre');

const escena = new EscenaMenu(document.getElementById('escena'), {
  alArrastrar: () => pista.classList.add('oculta'),
});

escena.personaje.aplicarColores(colores);
escena.personaje.cargar(RUTAS.modelos.personaje)
  .then(() => cargando.classList.add('oculto'))
  .catch((err) => {
    console.error(err);
    cargando.innerHTML = 'No se pudo cargar el personaje.<br>Abre el juego con <b>npm run runserver</b>.';
  });

iniciarMenuUI({
  colores,
  alCambiarColor(parte, hex) {
    colores[parte] = hex;
    escena.personaje.aplicarColor(parte, hex);
    guardarColores(colores);
  },
  alAleatorio: () => escena.saltar(),
  alJugar() {
    guardarColores(colores);
    escena.saltar();
  },
});
