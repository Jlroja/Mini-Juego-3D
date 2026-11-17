# Documentación del Mini Juego 3D

> Este documento se va actualizando con cada cambio del proyecto.
> Explica la idea del juego, qué hay en cada carpeta, qué hace cada archivo y qué se ha hecho en cada sesión.

---

## 1. La idea del juego

Un mini juego 3D que corre en el navegador, hecho para **exponer temas vistos en clase**.

- El jugador maneja un **personaje** que camina por un **mundo 3D**.
- En el mundo hay un **carro**: el personaje puede subirse, conducirlo y bajarse.
- El mundo tiene 8 **cabañas de madera** (las paradas), cada una con un **letrero** con su tema. Frente a la puerta se presiona **Enter**, se escribe el **nombre del estudiante** y el personaje **entra a la cabaña**. Adentro hay una **mesa con un libro**: al hacerle clic se abre la **reflexión** del tema para exponerla.
- Junto al punto de inicio hay un **tablero de instrucciones** (se abre al acercarse o al hacerle clic) y en la esquina superior izquierda un **mapa** con las cabañas, que se agranda con un clic.
- El juego tiene **música de fondo y efectos de sonido**.
- En el menú de inicio se puede **personalizar** el color de la camiseta, el pantalón y los zapatos del personaje, y también **ver el carro** y cambiarle el color (carrocería y asiento).

### Controles

| Tecla | Acción | Estado |
|---|---|---|
| W A S D / flechas | A pie: caminar (hacia donde mira la cámara) | ✅ Funciona |
| Shift (mantener) | Correr | ✅ Funciona |
| Espacio | Saltar | ✅ Funciona |
| Arrastrar con el ratón | Girar la cámara alrededor del personaje | ✅ Funciona |
| Rueda del ratón | Acercar o alejar la cámara | ✅ Funciona |
| Botón "☰ Menú" | Volver al menú de inicio | ✅ Funciona |
| E | Subir al carro (estando cerca) o bajar (con el carro casi parado) | ✅ Funciona |
| W / S (en el carro) | Acelerar / frenar y luego marcha atrás | ✅ Funciona |
| A / D (en el carro) | Girar a la izquierda / derecha | ✅ Funciona |
| Enter | Frente a la puerta de una cabaña: pedir el nombre y entrar. Dentro: abrir el libro (junto a la mesa) o salir (junto a la puerta). Junto al tablero: ver las instrucciones | ✅ Funciona |
| Clic en el libro | Dentro de la cabaña: abrir la reflexión del tema | ✅ Funciona |
| Esc | Cerrar la ventana abierta (instrucciones, nombre o reflexión) | ✅ Funciona |
| M o clic en el mapa | Agrandar o achicar el mapa | ✅ Funciona |
| Clic en el tablero "?" | Abrir las instrucciones | ✅ Funciona |

---

## 2. Tecnología

| Herramienta | Para qué se usa |
|---|---|
| **Three.js** | Motor 3D en el navegador (escena, cámara, luces, modelos) |
| **JavaScript (módulos ES)** | Código del juego, sin compilación |
| **HTML + CSS** | Menús, paneles y textos encima del juego |
| **Blender** | Crear los modelos 3D y exportarlos en formato `.glb` |
| **http-server** (npm) | Servidor local para abrir el juego |

### Cómo ejecutar el juego

```powershell
npm install        # solo la primera vez
npm run runserver  # abre http://localhost:8000/
```

> El juego **no funciona** abriendo `index.html` con doble clic: el navegador bloquea la carga de modelos. Hay que usar `npm run runserver`.

**Atajo para probar:** abrir `http://localhost:8000/?jugar` entra directo al mundo, sin pasar por el menú.

---

## 3. Estructura de carpetas

```
mini-juego-3d/
├─ index.html              Página del juego
├─ package.json            Comandos del proyecto (npm run runserver)
├─ README.md               Resumen corto del proyecto
├─ src/                    Código del juego
│  ├─ main.js
│  ├─ config/
│  ├─ datos/
│  ├─ escenas/
│  ├─ entidades/
│  ├─ sistemas/
│  │  ├─ audio/
│  │  ├─ camara/
│  │  ├─ controles/
│  │  ├─ interaccion/
│  │  ├─ azar.js
│  │  └─ guardado.js
│  ├─ ui/
│  └─ estilos/
├─ public/                 Todo lo que el juego carga mientras corre
│  ├─ assets/
│  │  ├─ modelos/          personaje/, vehiculos/, paradas/, objetos/, escenarios/
│  │  ├─ sonidos/          musica/, efectos/, ambiente/, voces/
│  │  ├─ texturas/
│  │  ├─ imagenes/         ui/, iconos/
│  │  └─ fuentes/
│  └─ contenidos/
│     ├─ paradas/
│     └─ imagenes/
├─ arte/                   Archivos fuente de arte (el juego NO los carga)
│  ├─ blender/
│  └─ referencias/
├─ herramientas/           Scripts de apoyo
│  └─ blender/
└─ docs/                   Documentación (este archivo)
```

### 3.1 `src/` — Código

| Carpeta | Qué contiene |
|---|---|
| `src/main.js` | Punto de entrada. Une la escena 3D con la interfaz. |
| `src/config/` | Constantes que se usan en todo el juego: rutas de recursos y colores. |
| `src/datos/` | Lista de las cabañas (paradas): tema, color y archivo de texto que abre. |
| `src/escenas/` | Cada "pantalla" 3D del juego: el menú y el mundo. |
| `src/entidades/` | Cosas que existen dentro del mundo: personaje, carro, paradas. |
| `src/sistemas/audio/` | Música de fondo, efectos de sonido y control de volumen. |
| `src/sistemas/camara/` | Cámara que sigue al personaje cuando camina o al carro cuando conduce. |
| `src/sistemas/controles/` | Lectura del teclado: caminar, conducir, subir y bajar del carro. |
| `src/sistemas/interaccion/` | Subir al carro, y detectar cuándo el personaje llega a una cabaña o al tablero de instrucciones. |
| `src/sistemas/guardado.js` | Guarda en el navegador los colores elegidos para el personaje. |
| `src/sistemas/azar.js` | Números al azar repetibles (para que el mundo salga siempre igual) y funciones matemáticas de apoyo. |
| `src/ui/` | Interfaz en HTML: menú, HUD (indicadores en pantalla) y panel de exposición. |
| `src/estilos/` | Archivos CSS. |

### 3.2 `public/assets/` — Recursos del juego

| Carpeta | Qué va ahí | Formato |
|---|---|---|
| `modelos/personaje/` | Modelo del personaje | `.glb` |
| `modelos/vehiculos/` | El carro | `.glb` |
| `modelos/paradas/` | La cabaña de madera (`cabana.glb`) | `.glb` |
| `modelos/objetos/` | Árboles, rocas, postes, decoración | `.glb` |
| `modelos/escenarios/` | Terreno, calles, edificios grandes | `.glb` |
| `sonidos/musica/` | Música de fondo | `.mp3` / `.ogg` |
| `sonidos/efectos/` | Pasos, puerta del carro, abrir parada, clics | `.mp3` / `.ogg` |
| `sonidos/ambiente/` | Sonidos de fondo: pájaros, viento, motor | `.mp3` / `.ogg` |
| `sonidos/voces/` | Narraciones (opcional) | `.mp3` / `.ogg` |
| `texturas/` | Imágenes para los materiales 3D (pasto, asfalto…) | `.png` / `.jpg` |
| `imagenes/ui/` | Fondos y gráficos de los menús | `.png` / `.svg` |
| `imagenes/iconos/` | Iconos pequeños | `.png` / `.svg` |
| `fuentes/` | Tipografías locales | `.woff2` |

### 3.3 `public/contenidos/` — Lo que se expone

| Carpeta | Qué va ahí |
|---|---|
| `contenidos/paradas/` | Un archivo de texto por cabaña, con el nombre de su tema: `arbol-genealogico.md`, `dba.md`… Es la reflexión que aparece al entrar. |
| `contenidos/imagenes/` | Imágenes que acompañan los textos de las paradas. |

Los textos están aquí y no dentro del código para que **se puedan editar sin programar**: se cambia el archivo y el juego muestra el texto nuevo.

### 3.4 Otras carpetas

| Carpeta | Qué contiene |
|---|---|
| `arte/blender/` | Archivos `.blend` editables (el juego no los usa; se exportan a `.glb`). |
| `arte/referencias/` | Imágenes de referencia para diseñar los modelos. |
| `herramientas/blender/` | Scripts de Python que crean modelos en Blender automáticamente. |
| `docs/` | Documentación del proyecto. |
| `node_modules/` | Dependencias de npm (se genera con `npm install`, no se edita). |

---

## 4. Archivos existentes y qué hacen

### Página y arranque

| Archivo | Qué hace |
|---|---|
| `index.html` | Página del juego. Contiene el menú de inicio (JUGAR, PERSONALIZAR, CONTROLES), el lienzo 3D, las indicaciones del juego (HUD) y carga Three.js. |
| `src/main.js` | Arranca el juego: carga los colores guardados, crea el menú, carga el personaje y, al pulsar JUGAR, apaga el menú y crea el mundo. |

### Configuración (`src/config/`)

| Archivo | Qué hace |
|---|---|
| `rutas.js` | Rutas de todos los recursos. Cada archivo nuevo de `public/assets/` se registra aquí. |
| `colores.js` | Partes que se pueden recolorear del personaje (camiseta, pantalón, zapatos) y del carro (carrocería, asiento), la paleta de colores y los colores iniciales. |
| `../datos/cabanas.js` | La lista de las 8 cabañas: `id` (nombre de su archivo de texto), `titulo` (lo que dice el letrero) y `color` (puerta y punto en el mapa). **Para agregar, quitar o renombrar un tema se cambia aquí.** |
| `mundo.js` | Todos los números del mundo y del jugador: tamaño del terreno, ancho y forma del camino, cuántos árboles, rocas, flores y nubes hay, velocidad al caminar y correr, fuerza del salto, ajustes de la cámara y todo lo del carro (`VEHICULO`: velocidad, aceleración, frenado, giro, dónde aparece). **Para cambiar el mundo se empieza por aquí.** |

### Escenas (`src/escenas/`)

| Archivo | Qué hace |
|---|---|
| `EscenaMenu.js` | Escena 3D del menú: el personaje (o el carro, con `mostrar('carro')`) sobre una plataforma iluminada, se puede girar arrastrando y salta al presionar JUGAR. Con `detener()` se apaga para dar paso al mundo. |
| `EscenaMundo.js` | El mundo del juego. Junta el terreno, el cielo, la vegetación, las cabañas, el tablero de instrucciones, las luces (sol con sombras), el personaje, el carro, los controles, la cámara y el mapa, y los actualiza en cada fotograma. Estaciona el carro a la derecha del personaje al empezar. |

### Entidades (`src/entidades/`)

| Archivo | Qué hace |
|---|---|
| `Personaje.js` | Carga `personaje.glb`, permite cambiar el color de sus partes y lo **anima** moviendo los huesos: quieto (respira y mira alrededor), caminar, correr, saltar y sentado al volante. |
| `Vehiculo.js` | Carga `carro.glb`, permite cambiar el color de la carrocería y del asiento, y hace girar las ruedas y el volante. |
| `Terreno.js` | El suelo: pasto verde con colinas suaves, montañas alrededor y el camino de tierra en circuito. Tiene la función `alturaTerreno(x, z)` que dice a qué altura está el suelo en cualquier punto. |
| `Cabanas.js` | Decide dónde va cada cabaña (junto al camino, mirando hacia él), aplana el terreno debajo, pinta el sendero hasta su puerta, carga `cabana.glb` y pone una copia en cada sitio con su letrero y su puerta de color. Abre y cierra las puertas. |
| `InteriorCabana.js` | El cuarto de dentro de las cabañas (uno solo para todas, escondido bajo el suelo del mundo). Carga `interior_cabana.glb`, pone las luces y, al entrar, lo "viste" con el tema: cartel de la pared y color del libro y de la puerta. |
| `TableroInstrucciones.js` | El tablero de madera con el "?" flotante que está junto al punto de inicio. |
| `Cielo.js` | Cielo azul con degradado (más claro en el horizonte), el sol y las nubes que se mueven despacio. |
| `Vegetacion.js` | Árboles (pinos y de copa redonda), arbustos, rocas y flores repartidos por el mundo sin tapar el camino. También guarda la lista de obstáculos contra los que choca el jugador. |

### Sistemas (`src/sistemas/`)

| Archivo | Qué hace |
|---|---|
| `controles/Teclado.js` | Sabe qué teclas están pulsadas y las traduce a acciones: adelante, atrás, izquierda, derecha, correr, saltar. También detecta el momento exacto en que se pulsa una tecla (para la E). |
| `controles/ControlPersonaje.js` | Mueve al personaje: camina o corre según el teclado, lo mantiene pegado al suelo en subidas y bajadas, hace el salto, lo frena contra árboles y rocas y no lo deja salir del mundo. |
| `controles/ControlVehiculo.js` | Conduce el carro: acelera, frena, marcha atrás y gira. Lo apoya sobre el terreno (se inclina en las subidas), lo frena contra árboles y rocas y no lo deja salir del mundo. |
| `interaccion/InteraccionVehiculo.js` | Subir y bajar del carro con E. Muestra el aviso "Pulsa E para subir al carro" cuando el personaje está cerca. |
| `interaccion/InteraccionLugares.js` | Detecta cuándo el personaje (a pie) está frente a una cabaña o junto al tablero. En la cabaña: Enter → pide el nombre → el personaje entra. Dentro: clic en el libro (o Enter junto a la mesa) → muestra la reflexión; Enter junto a la puerta → sale. En el tablero: abre las instrucciones al acercarse, con Enter o con un clic. |
| `camara/CamaraSeguimiento.js` | Cámara en tercera persona que sigue al personaje o al carro. Se gira arrastrando y se acerca con la rueda. No se mete bajo tierra. Al conducir se aleja un poco y vuelve sola a ponerse detrás del carro. |
| `azar.js` | Números al azar repetibles y funciones matemáticas de apoyo (`limitar`, `mezclar`, `escalon`, `suavizar`). |
| `guardado.js` | Guarda y carga los colores del personaje en el navegador (`localStorage`). |

### Interfaz y estilos

| Archivo | Qué hace |
|---|---|
| `src/ui/menuUI.js` | Lógica de los botones del menú: panel de personalizar, paleta de colores, ventana de controles, el botón "Ver carro / Ver personaje" y la cortina de "¡PREPARADOS!" al pulsar JUGAR. |
| `src/ui/juegoUI.js` | Las ventanas del juego: instrucciones, cuadro que pide el nombre del estudiante y panel con la reflexión (lee el archivo `.md` de la cabaña). Recuerda el último nombre escrito. |
| `src/ui/Minimapa.js` | El mapa de la esquina: dibuja el camino, las cabañas numeradas, el tablero, el carro y la flecha del jugador. Se agranda con un clic o con M y muestra la lista de temas. |
| `src/estilos/menu.css` | Estilos del menú de inicio. |
| `src/estilos/juego.css` | Estilos de la pantalla de juego: botón de menú, barra de indicaciones, aviso amarillo de "Pulsa E", botón "Ver carro" y ocultar el menú al jugar. |

### Modelos y herramientas

| Archivo | Qué hace |
|---|---|
| `public/assets/modelos/personaje/personaje.glb` | Modelo 3D del personaje **con esqueleto** (11 huesos) que usa el juego. |
| `arte/blender/personaje.blend` | Archivo editable del personaje, con su esqueleto. |
| `arte/referencias/personaje_referencia.png` | Imagen de referencia del personaje. |
| `herramientas/blender/crear_personaje.py` | Script de Blender que crea el personaje desde cero. Al terminar ejecuta solo `rig_personaje.py`. |
| `public/assets/modelos/vehiculos/carro.glb` | Modelo 3D del carro descapotable que usa el juego. |
| `arte/blender/carro.blend` | Archivo editable del carro. |
| `herramientas/blender/crear_carro.py` | Script de Blender que modela el carro desde cero, lo exporta a `carro.glb` y guarda el `.blend`. |
| `public/assets/modelos/paradas/cabana.glb` | Modelo 3D de la cabaña de madera (el mismo para las 8). |
| `arte/blender/cabana.blend` | Archivo editable de la cabaña. |
| `public/assets/modelos/paradas/interior_cabana.glb` | Modelo 3D del cuarto de dentro, con la mesa y el libro. |
| `arte/blender/interior_cabana.blend` | Archivo editable del interior. |
| `herramientas/blender/crear_interior.py` | Script de Blender que modela el interior (25 piezas), lo exporta y guarda el `.blend`. |
| `herramientas/blender/crear_cabana.py` | Script de Blender que modela la cabaña pieza por pieza, la exporta a `cabana.glb` y guarda el `.blend`. |
| `public/contenidos/paradas/*.md` | La reflexión de cada tema (8 archivos). **Por ahora tienen un texto de ejemplo.** |
| `herramientas/blender/rig_personaje.py` | Script de Blender que le pone el esqueleto al personaje, reparte cada parte del cuerpo entre los huesos y exporta el `.glb` y el `.blend`. |

> Los archivos `.gitkeep` solo sirven para que las carpetas vacías no se pierdan. Se pueden borrar cuando la carpeta tenga contenido.

---

## 4.1 Cómo funciona el mundo

**Tamaño.** El personaje mide 1.25 m. La zona donde se puede caminar es un círculo de 58 m de radio (unos 116 m de lado a lado: corriendo se cruza en unos 23 segundos). Alrededor hay montañas con árboles que cierran el mundo, y el terreno completo mide 260 m.

**El terreno no es un modelo de Blender: se genera con código.** Una fórmula (`alturaTerreno`) calcula la altura de cada punto sumando ondas suaves, y eso da las subiditas y bajaditas. Se hizo así por tres razones:
1. El personaje, la cámara, los árboles (y más adelante el carro y las paradas) usan **la misma fórmula** para saber dónde está el suelo, así nada flota ni se hunde.
2. Cambiar el mundo es cambiar números en `src/config/mundo.js`, sin abrir Blender.
3. No hay que descargar ningún archivo pesado.

**El camino de tierra** es un circuito cerrado que pasa por 10 puntos alrededor del centro (`radiosCamino` en `mundo.js`). Se pinta sobre una imagen del suelo vista desde arriba (pasto + manchas + camino), que luego se pega sobre el terreno. El personaje aparece sobre el camino.

**El cielo** es una esfera gigante pintada con un degradado azul, con un brillo donde está el sol. Las nubes son grupos de bolas blancas aplastadas que se desplazan lentamente.

**Mismo mundo siempre.** Los árboles, rocas, flores y nubes se colocan "al azar", pero con una semilla fija (`semilla` en `mundo.js`): el mundo sale idéntico cada vez. Cambiar la semilla da otro reparto.

**Rendimiento.** Todos los árboles de un mismo tipo se dibujan de una sola vez (técnica de *instancias*), por eso puede haber cientos sin que el juego vaya lento.

## 4.2 Cómo se anima el personaje

El modelo tiene un **esqueleto de 11 huesos**: `Cadera`, `Torso`, `Cabeza`, y a cada lado (`_L` izquierda, `_R` derecha) `Brazo`, `Antebrazo`, `Muslo` y `Pierna`. Cada parte del modelo sigue a su hueso; en la ropa (camisa y pantalón) los puntos cercanos a hombros, codos, cadera y rodillas se reparten entre dos huesos para que se doble suave.

Las animaciones **no están guardadas en el archivo**: se calculan en `Personaje.js` en cada fotograma con ondas (seno y coseno), según la velocidad:

| Animación | Cuándo | Qué se mueve |
|---|---|---|
| Quieto | Sin pulsar teclas | Respira, mueve un poco los brazos y gira la cabeza |
| Caminar | W A S D (2 m/s) | Piernas y brazos se balancean alternados, pasos cortos |
| Correr | Con Shift (5 m/s) | Zancadas largas, rodillas muy dobladas, codos doblados, cuerpo inclinado hacia delante |
| Saltar | Espacio | Encoge las piernas y abre los brazos mientras está en el aire |

El cambio entre una y otra es gradual (no hay saltos bruscos), y los números de cada animación (amplitud de piernas, brazos, inclinación…) están al final de `Personaje.js`, en la función `animar`.

---

## 4.3 El carro

**Diseño.** Es un descapotable de un solo asiento hecho a la medida del personaje: mide 2.24 m de largo, 1.24 m de ancho y 0.90 m de alto (el personaje mide 1.25 m). Tiene carrocería redondeada, cuatro guardabarros, parabrisas, asiento, volante, tablero, faros, luces traseras, parachoques, espejos, escapes y placa. Se modeló en Blender con el script `crear_carro.py` (39 piezas).

**Piezas con nombre especial** (el juego las busca por su nombre; si se renombran en Blender hay que cambiar `Vehiculo.js`):

| Nombre | Para qué |
|---|---|
| `Rueda_FL`, `Rueda_FR`, `Rueda_RL`, `Rueda_RR` | Las cuatro ruedas (F delantera, R trasera · L izquierda, R derecha). Giran al avanzar y las delanteras doblan. |
| `Volante` | Gira al doblar. |
| `Punto_Asiento` | Punto invisible que marca dónde queda la cadera del personaje al sentarse. |
| Materiales `carroceria` y `asiento` | Los que el jugador puede recolorear. |
| Material `vidrio` | El parabrisas; el juego lo vuelve transparente. |

**Dónde aparece.** Al empezar, estacionado 1.9 m a la derecha del personaje y mirando hacia el mismo lado (`ladoInicio` en `mundo.js`).

**Subir y bajar.** A menos de 2.2 m del carro aparece el aviso "Pulsa E para subir al carro". Al subir, el personaje pasa a ser parte del carro (se mueve e inclina con él) y adopta la postura de sentado con las manos al volante. Para bajar hay que ir casi parado; el personaje queda de pie a la izquierda del carro (o a la derecha si a la izquierda hay un árbol o una roca).

**Conducir.** W acelera (hasta 9 m/s), S frena y, ya parado, da marcha atrás (hasta 3.5 m/s). A y D doblan las ruedas delanteras; cuanto más rápido va, menos doblan, para que no se descontrole. Al soltar las teclas se va frenando solo. El carro mide la altura del suelo bajo cada rueda para subir, bajar e inclinarse con el terreno. Choca con árboles y rocas grandes y no puede salir del mundo. A pie, el personaje tampoco puede atravesar el carro.

**En el menú.** El botón "🚗 Ver carro" cambia el personaje por el carro sobre la plataforma (a mitad de tamaño para que quepa). En PERSONALIZAR hay dos pestañas nuevas, "Carro" y "Asiento", con la misma paleta de colores. Los colores se guardan en el navegador junto con los del personaje.

---

## 4.4 Las cabañas, las instrucciones y el mapa

**La cabaña.** Se modeló en Blender con `crear_cabana.py`: mide unos 5.2 m de ancho, 5.8 m de fondo (con porche y escaleras) y 4.4 m de alto. Tiene **35 piezas separadas**, cada una con su nombre:

| Pieza(s) | Qué es |
|---|---|
| `Base`, `Piso`, `Porche_Piso` | Base de piedra y pisos de tablas |
| `Pared_Frente`, `Pared_Atras`, `Pared_Izquierda`, `Pared_Derecha` | Paredes de troncos, con los huecos de puerta y ventanas |
| `Hastial_Izquierdo`, `Hastial_Derecho` | Los triángulos de tablas bajo el techo |
| `Techo_Frente`, `Techo_Atras`, `Techo_Porche`, `Cumbrera` | Techo de tejas en hileras |
| `Chimenea` | Chimenea de piedra |
| `Marco_Puerta`, `Puerta` | La puerta (su origen está en la bisagra para poder abrirla) |
| `Ventana_*` (4), `Contraventanas_*` (4), `Jardinera_*` (2) | Ventanas iluminadas, contraventanas verdes y jardineras con flores |
| `Porche_Postes`, `Porche_Baranda`, `Escaleras` | Porche con postes, baranda y tres escalones |
| `Letrero`, `Farol`, `Barril`, `Interior` | Tabla del letrero, detalles y el cuarto que se ve al abrir la puerta |
| `Punto_Letrero`, `Punto_Entrada` | Puntos invisibles de referencia |

El juego busca por nombre `Puerta`, `Punto_Letrero` y el material `puerta`; si se renombran hay que cambiar `Cabanas.js`.

**Los temas** (en `src/datos/cabanas.js`), en el orden del camino desde el inicio:

1. Árbol genealógico · 2. Línea de aprendizaje · 3. ¿Qué significa ser estudiante? · 4. Sentido de la formación · 5. Capital cultural · 6. ¿Para qué sirve ingresar a la universidad? · 7. DBA · 8. Poniendo a prueba mis habilidades

**Dónde están.** Repartidas a lo largo del camino, a 8.5 m de él y mirando hacia él; las impares por fuera del circuito y las pares por dentro. La primera queda a unos 14 m del punto de inicio. Bajo cada cabaña el terreno se aplana (`aplanar` en `Terreno.js`) para que no quede torcida, se pinta un sendero de tierra hasta el camino y no crecen árboles.

**Entrar.** A pie, frente a las escaleras, aparece el aviso "Pulsa Enter para entrar a la cabaña…". Al pulsarlo se pide el **nombre del estudiante** (no deja entrar con el nombre vacío). Luego la puerta se abre, la pantalla se oscurece un instante y el personaje aparece **dentro**.

**El interior.** Se modeló con `crear_interior.py` (25 piezas: `Piso_Interior`, `Pared_Interior_*`, `Techo_Interior`, `Mesa`, `Libro`, `Silla_*`, `Chimenea_Interior`, `Estante`, `Cartel_Interior`, `Banca`, `Lampara`, `Vela`, `Alfombra`, `Ventana_Interior_*`, `Puerta_Salida`…). Mide 8 × 7 m: es más grande por dentro que la cabaña por fuera para que el personaje y la cámara quepan. Es **un solo cuarto para las 8 cabañas**, escondido 60 m bajo el suelo; al entrar cambia el cartel de la pared y el color del libro y de la puerta. Dentro, la cámara no atraviesa las paredes, no se ve el mapa y no se puede usar el carro.

**El libro.** Está abierto en la mitad de la mesa, con un letrerito "CLIC" flotando encima. Al hacerle clic (o con Enter estando junto a la mesa) se abre el panel con el tema, quién presenta y la reflexión. Se cierra con Esc, con la ✕ o con "CERRAR EL LIBRO".

**Salir.** Junto a la puerta (por donde se entró) aparece "Pulsa Enter para salir de la cabaña"; el personaje vuelve a quedar frente a las escaleras.

**Cambiar una reflexión.** Se edita su archivo en `public/contenidos/paradas/` (se llama igual que el `id` del tema). `# ` es un título, `- ` un punto de lista, `**texto**` negrita y una línea en blanco separa párrafos.

**Tablero de instrucciones.** Está a la izquierda del punto de inicio (el carro queda a la derecha), con un "?" amarillo flotando encima. Las instrucciones se abren al acercarse a menos de 1.9 m, con Enter estando junto a él, o haciéndole clic desde cualquier distancia.

**Mapa.** En la esquina superior izquierda, semitransparente. Muestra el camino, las cabañas con su número y color, el tablero (?), el carro (cuadrito blanco) y al jugador (flecha roja que apunta hacia donde mira). Con un clic o la tecla M se agranda y muestra la lista de temas; otro clic lo achica. El botón "☰ Menú" pasó a la esquina superior derecha.

---

## 5. Convenciones (reglas del proyecto)

- **Nombres de archivos** en minúsculas, sin espacios ni tildes: `motor.mp3`, `carro.glb`, `parada-01.md`.
- **Clases** (entidades y escenas) con mayúscula inicial: `Personaje.js`, `Vehiculo.js`, `EscenaMundo.js`.
- **Recursos nuevos**: se guardan en `public/assets/` y su ruta se registra en `src/config/rutas.js`.
- **Cabañas (paradas) nuevas**: se agrega el tema en `src/datos/cabanas.js` y se crea su texto `public/contenidos/paradas/<id>.md`. El juego la coloca sola en el camino y en el mapa.
- **Regenerar la cabaña**: abrir Blender y ejecutar `herramientas/blender/crear_cabana.py` (por fuera) o `crear_interior.py` (por dentro). Si se cambia el tamaño del interior, cambiar también `INTERIOR` en `mundo.js`.
- **Colores del personaje**: los materiales `camiseta`, `pantalon` y `zapatos` del modelo son los que el jugador puede cambiar.
- **Regenerar el carro**: abrir Blender y ejecutar `herramientas/blender/crear_carro.py` (cambiar medidas o piezas ahí, no a mano en el `.glb`).
- **Regenerar el personaje**: abrir Blender y ejecutar `herramientas/blender/crear_personaje.py` (crea el modelo y luego le pone el esqueleto).
- **Solo rehacer el esqueleto** (sin volver a modelar): `blender --background arte/blender/personaje.blend --python herramientas/blender/rig_personaje.py`.
- **Si se renombra un hueso** en Blender hay que cambiar el mismo nombre en `src/entidades/Personaje.js`.
- **Ajustes del mundo y del jugador**: siempre en `src/config/mundo.js`, no repartidos por el código.
- **Este documento** se actualiza cada vez que se agrega o cambia algo.

---

## 6. Plan de trabajo

| # | Paso | Estado |
|---|---|---|
| 1 | Estructura de carpetas | ✅ Hecho |
| 2 | Menú de inicio con personaje personalizable | ✅ Hecho |
| 3 | Mundo 3D: terreno con colinas, camino de tierra, cielo, nubes, árboles | ✅ Hecho |
| 3b | Personaje con esqueleto: caminar, correr y saltar; cámara que lo sigue | ✅ Hecho |
| 4 | Carro: diseño, subir, bajar, conducir y cambiarle el color en el menú | ✅ Hecho |
| 5 | Cabañas (paradas): letrero, pedir nombre, entrar, libro con la reflexión; instrucciones y mapa | ✅ Hecho |
| 6 | Reflexión de cada tema | ⏳ Pendiente (los 8 archivos tienen texto de ejemplo) |
| 7 | Música y efectos de sonido | ⏳ Pendiente |
| 8 | Pulido final y prueba de la exposición | ⏳ Pendiente |

---

## 7. Bitácora (historial de cambios)

### 2026-11-11 — Base del proyecto
- Se creó el proyecto con Three.js y `http-server` (`npm run runserver`).
- Se creó la estructura inicial: `src/` (config, escenas, entidades, sistemas, ui, estilos), `public/assets/` (modelos, sonidos, texturas, imágenes, fuentes), `arte/`, `herramientas/` y `docs/`.
- Se modeló el personaje en Blender con un script (`crear_personaje.py`) y se exportó a `personaje.glb`.
- Se hizo el menú de inicio: personaje 3D que gira con el mouse, botones JUGAR / PERSONALIZAR / CONTROLES y cambio de color de camiseta, pantalón y zapatos (se guarda en el navegador).

### 2026-11-12 — Idea completa del juego y carpetas nuevas
- Se definió la idea: mundo 3D para caminar, carro para conducir y paradas que muestran textos de clase al presionar Enter, con música.
- Se agregaron carpetas nuevas:
  - `src/datos/` — lista de paradas.
  - `src/sistemas/audio/`, `camara/`, `controles/`, `interaccion/`.
  - `public/assets/modelos/vehiculos/` y `modelos/paradas/`.
  - `public/assets/sonidos/ambiente/`.
  - `public/contenidos/paradas/` y `contenidos/imagenes/` — textos e imágenes para exponer.
- Se actualizó la sección de estructura del `README.md`.
- Se creó este documento (`docs/DOCUMENTACION.md`).

### 2026-11-12 — El mundo y el personaje animado
- **Esqueleto del personaje:** se creó `herramientas/blender/rig_personaje.py`, que le pone 11 huesos al modelo y lo vuelve a exportar. `crear_personaje.py` ahora lo ejecuta al final.
- **Animaciones:** `Personaje.js` ahora anima al personaje (quieto, caminar, correr, saltar).
- **Mundo:** se crearon `Terreno.js` (pasto con colinas, montañas alrededor y camino de tierra en circuito), `Cielo.js` (cielo azul, sol y nubes) y `Vegetacion.js` (árboles, arbustos, rocas y flores).
- **Controles y cámara:** se crearon `Teclado.js`, `ControlPersonaje.js` (caminar, correr con Shift, saltar con Espacio, choques con árboles y rocas, límite del mundo) y `CamaraSeguimiento.js` (cámara en tercera persona que se gira arrastrando).
- **Escena:** se creó `EscenaMundo.js`, que une todo. `EscenaMenu.js` ganó el método `detener()`.
- **Entrada al mundo:** el botón JUGAR ya no dice "¡PRÓXIMAMENTE!": muestra la cortina y entra al mundo con el mismo personaje y sus colores.
- **Interfaz:** barra de indicaciones y botón "☰ Menú" durante el juego (`juego.css`); el cuadro de CONTROLES ahora explica Shift, Espacio y la cámara.
- **Configuración:** se creó `src/config/mundo.js` con todos los números ajustables, y `src/sistemas/azar.js`.
- **Decisión:** el terreno se genera con código en vez de modelarse en Blender (ver sección 4.1).
- **Probado:** el menú, la entrada al mundo y las posturas de caminar, correr y saltar se revisaron con capturas en el navegador. Falta la prueba a mano con teclado y ratón.

### 2026-11-12 — El carro
- **Modelo:** se creó `herramientas/blender/crear_carro.py` y se ejecutó en Blender (conectado). Genera el descapotable, `public/assets/modelos/vehiculos/carro.glb` y `arte/blender/carro.blend`.
- **Carro en el juego:** se crearon `Vehiculo.js` (modelo, colores, ruedas y volante), `ControlVehiculo.js` (avanzar, frenar, marcha atrás, girar, seguir el terreno, choques) e `InteraccionVehiculo.js` (subir y bajar con E).
- **Personaje:** nueva postura de sentado al volante en `Personaje.js`; los brazos acompañan el giro.
- **Cámara:** al conducir se aleja y vuelve sola a ponerse detrás del carro.
- **Mundo:** el carro aparece estacionado a la derecha del personaje al empezar.
- **Menú:** botón "Ver carro / Ver personaje" y pestañas "Carro" y "Asiento" para cambiarle el color; se guardan con los demás colores.
- **Interfaz:** aviso amarillo "Pulsa E para subir/bajar", tecla E en la barra de indicaciones y en el cuadro de CONTROLES.
- **Configuración:** bloque `VEHICULO` en `mundo.js`, `PARTES_CARRO` en `colores.js` y la ruta del carro en `rutas.js`.
- **Probado** con capturas en el navegador: carro al lado al empezar, subir, postura sentado, avanzar, girar, marcha atrás, bajar y la vista del carro en el menú. Falta la prueba a mano.

### 2026-11-12 — Arreglo del panel PERSONALIZAR
- **Problema:** con las pestañas nuevas del carro, el panel quedaba cortado por abajo en pantallas de poca altura.
- **Arreglo (`src/estilos/menu.css`):** al abrir PERSONALIZAR el menú se compacta (logo, JUGAR y botones más pequeños) y la paleta pasa de 3 filas de 6 colores a 2 filas de 9. Si la pantalla es muy baja, el panel permite desplazarse.
- Las reglas de las 5 pestañas (3 del personaje arriba, 2 del carro abajo) se movieron de `juego.css` a `menu.css`, que es donde corresponden.
- **Probado** con capturas a 1366×650 y 1280×560. La vista de móvil no se revisó.

### 2026-11-16 — Cabañas, instrucciones y mapa
- **Modelo:** se creó `herramientas/blender/crear_cabana.py` y se ejecutó en Blender (conectado). Genera la cabaña de madera con 35 piezas separadas (paredes, techos, puerta, ventanas, escaleras, porche, chimenea, letrero…), `public/assets/modelos/paradas/cabana.glb` y `arte/blender/cabana.blend`.
- **Cabañas en el mundo:** `src/datos/cabanas.js` (los 8 temas) y `Cabanas.js` (las coloca junto al camino, cada una con su letrero y su puerta de color). "Sentido de la formación" venía dos veces en la lista de temas: se dejó una sola cabaña.
- **Terreno:** `Terreno.js` ahora puede aplanar zonas (`aplanar`) y pintar senderos (`pintarSendero`). `Vegetacion.js` deja libres las zonas de las cabañas y del tablero (por eso los árboles cambiaron un poco de sitio).
- **Entrar a una cabaña:** `InteraccionLugares.js` + `juegoUI.js`: Enter frente a la puerta → nombre del estudiante → se abre la puerta y aparece la reflexión, leída de `public/contenidos/paradas/<id>.md` (8 archivos con texto de ejemplo).
- **Instrucciones:** `TableroInstrucciones.js`, junto al inicio; se abren al acercarse, con Enter o con un clic.
- **Mapa:** `Minimapa.js`, arriba a la izquierda; clic o M para agrandarlo. El botón "☰ Menú" pasó arriba a la derecha.
- **Controles:** teclas Enter, Esc y M; `Teclado.js` se pausa mientras hay una ventana abierta. Se agregaron al cuadro de CONTROLES y a la barra de indicaciones.
- **Configuración:** bloques `CABANA` e `INSTRUCCIONES` en `mundo.js`; rutas de la cabaña y de los textos en `rutas.js`.
- **Probado:** el modelo se revisó con una imagen de Blender y el código pasa la revisión de sintaxis. **Falta probarlo en el navegador** (no se pudo abrir desde aquí).

### 2026-11-16 — Entrar a la cabaña y el libro
- **Modelo:** se creó `herramientas/blender/crear_interior.py` y se ejecutó en Blender. Genera el cuarto de dentro (25 piezas, con la mesa y el libro en el centro), `interior_cabana.glb` y `arte/blender/interior_cabana.blend`.
- **Entrar de verdad:** después de escribir el nombre, el personaje pasa al interior (`InteriorCabana.js`). Antes la reflexión salía apenas se escribía el nombre; ahora sale al hacer **clic en el libro**.
- **Controles dentro:** `ControlPersonaje.js` acepta una `zona` rectangular (las paredes) y `CamaraSeguimiento.js` una `caja` de la que no sale la cámara. `InteraccionLugares.js` maneja entrar, el libro y salir.
- **Interfaz:** cortina oscura al entrar y salir (`fundir` en `juegoUI.js`), el botón del panel ahora dice "CERRAR EL LIBRO" y se actualizaron las instrucciones.
- **Configuración:** bloque `INTERIOR` en `mundo.js` y la ruta del interior en `rutas.js`.
- **Probado:** el modelo se revisó con una imagen de Blender y el código pasa la revisión de sintaxis. **Falta probarlo en el navegador.**
