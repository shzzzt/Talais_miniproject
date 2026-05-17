import os
import re

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
keep_head_patterns = [
    'classschedule', 'class_schedule', 'classSchedule',
    'form138', 'form_138', 'form-138', 'form 138',
    'form138controller', 'reportexcelcontroller', 'reportcontroller',
    'faculty', 'facultymanagement', 'grade_level_head', 'gradelevelhead', 'grade-level-head',
    'school_admin', 'system_admin', 'schooladmin', 'systemadmin'
]

conflict_re = re.compile(r'.*?.*?', re.S)

modified = []
errors = []

for dirpath, dirnames, filenames in os.walk(ROOT):
    # skip vendor, node_modules, storage, .git
    if any(part in ('vendor', 'node_modules', '.git', 'storage') for part in dirpath.split(os.sep)):
        continue
    for fname in filenames:
        fpath = os.path.join(dirpath, fname)
        try:
            with open(fpath, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            continue
        def choose(m):
            mstr = m.group(0)
            try:
                i1 = mstr.index('', i1)
                i3 = mstr.index('', i2)
            except ValueError:
                return mstr
            head_chunk = mstr[i1+7:i2]
            incoming_chunk = mstr[i2+7:i3]
            rel = os.path.relpath(fpath, ROOT).replace('\\','/').lower()
            use_head = any(pat in rel for pat in keep_head_patterns)
            chosen = head_chunk if use_head else incoming_chunk
            return chosen

        new_content, n = conflict_re.subn(lambda m: choose(m), content)
        if n > 0:
            # cleanup any leftover marker tokens on the same file
            cleaned = re.sub(r'            cleaned = re.sub(r'            cleaned = cleaned.replace('', '')
            try:
                with open(fpath, 'w', encoding='utf-8') as f:
                    f.write(cleaned)
                modified.append((fpath, n))
            except Exception as e:
                errors.append((fpath, str(e)))

print('Modified files:')
for p,n in modified:
    print(p, 'blocks:', n)
if errors:
    print('\nErrors:')
    for p,e in errors:
        print(p, e)

# exit code
if errors:
    raise SystemExit(1)
