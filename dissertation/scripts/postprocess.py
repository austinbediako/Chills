#!/usr/bin/env python3
"""Post-process the pandoc-built docx:
- UG logo already in markdown; center title page
- Replace [[TOC]] [[LOF]] [[LOT]] markers with real Word fields
- Center all figures and captions
- Style bold 'Table X.Y' paragraphs as Table Caption (for LOT field)
- 'CHAPTER N: Title' headings -> two-line UG style, centered
- Section split: front matter roman numerals, body arabic; PAGE footer fields
- updateFields on open
"""
import copy, re, sys
from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

SRC = 'KBlog-Dissertation.docx'
OUT = 'KBlog-Dissertation-formatted.docx'

doc = Document(SRC)

def set_center(p):
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER

def make_field(paragraph, instr):
    r1 = paragraph.add_run(); fc = OxmlElement('w:fldChar'); fc.set(qn('w:fldCharType'), 'begin'); r1._r.append(fc)
    r2 = paragraph.add_run(); it = OxmlElement('w:instrText'); it.set(qn('xml:space'), 'preserve'); it.text = f' {instr} '; r2._r.append(it)
    r3 = paragraph.add_run(); fs = OxmlElement('w:fldChar'); fs.set(qn('w:fldCharType'), 'separate'); r3._r.append(fs)
    r4 = paragraph.add_run('Right-click → Update Field to populate.')
    r5 = paragraph.add_run(); fe = OxmlElement('w:fldChar'); fe.set(qn('w:fldCharType'), 'end'); r5._r.append(fe)

def page_field(paragraph):
    make_field(paragraph, 'PAGE')

# ---------- 1. markers -> heading + field ----------
for p in list(doc.paragraphs):
    t = p.text.strip()
    if t in ('[[TOC]]', '[[LOF]]', '[[LOT]]'):
        title = {'[[TOC]]': 'TABLE OF CONTENTS', '[[LOF]]': 'LIST OF FIGURES', '[[LOT]]': 'LIST OF TABLES'}[t]
        instr = {'[[TOC]]': 'TOC \\o "1-3" \\h \\z \\u',
                 '[[LOF]]': 'TOC \\h \\z \\t "Image Caption,1"',
                 '[[LOT]]': 'TOC \\h \\z \\t "Table Caption,1"'}[t]
        p.text = ''
        p.style = doc.styles['Heading 1']
        p.runs.clear() if p.runs else None
        p.add_run(title)
        set_center(p)
        fp = p.insert_paragraph_before()  # moves BELOW? insert_paragraph_before inserts before
        # actually add field paragraph AFTER p
        newp = OxmlElement('w:p')
        p._p.addnext(newp)
        from docx.text.paragraph import Paragraph
        fp = Paragraph(newp, p._parent)
        make_field(fp, instr)

# ---------- 2. Table Caption style ----------
style_names = {s.name for s in doc.styles}
if 'Table Caption' not in style_names:
    from docx.enum.style import WD_STYLE_TYPE
    tc = doc.styles.add_style('Table Caption', WD_STYLE_TYPE.PARAGRAPH)
    tc.base_style = doc.styles['Normal']
    tc.font.bold = True

for p in doc.paragraphs:
    if re.match(r'^(Table|Table\s)\s*\d+\.\d+', p.text.strip()) and p.style.name in ('Body Text', 'Normal', 'First Paragraph', 'Compact'):
        p.style = doc.styles['Table Caption']

# ---------- 3. center figures & captions ----------
for p in doc.paragraphs:
    if p.style.name in ('Captioned Figure', 'Image Caption') or p._p.findall('.//' + qn('w:drawing')):
        set_center(p)

# ---------- 3b. normalise image sizes: min 5.8in wide, max 6.3in wide, max 8.9in tall ----------
EMU = 914400
MIN_W, MAX_W, MAX_H = 5.8 * EMU, 6.3 * EMU, 8.9 * EMU
for ext in doc.element.body.findall('.//' + qn('wp:extent')):
    cx, cy = int(ext.get('cx')), int(ext.get('cy'))
    if cx == 0: continue
    w, h = cx, cy
    if w < MIN_W:
        h = int(h * MIN_W / w); w = int(MIN_W)
    if w > MAX_W:
        h = int(h * MAX_W / w); w = int(MAX_W)
    if h > MAX_H:
        w = int(w * MAX_H / h); h = int(MAX_H)
    ext.set('cx', str(w)); ext.set('cy', str(h))
    # sync the picture's transform extents so render matches frame
    inline = ext.getparent()
    for aext in inline.findall('.//' + qn('a:ext')):
        aext.set('cx', str(w)); aext.set('cy', str(h))

# ---------- 4. center title-page paragraphs (everything before DECLARATION) ----------
seen_declaration = False
for p in doc.paragraphs:
    if p.text.strip().startswith('DECLARATION'):
        seen_declaration = True
    if not seen_declaration:
        set_center(p)

# ---------- 5. Heading 1 centered + split 'CHAPTER X: Title' into two lines ----------
for p in doc.paragraphs:
    if p.style.name == 'Heading 1':
        set_center(p)
        for run in p.runs:
            m = re.match(r'^(CHAPTER [A-Z]+):\s*(.*)$', run.text)
            if m and m.group(2):
                run.text = m.group(1)
                br = OxmlElement('w:br'); run._r.append(br)
                run._r.append(OxmlElement('w:t'))  # ensure t exists
                t2 = run._r.findall(qn('w:t'))[-1]
                t2.text = m.group(2)

# ---------- 6. section split: front matter roman, body arabic ----------
body_sectPr = doc.sections[0]._sectPr
first_ch1 = None
for p in doc.paragraphs:
    if p.text.strip().startswith('CHAPTER ONE'):
        first_ch1 = p
        break

if first_ch1 is not None:
    # section break paragraph BEFORE CHAPTER ONE
    sectPr_front = copy.deepcopy(body_sectPr)
    for el in sectPr_front.findall(qn('w:headerReference')) + sectPr_front.findall(qn('w:footerReference')):
        sectPr_front.remove(el)
    pg = OxmlElement('w:pgNumType'); pg.set(qn('w:fmt'), 'lowerRoman')
    sectPr_front.append(pg)

    brp = OxmlElement('w:p')
    pPr = OxmlElement('w:pPr')
    pPr.append(sectPr_front)
    brp.append(pPr)
    first_ch1._p.addprevious(brp)

    # body section: arabic, restart at 1
    for el in body_sectPr.findall(qn('w:pgNumType')):
        body_sectPr.remove(el)
    pgb = OxmlElement('w:pgNumType'); pgb.set(qn('w:fmt'), 'decimal'); pgb.set(qn('w:start'), '1')
    body_sectPr.append(pgb)

# footers with PAGE numbers for every section
for sec in doc.sections:
    sec.footer.is_linked_to_previous = False
    fp = sec.footer.paragraphs[0] if sec.footer.paragraphs else sec.footer.add_paragraph()
    for r in list(fp.runs): r._r.getparent().remove(r._r)
    set_center(fp)
    page_field(fp)

# ---------- 7. auto-update fields on open ----------
settings = doc.settings.element
if not settings.findall(qn('w:updateFields')):
    uf = OxmlElement('w:updateFields'); uf.set(qn('w:val'), 'true')
    settings.append(uf)

doc.save(OUT)
print('saved', OUT)
