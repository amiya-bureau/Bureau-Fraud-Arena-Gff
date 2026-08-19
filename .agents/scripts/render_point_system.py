import fitz
from pathlib import Path
src = Path('attached_assets/Bureau_Fraud_Arena_-_Point_System_1787115014556.pdf')
out = Path('.agents/outputs/point-system-pages')
out.mkdir(parents=True, exist_ok=True)
doc = fitz.open(src)
print(f'pages={len(doc)}')
for i, page in enumerate(doc):
    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
    path = out / f'page-{i+1}.png'
    pix.save(path)
    print(path)
    print(page.get_text())
