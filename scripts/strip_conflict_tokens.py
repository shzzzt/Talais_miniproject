import os, re
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
count=0
for dirpath, dirnames, filenames in os.walk(ROOT):
    if any(part in ('vendor','node_modules','.git','storage') for part in dirpath.split(os.sep)):
        continue
    for fname in filenames:
        fpath=os.path.join(dirpath,fname)
        try:
            with open(fpath,'r',encoding='utf-8') as f:
                s=f.read()
        except Exception:
            continue
        if '            new=s
            new=re.sub(r'            new=re.sub(r'            new=new.replace('','')
            if new!=s:
                with open(fpath,'w',encoding='utf-8') as f:
                    f.write(new)
                print('Cleaned', fpath)
                count+=1
print('Done. cleaned', count, 'files')
