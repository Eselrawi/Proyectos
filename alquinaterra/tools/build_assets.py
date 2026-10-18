"""Prepara los recursos gráficos del árbol de Alquinaterra a partir de fuentes CC0.
Uso: python3 -I build_assets.py <carpeta_recursos> <carpeta_salida>
"""
import sys, os, math, json
import numpy as np
from PIL import Image, ImageFilter

Image.MAX_IMAGE_PIXELS = None
RES, OUT = sys.argv[1], sys.argv[2]
os.makedirs(f'{OUT}/hi', exist_ok=True)
os.makedirs(f'{OUT}/lo', exist_ok=True)


def save(img, name, q=82, both=True, lo_scale=0.5):
    img.save(f'{OUT}/hi/{name}', quality=q, optimize=True)
    if both:
        w, h = img.size
        img.resize((max(1, int(w * lo_scale)), max(1, int(h * lo_scale))), Image.LANCZOS).save(f'{OUT}/lo/{name}', quality=q, optimize=True)


def arr(p, mode='RGB'):
    return np.asarray(Image.open(p).convert(mode)).astype(np.float32) / 255


# ---------- 1. Corteza (Poly Haven, Bark Willow 02, 2K) ----------
B = f'{RES}/bark2k'
d = arr(f'{B}/diff.jpg')
ao = arr(f'{B}/ao.jpg', 'L')
disp = arr(f'{B}/disp.jpg', 'L')
cav = np.clip((disp - disp.mean()) * 2.0 + 0.5, 0, 1)
d = d * (0.5 + 0.5 * ao[..., None]) * (0.6 + 0.55 * cav[..., None])
lum = d.mean(axis=2, keepdims=True)
lum = np.clip((lum - lum.mean()) * 1.55 + 0.42, 0, 1)
# Paleta de la foto: grieta casi negra y cálida → marrón → cresta gris-beige gastada
dark = np.array([0.10, 0.085, 0.07]); mid = np.array([0.34, 0.28, 0.22]); light = np.array([0.70, 0.65, 0.58])
gm = np.where(lum < 0.5, dark + (mid - dark) * (lum / 0.5), mid + (light - mid) * ((lum - 0.5) / 0.5))
orig = np.clip((d - d.mean()) * 1.3 + 0.4, 0, 1)
res = np.clip(gm * 0.68 + orig * 0.32, 0, 1)
save(Image.fromarray((res * 255).astype(np.uint8)), 'bark_color.jpg', 80)
save(Image.open(f'{B}/nor_gl.jpg').convert('RGB'), 'bark_normal.jpg', 82)
save(Image.open(f'{B}/arm.jpg').convert('RGB'), 'bark_arm.jpg', 80)
# Altura para desplazar la geometría en la CPU (misma en hi y lo)
dimg = Image.open(f'{B}/disp.jpg').convert('L').resize((1024, 1024), Image.LANCZOS)
dimg.save(f'{OUT}/hi/bark_height.jpg', quality=90)
dimg.resize((512, 512), Image.LANCZOS).save(f'{OUT}/lo/bark_height.jpg', quality=90)

# ---------- 2. Suelo (Poly Haven, Dry Ground 01, 1K) ----------
G = f'{RES}/ground'
g = arr(f'{G}/dry_diff.jpg')
gl = g.mean(axis=2, keepdims=True)
g = g * 0.55 + gl * 0.45  # menos saturado
g = np.clip((g - g.mean()) * 1.1 + np.array([0.40, 0.36, 0.30]), 0, 1)  # tierra templada, algo más oscura
Image.fromarray((g * 255).astype(np.uint8)).save(f'{OUT}/hi/ground_color.jpg', quality=80)
Image.fromarray((g * 255).astype(np.uint8)).resize((512, 512), Image.LANCZOS).save(f'{OUT}/lo/ground_color.jpg', quality=80)
for n in ('nor_gl', 'arm'):
    im = Image.open(f'{G}/dry_{n}.jpg').convert('RGB')
    im.save(f'{OUT}/hi/ground_{"normal" if n == "nor_gl" else "arm"}.jpg', quality=82)
    im.resize((512, 512), Image.LANCZOS).save(f'{OUT}/lo/ground_{"normal" if n == "nor_gl" else "arm"}.jpg', quality=82)

# ---------- 3. Atlas de hojas (ambientCG LeafSet023 + LeafSet024) ----------
L = f'{RES}/leaf'
CW, CH, COLS, ROWS = 256, 512, 8, 2
atlas = {k: Image.new(m, (CW * COLS, CH * ROWS), c) for k, m, c in
         (('color', 'RGB', (0, 0, 0)), ('alpha', 'L', 0), ('normal', 'RGB', (128, 128, 255)), ('trans', 'L', 0))}


def load_set(name):
    p = f'{L}/{name}/{name}_2K-JPG'
    out = {'color': Image.open(f'{p}_Color.jpg').convert('RGB'),
           'alpha': Image.open(f'{p}_Opacity.jpg').convert('L'),
           'normal': Image.open(f'{p}_NormalGL.jpg').convert('RGB')}
    sp = f'{p}_Scattering.jpg'
    if os.path.exists(sp):
        out['trans'] = Image.open(sp).convert('L')
    else:  # translucidez aproximada: más en el limbo verde, menos en los nervios claros
        c = np.asarray(out['color']).astype(np.float32)
        t = np.clip(c[..., 1] * 0.9 - c[..., 2] * 0.4, 0, 255)
        out['trans'] = Image.fromarray(t.astype(np.uint8))
    return out


def rotate_normal_ccw(img):
    """Gira 90° antihorario una normal en espacio tangente: n' = (-ny, nx)."""
    a = np.asarray(img).astype(np.int16)
    r, g_, b = a[..., 0], a[..., 1], a[..., 2]
    out = np.stack([255 - g_, r, b], -1).astype(np.uint8)
    return Image.fromarray(out)


def mirror_normal(img):
    a = np.asarray(img).copy()
    a[..., 0] = 255 - a[..., 0]
    return Image.fromarray(a)


leaves = []
for name, cols, rows, rot in (('LeafSet023', 2, 3, True), ('LeafSet024', 3, 3, False)):
    s = load_set(name)
    W, H = s['alpha'].size
    for r in range(rows):
        for c in range(cols):
            box = (c * W // cols, r * H // rows, (c + 1) * W // cols, (r + 1) * H // rows)
            crop = {k: v.crop(box) for k, v in s.items()}
            bb = crop['alpha'].point(lambda v: 255 if v > 40 else 0).getbbox()
            if not bb:
                continue
            crop = {k: v.crop(bb) for k, v in crop.items()}
            if rot:  # 023: punta hacia la derecha → girar para que la punta mire arriba y el tallo abajo
                crop = {k: (rotate_normal_ccw(v.rotate(90, expand=True)) if k == 'normal' else v.rotate(90, expand=True)) for k, v in crop.items()}
            leaves.append(crop)
# 16.ª celda: una hoja de 023 reflejada, para más variedad
m = {k: v.transpose(Image.FLIP_LEFT_RIGHT) for k, v in leaves[1].items()}
m['normal'] = mirror_normal(m['normal'])
leaves.append(m)
leaves = leaves[:COLS * ROWS]

cells = []
for i, lf in enumerate(leaves):
    col, row = i % COLS, i // COLS
    w, h = lf['alpha'].size
    sc = min((CW - 12) / w, (CH - 8) / h)
    nw, nh = max(1, int(w * sc)), max(1, int(h * sc))
    x = col * CW + (CW - nw) // 2
    y = row * CH + (CH - nh)  # tallo pegado al borde inferior de la celda
    for k in atlas:
        atlas[k].paste(lf[k].resize((nw, nh), Image.LANCZOS), (x, y))
    cells.append({'w': nw / CW, 'h': nh / CH})

# Dilatar el color hacia las zonas transparentes (evita bordes oscuros con el mipmapping)
col = np.asarray(atlas['color']).astype(np.float32)
al = (np.asarray(atlas['alpha']).astype(np.float32) / 255)[..., None]
acc, wsum = col * al, al.copy()
for rad in (2, 4, 8, 16, 32):
    bc = np.asarray(Image.fromarray((acc).clip(0, 255).astype(np.uint8)).filter(ImageFilter.BoxBlur(rad))).astype(np.float32)
    bw = np.asarray(Image.fromarray((wsum[..., 0] * 255).astype(np.uint8)).filter(ImageFilter.BoxBlur(rad))).astype(np.float32)[..., None] / 255
    fill = np.where(bw > 1e-3, bc / np.maximum(bw, 1e-3), 0)
    need = wsum < 0.5
    acc = np.where(need, fill * 0.999, acc)
    wsum = np.where(need & (bw > 1e-3), 1.0, wsum)
dil = np.where(al > 0.5, col, np.clip(acc, 0, 255))
atlas['color'] = Image.fromarray(dil.astype(np.uint8))

for k, q in (('color', 85), ('alpha', 90), ('normal', 85), ('trans', 85)):
    im = atlas[k]
    im.save(f'{OUT}/hi/leaf_{k}.jpg', quality=q, optimize=True)
    im.resize((im.width // 2, im.height // 2), Image.LANCZOS).save(f'{OUT}/lo/leaf_{k}.jpg', quality=q, optimize=True)

# ---------- 4. Madera cortada (muñones): anillos irregulares, grietas de secado, borde gastado ----------
def vnoise(n, cells, seed):
    r_ = np.random.default_rng(seed).random((cells, cells)).astype(np.float32)
    return np.asarray(Image.fromarray((r_ * 255).astype(np.uint8)).resize((n, n), Image.BICUBIC)).astype(np.float32) / 255


N = 1024
rng = np.random.default_rng(11)
yy, xx = np.mgrid[0:N, 0:N].astype(np.float32)
dx, dy = (xx - N / 2) / (N / 2), (yy - N / 2) / (N / 2)
r = np.sqrt(dx ** 2 + dy ** 2)
a = np.arctan2(dy, dx)
warp = (vnoise(N, 6, 1) - 0.5) * 0.10 + (vnoise(N, 18, 2) - 0.5) * 0.025
rr = (r + warp) * (1 + 0.06 * np.sin(a * 2 + 0.7) + 0.04 * np.sin(a * 3 + 2.1))
spacing = np.cumsum(rng.uniform(0.6, 1.5, 200)); spacing /= spacing[-1]
t = np.interp(np.clip(rr, 0, 1), np.linspace(0, 1, 200), spacing) * 55
ring = np.abs(np.sin(np.pi * t)) ** 6
heart = np.clip(1 - rr / 0.55, 0, 1)
base = np.array([0.70, 0.58, 0.42]) * (1 - heart[..., None] * 0.18) + np.array([0.55, 0.40, 0.26]) * heart[..., None] * 0.18
wood = base * (1 - 0.22 * ring[..., None])
wood *= (0.9 + 0.18 * vnoise(N, 160, 3))[..., None]
wood *= (0.88 + 0.18 * vnoise(N, 10, 4))[..., None]
crack = np.zeros((N, N), np.float32)
for _ in range(6):
    ang = rng.uniform(-np.pi, np.pi); Lc = rng.uniform(0.3, 0.85)
    da = np.abs(np.angle(np.exp(1j * (a - ang - 0.08 * np.sin(r * 14 + ang)))))
    w = 0.004 + 0.03 * np.clip((r - 0.08) / Lc, 0, 1) ** 1.5
    crack = np.maximum(crack, ((da < w) & (r > 0.06) & (r < Lc)).astype(np.float32))
crack = np.asarray(Image.fromarray((crack * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.6))).astype(np.float32) / 255
wood *= (1 - 0.75 * crack)[..., None]
weather = np.clip((rr - 0.62) / 0.3, 0, 1)[..., None]
wood = wood * (1 - weather * 0.35) + np.array([0.45, 0.42, 0.38]) * weather * 0.35
edge = np.clip((rr - 0.9) / 0.06, 0, 1)[..., None]
wood = wood * (1 - edge) + np.array([0.13, 0.11, 0.09]) * edge * (0.8 + 0.4 * vnoise(N, 40, 5)[..., None])
img = Image.fromarray((np.clip(wood, 0, 1) * 255).astype(np.uint8))
img.save(f'{OUT}/hi/cut_wood.jpg', quality=84)
img.resize((512, 512), Image.LANCZOS).save(f'{OUT}/lo/cut_wood.jpg', quality=84)

# ---------- 5. Cielos (Poly Haven, panorámicas) y dirección del sol ----------
meta = {'cells': cells, 'atlas': {'cols': COLS, 'rows': ROWS}}
for key, name in (('day', 'kloofendal_48d_partly_cloudy_puresky'), ('dusk', 'qwantani_dusk_2_puresky')):
    im = Image.open(f'{RES}/sky/{name}_tm.jpg').convert('RGB')
    im.resize((4096, 2048), Image.LANCZOS).save(f'{OUT}/hi/sky_{key}.jpg', quality=80, optimize=True)
    small = im.resize((2048, 1024), Image.LANCZOS)
    small.save(f'{OUT}/lo/sky_{key}.jpg', quality=82, optimize=True)
    a_ = np.asarray(small.resize((1024, 512))).astype(np.float32).mean(axis=2)
    top = a_[:256]
    thr = np.percentile(top, 99.7)
    ys, xs = np.nonzero(top >= thr)
    wts = top[ys, xs]
    u = float((xs * wts).sum() / wts.sum()) / 1024
    v = 1 - float((ys * wts).sum() / wts.sum()) / 512
    lon, lat = (u - 0.5) * 2 * math.pi, (v - 0.5) * math.pi
    meta[f'sun_{key}'] = [math.cos(lat) * math.cos(lon), math.sin(lat), math.cos(lat) * math.sin(lon)]
    os.system(f'cp "{RES}/sky/{name}_1k.hdr" "{OUT}/sky_{key}.hdr"')  # luz ambiental (igual en ordenador y móvil)
for key in ('day', 'dusk'):
    a_ = np.asarray(Image.open(f'{OUT}/lo/sky_{key}.jpg').convert('RGB')).astype(np.float32)
    H_ = a_.shape[0]
    c_ = a_[int(H_ * 0.47):int(H_ * 0.5)].reshape(-1, 3).mean(0) / 255
    meta[f'horizon_{key}'] = '#%02x%02x%02x' % tuple(int(v * 255) for v in c_)
json.dump(meta, open(f'{OUT}/meta.json', 'w'), indent=1)
print(json.dumps({k: v for k, v in meta.items() if k.startswith('sun')}))
