// Medidas y ajustes del mundo y del jugador. Todo está en metros
// (el personaje mide 1.25 m). Cambiar un número aquí cambia el juego.

export const MUNDO = {
  semilla: 2026,          // misma semilla = mismo mundo (árboles, piedras…) en cada partida
  tamano: 260,            // lado del terreno completo, incluidas las montañas del borde
  segmentos: 200,         // divisiones de la malla del terreno
  radioJugable: 58,       // el jugador no puede alejarse más que esto del centro
  anchoCamino: 3.4,
  // Distancia al centro de cada punto del camino (forma un circuito cerrado)
  radiosCamino: [34, 39, 31, 37, 28, 36, 40, 30, 37, 32],
  arboles: 70,            // dentro de la zona jugable
  arbolesBorde: 230,      // en las montañas de alrededor
  rocas: 35,
  arbustos: 70,
  flores: 420,
  nubes: 20,
};

export const JUGADOR = {
  velCaminar: 2.0,        // m/s
  velCorrer: 5.0,         // m/s (con Shift)
  salto: 5.5,             // velocidad inicial del salto
  gravedad: 18,
  radio: 0.3,             // "grosor" del personaje para chocar con árboles y rocas
};

export const VEHICULO = {
  velMax: 9,              // m/s hacia delante
  velReversa: 3.5,        // m/s marcha atrás
  aceleracion: 6,
  aceleracionReversa: 4,
  frenado: 14,
  rozamiento: 3.5,        // lo que se frena solo al soltar las teclas
  giroMax: 0.6,           // giro de las ruedas yendo despacio (radianes)
  giroMaxRapido: 0.2,     // giro de las ruedas a toda velocidad
  distEjes: 1.36,         // distancia entre el eje delantero y el trasero
  ejeX: 0.5,              // distancia del centro a cada rueda
  radioRueda: 0.24,
  distanciaSubir: 2.2,    // qué tan cerca hay que estar para subir con E
  velBajar: 1.5,          // solo se puede bajar yendo más despacio que esto
  ladoInicio: 1.9,        // metros a la derecha del personaje donde aparece el carro
  camaraLejos: 1.45,      // cuánto se aleja la cámara al conducir
};

// Las cabañas (paradas) donde se expone cada tema. La lista de temas está en src/datos/cabanas.js
export const CABANA = {
  distanciaCamino: 8.5,   // del centro del camino al centro de la cabaña
  explanada: 5.5,         // radio del terreno plano bajo cada cabaña…
  explanadaBorde: 10,     // …y hasta dónde se va mezclando con las colinas
  zonaLibre: 7.5,         // radio sin árboles, rocas ni flores
  entrada: 4.3,           // metros delante del centro de la cabaña: el pie de las escaleras
  distanciaEntrar: 1.7,   // qué tan cerca de la entrada hay que estar para poder entrar
  letrero: { ancho: 2.9, alto: 0.54 },   // tamaño del texto del letrero (la tabla mide 3.0 × 0.62)
  aperturaPuerta: 1.7,    // cuánto gira la puerta al abrirse (radianes)
};

// El cuarto de dentro de las cabañas (uno solo para todas, escondido bajo el suelo del mundo).
// ancho, fondo y alto deben coincidir con herramientas/blender/crear_interior.py
export const INTERIOR = {
  y: -60,                 // a qué altura del mundo está escondido
  ancho: 8, fondo: 7, alto: 3,
  margen: 0.55,           // qué tanto se puede acercar el personaje a las paredes
  llegada: 1.7,           // al entrar aparece a esta distancia de la puerta
  distanciaLibro: 1.8,    // qué tan cerca de la mesa hay que estar para abrir el libro con Enter
  distanciaSalir: 1.2,    // qué tan cerca de la puerta hay que estar para salir
};

// El tablero de instrucciones, junto al punto de inicio
export const INSTRUCCIONES = {
  lado: 2.8,              // metros a la izquierda del personaje al empezar
  adelante: 1.8,          // metros hacia delante
  distanciaAbrir: 1.9,    // al acercarse más que esto, las instrucciones se abren solas
};

export const CAMARA = {
  distancia: 5.5, distanciaMin: 2.5, distanciaMax: 11,
  inclinacion: 0.3, inclinacionMin: -0.3, inclinacionMax: 1.25,   // radianes
};
