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
- En el menú de inicio se puede **personalizar** el color de la camiseta, el pantalón y los zapatos del personaje.

### Controles previstos

| Tecla | Acción |
|---|---|
| W A S D / flechas | Caminar o conducir |
| E | Subir o bajar del carro |
| Enter | Abrir la parada cercana |
| Esc | Cerrar el panel de la parada |

*(Pueden cambiar cuando se programen los controles.)*

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

| Archivo | Qué hace |
|---|---|
| `index.html` | Página del juego. Contiene el menú de inicio (JUGAR, PERSONALIZAR, CONTROLES), el lienzo 3D y carga Three.js. |
| `src/main.js` | Arranca el juego: carga los colores guardados, crea la escena del menú, carga el personaje y conecta los botones. |
| `src/config/rutas.js` | Rutas de todos los recursos. Cada archivo nuevo de `public/assets/` se registra aquí. |
| `src/config/colores.js` | Partes que se pueden recolorear (camiseta, pantalón, zapatos), la paleta de colores y los colores iniciales. |
| `src/escenas/EscenaMenu.js` | Escena 3D del menú: el personaje sobre una plataforma iluminada, se puede girar arrastrando y salta al presionar JUGAR. |
| `src/entidades/Personaje.js` | Carga el modelo `personaje.glb` y permite cambiar el color de sus partes. |
| `src/sistemas/guardado.js` | Guarda y carga los colores del personaje en el navegador (`localStorage`). |
| `src/ui/menuUI.js` | Lógica de los botones del menú: panel de personalizar, paleta de colores, ventana de controles. |
| `src/estilos/menu.css` | Estilos del menú de inicio. |
| `public/assets/modelos/personaje/personaje.glb` | Modelo 3D del personaje usado por el juego. |
| `arte/blender/personaje.blend` | Archivo editable del personaje. |
| `arte/referencias/personaje_referencia.png` | Imagen de referencia del personaje. |
| `herramientas/blender/crear_personaje.py` | Script de Blender que crea el personaje desde cero, lo exporta a `personaje.glb` y guarda el `.blend`. |

> Los archivos `.gitkeep` solo sirven para que las carpetas vacías no se pierdan. Se pueden borrar cuando la carpeta tenga contenido.

---

## 5. Convenciones (reglas del proyecto)

- **Nombres de archivos** en minúsculas, sin espacios ni tildes: `motor.mp3`, `carro.glb`, `parada-01.md`.
- **Clases** (entidades y escenas) con mayúscula inicial: `Personaje.js`, `Vehiculo.js`, `EscenaMundo.js`.
- **Recursos nuevos**: se guardan en `public/assets/` y su ruta se registra en `src/config/rutas.js`.
- **Paradas nuevas**: se escribe su texto en `public/contenidos/paradas/` y se registra en `src/datos/`.
- **Colores del personaje**: los materiales `camiseta`, `pantalon` y `zapatos` del modelo son los que el jugador puede cambiar.
- **Regenerar el personaje**: abrir Blender y ejecutar `herramientas/blender/crear_personaje.py`.
- **Este documento** se actualiza cada vez que se agrega o cambia algo.

---

## 6. Plan de trabajo

| # | Paso | Estado |
|---|---|---|
| 1 | Estructura de carpetas | ✅ Hecho |
| 2 | Menú de inicio con personaje personalizable | ✅ Hecho |
| 3 | Mundo 3D: suelo, luces, cámara y personaje caminando | ⏳ Pendiente |
| 4 | Carro: subir, bajar y conducir | ⏳ Pendiente |
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
