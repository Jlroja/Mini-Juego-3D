// Rutas de todos los recursos del juego. Cualquier archivo nuevo de
// public/assets se registra aquí para no repetir rutas por el código.
const BASE = 'public/assets';

export const RUTAS = {
  modelos: {
    personaje: `${BASE}/modelos/personaje/personaje.glb`,
    carro: `${BASE}/modelos/vehiculos/carro.glb`,
    cabana: `${BASE}/modelos/paradas/cabana.glb`,
    interiorCabana: `${BASE}/modelos/paradas/interior_cabana.glb`,
  },
  sonidos: {
    musica: `${BASE}/sonidos/musica`,
    efectos: `${BASE}/sonidos/efectos`,
    voces: `${BASE}/sonidos/voces`,
  },
  texturas: `${BASE}/texturas`,
  imagenes: `${BASE}/imagenes`,
  contenidos: 'public/contenidos/paradas',   // un archivo .md por cabaña (su reflexión)
};
