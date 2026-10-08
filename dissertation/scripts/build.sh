#!/bin/bash
# Assemble the dissertation docx via pandoc.
cd "$(dirname "$0")/.."

# Inline the auto-generated API table into the appendices at its marker
python3 - <<'PY'
api = open('tables/api-reference.md').read().split('\n', 2)[2]  # strip local title
ap = open('appendices.md').read()
ap = ap.replace('## Appendix B — Full REST API Reference\n\nAuto-generated from `server/routes/`; all 49 endpoints.',
                '## Appendix B — Full REST API Reference\n\n' + api)
open('appendices.md', 'w').write(ap)
PY

# concatenate with blank-line separation + real page breaks for \newpage and before chapters
for f in front-matter.md ch1-introduction.md ch2-literature.md ch3-design.md ch4-implementation.md ch5-conclusion.md references.md appendices.md; do
  cat "$f"; printf '\n\n'; done > _combined.md

python3 - <<'PY'
import re
src = open('_combined.md').read()
PB = '\n```{=openxml}\n<w:p><w:r><w:br w:type="page"/></w:r></w:p>\n```\n'
src = re.sub(r'\\newpage', PB, src)
src = re.sub(r'\n# (CHAPTER (TWO|THREE|FOUR|FIVE)|REFERENCES|APPENDICES)', PB + r'\n# \1', src)
open('_combined.md','w').write(src)
PY

# ensure every image line is its own paragraph (enables pandoc implicit_figures + captions)
python3 - <<'PY'
lines = open('_combined.md').read().split('\n')
out = []
for i, ln in enumerate(lines):
    if ln.strip().startswith('!['):
        if out and out[-1].strip() != '':
            out.append('')
        out.append(ln)
        out.append('')
    else:
        out.append(ln)
open('_combined.md','w').write('\n'.join(out))
PY

pandoc _combined.md \
  --reference-doc=reference.docx \
  -f markdown+smart \
  -o KBlog-Dissertation.docx
echo "built KBlog-Dissertation.docx"
python3 scripts/postprocess.py
ls -la KBlog-Dissertation.docx KBlog-Dissertation-formatted.docx
