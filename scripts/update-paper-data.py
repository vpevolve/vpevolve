"""Refresh public derived metrics from a local, verified manuscript checkout.

Usage: python3 scripts/update-paper-data.py /path/to/manuscript
No raw experiment files, host paths, or model responses are exported.
"""
import argparse
import hashlib
import json
import re
import shutil
from pathlib import Path
from statistics import mean

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('manuscript', type=Path)
args = parser.parse_args()
paper = args.manuscript.resolve()
site = Path(__file__).resolve().parents[1]
source = paper/'results/r37-engineer-experience-v1/window-benchmark-v1/table-updates'
output = site/'assets/current'
data = json.loads((output/'results.json').read_text())
tex_path = paper/'sections/generated/current_online_table.tex'
tex = tex_path.read_text()
groups = {}
group = None
for line in tex.splitlines():
    if 'multicolumn' in line:
        group = 'poly' if 'Poly (' in line else 'metal1' if 'Metal1 (' in line else 'all'
        groups[group] = []
    elif group and ' & ' in line and 'textbf{Method}' not in line:
        fields = [re.sub(r'\\textbf\{([^}]+)\}', r'\1', x.strip()).replace('\\\\', '') for x in line.split(' & ')]
        if len(fields) != 7:
            continue
        groups[group].append(dict(method=fields[0], max=float(fields[1]), avg=float(fields[2]), pvb=float(fields[3]), mrc=int(fields[4]), success=None if 'textemdash' in fields[5] else float(fields[5]), calls=None if 'textemdash' in fields[6] else fields[6].strip()))
assert len(groups) == 3 and all(len(rows) == 8 for rows in groups.values())
values_path = paper/'sections/generated/final_experiment_values.tex'
values = dict(re.findall(r'\\setresult\{([^}]+)\}\{([^}]+)\}', values_path.read_text()))
ablation = {}
for layer in ['all', 'poly', 'metal1']:
    ablation[layer] = []
    for arm, label in [('nohistory', 'Without experience bank'), ('frozen', 'Frozen experience bank'), ('full', 'VPEvolve')]:
        row = dict(arm=arm, method=label)
        for key in ['max', 'avg', 'pvb', 'mrc', 'success', 'opccalls', 'llmcalls']:
            row[key] = float(values[f'final.ablation.{layer}.{arm}.{key}'])
        ablation[layer].append(row)
frozen_path = source/'current-frozen-ablation-latest.json'
frozen = json.loads(frozen_path.read_text())
assert all(x['status'] == 'complete' and all(x['checks'].values()) for x in frozen['rows'])
reductions = {}
for layer in ablation:
    rows = [x for x in frozen['rows'] if layer == 'all' or x['layer'] == layer]
    full = mean(x['terminal']['edge_normal_max_epe_nm'] for x in rows if x['arm'] == 'full')
    fixed = mean(x['terminal']['edge_normal_max_epe_nm'] for x in rows if x['arm'] == 'frozen')
    reductions[layer] = 100 * (1-full/fixed)
long_path = source/'current-long-latest.json'
long = json.loads(long_path.read_text())
assert len(long['rows']) == 2
assert all(x['status'] == 'complete' and all(x['checks'].values()) and not x['unplotted_calls'] for x in long['rows'])
public_keys = ['case_id','layer','status','stop_reason','initial','current','opc_submitted','llm_reserved','proposal_rejections','points','report_sha256']
data.update(main=groups, ablation=ablation, ablationReductionPct=reductions, trajectories=[{k:row[k] for k in public_keys} for row in long['rows']])
data['sources'] = [{'file': label, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()} for label,path in [('sections/generated/current_online_table.tex',tex_path),('sections/generated/final_experiment_values.tex',values_path),('current-long-derived',long_path),('current-frozen-derived',frozen_path),('figures/pattern-local-rule.png',paper/'figures/pattern-local-rule.png')]]
(output/'results.json').write_text(json.dumps(data, indent=2)+'\n')
shutil.copy2(paper/'figures/pattern-local-rule.png', output/'pattern-local-rule.png')
print('Updated current main / ablation / two completed trajectories. Check visible claims and snapshot date before publishing.')
