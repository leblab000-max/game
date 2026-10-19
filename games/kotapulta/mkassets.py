import base64, io
from PIL import Image
K='kenney/PNG/'
M={'wood':('Wood','Wood',{'h':['012','015','047'],'v':['019','024','051'],'s':['010','013','045'],'S':['017','022','049'],'ball':['000','006','044'],'tri':['054','005','043']}),
   'stone':('Stone','Stone',{'h':['013','016','048'],'v':['020','025','052'],'s':['011','014','046'],'S':['018','023','050'],'ball':['001','007','045'],'tri':['000','006','044']}),
   'ice':('Glass','Glass',{'h':['014','017','049'],'v':['021','026','053'],'s':['012','015','047'],'S':['019','024','051'],'ball':['002','008','046'],'tri':['001','007','045']})}
files={}
for key,(folder,name,slots) in M.items():
  for slot,ids in slots.items():
    for st,i in enumerate(ids): files[f'{key}_{slot}_{st}']=f'{K}{folder} elements/element{name}{i}.png'
for st,i in enumerate(['011','014','049']): files[f'tnt_{st}']=f'{K}Explosive elements/elementExplosive{i}.png'
for m,n in [('wood','Wood'),('stone','Stone'),('ice','Glass')]:
  for k in (1,2,3): files[f'deb_{m}_{k}']=f'{K}Debris/debris{n}_{k}.png'
for o in ['grass','dirt','snow','sand','rock','bush','frozenBush','starGold','flagRed','coinGold']: files[o]=f'{K}Other/{o}.png'
out=[]; total=0
for k,f in files.items():
  im=Image.open(f).convert('RGBA')
  b=io.BytesIO(); im.save(b,'PNG',optimize=True); data=b.getvalue()
  q=im.quantize(colors=96, method=Image.FASTOCTREE); b2=io.BytesIO(); q.save(b2,'PNG',optimize=True)
  if len(b2.getvalue())<len(data): data=b2.getvalue()
  total+=len(data); out.append(f'"{k}":"data:image/png;base64,{base64.b64encode(data).decode()}"')
open('assets.js','w').write('// Графика: Kenney Physics Assets (CC0, www.kenney.nl)\nconst KSRC = {'+',\n'.join(out)+'};\nconst KIMG = {}; for (const k in KSRC) { const im = new Image(); im.src = KSRC[k]; KIMG[k] = im; }\n')
print(len(files),'images',total//1024,'KB')
