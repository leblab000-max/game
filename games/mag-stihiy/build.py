# Сборка «Маг стихий» в один html: превью для артефакта и zip для Яндекса
import base64, os, re, zipfile
H = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(H, '..', '..')
V = os.path.join(ROOT, 'vendor')
LAT = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'
CYR = 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116'
ff = ''
for w in (400, 500, 700, 800):
    for sub, rng in (('cyrillic', CYR), ('latin', LAT)):
        b = base64.b64encode(open(f'{V}/fonts/rubik-{sub}-{w}-normal.woff2', 'rb').read()).decode()
        ff += f"@font-face{{font-family:Rubik;font-style:normal;font-weight:{w};font-display:swap;src:url(data:font/woff2;base64,{b}) format('woff2');unicode-range:{rng}}}\n"
h = open(f'{H}/src/shell.html').read().replace('<style>\n', '<style>\n' + ff, 1)
phaser = open(f'{V}/phaser-3.90.0.min.js').read()
js = '\n'.join(open(f'{H}/src/{f}').read() for f in ['data.js', 'tex.js', 'run.js', 'ya.js', 'ui.js'])
js = open(f'{ROOT}/shared/zzfx.js').read() + '\n' + js
body = '\n<script>\n' + phaser + '\n</script>\n<script>\n"use strict";\n' + js + '\n</script>\n'
full = '<!doctype html>\n<html lang="ru">\n<head>\n<meta charset="utf-8">\n' + h.replace('<div class="app">', '</head>\n<body>\n<div class="app">', 1) + body + '</body>\n</html>\n'
os.makedirs(f'{H}/dist', exist_ok=True)
open(f'{H}/dist/index.html', 'w').write(full)
with zipfile.ZipFile(f'{H}/dist/mag-stihiy-yandex.zip', 'w', zipfile.ZIP_DEFLATED) as z: z.writestr('index.html', full)
print(len(full) // 1024, 'KB', os.path.getsize(f'{H}/dist/mag-stihiy-yandex.zip') // 1024, 'KB zip')
