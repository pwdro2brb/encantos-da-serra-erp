"""Gera uma versão HTML única e um pacote portátil, sem arquivos de trabalho."""
from pathlib import Path
import zipfile,base64
ROOT=Path(__file__).resolve().parent
dist=ROOT/'prototipo/dist'
html=(dist/'index.html').read_text(encoding='utf-8')
html=html.replace('<link rel="stylesheet" href="styles.css">','<style>\n'+(dist/'styles.css').read_text(encoding='utf-8')+'\n</style>')
html=html.replace('<link rel="stylesheet" href="official.css">','<style>\n'+(dist/'official.css').read_text(encoding='utf-8')+'\n</style>')
for script in ['official.js','core.js','official-ui.js','app.js']:
    html=html.replace(f'<script src="{script}"></script>','<script>\n'+(dist/script).read_text(encoding='utf-8')+'\n</script>')
for asset in (dist/'assets/official').glob('*.webp'):
    relative=asset.relative_to(dist).as_posix()
    html=html.replace(relative,'data:image/webp;base64,'+base64.b64encode(asset.read_bytes()).decode('ascii'))
(ROOT/'INICIAR.html').write_text(html,encoding='utf-8')
files=[ROOT/'README.md',ROOT/'INICIAR.html']
for folder in ['docs','database','apresentacao']:
    files += [p for p in (ROOT/folder).rglob('*') if p.is_file() and '__pycache__' not in str(p)]
files += [p for p in dist.rglob('*') if p.is_file()]+[ROOT/'prototipo/server.mjs',ROOT/'prototipo/core.test.cjs']
with zipfile.ZipFile(ROOT/'Encantos_da_Serra_Kit_Apresentacao.zip','w',zipfile.ZIP_DEFLATED) as z:
    for p in files:z.write(p,p.relative_to(ROOT))
print('HTML único e kit de apresentação gerados.')
