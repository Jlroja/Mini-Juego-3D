import bpy, bmesh, math, os
from mathutils import Vector, Matrix

PROJ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT_GLB = os.path.join(PROJ, "public", "assets", "modelos", "personaje", "personaje.glb")
OUT_BLEND = os.path.join(PROJ, "arte", "blender", "personaje.blend")
ALTURA = 1.25

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

def mat(name, hexa, rough=0.65, metal=0.0):
    rgb = tuple(lin(int(hexa[i:i + 2], 16)) for i in (1, 3, 5))
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    m.diffuse_color = (*rgb, 1)
    return m

M = {n: mat(n, *v) for n, v in {
    "piel":                ("#f2b78f", 0.55),
    "cabello":             ("#5a3420", 0.5),
    "ojo_blanco":          ("#f7f7f7", 0.12),
    "ojo_iris":            ("#6b4423", 0.2),
    "ojo_pupila":          ("#0d0d0d", 0.1),
    "boca":                ("#6a1a20", 0.5),
    "lengua":              ("#e0707a", 0.45),
    "dientes":             ("#f6f6f0", 0.25),
    "camiseta":            ("#e07a2e", 0.8),
    "chaleco":             ("#6e4a30", 0.7),
    "correa":              ("#4a3020", 0.6),
    "bolso":               ("#8a5c36", 0.65),
    "mochila":             ("#7a5233", 0.7),
    "mochila_detalle":     ("#5c3b24", 0.7),
    "pantalon":            ("#4f76a8", 0.85),
    "pantalon_dobladillo": ("#86a9d0", 0.85),
    "cinturon":            ("#3a2718", 0.55),
    "metal":               ("#b8b0a0", 0.35, 0.8),
    "zapatos":             ("#7b4a2b", 0.6),
    "suela":               ("#3b2a20", 0.75),
    "cordones":            ("#d9c7a3", 0.7),
    "gafas_montura":       ("#b9b29a", 0.35, 0.7),
    "gafas_lente":         ("#9fd0e0", 0.05),
    "gafas_correa":        ("#4a3a2e", 0.6),
    "auriculares":         ("#2e2e33", 0.45),
    "auriculares_detalle": ("#c0552a", 0.5),
}.items()}

root = bpy.data.objects.new("Personaje", None)
bpy.context.scene.collection.objects.link(root)

def select_only(ob):
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob

def finish(ob, name, material):
    ob.name = name; ob.data.name = name
    ob.data.materials.clear(); ob.data.materials.append(M[material])
    select_only(ob)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    bpy.ops.object.shade_smooth()
    ob.parent = root
    bpy.context.view_layer.update()
    return ob

def orient(d):
    return Vector(d).to_track_quat('Z', 'Y').to_euler()

def sphere(name, material, loc, scale, rot=(0, 0, 0), seg=24, rings=12):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, radius=1,
                                         location=loc, rotation=rot, scale=scale)
    return finish(bpy.context.active_object, name, material)

def tubo(name, material, p1, p2, r1, r2, verts=20, sy=1.0, tapas=True):
    p1, p2 = Vector(p1), Vector(p2)
    d = p2 - p1
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r1, radius2=r2, depth=d.length,
                                    location=(p1 + p2) / 2, rotation=orient(d),
                                    end_fill_type='NGON' if tapas else 'NOTHING')
    ob = bpy.context.active_object
    ob.scale = (1, sy, 1)
    return finish(ob, name, material)

def aro(name, material, loc, R, r, scale=(1, 1, 1), rot=(0, 0, 0), seg=32, mseg=10):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=seg,
                                     minor_segments=mseg, location=loc, rotation=rot)
    ob = bpy.context.active_object
    ob.scale = scale
    return finish(ob, name, material)

def aplicar(ob, tipo, **props):
    select_only(ob)
    mod = ob.modifiers.new(tipo, tipo)
    for k, v in props.items():
        setattr(mod, k, v)
    bpy.ops.object.modifier_apply(modifier=mod.name)

def caja(name, material, loc, dims, rot=(0, 0, 0), bisel=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot, scale=dims)
    ob = finish(bpy.context.active_object, name, material)
    if bisel:
        aplicar(ob, 'BEVEL', width=bisel, segments=3, limit_method='ANGLE')
        select_only(ob); bpy.ops.object.shade_smooth()
    return ob

def recortar(ob, pred):
    mw = ob.matrix_world
    bm = bmesh.new(); bm.from_mesh(ob.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if pred(mw @ v.co)], context='VERTS')
    bm.to_mesh(ob.data); bm.free()

def fusion(nombre, material, piezas, voxel=0.007, suav=6, decim=0.45):
    """Une piezas cerradas en una sola malla orgánica y suave."""
    bpy.ops.object.select_all(action='DESELECT')
    for o in piezas:
        o.select_set(True)
    bpy.context.view_layer.objects.active = piezas[0]
    bpy.ops.object.join()
    ob = bpy.context.active_object
    aplicar(ob, 'REMESH', mode='VOXEL', voxel_size=voxel)
    aplicar(ob, 'SMOOTH', factor=0.5, iterations=suav)
    aplicar(ob, 'DECIMATE', ratio=decim)
    return finish(ob, nombre, material)

T = "_tmp"  # nombre provisional de piezas que se van a fundir

# El personaje mira hacia -Y (frente en Blender) => +Z en Three.js.
# L = su izquierda (+X), R = su derecha (-X).

# ---------------- Botas ----------------
for s, lado in ((1, "L"), (-1, "R")):
    x = 0.085 * s
    fusion(f"Bota_{lado}", "zapatos", [
        sphere(T, "zapatos", (x, -0.045, 0.07), (0.075, 0.135, 0.062), seg=16, rings=8),
        sphere(T, "zapatos", (x, -0.12, 0.066), (0.07, 0.07, 0.056), seg=16, rings=8),
        tubo(T, "zapatos", (x, 0.0, 0.05), (x, 0.005, 0.215), 0.066, 0.07),
        aro(T, "zapatos", (x, 0.005, 0.213), 0.062, 0.016, seg=20, mseg=8),
    ], voxel=0.006, suav=5)
    sphere(f"Suela_{lado}", "suela", (x, -0.047, 0.023), (0.083, 0.148, 0.023))
    sphere(f"Puntera_{lado}", "suela", (x, -0.142, 0.056), (0.073, 0.062, 0.05), seg=20, rings=10)
    for i, z in enumerate((0.105, 0.14, 0.175)):
        tubo(f"Cordon_{lado}_{i + 1}", "cordones", (x - 0.034, -0.062, z), (x + 0.034, -0.062, z),
             0.006, 0.006, verts=8)

# ---------------- Pantalón vaquero ----------------
piezas = [sphere(T, "pantalon", (0, 0, 0.5), (0.158, 0.11, 0.09), seg=16, rings=8),
          tubo(T, "pantalon", (0, 0, 0.5), (0, 0, 0.585), 0.15, 0.135, sy=0.7)]
for s in (1, -1):
    piezas.append(tubo(T, "pantalon", (0.085 * s, 0, 0.22), (0.08 * s, 0, 0.36), 0.074, 0.079))
    piezas.append(tubo(T, "pantalon", (0.08 * s, 0, 0.36), (0.075 * s, 0, 0.5), 0.079, 0.085))
fusion("Pantalon", "pantalon", piezas, voxel=0.007, suav=6)
for s, lado in ((1, "L"), (-1, "R")):
    aro(f"Dobladillo_{lado}", "pantalon_dobladillo", (0.085 * s, 0, 0.236), 0.066, 0.024, seg=24)
aro("Cinturon", "cinturon", (0, 0, 0.562), 0.138, 0.012, scale=(1, 0.71, 1.3), seg=32, mseg=8)
caja("Hebilla", "metal", (0, -0.102, 0.562), (0.042, 0.014, 0.034), bisel=0.005)

# ---------------- Camisa naranja de manga larga ----------------
piezas = [tubo(T, "camiseta", (0, 0, 0.55), (0, 0, 0.8), 0.135, 0.15, sy=0.7),
          sphere(T, "camiseta", (0, 0, 0.79), (0.15, 0.105, 0.06), seg=16, rings=8),
          aro(T, "camiseta", (0, 0, 0.842), 0.058, 0.018, scale=(1, 0.9, 1), seg=20, mseg=8)]
for s in (1, -1):
    hombro, codo, muneca = Vector((0.155 * s, 0, 0.79)), Vector((0.192 * s, 0.006, 0.67)), Vector((0.213 * s, -0.02, 0.565))
    piezas += [sphere(T, "camiseta", (0.15 * s, 0, 0.785), (0.06, 0.06, 0.058), seg=16, rings=8),
               tubo(T, "camiseta", hombro, codo, 0.055, 0.049),
               sphere(T, "camiseta", codo, (0.05, 0.05, 0.05), seg=12, rings=6),
               tubo(T, "camiseta", codo, muneca, 0.049, 0.044),
               aro(T, "camiseta", muneca, 0.036, 0.017, rot=orient(muneca - codo), seg=16, mseg=8)]
fusion("Camisa", "camiseta", piezas, voxel=0.007, suav=6)

# ---------------- Manos ----------------
for s, lado in ((1, "L"), (-1, "R")):
    piezas = [tubo(T, "piel", (0.213 * s, -0.02, 0.57), (0.217 * s, -0.026, 0.52), 0.027, 0.029, verts=12),
              sphere(T, "piel", (0.218 * s, -0.028, 0.505), (0.03, 0.043, 0.05), seg=16, rings=8),
              sphere(T, "piel", (0.2 * s, -0.064, 0.5), (0.015, 0.016, 0.032),
                     rot=(math.radians(-25), 0, 0), seg=12, rings=6)]
    for y in (-0.06, -0.037, -0.014, 0.008):
        piezas.append(sphere(T, "piel", (0.214 * s, y, 0.458), (0.0135, 0.0135, 0.034),
                             rot=(0, math.radians(8 * s), 0), seg=12, rings=6))
    fusion(f"Mano_{lado}", "piel", piezas, voxel=0.004, suav=3, decim=0.5)

# ---------------- Chaleco (abierto por delante) ----------------
chaleco = tubo("Chaleco", "chaleco", (0, 0, 0.572), (0, 0, 0.818), 0.15, 0.166, verts=32, sy=0.73, tapas=False)
recortar(chaleco, lambda p: abs(p.x) < 0.02 and p.y < 0)
aplicar(chaleco, 'SOLIDIFY', thickness=0.014, offset=1.0)
aplicar(chaleco, 'SUBSURF', levels=1)
select_only(chaleco); bpy.ops.object.shade_smooth()
for s, lado in ((1, "L"), (-1, "R")):
    caja(f"Bolsillo_Chaleco_{lado}", "correa", (0.095 * s, -0.112, 0.64), (0.055, 0.016, 0.05),
         rot=(0, 0, math.radians(22 * s)), bisel=0.006)

# ---------------- Correa cruzada, bolso y mochila ----------------
aro("Correa", "correa", (0, 0, 0.705), 0.215, 0.012, scale=(1, 0.66, 1), rot=(0, math.radians(35), 0),
    seg=40, mseg=6)
caja("Bolso", "bolso", (0.182, -0.02, 0.535), (0.05, 0.095, 0.085), bisel=0.016)
caja("Bolso_Tapa", "correa", (0.188, -0.02, 0.562), (0.046, 0.1, 0.04), bisel=0.012)
caja("Mochila", "mochila", (0, 0.172, 0.69), (0.21, 0.11, 0.24), bisel=0.035)
caja("Mochila_Tapa", "mochila_detalle", (0, 0.18, 0.785), (0.216, 0.116, 0.08), bisel=0.03)
caja("Mochila_Bolsillo", "mochila_detalle", (0, 0.232, 0.65), (0.13, 0.035, 0.1), bisel=0.014)
caja("Mochila_Hebilla", "metal", (0, 0.24, 0.755), (0.032, 0.012, 0.032), bisel=0.004)
for s, lado in ((1, "L"), (-1, "R")):
    aro(f"Mochila_Tirante_{lado}", "mochila_detalle", (0.112 * s, 0.0, 0.715), 0.13, 0.012,
        scale=(1.08, 0.98, 1.6), rot=(0, math.radians(90), 0), seg=32, mseg=6)

# ---------------- Cuello y cabeza ----------------
tubo("Cuello", "piel", (0, 0, 0.8), (0, 0, 0.9), 0.048, 0.048)
piezas = [sphere(T, "piel", (0, 0, 1.06), (0.185, 0.172, 0.19), seg=24, rings=12),
          sphere(T, "piel", (0, -0.05, 0.93), (0.09, 0.085, 0.06), seg=16, rings=8),
          sphere(T, "piel", (0, -0.178, 1.03), (0.026, 0.024, 0.022), seg=12, rings=6)]
for s in (1, -1):
    piezas.append(sphere(T, "piel", (0.075 * s, -0.06, 1.0), (0.09, 0.09, 0.075), seg=16, rings=8))
    piezas.append(sphere(T, "piel", (0.183 * s, 0.015, 1.04), (0.03, 0.04, 0.052), seg=12, rings=6))
fusion("Cabeza", "piel", piezas, voxel=0.007, suav=10, decim=1.0)

for s, lado in ((1, "L"), (-1, "R")):
    x = 0.068 * s
    sphere(f"Ojo_{lado}", "ojo_blanco", (x, -0.14, 1.095), (0.05, 0.032, 0.056))
    parpado = sphere(f"Parpado_{lado}", "piel", (x, -0.14, 1.095), (0.054, 0.037, 0.06))
    recortar(parpado, lambda p: p.z < 1.128)
    sphere(f"Iris_{lado}", "ojo_iris", (x, -0.165, 1.09), (0.033, 0.010, 0.037), seg=20, rings=8)
    sphere(f"Pupila_{lado}", "ojo_pupila", (x, -0.172, 1.09), (0.019, 0.006, 0.022), seg=16, rings=8)
    sphere(f"Brillo_{lado}", "ojo_blanco", (x + 0.013, -0.177, 1.104), (0.009, 0.004, 0.01), seg=10, rings=6)
    sphere(f"Ceja_{lado}", "cabello", (0.07 * s, -0.136, 1.162), (0.046, 0.013, 0.012),
           rot=(0, math.radians(-12 * s), 0), seg=16, rings=8)

boca = sphere("Boca", "boca", (0, -0.146, 0.968), (0.055, 0.014, 0.035))
recortar(boca, lambda p: p.z > 0.977)
sphere("Dientes", "dientes", (0, -0.157, 0.971), (0.042, 0.006, 0.009), seg=16, rings=6)
sphere("Lengua", "lengua", (0, -0.153, 0.948), (0.028, 0.008, 0.012), seg=12, rings=6)

# ---------------- Cabello (mechones gruesos fundidos) ----------------
piezas = [sphere(T, "cabello", (0, 0.03, 1.10), (0.196, 0.186, 0.172), seg=24, rings=12)]
for b, t, r in [
        # flequillo barrido hacia un lado
        ((0.11, -0.07, 1.20), (0.13, -0.165, 1.15), 0.06),
        ((0.05, -0.09, 1.22), (0.02, -0.185, 1.185), 0.065),
        ((-0.02, -0.09, 1.22), (-0.07, -0.18, 1.18), 0.065),
        ((-0.09, -0.07, 1.20), (-0.15, -0.14, 1.14), 0.06),
        # parte superior, puntas hacia arriba
        ((0.00, 0.02, 1.23), (-0.03, -0.05, 1.325), 0.085),
        ((0.09, 0.03, 1.21), (0.14, 0.00, 1.29), 0.07),
        ((-0.09, 0.04, 1.21), (-0.15, 0.02, 1.28), 0.07),
        ((0.03, 0.10, 1.22), (0.05, 0.14, 1.31), 0.075),
        ((-0.05, 0.11, 1.21), (-0.09, 0.17, 1.28), 0.07),
        # laterales
        ((0.16, 0.04, 1.12), (0.215, 0.07, 1.07), 0.055),
        ((-0.16, 0.04, 1.12), (-0.215, 0.07, 1.07), 0.055),
        # nuca
        ((0.0, 0.16, 1.05), (0.0, 0.25, 0.965), 0.075),
        ((0.09, 0.14, 1.05), (0.14, 0.215, 0.97), 0.065),
        ((-0.09, 0.14, 1.05), (-0.14, 0.215, 0.97), 0.065),
        ((0.05, 0.17, 1.13), (0.08, 0.27, 1.08), 0.07),
        ((-0.05, 0.17, 1.13), (-0.08, 0.27, 1.08), 0.07),
        ((0.0, 0.17, 1.19), (0.0, 0.265, 1.17), 0.07),
]:
    piezas.append(tubo(T, "cabello", b, t, r, 0.014, verts=12))
fusion("Cabello", "cabello", piezas, voxel=0.007, suav=4, decim=0.45)

# ---------------- Gafas de aviador sobre la frente ----------------
dirg = Vector((0, -0.72, 0.69)).normalized()
rotg = orient(dirg)
for s, lado in ((1, "L"), (-1, "R")):
    base = Vector((0.068 * s, -0.135, 1.225))
    tubo(f"Gafas_Montura_{lado}", "gafas_montura", base, base + dirg * 0.05, 0.056, 0.05, verts=24)
    aro(f"Gafas_Aro_{lado}", "gafas_montura", base + dirg * 0.05, 0.046, 0.008, rot=rotg, seg=24, mseg=8)
    sphere(f"Gafas_Lente_{lado}", "gafas_lente", base + dirg * 0.048, (0.042, 0.042, 0.014), rot=rotg,
           seg=20, rings=8)
caja("Gafas_Puente", "gafas_montura", Vector((0, -0.135, 1.225)) + dirg * 0.025, (0.04, 0.022, 0.022),
     bisel=0.005)
aro("Gafas_Correa", "gafas_correa", (0, 0.012, 1.2), 0.172, 0.014, scale=(1, 0.98, 1.4), seg=32, mseg=6)

# ---------------- Auriculares con micrófono ----------------
banda = aro("Auriculares_Banda", "auriculares", (0, 0.045, 1.05), 0.215, 0.016, scale=(1, 1.22, 1.5),
            rot=(math.radians(90), 0, 0), seg=40, mseg=8)
recortar(banda, lambda p: p.z < 1.07)
for s, lado in ((1, "L"), (-1, "R")):
    copa = tubo(f"Auricular_{lado}", "auriculares", (0.176 * s, 0.02, 1.05), (0.224 * s, 0.02, 1.05),
                0.068, 0.06, verts=28)
    aplicar(copa, 'BEVEL', width=0.012, segments=3, limit_method='ANGLE')
    select_only(copa); bpy.ops.object.shade_smooth()
    sphere(f"Auricular_Detalle_{lado}", "auriculares_detalle", (0.226 * s, 0.02, 1.05),
           (0.012, 0.038, 0.038), seg=20, rings=8)
tubo("Microfono_Brazo", "auriculares", (-0.205, -0.03, 1.02), (-0.09, -0.192, 0.965), 0.006, 0.006, verts=8)
sphere("Microfono", "auriculares", (-0.084, -0.198, 0.962), (0.018, 0.02, 0.018), seg=12, rings=8)

# ---------------- Normalizar altura exacta y apoyo en el origen ----------------
bpy.context.view_layer.update()
def limites():
    pts = [o.matrix_world @ v.co for o in root.children for v in o.data.vertices]
    return min(p.z for p in pts), max(p.z for p in pts)
zmin, zmax = limites()
f = ALTURA / (zmax - zmin)
for o in root.children:
    o.location = Vector((o.location.x * f, o.location.y * f, (o.location.z - zmin) * f))
    o.data.transform(Matrix.Scale(f, 4))
bpy.context.view_layer.update()
zmin, zmax = limites()

info = {"n_objects": len(root.children),
        "objects": sorted(o.name for o in root.children),
        "n_materials": len([m for m in bpy.data.materials if m.users]),
        "minZ": round(zmin, 4), "maxZ": round(zmax, 4),
        "tris": sum(len(p.vertices) - 2 for o in root.children for p in o.data.polygons)}

# ---------------- Exportar ----------------
os.makedirs(os.path.dirname(OUT_GLB), exist_ok=True)
os.makedirs(os.path.dirname(OUT_BLEND), exist_ok=True)
bpy.ops.object.select_all(action='DESELECT')
root.select_set(True)
for o in root.children:
    o.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT_GLB, export_format='GLB', use_selection=True,
                          export_apply=True, export_animations=False)
info["glb_bytes"] = os.path.getsize(OUT_GLB)
bpy.ops.object.select_all(action='DESELECT')
bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)

# ---------------- Esqueleto ----------------
# Le pone los huesos al personaje y vuelve a exportar el .glb y el .blend ya listos para animar.
import runpy
runpy.run_path(os.path.join(os.path.dirname(os.path.abspath(__file__)), "rig_personaje.py"))
