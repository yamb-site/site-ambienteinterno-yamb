# Gera o ícone do app: python3 scripts/icone_app.py assets/flower-gold.png (grava icon.png, icon-192.png, apple-touch-icon.png e previa.png na pasta atual)
import sys, math
from PIL import Image, ImageDraw, ImageChops
src = Image.open(sys.argv[1]).convert('RGBA'); src = src.crop(src.getbbox())
N = 2048; C = N/2
# fundo: marrom café profundo, centro mais quente (degradê radial suave, sem sombra)
def radial(c0, c1, rmax):
    g = Image.new('L', (N, N)); px = g.load()
    for y in range(0, N, 4):
        for x in range(0, N, 4):
            t = min(1, math.hypot(x-C, y-C)/rmax); v = int(255*t**1.4)
            for dy in range(4):
                for dx in range(4): px[x+dx, y+dy] = v
    return Image.composite(Image.new('RGB',(N,N),c1), Image.new('RGB',(N,N),c0), g)
bg = radial((58, 45, 24), (22, 18, 12), N*0.72).convert('RGBA')
# anel dourado em degradê (claro em cima, mais fundo embaixo)
def anel(R, w, a0, a1):
    m = Image.new('L', (N, N), 0); dm = ImageDraw.Draw(m)
    dm.ellipse((C-R, C-R, C+R, C+R), outline=255, width=w)
    g = Image.linear_gradient('L').resize((N, N))  # 0 em cima -> 255 embaixo
    ouro = Image.composite(Image.new('RGB',(N,N),(150,104,40)), Image.new('RGB',(N,N),(250,214,140)), g).convert('RGBA')
    m = m.point(lambda v: v*a0//255)
    return ouro, m
for R, w, a in [(N*0.40, int(N*0.007), 235), (N*0.372, int(N*0.0022), 110)]:
    ouro, m = anel(R, w, a, a); bg = Image.composite(ouro, bg, m)
# pontinhos dourados em volta da flor, alternando tamanho
ov = Image.new('RGBA', (N, N)); o = ImageDraw.Draw(ov)
Rp = N*0.262; k = 60
for i in range(k):
    a = 2*math.pi*i/k - math.pi/2; x = C+Rp*math.cos(a); y = C+Rp*math.sin(a)
    s = N*(0.0058 if i % 2 == 0 else 0.0034)
    o.ellipse((x-s, y-s, x+s, y+s), fill=(240, 196, 110, 210 if i % 2 == 0 else 140))
bg = Image.alpha_composite(bg, ov)
F = int(N*0.50); fl = src.resize((F, F), Image.LANCZOS)
bg.alpha_composite(fl, (int(C-F/2), int(C-F/2)))
bg = bg.convert('RGB')
for s, nome in [(512,'icon.png'), (192,'icon-192.png'), (180,'apple-touch-icon.png')]:
    bg.resize((s, s), Image.LANCZOS).save(nome, optimize=True)
# prévia: grande com corte arredondado do iPhone + tamanhos pequenos
P = 520; big = bg.resize((P, P), Image.LANCZOS)
mask = Image.new('L', (P, P), 0); ImageDraw.Draw(mask).rounded_rectangle((0,0,P-1,P-1), radius=int(P*0.225), fill=255)
tela = Image.new('RGB', (P+40+240, P+40), (238, 232, 222))
tela.paste(big, (20, 20), mask)
y = 40
for s in [120, 76, 60]:
    sm = bg.resize((s, s), Image.LANCZOS); mk = mask.resize((s, s), Image.LANCZOS)
    tela.paste(sm, (P+60+(180-s)//2, y), mk); y += s+30
mk = Image.new('L', (120,120), 0); ImageDraw.Draw(mk).ellipse((0,0,119,119), fill=255)
tela.paste(bg.resize((120,120), Image.LANCZOS), (P+90, y), mk)
tela.save('previa.png')
