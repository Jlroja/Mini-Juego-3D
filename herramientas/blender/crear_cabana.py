"""Crea la cabaña de madera del juego (las "paradas" donde se expone cada tema).

Uso: abrir Blender y ejecutar este archivo (pestaña Scripting > Abrir > Ejecutar), o
    blender --background --python herramientas/blender/crear_cabana.py

Qué hace: limpia la escena, modela la cabaña pieza por pieza, la exporta a
public/assets/modelos/paradas/cabana.glb y guarda arte/blender/cabana.blend.

Cada parte es un objeto aparte: Base, Piso, Pared_Frente, Pared_Atras, Pared_Izquierda,
Pared_Derecha, Hastial_*, Techo_*, Cumbrera, Chimenea, Marco_Puerta, Puerta, Ventana_*,
Contraventanas_*, Jardinera_*, Porche_*, Escaleras, Letrero, Farol, Barril, Interior.

Nombres que usa el juego (no cambiarlos sin cambiar src/entidades/Cabanas.js):
  - Objeto  Puerta (su origen está en la bisagra: el juego la gira para abrirla).
  - Objeto  Punto_Letrero (centro de la tabla del letrero: ahí el juego escribe el tema).
  - Objeto  Interior (no proyecta sombra).  Material  puerta (cada cabaña lo pinta de su color).
El frente de la cabaña mira hacia -Y (en el juego, +Z). El suelo está en Z = 0.
"""
import bpy, bmesh, math, os, random
from mathutils import Vector, Matrix, Euler

PROJ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT_GLB = os.path.join(PROJ, "public", "assets", "modelos", "paradas", "cabana.glb")
OUT_BLEND = os.path.join(PROJ, "arte", "blender", "cabana.blend")

# ---------------- Medidas principales (metros; el personaje mide 1.25) ----------------
ANCHO, FONDO = 4.2, 3.2       # cuerpo de la cabaña (X, Y)
PISO = 0.48                   # altura del piso sobre el suelo
ALTO = 2.0                    # altura de las paredes
CUMBRERA = 1.2                # cuánto sube el techo por encima de las paredes
PORCHE = 1.3                  # fondo del porche (delante de la puerta)
R_TRONCO, PASO, SALIENTE = 0.13, 0.25, 0.3
X, Y = ANCHO / 2, FONDO / 2
Z_PARED = PISO + ALTO
Y_PORCHE = -(Y + PORCHE)      # borde delantero del porche
azar = random.Random(7)

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
    "tronco":         ("#8a5a35", 0.9),
    "madera_corte":   ("#cfa26b", 0.9),
    "madera_oscura":  ("#553521", 0.9),
    "tabla":          ("#a8733f", 0.85),
    "piedra":         ("#8f9194", 0.95),
    "piedra_oscura":  ("#6c6e72", 0.95),
    "techo":          ("#a23f30", 0.8),
    "techo_2":        ("#8a3327", 0.8),
    "puerta":         ("#3f6fa8", 0.7),
    "contraventana":  ("#3f7d4a", 0.75),
    "ventana_luz":    ("#ffe9a8", 0.3, 0.0, 1.2),
    "interior":       ("#6b4a30", 1.0, 0.0, 0.25),
    "metal":          ("#2a2a2e", 0.45, 0.8),
    "letrero":        ("#e2c08a", 0.85),
    "flor_roja":      ("#ff4f6a", 0.7),
    "flor_amarilla":  ("#ffd23f", 0.7),
    "hoja":           ("#4a9d3c", 0.9),
}.items()}

root = bpy.data.objects.new("Cabana", None)
bpy.context.scene.collection.objects.link(root)

# ---------------- Ayudantes ----------------
class Pieza:
    """Un objeto de la cabaña. Se le van sumando cajas, troncos y bolas, cada uno con su material."""
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

    def tronco(self, material, a, b, r, seg=12, tapa=None, r2=None):
        """Cilindro de a hasta b. tapa = material de los extremos (el corte del tronco)."""
        a, b = Vector(a), Vector(b)
        eje = b - a
        verts = bmesh.ops.create_cone(self.bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r,
                                      radius2=r if r2 is None else r2, depth=eje.length)['verts']
        it = self._mat(tapa or material)
        for f in self._pintar(verts, material, suave=True):
            if len(f.verts) > 4:                       # las tapas
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

    def terminar(self, origen=(0, 0, 0), local=False, giro_z=0.0, invertir=False):
        """Crea el objeto. origen = dónde queda su punto de origen.
        local=True: la pieza se modeló alrededor de (0,0,0) y aquí se gira y se lleva a su sitio."""
        bm, o = self.bm, Vector(origen)
        if local:
            if giro_z:
                bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=Matrix.Rotation(giro_z, 3, 'Z'), verts=bm.verts)
        else:
            bmesh.ops.translate(bm, vec=-o, verts=bm.verts)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        if invertir:
            bmesh.ops.reverse_faces(bm, faces=bm.faces)
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
    """Punto invisible de referencia para el juego."""
    e = bpy.data.objects.new(nombre, None)
    e.empty_display_size = 0.15
    e.location = pos
    e.parent = root
    bpy.context.scene.collection.objects.link(e)
    return e

# ---------------- Base de piedra y pisos ----------------
p = Pieza("Base")
p.caja("piedra", (0, (Y + 0.08 + Y_PORCHE) / 2, (PISO - 0.06 - 0.5) / 2),
       (ANCHO + 0.16, Y + 0.08 - Y_PORCHE, PISO - 0.06 + 0.5))
p.terminar()

p = Pieza("Piso")
p.caja("tabla", (0, 0, PISO - 0.03), (ANCHO, FONDO + 0.2, 0.06))
p.terminar()

p = Pieza("Porche_Piso")                                   # tablas sueltas, con una rendija entre ellas
for i in range(6):
    p.caja("tabla", (0, -(Y + 0.1 + 0.2 * (i + 0.5)), PISO - 0.03), (ANCHO + 0.2, 0.19, 0.06))
p.terminar()

# ---------------- Paredes de troncos ----------------
def pared(nombre, eje, fijo, mitad, centros_z, huecos=()):
    """Troncos acostados, uno sobre otro. eje 'x' = a lo largo de X, en y = fijo (o al revés).
    huecos = [(desde, hasta, z_abajo, z_arriba)]: donde van la puerta y las ventanas."""
    p = Pieza(nombre)
    for zc in centros_z:
        ini = -mitad - SALIENTE - azar.uniform(-0.05, 0.05)
        if eje == 'y' and zc > PISO + 1.7:                 # los de arriba no asoman: ahí va el techo del porche
            ini = -mitad - (0.12 if zc < PISO + 1.9 else 0)
        tramos = [(ini, mitad + SALIENTE + azar.uniform(-0.05, 0.05))]
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
            p.tronco("tronco", ini, fin, R_TRONCO, tapa="madera_corte")
    return p.terminar()

Z_FRENTE = [PISO + 0.125 + k * PASO for k in range(8)]     # las paredes del frente y de atrás
Z_LADOS = [PISO + k * PASO for k in range(9)]              # las de los lados van medio tronco corridas (encajan)
PUERTA_ANCHO, PUERTA_ALTO = 0.9, 1.6
VENT_X, VENT_ANCHO, VENT_ALTO = 1.35, 0.8, 0.75            # ventanas del frente (a cada lado de la puerta)
VENT_Z = PISO + 1.125                                      # centro de las ventanas del frente
VENT_Z_LADO = PISO + 1.25                                  # centro de las ventanas de los lados

pared("Pared_Frente", 'x', -Y, X, Z_FRENTE, [
    (-PUERTA_ANCHO / 2, PUERTA_ANCHO / 2, PISO - 0.2, PISO + PUERTA_ALTO + 0.15),
    (-VENT_X - VENT_ANCHO / 2, -VENT_X + VENT_ANCHO / 2, VENT_Z - VENT_ALTO / 2, VENT_Z + VENT_ALTO / 2),
    (VENT_X - VENT_ANCHO / 2, VENT_X + VENT_ANCHO / 2, VENT_Z - VENT_ALTO / 2, VENT_Z + VENT_ALTO / 2)])
pared("Pared_Atras", 'x', Y, X, Z_FRENTE)
hueco_lado = [(-VENT_ANCHO / 2, VENT_ANCHO / 2, VENT_Z_LADO - VENT_ALTO / 2, VENT_Z_LADO + VENT_ALTO / 2)]
pared("Pared_Izquierda", 'y', X, Y, Z_LADOS, hueco_lado)
pared("Pared_Derecha", 'y', -X, Y, Z_LADOS, hueco_lado)

# Hastiales: el triángulo de tablas que cierra cada lado bajo el techo
def hastial(nombre, x):
    p = Pieza(nombre)
    g = 0.09
    v = [p.bm.verts.new((x + sx * g, y, z)) for sx in (-1, 1)
         for y, z in ((-Y, Z_PARED), (Y, Z_PARED), (0, Z_PARED + CUMBRERA))]
    for cara in ((0, 1, 2), (3, 5, 4), (0, 3, 4, 1), (1, 4, 5, 2), (2, 5, 3, 0)):
        p.bm.faces.new([v[i] for i in cara])
    p._pintar(v, "tabla")
    for y in (-1.2, -0.6, 0, 0.6, 1.2):                    # listones verticales
        h = CUMBRERA * (1 - abs(y) / Y) - 0.04
        p.caja("madera_oscura", (x, y, Z_PARED + h / 2), (2 * g + 0.04, 0.05, h))
    return p.terminar()

hastial("Hastial_Izquierdo", X)
hastial("Hastial_Derecho", -X)

# Interior: una caja "al revés" para que, al abrir la puerta, se vea el cuarto por dentro
p = Pieza("Interior")
p.caja("interior", (0, 0, PISO + ALTO / 2 + 0.01), (ANCHO - 0.3, FONDO - 0.3, ALTO))
p.terminar(invertir=True)

# ---------------- Techo ----------------
ANCHO_TECHO = ANCHO + 0.9

def faldon(p, y_ini, z_ini, signo, horizontal, caida, filas):
    """Una caída del techo: una tabla de base y, encima, hileras de tejas montadas una sobre otra.
    Baja desde (y_ini, z_ini) hacia signo*Y."""
    ang, largo = math.atan2(caida, horizontal), math.hypot(horizontal, caida)
    d = Vector((0, signo * math.cos(ang), -math.sin(ang)))          # cuesta abajo
    n = Vector((0, signo * math.sin(ang), math.cos(ang)))           # hacia fuera del techo
    o = Vector((0, y_ini, z_ini))
    p.caja("madera_oscura", o + d * (largo / 2) + n * 0.02, (ANCHO_TECHO - 0.12, largo, 0.04), (-signo * ang, 0, 0))
    paso = largo / filas
    for j in range(filas):
        p.caja("techo" if j % 2 else "techo_2", o + d * (paso * (j + 0.5)) + n * 0.075,
               (ANCHO_TECHO, paso + 0.09, 0.05), (-signo * (ang - 0.07), 0, 0))

Z_CUMBRERA = Z_PARED + CUMBRERA
PEND = CUMBRERA / Y                                        # pendiente del techo principal

p = Pieza("Techo_Atras")
faldon(p, 0, Z_CUMBRERA, 1, Y + 0.38, PEND * (Y + 0.38), 6)
p.terminar()

p = Pieza("Techo_Frente")
faldon(p, 0, Z_CUMBRERA, -1, Y + 0.14, PEND * (Y + 0.14), 5)
p.terminar()

CAIDA_PORCHE, LARGO_PORCHE = 0.42, PORCHE + 0.26           # el techo del porche es más tendido
p = Pieza("Techo_Porche")
faldon(p, -(Y + 0.04), Z_PARED + 0.03, -1, LARGO_PORCHE, CAIDA_PORCHE, 4)
p.terminar()

p = Pieza("Cumbrera")
p.tronco("madera_oscura", (-ANCHO_TECHO / 2 - 0.03, 0, Z_CUMBRERA + 0.09), (ANCHO_TECHO / 2 + 0.03, 0, Z_CUMBRERA + 0.09), 0.1)
p.terminar()

# ---------------- Chimenea ----------------
p = Pieza("Chimenea")
CH = (1.25, 0.8)
p.caja("piedra", (*CH, PISO + 2.8), (0.6, 0.6, 1.8))
p.caja("piedra_oscura", (*CH, PISO + 3.74), (0.76, 0.76, 0.09))
p.caja("piedra", (*CH, PISO + 3.84), (0.5, 0.5, 0.12))
p.caja("metal", (*CH, PISO + 3.905), (0.36, 0.36, 0.01))
p.terminar()

# ---------------- Puerta ----------------
p = Pieza("Marco_Puerta")
for sx in (-1, 1):
    p.caja("madera_oscura", (sx * (PUERTA_ANCHO / 2 + 0.05), -Y, PISO + (PUERTA_ALTO + 0.15) / 2), (0.1, 0.34, PUERTA_ALTO + 0.15))
p.caja("madera_oscura", (0, -Y, PISO + PUERTA_ALTO + 0.075), (PUERTA_ANCHO + 0.2, 0.36, 0.15))
p.caja("madera_oscura", (0, -Y - 0.02, PISO + 0.01), (PUERTA_ANCHO, 0.36, 0.03))        # umbral
p.terminar()

# La puerta se modela con la bisagra en (0,0,0): así el juego la abre girándola
p = Pieza("Puerta")
HOJA = PUERTA_ANCHO - 0.02
for i in range(4):
    p.caja("puerta", (HOJA / 4 * (i + 0.5), 0, PUERTA_ALTO / 2), (HOJA / 4 - 0.006, 0.05, PUERTA_ALTO - 0.03))
for z in (0.3, 1.3):
    p.caja("madera_oscura", (HOJA / 2, -0.035, z), (HOJA - 0.06, 0.025, 0.1))
p.caja("madera_oscura", (HOJA / 2, -0.035, 0.8), (1.12, 0.024, 0.09), (0, -math.atan2(0.9, 0.7), 0))
for y in (-0.07, 0.07):
    p.bola("metal", (HOJA - 0.12, y, 0.78), 0.04)
p.terminar((-HOJA / 2, -Y - 0.03, PISO + 0.02), local=True)

# ---------------- Ventanas ----------------
def ventana(nombre, centro, giro, jardinera=False):
    """Se modela mirando hacia -Y (el vidrio en y = 0) y luego se gira hacia su pared."""
    a, h, m = VENT_ANCHO, VENT_ALTO, 0.08
    p = Pieza("Ventana_" + nombre)
    for s in (-1, 1):
        p.caja("madera_oscura", (s * (a / 2 + m / 2 - 0.02), 0, 0), (m, 0.34, h + 2 * m - 0.04))
        p.caja("madera_oscura", (0, 0, s * (h / 2 + m / 2 - 0.02)), (a + 2 * m - 0.04, 0.34, m))
    p.caja("ventana_luz", (0, 0, 0), (a, 0.03, h))
    p.caja("madera_oscura", (0, -0.02, 0), (0.04, 0.05, h))                 # cruz del vidrio
    p.caja("madera_oscura", (0, -0.02, 0), (a, 0.05, 0.04))
    p.caja("madera_oscura", (0, -0.2, -h / 2 - m / 2), (a + 0.3, 0.12, 0.05))   # repisa
    p.terminar(centro, local=True, giro_z=giro)

    p = Pieza("Contraventanas_" + nombre)
    for s in (-1, 1):
        x = s * (a / 2 + m + 0.17)
        p.caja("contraventana", (x, -0.16, 0), (0.34, 0.04, h + 0.06))
        for z in (-0.22, 0.22):
            p.caja("madera_oscura", (x, -0.185, z), (0.3, 0.02, 0.06))
    p.terminar(centro, local=True, giro_z=giro)

    if jardinera:
        p = Pieza("Jardinera_" + nombre)
        z = -h / 2 - 0.2
        p.caja("madera_oscura", (0, -0.3, z), (a + 0.1, 0.18, 0.16))
        p.caja("hoja", (0, -0.3, z + 0.08), (a + 0.02, 0.12, 0.04))
        for i in range(6):
            x = -a / 2 + 0.1 + i * (a - 0.2) / 5
            p.bola("hoja", (x, -0.3, z + 0.12), 0.07, (1, 1, 0.7))
            p.bola("flor_roja" if i % 2 else "flor_amarilla", (x + 0.02, -0.33, z + 0.19), 0.055)
        p.terminar(centro, local=True, giro_z=giro)

ventana("Frente_Izq", (VENT_X, -Y, VENT_Z), 0, jardinera=True)
ventana("Frente_Der", (-VENT_X, -Y, VENT_Z), 0, jardinera=True)
ventana("Izquierda", (X, 0, VENT_Z_LADO), math.pi / 2)
ventana("Derecha", (-X, 0, VENT_Z_LADO), -math.pi / 2)

# ---------------- Porche: postes, viga y baranda ----------------
Y_POSTE = Y_PORCHE + 0.12
POSTES_X = (-2.0, -0.85, 0.85, 2.0)
Z_VIGA = PISO + 1.6

p = Pieza("Porche_Postes")
for x in POSTES_X:
    p.tronco("tronco", (x, Y_POSTE, PISO), (x, Y_POSTE, Z_VIGA), 0.08, tapa="madera_corte")
p.caja("madera_oscura", (0, Y_POSTE, Z_VIGA + 0.06), (ANCHO + 0.3, 0.14, 0.12))                 # viga del frente
for x in (-2.0, 2.0):                                                                        # vigas de los lados
    p.caja("madera_oscura", (x, (Y_POSTE - Y) / 2, Z_VIGA + 0.06), (0.1, PORCHE - 0.1, 0.1))
p.terminar()

p = Pieza("Porche_Baranda")
tramos = [((sx * 2.0, -Y - 0.14), (sx * 2.0, Y_POSTE)) for sx in (-1, 1)]
tramos += [((sx * 0.85, Y_POSTE), (sx * 2.0, Y_POSTE)) for sx in (-1, 1)]
for (x1, y1), (x2, y2) in tramos:
    for z in (PISO + 0.3, PISO + 0.62):
        p.tronco("madera_oscura", (x1, y1, z), (x2, y2, z), 0.035, seg=8)
    for i in range(1, 5):                                  # barrotes
        t = i / 5
        x, y = x1 + (x2 - x1) * t, y1 + (y2 - y1) * t
        p.tronco("tabla", (x, y, PISO), (x, y, PISO + 0.62), 0.022, seg=6)
p.terminar()

# ---------------- Escaleras ----------------
p = Pieza("Escaleras")
ESCALONES, HUELLA = 3, 0.26
for i in range(ESCALONES):
    arriba = PISO - (PISO / (ESCALONES + 1)) * (i + 1)
    yc = Y_PORCHE - HUELLA * (i + 0.5)
    p.caja("tabla", (0, yc, arriba - 0.025), (1.5, HUELLA + 0.03, 0.05))
    p.caja("madera_oscura", (0, yc, (arriba - 0.05 - 0.5) / 2), (1.4, HUELLA, arriba - 0.05 + 0.5))
p.terminar()
Y_PIE = Y_PORCHE - HUELLA * ESCALONES                      # donde termina la escalera

# ---------------- Letrero (el juego escribe encima el tema de la cabaña) ----------------
Y_LETRERO, Z_LETRERO = Y_PORCHE - 0.12, PISO + 2.24
LETRERO = (3.0, 0.62)
p = Pieza("Letrero")
p.caja("letrero", (0, Y_LETRERO, Z_LETRERO), (LETRERO[0], 0.07, LETRERO[1]))
for s in (-1, 1):                                          # marco
    p.caja("madera_oscura", (0, Y_LETRERO, Z_LETRERO + s * (LETRERO[1] / 2 + 0.02)), (LETRERO[0] + 0.14, 0.11, 0.07))
    p.caja("madera_oscura", (s * (LETRERO[0] / 2 + 0.035), Y_LETRERO, Z_LETRERO), (0.07, 0.11, LETRERO[1] + 0.04))
    p.caja("madera_oscura", (s * 1.2, Y_LETRERO + 0.09, PISO + 1.84), (0.08, 0.08, 0.5))       # soportes
p.terminar()
punto("Punto_Letrero", (0, Y_LETRERO - 0.035, Z_LETRERO))
punto("Punto_Entrada", (0, Y_PIE - 0.6, 0))

# ---------------- Detalles: farol y barril ----------------
p = Pieza("Farol")
F = (0.78, -Y - 0.22, PISO + 1.4)
p.caja("metal", (F[0], -Y - 0.14, F[2] + 0.16), (0.04, 0.2, 0.04))
p.caja("metal", (F[0], F[1], F[2] + 0.1), (0.15, 0.15, 0.03))
p.caja("ventana_luz", F, (0.1, 0.1, 0.17))
p.caja("metal", (F[0], F[1], F[2] - 0.1), (0.13, 0.13, 0.03))
p.terminar()

p = Pieza("Barril")
B = (-1.5, -Y - 0.75)
p.tronco("tabla", (*B, PISO), (*B, PISO + 0.56), 0.2, seg=14, tapa="madera_oscura")
for z in (0.12, 0.44):
    p.tronco("metal", (*B, PISO + z - 0.02), (*B, PISO + z + 0.02), 0.208, seg=14)
p.terminar()

# ---------------- Cámara y luz (solo para ver la cabaña en Blender) ----------------
cam_data = bpy.data.cameras.new("Camara"); cam_data.lens = 40
cam = bpy.data.objects.new("Camara", cam_data)
cam.location = (6.5, -10.5, 4.2)
cam.rotation_euler = (Vector((0, -0.6, 1.9)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
luz_data = bpy.data.lights.new("Sol", 'SUN'); luz_data.energy = 3.5
luz = bpy.data.objects.new("Sol", luz_data)
luz.rotation_euler = (math.radians(55), 0, math.radians(30))
for o in (cam, luz):
    bpy.context.scene.collection.objects.link(o)
bpy.context.scene.camera = cam

# ---------------- Exportar ----------------
bpy.context.view_layer.update()
partes = list(root.children)
pts = [o.matrix_world @ v.co for o in partes if o.type == 'MESH' for v in o.data.vertices]
info = {"objetos": len(partes), "nombres": sorted(o.name for o in partes),
        "ancho": round(max(q.x for q in pts) - min(q.x for q in pts), 3),
        "fondo": round(max(q.y for q in pts) - min(q.y for q in pts), 3),
        "alto": round(max(q.z for q in pts), 3), "y_pie_escalera": round(Y_PIE, 3),
        "punto_letrero": [round(c, 3) for c in (0, Y_LETRERO - 0.035, Z_LETRERO)],
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
print("CABANA_OK", info)
