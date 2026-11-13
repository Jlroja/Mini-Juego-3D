# Documentación del Mini Juego 3D

> Este documento se va actualizando con cada cambio del proyecto.
> Explica la idea del juego, qué hay en cada carpeta, qué hace cada archivo y qué se ha hecho en cada sesión.

---

## 1. La idea del juego

Un mini juego 3D que corre en el navegador, hecho para **exponer temas vistos en clase**.

- El jugador maneja un **personaje** que camina por un **mundo 3D**.
- En el mundo hay un **carro**: el personaje puede subirse, conducirlo y bajarse.
- El mundo tiene varias **paradas** (puntos de interés). Cuando el personaje se acerca a una y presiona **Enter**, se abre un **panel con el texto** del tema de clase para exponerlo.
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
| Enter | Abrir la parada cercana | ⏳ Pendiente |
| Esc | Cerrar el panel de la parada | ⏳ Pendiente |

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
| `src/datos/` | Lista de las paradas: nombre, posición en el mundo y archivo de texto que abre. |
| `src/escenas/` | Cada "pantalla" 3D del juego: el menú y el mundo. |
| `src/entidades/` | Cosas que existen dentro del mundo: personaje, carro, paradas. |
| `src/sistemas/audio/` | Música de fondo, efectos de sonido y control de volumen. |
| `src/sistemas/camara/` | Cámara que sigue al personaje cuando camina o al carro cuando conduce. |
| `src/sistemas/controles/` | Lectura del teclado: caminar, conducir, subir y bajar del carro. |
| `src/sistemas/interaccion/` | Detecta cuándo el personaje está cerca de una parada y la abre con Enter. |
| `src/sistemas/guardado.js` | Guarda en el navegador los colores elegidos para el personaje. |
| `src/sistemas/azar.js` | Números al azar repetibles (para que el mundo salga siempre igual) y funciones matemáticas de apoyo. |
| `src/ui/` | Interfaz en HTML: menú, HUD (indicadores en pantalla) y panel de exposición. |
| `src/estilos/` | Archivos CSS. |

### 3.2 `public/assets/` — Recursos del juego

| Carpeta | Qué va ahí | Formato |
|---|---|---|
| `modelos/personaje/` | Modelo del personaje | `.glb` |
| `modelos/vehiculos/` | El carro | `.glb` |
| `modelos/paradas/` | Letreros, kioscos o marcadores de cada parada | `.glb` |
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
| `contenidos/paradas/` | Un archivo de texto por parada: `parada-01.md`, `parada-02.md`… Es lo que aparece en pantalla al presionar Enter. |
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
| `mundo.js` | Todos los números del mundo y del jugador: tamaño del terreno, ancho y forma del camino, cuántos árboles, rocas, flores y nubes hay, velocidad al caminar y correr, fuerza del salto, ajustes de la cámara y todo lo del carro (`VEHICULO`: velocidad, aceleración, frenado, giro, dónde aparece). **Para cambiar el mundo se empieza por aquí.** |

### Escenas (`src/escenas/`)

| Archivo | Qué hace |
|---|---|
| `EscenaMenu.js` | Escena 3D del menú: el personaje (o el carro, con `mostrar('carro')`) sobre una plataforma iluminada, se puede girar arrastrando y salta al presionar JUGAR. Con `detener()` se apaga para dar paso al mundo. |
| `EscenaMundo.js` | El mundo del juego. Junta el terreno, el cielo, la vegetación, las luces (sol con sombras), el personaje, el carro, los controles y la cámara, y los actualiza en cada fotograma. Estaciona el carro a la derecha del personaje al empezar. |

### Entidades (`src/entidades/`)

| Archivo | Qué hace |
|---|---|
| `Personaje.js` | Carga `personaje.glb`, permite cambiar el color de sus partes y lo **anima** moviendo los huesos: quieto (respira y mira alrededor), caminar, correr, saltar y sentado al volante. |
| `Vehiculo.js` | Carga `carro.glb`, permite cambiar el color de la carrocería y del asiento, y hace girar las ruedas y el volante. |
| `Terreno.js` | El suelo: pasto verde con colinas suaves, montañas alrededor y el camino de tierra en circuito. Tiene la función `alturaTerreno(x, z)` que dice a qué altura está el suelo en cualquier punto. |
| `Cielo.js` | Cielo azul con degradado (más claro en el horizonte), el sol y las nubes que se mueven despacio. |
| `Vegetacion.js` | Árboles (pinos y de copa redonda), arbustos, rocas y flores repartidos por el mundo sin tapar el camino. También guarda la lista de obstáculos contra los que choca el jugador. |

### Sistemas (`src/sistemas/`)

| Archivo | Qué hace |
|---|---|
| `controles/Teclado.js` | Sabe qué teclas están pulsadas y las traduce a acciones: adelante, atrás, izquierda, derecha, correr, saltar. También detecta el momento exacto en que se pulsa una tecla (para la E). |
| `controles/ControlPersonaje.js` | Mueve al personaje: camina o corre según el teclado, lo mantiene pegado al suelo en subidas y bajadas, hace el salto, lo frena contra árboles y rocas y no lo deja salir del mundo. |
| `controles/ControlVehiculo.js` | Conduce el carro: acelera, frena, marcha atrás y gira. Lo apoya sobre el terreno (se inclina en las subidas), lo frena contra árboles y rocas y no lo deja salir del mundo. |
| `interaccion/InteraccionVehiculo.js` | Subir y bajar del carro con E. Muestra el aviso "Pulsa E para subir al carro" cuando el personaje está cerca. |
| `camara/CamaraSeguimiento.js` | Cámara en tercera persona que sigue al personaje o al carro. Se gira arrastrando y se acerca con la rueda. No se mete bajo tierra. Al conducir se aleja un poco y vuelve sola a ponerse detrás del carro. |
| `azar.js` | Números al azar repetibles y funciones matemáticas de apoyo (`limitar`, `mezclar`, `escalon`, `suavizar`). |
| `guardado.js` | Guarda y carga los colores del personaje en el navegador (`localStorage`). |

### Interfaz y estilos

| Archivo | Qué hace |
|---|---|
| `src/ui/menuUI.js` | Lógica de los botones del menú: panel de personalizar, paleta de colores, ventana de controles, el botón "Ver carro / Ver personaje" y la cortina de "¡PREPARADOS!" al pulsar JUGAR. |
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

## 5. Convenciones (reglas del proyecto)

- **Nombres de archivos** en minúsculas, sin espacios ni tildes: `motor.mp3`, `carro.glb`, `parada-01.md`.
- **Clases** (entidades y escenas) con mayúscula inicial: `Personaje.js`, `Vehiculo.js`, `EscenaMundo.js`.
- **Recursos nuevos**: se guardan en `public/assets/` y su ruta se registra en `src/config/rutas.js`.
- **Paradas nuevas**: se escribe su texto en `public/contenidos/paradas/` y se registra en `src/datos/`.
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
| 5 | Paradas: acercarse, presionar Enter y mostrar el texto | ⏳ Pendiente |
| 6 | Textos de clase de cada parada | ⏳ Pendiente (faltan los temas) |
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
