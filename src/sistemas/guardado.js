// Guardado local (localStorage) de la personalización del jugador.
import { COLORES_INICIALES } from '../config/colores.js';

const CLAVE = 'minijuego3d.personaje.v3';

export function cargarColores() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE));
    if (guardado && typeof guardado === 'object') return { ...COLORES_INICIALES, ...guardado };
  } catch (e) { /* sin almacenamiento disponible */ }
  return { ...COLORES_INICIALES };
}

export function guardarColores(colores) {
  try { localStorage.setItem(CLAVE, JSON.stringify(colores)); } catch (e) { /* ignorar */ }
}
