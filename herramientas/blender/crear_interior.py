"""Crea el interior de la cabaña: el cuarto al que entra el personaje, con la mesa y el libro.

Uso: abrir Blender y ejecutar este archivo (pestaña Scripting > Abrir > Ejecutar), o
    blender --background --python herramientas/blender/crear_interior.py

Qué hace: limpia la escena, modela el cuarto pieza por pieza, lo exporta a
public/assets/modelos/paradas/interior_cabana.glb y guarda arte/blender/interior_cabana.blend.

El cuarto es más grande por dentro que la cabaña por fuera (8 × 7 m), para que el personaje
y la cámara quepan cómodos. Es el mismo para todas las cabañas: el juego cambia el cartel,
el color del libro y el de la puerta.

Nombres que usa el juego (no cambiarlos sin cambiar src/entidades/InteriorCabana.js):
  - Objeto  Libro (se le hace clic para exponer).   - Objeto  Punto_Cartel (ahí se escribe el tema).
  - Materiales  libro_tapa y puerta (se pintan del color de la cabaña).
Las medidas ANCHO, FONDO y ALTO deben coincidir con INTERIOR en src/config/mundo.js.
La puerta de salida está en la pared de -Y (en el juego, +Z). El piso está en Z = 0.
"""
import bpy, bmesh, math, os, random
from mathutils import Vector, Matrix, Euler

PROJ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT_GLB = os.path.join(PROJ, "public", "assets", "modelos", "paradas", "interior_cabana.glb")
OUT_BLEND = os.path.join(PROJ, "arte", "blender", "interior_cabana.blend")

# ---------------- Medidas principales (metros; el personaje mide 1.25) ----------------
ANCHO, FONDO, ALTO = 8.0, 7.0, 3.0
A, B = ANCHO / 2, FONDO / 2
R_TRONCO, PASO = 0.16, 0.3
azar = random.Random(11)

# ---------------- Limpiar escena ----------------
if bpy.context.object and bpy.context.object.mode != 'OBJECT':
    bpy.ops.object.mode_set(mode='OBJECT')
for ob in list(bpy.data.objects):
    bpy.data.objects.remove(ob, do_unlink=True)
for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
    for d in list(coll):
        if d.users == 0:
            coll.remove(d)

# ---------------- Materiales ----------------
def lin(c):
    c /= 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def mat(name, hexa, rough=0.85, metal=0.0, emision=0.0):
    rgb = tuple(lin(int(hexa[i:i + 2], 16)) for i in (1, 3, 5))
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emision:
        b.inputs["Emission Color"].default_value = (*rgb, 1)
        b.inputs["Emission Strength"].default_value = emision
    m.diffuse_color = (*rgb, 1)
    return m

M = {n: mat(n, *v) for n, v in {
    "tronco":         ("#9a6a42", 0.9),
    "madera_oscura":  ("#553521", 0.9),
    "tabla":          ("#b07a45", 0.85),
    "tabla_2":        ("#a06c3a", 0.85),
    "piedra":         ("#8f9194", 0.95),
    "piedra_oscura":  ("#5d5f63", 0.95),
    "hollin":         ("#1c1614", 1.0),
    "fuego":          ("#ff8a1f", 0.5, 0.0, 3.0),
    "fuego_2":        ("#ffd23f", 0.5, 0.0, 3.5),
    "puerta":         ("#3f6fa8", 0.7),
    "ventana_cielo":  ("#cdeeff", 0.3, 0.0, 1.4),
    "luz_calida":     ("#ffe9a8", 0.3, 0.0, 2.0),
    "metal":          ("#2a2a2e", 0.45, 0.8),
    "alfombra":       ("#a8323a", 1.0),
    "alfombra_2":     ("#d9b56a", 1.0),
    "libro_tapa":     ("#7b5cff", 0.6),
    "papel":          ("#fbf6e6", 0.9),
    "tinta":          ("#4a4038", 0.9),
    "cinta":          ("#e63946", 0.7),
    "lomo_1":         ("#2fae62", 0.7),
    "lomo_2":         ("#1f8fe0", 0.7),
    "lomo_3":         ("#e0b400", 0.7),
    "lomo_4":         ("#e0409a", 0.7),
    "cojin":          ("#3f7d4a", 0.95),
}.items()}

root = bpy.data.objects.new("Interior_Cabana", None)
bpy.context.scene.collection.objects.link(root)

# ---------------- Ayudantes (los mismos de crear_cabana.py) ----------------
class Pieza:
    """Un objeto del cuarto. Se le van sumando cajas, troncos y bolas, cada uno con su material."""
    def __init__(self, nombre):
        self.nombre, self.bm, self.mats = nombre, bmesh.new(), []

    def _mat(self, nombre):
        if nombre not in self.mats:
            self.mats.append(nombre)
        return self.mats.index(nombre)

    def _pintar(self, verts, material, suave=False):
        caras = {f for v in verts for f in v.link_faces}
        i = self._mat(material)
        for f in caras:
            f.material_index = i
            f.smooth = suave
        return caras

    def caja(self, material, centro, tam, rot=(0, 0, 0)):
        verts = bmesh.ops.create_cube(self.bm, size=1.0)['verts']
        bmesh.ops.scale(self.bm, vec=Vector(tam), verts=verts)
        if any(rot):
            bmesh.ops.rotate(self.bm, cent=(0, 0, 0), matrix=Euler(rot).to_matrix(), verts=verts)
        bmesh.ops.translate(self.bm, vec=Vector(centro), verts=verts)
        self._pintar(verts, material)

    def tronco(self, material, a, b, r, seg=12, tapa=None):
        a, b = Vector(a), Vector(b)
        eje = b - a
        verts = bmesh.ops.create_cone(self.bm, cap_ends=True, cap_tris=False, segments=seg,
                                      radius1=r, radius2=r, depth=eje.length)['verts']
        it = self._mat(tapa or material)
        for f in self._pintar(verts, material, suave=True):
            if len(f.verts) > 4:
                f.material_index = it
                f.smooth = False
                for e in f.edges:
                    e.smooth = False
        bmesh.ops.rotate(self.bm, cent=(0, 0, 0), matrix=eje.to_track_quat('Z', 'Y').to_matrix(), verts=verts)
        bmesh.ops.translate(self.bm, vec=(a + b) / 2, verts=verts)

    def bola(self, material, centro, r, escala=(1, 1, 1)):
        verts = bmesh.ops.create_icosphere(self.bm, subdivisions=2, radius=r)['verts']
        bmesh.ops.scale(self.bm, vec=Vector(escala), verts=verts)
        bmesh.ops.translate(self.bm, vec=Vector(centro), verts=verts)
        self._pintar(verts, material, suave=True)

    def terminar(self, origen=(0, 0, 0), local=False):
        """origen = dónde queda el punto de origen. local=True: la pieza se modeló alrededor de (0,0,0)."""
        bm, o = self.bm, Vector(origen)
        if not local:
            bmesh.ops.translate(bm, vec=-o, verts=bm.verts)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        me = bpy.data.meshes.new(self.nombre)
        bm.to_mesh(me); bm.free()
        for n in self.mats:
            me.materials.append(M[n])
        if hasattr(me, "use_auto_smooth"):
            me.use_auto_smooth = True
        ob = bpy.data.objects.new(self.nombre, me)
        ob.location = o
        ob.parent = root
        bpy.context.scene.collection.objects.link(ob)
        return ob

def punto(nombre, pos):
    e = bpy.data.objects.new(nombre, None)
    e.empty_display_size = 0.2
    e.location = pos
    e.parent = root
    bpy.context.scene.collection.objects.link(e)

# ---------------- Piso, alfombra y techo ----------------
p = Pieza("Piso_Interior")
for i in range(14):
    p.caja("tabla" if i % 2 else "tabla_2", (0, -B + 0.5 * (i + 0.5), -0.03), (ANCHO + 0.4, 0.49, 0.06))
p.caja("madera_oscura", (0, 0, -0.08), (ANCHO + 0.4, FONDO + 0.4, 0.04))
p.terminar()

p = Pieza("Alfombra")
p.caja("alfombra_2", (0, 0, 0.008), (3.9, 2.9, 0.016))
p.caja("alfombra", (0, 0, 0.012), (3.6, 2.6, 0.02))
p.caja("alfombra_2", (0, 0, 0.016), (2.6, 1.7, 0.02))
p.caja("alfombra", (0, 0, 0.02), (2.3, 1.4, 0.02))
p.terminar()

p = Pieza("Techo_Interior")
p.caja("tabla_2", (0, 0, ALTO + 0.05), (ANCHO + 0.5, FONDO + 0.5, 0.1))
for y in (-2.5, -0.85, 0.85, 2.5):                                  # vigas
    p.tronco("madera_oscura", (-A - 0.1, y, ALTO - 0.1), (A + 0.1, y, ALTO - 0.1), 0.13)
p.terminar()

# ---------------- Paredes de troncos ----------------
Z_TRONCOS = [R_TRONCO - 0.01 + k * PASO for k in range(10)]

def pared(nombre, eje, fijo, mitad, huecos=()):
    """Troncos acostados. eje 'x' = a lo largo de X en y = fijo (o al revés).
    huecos = [(desde, hasta, z_abajo, z_arriba)]: puerta y ventanas. Detrás va una tabla que tapa las rendijas."""
    p = Pieza(nombre)
    fuera = math.copysign(0.14, fijo)
    for zc in Z_TRONCOS:
        tramos = [(-mitad - 0.12, mitad + 0.12)]
        for a, b, z0, z1 in huecos:
            if not z0 < zc < z1:
                continue
            nuevos = []
            for t0, t1 in tramos:
                if b <= t0 or a >= t1:
                    nuevos.append((t0, t1)); continue
                if a > t0: nuevos.append((t0, a))
                if b < t1: nuevos.append((b, t1))
            tramos = nuevos
        for t0, t1 in tramos:
            ini, fin = ((t0, fijo, zc), (t1, fijo, zc)) if eje == 'x' else ((fijo, t0, zc), (fijo, t1, zc))
            p.tronco("tronco", ini, fin, R_TRONCO, tapa="madera_oscura")
    largo = 2 * mitad + 0.5
    if eje == 'x':
        p.caja("madera_oscura", (0, fijo + fuera, ALTO / 2), (largo, 0.06, ALTO + 0.1))
    else:
        p.caja("madera_oscura", (fijo + fuera, 0, ALTO / 2), (0.06, largo, ALTO + 0.1))
    return p.terminar()

PUERTA_ANCHO, PUERTA_ALTO = 1.0, 1.75
VENT = (0.89, 1.79)                                                 # de dónde a dónde (en Z) van las ventanas
pared("Pared_Interior_Frente", 'x', -B, A, [(-PUERTA_ANCHO / 2, PUERTA_ANCHO / 2, -1, PUERTA_ALTO + 0.04),
                                           (-2.9, -1.9, *VENT), (1.9, 2.9, *VENT)])
pared("Pared_Interior_Atras", 'x', B, A)
pared("Pared_Interior_Izquierda", 'y', A, B, [(-0.7, 0.7, *VENT)])
pared("Pared_Interior_Derecha", 'y', -A, B)

def ventana(nombre, centro, ancho, giro):
    """Ventana vista desde dentro: marco, cruz y un vidrio claro (se ve el día afuera). Se modela mirando a +Y."""
    alto, m = VENT[1] - VENT[0], 0.09
    p = Pieza("Ventana_Interior_" + nombre)
    for s in (-1, 1):
        p.caja("madera_oscura", (s * (ancho / 2 + m / 2 - 0.02), 0, 0), (m, 0.4, alto + 2 * m - 0.04))
        p.caja("madera_oscura", (0, 0, s * (alto / 2 + m / 2 - 0.02)), (ancho + 2 * m - 0.04, 0.4, m))
    p.caja("ventana_cielo", (0, -0.05, 0), (ancho, 0.03, alto))
    p.caja("madera_oscura", (0, 0, 0), (0.05, 0.06, alto))
    p.caja("madera_oscura", (0, 0, 0), (ancho, 0.06, 0.05))
    p.caja("madera_oscura", (0, 0.22, -alto / 2 - m / 2), (ancho + 0.3, 0.14, 0.05))      # repisa
    if giro:
        bmesh.ops.rotate(p.bm, cent=(0, 0, 0), matrix=Matrix.Rotation(giro, 3, 'Z'), verts=p.bm.verts)
    p.terminar(centro, local=True)

Z_VENT = (VENT[0] + VENT[1]) / 2
ventana("Frente_Izq", (2.4, -B, Z_VENT), 1.0, 0)
ventana("Frente_Der", (-2.4, -B, Z_VENT), 1.0, 0)
ventana("Izquierda", (A, 0, Z_VENT), 1.4, math.pi / 2)

# ---------------- Puerta de salida ----------------
p = Pieza("Marco_Salida")
for s in (-1, 1):
    p.caja("madera_oscura", (s * (PUERTA_ANCHO / 2 + 0.06), -B, (PUERTA_ALTO + 0.14) / 2), (0.12, 0.42, PUERTA_ALTO + 0.14))
p.caja("madera_oscura", (0, -B, PUERTA_ALTO + 0.08), (PUERTA_ANCHO + 0.24, 0.44, 0.14))
p.terminar()

p = Pieza("Puerta_Salida")
for i in range(4):
    p.caja("puerta", (-PUERTA_ANCHO / 2 + PUERTA_ANCHO / 4 * (i + 0.5), -B, PUERTA_ALTO / 2),
           (PUERTA_ANCHO / 4 - 0.006, 0.06, PUERTA_ALTO))
for z in (0.32, 1.42):
    p.caja("madera_oscura", (0, -B + 0.04, z), (PUERTA_ANCHO - 0.08, 0.03, 0.11))
p.bola("metal", (PUERTA_ANCHO / 2 - 0.13, -B + 0.08, 0.85), 0.045)
p.terminar()

# ---------------- Mesa (en el centro) y sillas ----------------
MESA_Z = 0.6                                                        # altura del tablero
p = Pieza("Mesa")
p.caja("tabla", (0, 0, MESA_Z - 0.035), (1.7, 0.95, 0.07))
p.caja("madera_oscura", (0, 0, MESA_Z - 0.11), (1.5, 0.75, 0.08))
for sx in (-1, 1):
    for sy in (-1, 1):
        p.tronco("madera_oscura", (sx * 0.72, sy * 0.35, 0), (sx * 0.72, sy * 0.35, MESA_Z - 0.07), 0.055, seg=10)
p.terminar()

def silla(nombre, x, lado):
    """lado = +1 si el espaldar queda hacia +X."""
    p = Pieza(nombre)
    p.caja("tabla", (x, 0, 0.36), (0.44, 0.44, 0.05))
    p.caja("cojin", (x, 0, 0.395), (0.36, 0.36, 0.03))
    for sx in (-1, 1):
        for sy in (-1, 1):
            alto = 0.95 if sx == lado else 0.34
            p.caja("madera_oscura", (x + sx * 0.19, sy * 0.19, alto / 2), (0.05, 0.05, alto))
    for z in (0.62, 0.86):
        p.caja("tabla", (x + lado * 0.19, 0, z), (0.035, 0.4, 0.13))
    p.terminar()

silla("Silla_Izquierda", 1.3, 1)
silla("Silla_Derecha", -1.3, -1)

# ---------------- El libro (abierto, en la mitad de la mesa) ----------------
p = Pieza("Libro")                                                  # se modela con su origen sobre la mesa
p.caja("libro_tapa", (0, 0, 0.012), (0.66, 0.46, 0.024))
for s in (-1, 1):
    p.caja("papel", (s * 0.158, 0, 0.045), (0.3, 0.42, 0.045), (0, -s * 0.05, 0))
    for i in range(7):                                              # renglones
        largo = 0.22 if i < 6 else 0.12
        p.caja("tinta", (s * 0.158 - (0.22 - largo) / 2, 0.15 - i * 0.05, 0.0695 + 0.004 * 0), (largo, 0.014, 0.004), (0, -s * 0.05, 0))
p.caja("libro_tapa", (0, 0, 0.03), (0.024, 0.46, 0.036))             # lomo
p.caja("cinta", (0.02, -0.06, 0.066), (0.03, 0.46, 0.004))           # cinta marcapáginas
p.terminar((0, 0, MESA_Z), local=True)

p = Pieza("Vela")
p.caja("metal", (0.62, 0.28, MESA_Z + 0.01), (0.12, 0.12, 0.02))
p.tronco("papel", (0.62, 0.28, MESA_Z + 0.02), (0.62, 0.28, MESA_Z + 0.16), 0.025, seg=8)
p.bola("fuego_2", (0.62, 0.28, MESA_Z + 0.195), 0.022, (1, 1, 1.8))
p.terminar()

# ---------------- Lámpara sobre la mesa ----------------
p = Pieza("Lampara")
p.caja("metal", (0, 0, (ALTO + 2.42) / 2), (0.025, 0.025, ALTO - 2.42))
p.caja("metal", (0, 0, 2.42), (0.3, 0.3, 0.03))
p.caja("luz_calida", (0, 0, 2.3), (0.2, 0.2, 0.22))
p.caja("metal", (0, 0, 2.18), (0.26, 0.26, 0.03))
p.terminar()
punto("Punto_Luz", (0, 0, 2.2))

# ---------------- Chimenea (pared derecha) ----------------
p = Pieza("Chimenea_Interior")
XC = -A + 0.42
p.caja("piedra", (XC, 0, 0.75), (0.7, 2.2, 1.5))
p.caja("piedra", (XC - 0.08, 0, 2.25), (0.5, 1.3, 1.5))
p.caja("madera_oscura", (XC + 0.05, 0, 1.54), (0.86, 2.4, 0.08))     # repisa
p.caja("hollin", (XC + 0.33, 0, 0.52), (0.08, 1.2, 0.9))             # boca
p.caja("piedra_oscura", (XC + 0.5, 0, 0.04), (0.5, 1.6, 0.08))       # solera
for y, r in ((-0.22, 0.2), (0.2, -0.25)):
    p.tronco("tronco", (XC + 0.42, y - 0.3, 0.16), (XC + 0.42 + r * 0.3, y + 0.3, 0.16), 0.07, seg=8, tapa="tabla")
for y, alto, m in ((-0.2, 0.34, "fuego"), (0.05, 0.46, "fuego_2"), (0.26, 0.3, "fuego"), (-0.02, 0.26, "fuego")):
    p.bola(m, (XC + 0.44, y, 0.24 + alto / 2), 0.12, (0.8, 1, alto / 0.24))
p.terminar()
punto("Punto_Fuego", (XC + 0.6, 0, 0.45))

# ---------------- Estante con libros y tabla del cartel (pared del fondo) ----------------
p = Pieza("Estante")
YE = B - 0.36
p.caja("madera_oscura", (0, YE + 0.16, 0.7), (2.6, 0.03, 1.4))
for x in (-1.3, 1.3):
    p.caja("madera_oscura", (x, YE, 0.7), (0.06, 0.36, 1.4))
for z in (0.03, 0.5, 0.95, 1.4):
    p.caja("tabla", (0, YE, z), (2.66, 0.38, 0.05))
for z in (0.055, 0.525, 0.975):
    x = -1.22
    while x < 1.1:
        ancho, alto = azar.uniform(0.07, 0.14), azar.uniform(0.28, 0.4)
        if azar.random() < 0.82:
            p.caja("lomo_%d" % azar.randint(1, 4), (x + ancho / 2, YE - 0.02, z + alto / 2), (ancho - 0.01, 0.26, alto))
        x += ancho
p.terminar()

p = Pieza("Cartel_Interior")
Y_CARTEL, Z_CARTEL = B - 0.2, 2.15
p.caja("tabla", (0, Y_CARTEL + 0.03, Z_CARTEL), (4.0, 0.05, 0.86))
for s in (-1, 1):
    p.caja("madera_oscura", (0, Y_CARTEL + 0.02, Z_CARTEL + s * 0.45), (4.14, 0.09, 0.07))
    p.caja("madera_oscura", (s * 2.035, Y_CARTEL + 0.02, Z_CARTEL), (0.07, 0.09, 0.9))
p.terminar()
punto("Punto_Cartel", (0, Y_CARTEL, Z_CARTEL))

# ---------------- Banca bajo la ventana (pared izquierda) ----------------
p = Pieza("Banca")
XB = A - 0.42
p.caja("tabla", (XB, 0, 0.36), (0.46, 1.9, 0.06))
p.caja("cojin", (XB, 0, 0.41), (0.4, 1.7, 0.05))
for y in (-0.85, 0.85):
    p.caja("madera_oscura", (XB, y, 0.17), (0.42, 0.07, 0.34))
p.terminar()

# ---------------- Cámara y luz (solo para ver el cuarto en Blender) ----------------
cam_data = bpy.data.cameras.new("Camara"); cam_data.lens = 20
cam = bpy.data.objects.new("Camara", cam_data)
cam.location = (2.9, -3.0, 2.5)
cam.rotation_euler = (Vector((-0.8, 0.8, 0.9)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
luz_data = bpy.data.lights.new("Bombillo", 'POINT'); luz_data.energy = 900
luz = bpy.data.objects.new("Bombillo", luz_data)
luz.location = (0.4, -0.6, 2.0)
for o in (cam, luz):
    bpy.context.scene.collection.objects.link(o)
bpy.context.scene.camera = cam

# ---------------- Exportar ----------------
bpy.context.view_layer.update()
partes = list(root.children)
info = {"objetos": len(partes), "nombres": sorted(o.name for o in partes),
        "triangulos": sum(len(q.vertices) - 2 for o in partes if o.type == 'MESH' for q in o.data.polygons)}
os.makedirs(os.path.dirname(OUT_GLB), exist_ok=True)
os.makedirs(os.path.dirname(OUT_BLEND), exist_ok=True)
bpy.ops.object.select_all(action='DESELECT')
root.select_set(True)
for o in partes:
    o.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT_GLB, export_format='GLB', use_selection=True,
                          export_apply=True, export_animations=False)
info["glb_bytes"] = os.path.getsize(OUT_GLB)
bpy.ops.object.select_all(action='DESELECT')
bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
result = info
print("INTERIOR_OK", info)
