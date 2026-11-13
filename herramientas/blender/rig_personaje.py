"""Le pone esqueleto (huesos) al personaje para poder animarlo en el juego.

Uso (desde la carpeta del proyecto):
    blender --background arte/blender/personaje.blend --python herramientas/blender/rig_personaje.py

También se ejecuta solo al final de crear_personaje.py.
Qué hace:
  1. Crea el esqueleto "Esqueleto" con 11 huesos (cadera, torso, cabeza, brazos y piernas).
  2. Reparte cada vértice del modelo entre los huesos (pesos) según su posición.
  3. Exporta public/assets/modelos/personaje/personaje.glb y guarda el .blend.
Las animaciones (quieto, caminar, correr, salto) se calculan en src/entidades/Personaje.js.
"""
import bpy, os
from mathutils import Vector, Matrix

PROJ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT_GLB = os.path.join(PROJ, "public", "assets", "modelos", "personaje", "personaje.glb")
OUT_BLEND = os.path.join(PROJ, "arte", "blender", "personaje.blend")
NOMBRE = "Esqueleto"

if "Personaje" not in bpy.data.objects:
    bpy.ops.wm.open_mainfile(filepath=OUT_BLEND)
root = bpy.data.objects["Personaje"]

# ---------------- Limpiar un esqueleto anterior (el script se puede repetir) ----------------
viejo = bpy.data.objects.get(NOMBRE)
mallas = [o for o in bpy.data.objects if o.type == 'MESH' and (o.parent in (root, viejo))]
for o in mallas:
    for m in [m for m in o.modifiers if m.type == 'ARMATURE']:
        o.modifiers.remove(m)
    o.vertex_groups.clear()
if viejo:
    for o in mallas:
        mw = o.matrix_world.copy()
        o.parent = root
        o.matrix_world = mw
    bpy.data.objects.remove(viejo, do_unlink=True)

# ---------------- Medidas ----------------
# crear_personaje.py modela en unas medidas "de diseño" y al final escala todo a 1.25 m.
# Aquí se recupera esa escala (F) y el desplazamiento (ZMIN) para usar las mismas medidas.
bpy.context.view_layer.update()
z1 = bpy.data.objects["Cinturon"].matrix_world.translation.z      # diseño: z = 0.562
z2 = bpy.data.objects["Gafas_Correa"].matrix_world.translation.z  # diseño: z = 1.2
if abs(z2 - z1) > 1e-6:
    F = (z2 - z1) / (1.2 - 0.562)
    ZMIN = 0.562 - z1 / F
    root["rig_f"], root["rig_zmin"] = F, ZMIN
else:  # ya se habían aplicado las posiciones en una ejecución anterior
    F, ZMIN = root["rig_f"], root["rig_zmin"]

def mundo(p):
    return Vector((p[0] * F, p[1] * F, (p[2] - ZMIN) * F))

def diseno(p):
    return Vector((p.x / F, p.y / F, p.z / F + ZMIN))

# ---------------- Huesos (medidas de diseño) ----------------
# nombre: (inicio, fin, padre).  L = izquierda del personaje (+X), R = derecha (-X).
HUESOS = {
    "Cadera": ((0, 0, 0.50), (0, 0, 0.58), None),
    "Torso":  ((0, 0, 0.58), (0, 0, 0.84), "Cadera"),
    "Cabeza": ((0, 0, 0.86), (0, 0, 1.10), "Torso"),
}
for s, lado in ((1, "L"), (-1, "R")):
    hombro, codo, muneca = (0.155 * s, 0, 0.79), (0.192 * s, 0.006, 0.67), (0.213 * s, -0.02, 0.565)
    HUESOS[f"Brazo_{lado}"] = (hombro, codo, "Torso")
    HUESOS[f"Antebrazo_{lado}"] = (codo, muneca, f"Brazo_{lado}")
    HUESOS[f"Muslo_{lado}"] = ((0.078 * s, 0, 0.50), (0.08 * s, 0, 0.36), "Cadera")
    HUESOS[f"Pierna_{lado}"] = ((0.08 * s, 0, 0.36), (0.085 * s, 0, 0.20), f"Muslo_{lado}")

arm_data = bpy.data.armatures.new(NOMBRE)
arm = bpy.data.objects.new(NOMBRE, arm_data)
(root.users_collection[0] if root.users_collection else bpy.context.scene.collection).objects.link(arm)
arm.parent = root
bpy.ops.object.select_all(action='DESELECT')
arm.select_set(True)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT')
for nombre, (ini, fin, padre) in HUESOS.items():
    b = arm_data.edit_bones.new(nombre)
    b.head, b.tail = mundo(ini), mundo(fin)
    if padre:
        b.parent = arm_data.edit_bones[padre]
        b.use_connect = False
bpy.ops.object.mode_set(mode='OBJECT')

# ---------------- Pesos ----------------
def ss(x, a, b):
    """0 por debajo de a, 1 por encima de b, transición suave en medio."""
    t = min(1.0, max(0.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)

def tronco(p):
    t = ss(p.z, 0.55, 0.66)
    return {"Cadera": 1 - t, "Torso": t}

def pesos_pantalon(p):
    pierna = 1 - ss(p.z, 0.42, 0.52)        # 1 = pierna, 0 = cadera
    izq = ss(p.x, -0.012, 0.012)
    baja = 1 - ss(p.z, 0.33, 0.39)          # 1 = por debajo de la rodilla
    return {"Cadera": 1 - pierna,
            "Muslo_L": pierna * izq * (1 - baja), "Pierna_L": pierna * izq * baja,
            "Muslo_R": pierna * (1 - izq) * (1 - baja), "Pierna_R": pierna * (1 - izq) * baja}

def pesos_camisa(p):
    lado = "L" if p.x > 0 else "R"
    brazo = ss(abs(p.x), 0.14, 0.17)        # 1 = brazo, 0 = torso
    bajo = 1 - ss(p.z, 0.64, 0.70)          # 1 = por debajo del codo
    w = {k: v * (1 - brazo) for k, v in tronco(p).items()}
    w[f"Brazo_{lado}"] = brazo * (1 - bajo)
    w[f"Antebrazo_{lado}"] = brazo * bajo
    return w

def pesos_cuello(p):
    t = ss(p.z, 0.82, 0.90)
    return {"Torso": 1 - t, "Cabeza": t}

CABEZA = ("Cabeza", "Cabello", "Ojo", "Parpado", "Iris", "Pupila", "Brillo", "Ceja", "Boca",
          "Dientes", "Lengua", "Gafas", "Auricular", "Microfono")
PIERNA = ("Bota_", "Suela_", "Puntera_", "Cordon_", "Dobladillo_")

def regla(nombre):
    """Devuelve la función de pesos que le toca a cada pieza del modelo."""
    lado = "L" if "_L" in nombre else "R"
    if nombre == "Pantalon": return pesos_pantalon
    if nombre == "Camisa": return pesos_camisa
    if nombre == "Cuello": return pesos_cuello
    if nombre in ("Cinturon", "Hebilla"): return lambda p: {"Cadera": 1}
    if nombre.startswith(PIERNA): return lambda p: {f"Pierna_{lado}": 1}
    if nombre.startswith("Mano_"): return lambda p: {f"Antebrazo_{lado}": 1}
    if nombre.startswith(CABEZA): return lambda p: {"Cabeza": 1}
    return tronco  # chaleco, correa, bolso, mochila

total = 0
for o in mallas:
    mw = o.matrix_world.copy()
    o.data.transform(mw)                   # los vértices pasan a coordenadas del mundo
    o.parent = arm
    o.matrix_parent_inverse = Matrix.Identity(4)
    o.matrix_basis = Matrix.Identity(4)
    grupos = {n: o.vertex_groups.new(name=n) for n in HUESOS}
    f = regla(o.name)
    for v in o.data.vertices:
        for hueso, w in f(diseno(v.co)).items():
            if w > 0.001:
                grupos[hueso].add([v.index], w, 'REPLACE')
    for g in [g for g in o.vertex_groups if not any(g.index in [x.group for x in v.groups] for v in o.data.vertices)]:
        o.vertex_groups.remove(g)
    mod = o.modifiers.new("Armature", 'ARMATURE')
    mod.object = arm
    total += len(o.data.vertices)

# ---------------- Exportar ----------------
bpy.context.view_layer.update()
bpy.ops.object.select_all(action='DESELECT')
for o in [root, arm, *mallas]:
    o.select_set(True)
bpy.context.view_layer.objects.active = arm
bpy.ops.export_scene.gltf(filepath=OUT_GLB, export_format='GLB', use_selection=True,
                          export_apply=False, export_animations=False)
bpy.ops.object.select_all(action='DESELECT')
bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
result = {"huesos": len(HUESOS), "mallas": len(mallas), "vertices": total,
          "glb_bytes": os.path.getsize(OUT_GLB), "F": round(F, 4), "ZMIN": round(ZMIN, 4)}
print("RIG_OK", result)
