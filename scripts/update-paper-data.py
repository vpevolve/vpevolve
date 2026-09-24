"""Export verified manuscript aggregates; retain only derived public data."""
import argparse,json,re,hashlib
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('manuscript',type=Path);a=p.parse_args();paper=a.manuscript.resolve();site=Path(__file__).resolve().parents[1]
f=paper/'sections/generated/final_experiment_values.tex';v=dict(re.findall(r'\\setresult\{([^}]+)\}\{([^}]+)\}',f.read_text()))
out=site/'assets/current/results.json';d=json.loads(out.read_text());groups={};abl={}
online_table=paper/'sections/online_main_results.tex'
online_rows={};layer=None
for line in online_table.read_text().splitlines():
 line=line.strip()
 if line.startswith('Poly & R0 &'):layer='poly'
 elif line.startswith('Metal1 & R0 &'):layer='metal1'
 elif not (line.startswith('& Final &') and layer):continue
 cells=[re.sub(r'\\textbf\{([^}]+)\}',r'\1',cell.strip()).rstrip(' \\') for cell in line.split('&')]
 if cells[1]=='R0':
  online_rows[layer]={'initial':{'max':float(cells[2]),'avg':float(cells[3]),'pvb':float(cells[4])}}
 else:
  online_rows[layer]['final']={'max':float(cells[2]),'avg':float(cells[3]),'pvb':float(cells[4]),'success':cells[5],'opccalls':int(cells[6]),'llmcalls':int(cells[7])}
assert set(online_rows)=={'poly','metal1'} and all(set(rows)=={'initial','final'} for rows in online_rows.values())
d['online']={'study':'Online Actor--Reflector--Curator','model':'Qwen3.6-27B-BF16','windows':20,'trialsPerWindow':10,'layers':online_rows}
methods=[('initial','Initial recipe'),('raw','Raw Actor'),('react','ReAct'),('text','Textual Memory'),('reasonbank','ReasoningBank-style'),('ace','ACE-style'),('static','Static Harness'),('bo','Bayesian optimization'),('full','Direct reuse')]
for g in ['all','poly','metal1']:
 groups[g]=[];abl[g]=[]
 for key,name in methods:
  prefix=f'final.main.{g}.{key}.';row={'method':name,**{k:float(v[prefix+k]) for k in ['max','avg','pvb','mrc']}}
  row.update(success=None if key=='initial' else float(v[prefix+'success']),calls=None if key=='initial' else v[prefix+'opccalls']+' / '+v[prefix+'llmcalls']);groups[g].append(row)
 for arm,label in [('nohistory','No experience bank'),('frozen','Frozen bank'),('nolocal','No local correction'),('full','Direct reuse'),('reviewed','Reviewed reuse')]:
  prefix=f'final.ablation.{g}.{arm}.';abl[g].append(dict(arm=arm,method=label,**{k:float(v[prefix+k]) for k in ['max','avg','pvb','mrc','success','opccalls','llmcalls']}))
c=paper/'output/continuation-20260921/final-summary.json'
if not c.exists():c=paper.parent/'continuation-20260921/final-summary.json'
continuation=json.loads(c.read_text())
d.update(asOf='2026-09-21',main=groups,ablation=abl,continuation=continuation)
d['protocol'].update(candidates=10,methods=8)
d.pop('ablationReductionPct',None)
d['sources']=[{'file':name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()} for name,path in [('manuscript-results',f),('paired-continuation',c),('online-main',online_table)]]
trajectory=site/'assets/current/geometry/trajectories.json'
if trajectory.exists():d['trajectories']=json.loads(trajectory.read_text())
out.write_text(json.dumps(d,indent=2)+'\n');print('Updated online run, direct-reuse comparison, five-condition reuse, and paired continuation')
