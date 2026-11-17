# Mini Juego 3D

Juego 3D para navegador hecho con Three.js.

📖 Documentación completa (idea, carpetas, archivos e historial): [docs/DOCUMENTACION.md](docs/DOCUMENTACION.md)

## Cómo ejecutarlo

```powershell
npm install        # solo la primera vez
npm run runserver  # abre http://localhost:8000/
```

## Estructura

```
mini-juego-3d/
├─ index.html              Página del juego (pantalla de inicio)
├─ package.json            Comandos del proyecto
├─ src/                    Código
│  ├─ main.js              Punto de entrada
│  ├─ config/              Constantes: rutas de recursos, colores, medidas del mundo (mundo.js)
│  ├─ datos/               cabanas.js: los temas de las cabañas (paradas)
│  ├─ escenas/             Escenas 3D (EscenaMenu, EscenaMundo)
│  ├─ entidades/           Objetos del juego (Personaje, Vehiculo, Terreno, Cielo, Vegetacion, Cabanas, TableroInstrucciones)
│  ├─ sistemas/            Lógica transversal
│  │  ├─ audio/            Música de fondo, efectos, volumen
│  │  ├─ camara/           Cámara que sigue al personaje o al carro
│  │  ├─ controles/        Teclado: caminar, subir/bajar del carro, conducir
│  │  ├─ interaccion/      Subir al carro; entrar a las cabañas y abrir las instrucciones
│  │  └─ guardado.js       Guardar progreso/preferencias
│  ├─ ui/                  Interfaz HTML (menú, ventanas del juego, mapa)
│  └─ estilos/             CSS
├─ public/assets/          Recursos que carga el juego
│  ├─ modelos/             .glb → personaje/, vehiculos/, paradas/, objetos/, escenarios/
│  ├─ sonidos/             .mp3/.ogg → musica/, efectos/, ambiente/, voces/
│  ├─ texturas/            Imágenes para materiales 3D
│  ├─ imagenes/            Imágenes 2D → ui/, iconos/
│  └─ fuentes/             Tipografías locales
├─ public/contenidos/      Lo que se expone en cada parada (se edita sin tocar código)
│  ├─ paradas/             Un archivo por cabaña con su reflexión: dba.md, capital-cultural.md…
│  └─ imagenes/            Imágenes que acompañan los textos de las paradas
├─ arte/                   Archivos fuente (no los carga el juego)
│  ├─ blender/             .blend editables
│  └─ referencias/         Imágenes de referencia
├─ herramientas/           Scripts de apoyo
│  └─ blender/             crear_personaje.py, rig_personaje.py (esqueleto), crear_carro.py, crear_cabana.py y crear_interior.py
└─ docs/                   Documentación de diseño
```

## Controles

A pie: W A S D moverse · Shift correr · Espacio saltar · arrastrar el ratón para girar la cámara · rueda para acercar.
Carro: E para subir o bajar · W acelera · S frena y da marcha atrás · A y D giran.
Cabañas: Enter frente a la puerta (pide el nombre del estudiante) para entrar · clic en el libro de la mesa para exponer · Esc para cerrar · Enter junto a la puerta para salir · M o clic para agrandar el mapa.
Para probar rápido, `http://localhost:8000/?jugar` entra directo al mundo.

## Convenciones

- Para agregar una cabaña (parada): registrar el tema en `src/datos/cabanas.js` y crear su texto `public/contenidos/paradas/<id>.md`.
- Para regenerar la cabaña: abrir Blender y ejecutar `herramientas/blender/crear_cabana.py`.
- Los recursos nuevos se guardan en `public/assets/` y su ruta se registra en `src/config/rutas.js`.
- Nombres de archivos de recursos en minúsculas y sin espacios: `salto.mp3`, `moneda.glb`.
- Los materiales `camiseta`, `pantalon` y `zapatos` del personaje son los que el jugador puede recolorear.
- Para regenerar el carro: abrir Blender y ejecutar `herramientas/blender/crear_carro.py`.
- Para regenerar el personaje: abrir Blender y ejecutar `herramientas/blender/crear_personaje.py`
  (limpia la escena, crea el modelo, le pone el esqueleto, lo exporta a `public/assets/modelos/personaje/` y guarda el `.blend` en `arte/blender/`).
