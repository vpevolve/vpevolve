"""Export verified manuscript aggregates; retain only derived public data."""
import argparse,json,re,hashlib
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('manuscript',type=Path);a=p.parse_args();paper=a.manuscript.resolve();site=Path(__file__).resolve().parents[1]
f=paper/'sections/generated/final_experiment_values.tex';v=dict(re.findall(r'\\setresult\{([^}]+)\}\{([^}]+)\}',f.read_text()))
out=site/'assets/current/results.json';d=json.loads(out.read_text());groups={};abl={}
methods=[('initial','Initial recipe'),('raw','Raw Actor'),('react','ReAct'),('text','Textual Memory'),('reasonbank','ReasoningBank-style'),('ace','ACE-style'),('static','Static Harness'),('bo','Bayesian optimization'),('full','VPEvolve')]
for g in ['all','poly','metal1']:
 groups[g]=[];abl[g]=[]
 for key,name in methods:
  prefix=f'final.main.{g}.{key}.';row={'method':name,**{k:float(v[prefix+k]) for k in ['max','avg','pvb','mrc']}}
  row.update(success=None if key=='initial' else float(v[prefix+'success']),calls=None if key=='initial' else v[prefix+'opccalls']+' / '+v[prefix+'llmcalls']);groups[g].append(row)
 for arm,label in [('nohistory','No experience bank'),('frozen','Frozen bank'),('nolocal','No local correction'),('full','Direct reuse'),('reviewed','Reviewed reuse')]:
  prefix=f'final.ablation.{g}.{arm}.';abl[g].append(dict(arm=arm,method=label,**{k:float(v[prefix+k]) for k in ['max','avg','pvb','mrc','success','opccalls','llmcalls']}))
c=paper/'output/continuation-20260921/final-summary.json';continuation=json.loads(c.read_text())
d.update(asOf='2026-09-21',main=groups,ablation=abl,continuation=continuation)
d['protocol'].update(candidates=10,methods=8)
d.pop('ablationReductionPct',None)
d['sources']=[{'file':name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()} for name,path in [('manuscript-results',f),('paired-continuation',c)]]
trajectory=site/'assets/current/geometry/trajectories.json'
if trajectory.exists():d['trajectories']=json.loads(trajectory.read_text())
out.write_text(json.dumps(d,indent=2)+'\n');print('Updated20-window main,5-condition reuse,paired continuation; asOf2026-09-21')
