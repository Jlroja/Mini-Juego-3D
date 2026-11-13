"""Crea el carrito descapotable del juego, a la medida del personaje (que mide 1.25 m).

Uso: abrir Blender y ejecutar este archivo (pestaña Scripting > Abrir > Ejecutar), o
    blender --background --python herramientas/blender/crear_carro.py

Qué hace: limpia la escena, modela el carro, lo exporta a
public/assets/modelos/vehiculos/carro.glb y guarda arte/blender/carro.blend.

Nombres que usa el juego (no cambiarlos sin cambiar src/entidades/Vehiculo.js):
  - Objetos  Rueda_FL, Rueda_FR, Rueda_RL, Rueda_RR (giran), Volante (gira), Punto_Asiento (donde va la cadera).
  - Materiales  carroceria y asiento (el jugador les cambia el color), vidrio (transparente).
El frente del carro mira hacia -Y (en el juego, +Z).  L = izquierda (+X), R = derecha (-X).
"""
import bpy, bmesh, math, os
from mathutils import Vector, Matrix

PROJ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT_GLB = os.path.join(PROJ, "public", "assets", "modelos", "vehiculos", "carro.glb")
OUT_BLEND = os.path.join(PROJ, "arte", "blender", "carro.blend")

# ---------------- Medidas principales (metros) ----------------
RADIO_RUEDA = 0.24
EJE_Y = 0.68          # distancia del centro a cada eje (delantero en -Y, trasero en +Y)
EJE_X = 0.50          # distancia del centro a cada rueda
ASIENTO = (0, 0.12, 0.36)   # donde queda la cadera del personaje sentado
CABINA = dict(x=0.31, y1=-0.22, y2=0.47, z=0.20)   # hueco donde va sentado

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

def mat(name, hexa, rough=0.5, metal=0.0, emision=0.0, alpha=1.0):
    rgb = tuple(lin(int(hexa[i:i + 2], 16)) for i in (1, 3, 5))
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emision:
        b.inputs["Emission Color"].default_value = (*rgb, 1)
        b.inputs["Emission Strength"].default_value = emision
    if alpha < 1:
        b.inputs["Alpha"].default_value = alpha
        try: m.surface_render_method = 'BLENDED'
        except Exception: pass
    m.diffuse_color = (*rgb, alpha)
    return m

M = {n: mat(n, *v) for n, v in {
    "carroceria":   ("#e63946", 0.32, 0.1),
    "interior":     ("#2b2b33", 0.8),
    "asiento":      ("#c9965f", 0.75),
    "cromo":        ("#d9dadd", 0.18, 1.0),
    "oscuro":       ("#1f2126", 0.6),
    "llanta":       ("#19191c", 0.9),
    "rin":          ("#e8e8ee", 0.3, 0.8),
    "vidrio":       ("#bfe6ff", 0.05, 0.0, 0.0, 0.35),
    "faro":         ("#fff3c4", 0.2, 0.0, 1.5),
    "luz_trasera":  ("#e01228", 0.3, 0.0, 1.0),
    "placa":        ("#f4f4f0", 0.6),
}.items()}

root = bpy.data.objects.new("Carro", None)
bpy.context.scene.collection.objects.link(root)

# ---------------- Ayudantes ----------------
def select_only(ob):
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob

def suavizar(ob, angulo=38):
    ob.data.polygons.foreach_set("use_smooth", [True] * len(ob.data.polygons))
    try: ob.data.set_sharp_from_angle(angle=math.radians(angulo))
    except Exception: pass
    ob.data.update()

def finish(ob, name, material, angulo=38):
    ob.name = name; ob.data.name = name
    ob.data.materials.clear(); ob.data.materials.append(M[material])
    select_only(ob)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    suavizar(ob, angulo)
    ob.parent = root
    bpy.context.view_layer.update()
    return ob

def orient(d):
    return Vector(d).to_track_quat('Z', 'Y').to_euler()

def sphere(name, material, loc, scale, rot=(0, 0, 0), seg=24, rings=12):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, radius=1, location=loc, rotation=rot, scale=scale)
    return finish(bpy.context.active_object, name, material, 180)

def tubo(name, material, p1, p2, r1, r2=None, verts=16):
    p1, p2 = Vector(p1), Vector(p2)
    d = p2 - p1
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r1, radius2=r1 if r2 is None else r2,
                                    depth=d.length, location=(p1 + p2) / 2, rotation=orient(d))
    return finish(bpy.context.active_object, name, material, 50)

def aro(name, material, loc, R, r, scale=(1, 1, 1), rot=(0, 0, 0), seg=40, mseg=12):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=seg, minor_segments=mseg,
                                     location=loc, rotation=rot)
    ob = bpy.context.active_object
    ob.scale = scale
    return finish(ob, name, material, 180)

def aplicar(ob, tipo, **props):
    select_only(ob)
    mod = ob.modifiers.new(tipo, tipo)
    for k, v in props.items():
        setattr(mod, k, v)
    bpy.ops.object.modifier_apply(modifier=mod.name)

def caja(name, material, loc, dims, rot=(0, 0, 0), bisel=0.0, seg=3):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot, scale=dims)
    ob = finish(bpy.context.active_object, name, material)
    if bisel:
        aplicar(ob, 'BEVEL', width=bisel, segments=seg, limit_method='ANGLE')
        suavizar(ob)
    return ob

def recortar(ob, pred, tapar=False):
    """Borra los vértices que cumplen pred (posición en el mundo). tapar = cierra los huecos."""
    mw = ob.matrix_world
    bm = bmesh.new(); bm.from_mesh(ob.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if pred(mw @ v.co)], context='VERTS')
    if tapar:
        bmesh.ops.holes_fill(bm, edges=bm.edges)
    bm.to_mesh(ob.data); bm.free()

def restar(ob, cortador):
    """Le quita a ob el volumen de cortador (y borra el cortador)."""
    aplicar(ob, 'BOOLEAN', operation='DIFFERENCE', object=cortador, solver='EXACT')
    bpy.data.objects.remove(cortador, do_unlink=True)

def unir(nombre, piezas):
    """Junta varias piezas en un solo objeto (conserva sus materiales). El origen es el de la primera."""
    bpy.ops.object.select_all(action='DESELECT')
    for o in piezas:
        o.select_set(True)
    bpy.context.view_layer.objects.active = piezas[0]
    bpy.ops.object.join()
    ob = bpy.context.active_object
    ob.name = nombre; ob.data.name = nombre
    return ob

T = "_tmp"

# ---------------- Carrocería ----------------
# Se dibuja como una serie de "rebanadas" de adelante hacia atrás: (y, medio ancho, z abajo, z arriba)
REBANADAS = [(-1.04, 0.24, 0.27, 0.43), (-0.98, 0.38, 0.19, 0.50), (-0.72, 0.45, 0.16, 0.56),
             (-0.26, 0.46, 0.16, 0.63), (0.47, 0.46, 0.16, 0.63), (0.80, 0.44, 0.17, 0.60),
             (0.98, 0.38, 0.20, 0.54), (1.04, 0.26, 0.27, 0.47)]
N, REDONDEZ = 28, 3.2
bm = bmesh.new()
anillos = []
for y, w, zb, zt in REBANADAS:
    cz, h = (zb + zt) / 2, (zt - zb) / 2
    anillo = []
    for i in range(N):
        a = 2 * math.pi * i / N
        c, s = math.cos(a), math.sin(a)
        x = w * math.copysign(abs(c) ** (2 / REDONDEZ), c)
        z = cz + h * math.copysign(abs(s) ** (2 / REDONDEZ), s)
        anillo.append(bm.verts.new((x, y, z)))
    anillos.append(anillo)
for r1, r2 in zip(anillos, anillos[1:]):
    for i in range(N):
        bm.faces.new((r1[i], r1[(i + 1) % N], r2[(i + 1) % N], r2[i]))
bm.faces.new(anillos[0]); bm.faces.new(anillos[-1])
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
malla = bpy.data.meshes.new("Carroceria")
bm.to_mesh(malla); bm.free()
cuerpo = bpy.data.objects.new("Carroceria", malla)
bpy.context.scene.collection.objects.link(cuerpo)
finish(cuerpo, "Carroceria", "carroceria")
aplicar(cuerpo, 'SUBSURF', levels=2)

# Hueco de la cabina
C = CABINA
hueco = caja(T, "interior", (0, (C["y1"] + C["y2"]) / 2, C["z"] + 0.5), (C["x"] * 2, C["y2"] - C["y1"], 1.0), bisel=0.07, seg=5)
restar(cuerpo, hueco)
# Huecos de las ruedas
for sx in (1, -1):
    for sy in (-1, 1):
        bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=RADIO_RUEDA + 0.055, depth=0.44,
                                            location=(sx * (EJE_X + 0.07), sy * EJE_Y, RADIO_RUEDA),
                                            rotation=(0, math.radians(90), 0))
        restar(cuerpo, finish(bpy.context.active_object, T, "interior"))
# Las caras de dentro de la cabina van de color oscuro
cuerpo.data.materials.append(M["interior"])
for p in cuerpo.data.polygons:
    c = p.center
    if abs(c.x) < C["x"] + 0.004 and C["y1"] - 0.004 < c.y < C["y2"] + 0.004 and C["z"] - 0.004 < c.z < 0.615:
        p.material_index = 1
suavizar(cuerpo, 42)

# Guardabarros (media rosca sobre cada rueda)
for sx, lx in ((1, "L"), (-1, "R")):
    for sy, ly in ((-1, "F"), (1, "R")):
        g = aro(f"Guardabarros_{ly}{lx}", "carroceria", (sx * (EJE_X - 0.01), sy * EJE_Y, RADIO_RUEDA),
                RADIO_RUEDA + 0.075, 0.062, scale=(1, 1, 2.1), rot=(0, math.radians(90), 0))
        recortar(g, lambda p: p.z < 0.2, tapar=True)
        suavizar(g, 60)

# ---------------- Ruedas ----------------
for sx, lx in ((1, "L"), (-1, "R")):
    for sy, ly in ((-1, "F"), (1, "R")):
        c = Vector((sx * EJE_X, sy * EJE_Y, RADIO_RUEDA))
        eje = Vector((sx, 0, 0))
        llanta = aro(T, "llanta", c, RADIO_RUEDA - 0.078, 0.078, scale=(1, 1, 1.12), rot=(0, math.radians(90), 0))
        rin = tubo(T, "rin", c - eje * 0.07, c + eje * 0.075, 0.135, verts=28)
        aplicar(rin, 'BEVEL', width=0.015, segments=2, limit_method='ANGLE'); suavizar(rin, 50)
        aro_rin = aro(T, "cromo", c + eje * 0.075, 0.118, 0.016, rot=(0, math.radians(90), 0), seg=28, mseg=8)
        tapa = sphere(T, "cromo", c + eje * 0.075, (0.03, 0.06, 0.06), seg=16, rings=8)
        tuercas = [sphere(T, "oscuro", c + eje * 0.08 + Vector((0, math.cos(a), math.sin(a))) * 0.088, (0.012, 0.016, 0.016), seg=8, rings=6)
                   for a in (i * math.pi * 2 / 5 for i in range(5))]
        unir(f"Rueda_{ly}{lx}", [llanta, rin, aro_rin, tapa, *tuercas])

# ---------------- Frente ----------------
caja("Parrilla", "oscuro", (0, -1.0, 0.345), (0.36, 0.1, 0.11), bisel=0.03)
for i in range(4):
    caja(f"Parrilla_Barra_{i + 1}", "cromo", (-0.12 + i * 0.08, -1.052, 0.345), (0.014, 0.012, 0.09), bisel=0.004)
unir("Parachoques_Delantero", [
    tubo(T, "cromo", (-0.4, -1.085, 0.245), (0.4, -1.085, 0.245), 0.036),
    sphere(T, "cromo", (-0.4, -1.085, 0.245), (0.036, 0.036, 0.036), seg=16, rings=8),
    sphere(T, "cromo", (0.4, -1.085, 0.245), (0.036, 0.036, 0.036), seg=16, rings=8),
    tubo(T, "cromo", (-0.2, -1.085, 0.245), (-0.2, -0.98, 0.25), 0.02, verts=10),
    tubo(T, "cromo", (0.2, -1.085, 0.245), (0.2, -0.98, 0.25), 0.02, verts=10)])
for s, lado in ((1, "L"), (-1, "R")):
    x = 0.29 * s
    sphere(f"Faro_Base_{lado}", "carroceria", (x, -0.86, 0.515), (0.088, 0.14, 0.085))
    aro(f"Faro_Aro_{lado}", "cromo", (x, -0.975, 0.515), 0.072, 0.014, rot=(math.radians(90), 0, 0), seg=28, mseg=8)
    sphere(f"Faro_{lado}", "faro", (x, -0.972, 0.515), (0.068, 0.03, 0.068), seg=20, rings=10)

# ---------------- Parte trasera ----------------
unir("Parachoques_Trasero", [
    tubo(T, "cromo", (-0.4, 1.085, 0.255), (0.4, 1.085, 0.255), 0.036),
    sphere(T, "cromo", (-0.4, 1.085, 0.255), (0.036, 0.036, 0.036), seg=16, rings=8),
    sphere(T, "cromo", (0.4, 1.085, 0.255), (0.036, 0.036, 0.036), seg=16, rings=8),
    tubo(T, "cromo", (-0.2, 1.085, 0.255), (-0.2, 0.98, 0.26), 0.02, verts=10),
    tubo(T, "cromo", (0.2, 1.085, 0.255), (0.2, 0.98, 0.26), 0.02, verts=10)])
for s, lado in ((1, "L"), (-1, "R")):
    aro(f"Luz_Trasera_Aro_{lado}", "cromo", (0.27 * s, 1.022, 0.455), 0.05, 0.011, rot=(math.radians(90), 0, 0), seg=24, mseg=8)
    sphere(f"Luz_Trasera_{lado}", "luz_trasera", (0.27 * s, 1.018, 0.455), (0.048, 0.028, 0.048), seg=16, rings=8)
    tubo(f"Escape_{lado}", "cromo", (0.3 * s, 0.9, 0.2), (0.3 * s, 1.1, 0.19), 0.028, verts=14)
caja("Placa", "placa", (0, 1.04, 0.37), (0.24, 0.03, 0.1), bisel=0.008)

# ---------------- Parabrisas ----------------
INCL = math.radians(-24)                       # se inclina hacia atrás
centro_vidrio = Vector((0, -0.30, 0.765))
rot_vidrio = Matrix.Rotation(INCL, 4, 'X')
esquina = lambda x, z: centro_vidrio + rot_vidrio @ Vector((x, 0, z))
caja("Parabrisas", "vidrio", centro_vidrio, (0.78, 0.012, 0.27), rot=(INCL, 0, 0))
unir("Parabrisas_Marco", [
    tubo(T, "cromo", esquina(-0.395, -0.15), esquina(-0.395, 0.135), 0.017, verts=12),
    tubo(T, "cromo", esquina(0.395, -0.15), esquina(0.395, 0.135), 0.017, verts=12),
    tubo(T, "cromo", esquina(-0.395, 0.135), esquina(0.395, 0.135), 0.017, verts=12),
    sphere(T, "cromo", esquina(-0.395, 0.135), (0.017, 0.017, 0.017), seg=12, rings=8),
    sphere(T, "cromo", esquina(0.395, 0.135), (0.017, 0.017, 0.017), seg=12, rings=8),
    tubo(T, "oscuro", esquina(-0.4, -0.14), esquina(0.4, -0.14), 0.024, verts=12)])
for s, lado in ((1, "L"), (-1, "R")):
    unir(f"Espejo_{lado}", [
        sphere(T, "carroceria", (0.5 * s, -0.24, 0.72), (0.055, 0.03, 0.04), seg=16, rings=8),
        sphere(T, "cromo", (0.5 * s, -0.222, 0.72), (0.045, 0.012, 0.031), seg=16, rings=8),
        tubo(T, "cromo", (0.43 * s, -0.25, 0.63), (0.49 * s, -0.245, 0.7), 0.011, verts=8)])

# ---------------- Interior ----------------
caja("Asiento_Base", "asiento", (0, 0.14, 0.225), (0.52, 0.44, 0.09), bisel=0.035, seg=4)
caja("Asiento_Respaldo", "asiento", (0, 0.425, 0.49), (0.54, 0.085, 0.5), rot=(math.radians(-8), 0, 0), bisel=0.04, seg=4)
caja("Tablero", "oscuro", (0, -0.2, 0.56), (0.6, 0.07, 0.1), bisel=0.03)
sphere("Tablero_Reloj", "placa", (0.17, -0.163, 0.57), (0.035, 0.008, 0.035), seg=16, rings=8)

# Volante: se arma acostado en el origen y luego se coloca inclinado hacia el conductor.
# No se le aplica la rotación para que en el juego gire sobre su propio eje.
piezas = [aro(T, "oscuro", (0, 0, 0), 0.125, 0.017, seg=32, mseg=10),
          sphere(T, "cromo", (0, 0, 0), (0.034, 0.034, 0.02), seg=16, rings=8)]
for a in (90, 210, 330):
    r = math.radians(a)
    piezas.append(tubo(T, "cromo", (0, 0, 0), (math.cos(r) * 0.125, math.sin(r) * 0.125, 0), 0.01, verts=8))
piezas.append(tubo(T, "oscuro", (0, 0, 0), (0, 0, -0.2), 0.016, verts=10))   # columna hacia el tablero
volante = unir("Volante", piezas)
volante.location = (0, -0.13, 0.615)
volante.rotation_euler = (math.radians(-62), 0, 0)

# Punto de referencia: aquí queda la cadera del personaje cuando se sienta
asiento = bpy.data.objects.new("Punto_Asiento", None)
asiento.empty_display_size = 0.1
asiento.location = ASIENTO
asiento.parent = root
bpy.context.scene.collection.objects.link(asiento)

# ---------------- Cámara y luz (solo para ver el carro en Blender) ----------------
cam_data = bpy.data.cameras.new("Camara"); cam_data.lens = 55
cam = bpy.data.objects.new("Camara", cam_data)
cam.location = (2.6, -3.4, 1.7)
cam.rotation_euler = (Vector((0, 0, 0.42)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
luz_data = bpy.data.lights.new("Sol", 'SUN'); luz_data.energy = 3.5
luz = bpy.data.objects.new("Sol", luz_data)
luz.rotation_euler = (math.radians(50), 0, math.radians(35))
for o in (cam, luz):
    bpy.context.scene.collection.objects.link(o)
bpy.context.scene.camera = cam

# ---------------- Exportar ----------------
bpy.context.view_layer.update()
partes = [o for o in root.children]
pts = [o.matrix_world @ v.co for o in partes if o.type == 'MESH' for v in o.data.vertices]
info = {"objetos": len(partes),
        "largo": round(max(p.y for p in pts) - min(p.y for p in pts), 3),
        "ancho": round(max(p.x for p in pts) - min(p.x for p in pts), 3),
        "alto": round(max(p.z for p in pts), 3), "z_min": round(min(p.z for p in pts), 4),
        "triangulos": sum(len(p.vertices) - 2 for o in partes if o.type == 'MESH' for p in o.data.polygons)}
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
print("CARRO_OK", info)
