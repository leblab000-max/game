M='/tmp/claude-0/-home-claude/2c70e405-e32e-570c-8707-ce4e4cb47a21/scratchpad/fnt/node_modules/matter-js/build/matter.min.js'
import base64, re, os, zipfile
F='/tmp/claude-0/-home-claude/2c70e405-e32e-570c-8707-ce4e4cb47a21/scratchpad/fnt/node_modules/@fontsource/rubik/files/'
LAT='U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'
CYR='U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116'
ff=''
for w in (400,500,700,800):
  for sub,rng in (('cyrillic',CYR),('latin',LAT)):
    b=base64.b64encode(open(F+f'rubik-{sub}-{w}-normal.woff2','rb').read()).decode()
    ff+=f"@font-face{{font-family:Rubik;font-style:normal;font-weight:{w};font-display:swap;src:url(data:font/woff2;base64,{b}) format('woff2');unicode-range:{rng}}}\n"
h=open('cat/shell.html').read()
h=re.sub(r'<link rel="preconnect"[^>]*>\n','',h); h=re.sub(r'<link rel="stylesheet" href="https://fonts[^>]*>\n','',h)
h=h.replace('<style>\n','<style>\n'+ff,1)
js='\n<script>\n"use strict";\n'+'\n'.join((open(M).read() if f=='MATTER' else open('cat/'+f).read()) for f in ['MATTER','../arena/zzfx.js','assets.js','game.js','story.js','draw.js','ya.js','ui.js'])+'\n</script>\n'
open('cat.html','w').write(h+js)
full='<!doctype html>\n<html lang="ru">\n<head>\n<meta charset="utf-8">\n'+h.replace('<div class="app">','</head>\n<body>\n<div class="app">',1)+js+'</body>\n</html>\n'
open('cat_preview.html','w').write(full)
os.makedirs('dist3',exist_ok=True)
with zipfile.ZipFile('dist3/kotapulta-yandex.zip','w',zipfile.ZIP_DEFLATED) as z: z.writestr('index.html',full)
print(len(full)//1024,'KB', os.path.getsize('dist3/kotapulta-yandex.zip')//1024,'KB zip')
