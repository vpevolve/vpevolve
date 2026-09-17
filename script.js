'use strict';
const $ = (s) => document.querySelector(s);
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const stages = {
 global: ['RECIPE-WIDE INTERVENTION','Improve the common recipe first.','Change editable recipe settings such as fragmentation, movement limits, and feedback. Search begins globally, with every candidate checked against the same fixed measurement contract.',['parent recipe','typed global edit','physical evaluation'],'Both stages share one evaluation budget. The local stage opens after two consecutive feasible low-gain trials and a persistent hotspot.'],
 local: ['SPATIALLY SCOPED INTERVENTION','Act on the pattern behind the error.','Locate the worst gauge, capture its surrounding pattern, and match that geometry. Native markers tag target-edge fragments for a local feedback override; the fixed external gauges still score the full window.',['hotspot pattern','matched fragments','scoped OPC rule'],'Track the original focus and the new global maximum. Better focus EPE alone is not sufficient for retaining a candidate.'],
 memory: ['PERSISTENT MEASURED EXPERIENCE','Keep the evidence, including the failures.','Each physical trial joins the archive with its parent recipe, action, scope, measurements, and outcome. Later proposals retrieve relevant records and verify historical claims before execution.',['measured trial','scoped record','retrieval & checking'],'The actor and harness code remain fixed. Authored engineering skills are part of the design; trial records and retained recipes accumulate during search.']
};
document.querySelectorAll('[data-stage]').forEach(button => button.addEventListener('click',()=>{
 document.querySelectorAll('[data-stage]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});
 const x=stages[button.dataset.stage];$('#stage-tag').textContent=x[0];$('#stage-title').textContent=x[1];$('#stage-body').textContent=x[2];$('#stage-note').textContent=x[4];$('#stage-code').innerHTML=x[3].map(s=>`<span>${s}</span>`).join('<b>→</b>');
}));
const stack=$('.hero-stack');
if(stack){stack.addEventListener('pointermove',e=>{if(reduced.matches||e.pointerType==='touch')return;const r=stack.getBoundingClientRect();stack.style.setProperty('--rx',`${(e.clientY-r.top-r.height/2)/50}deg`);stack.style.setProperty('--ry',`${(e.clientX-r.left-r.width/2)/45}deg`);});stack.addEventListener('pointerleave',()=>{stack.style.setProperty('--rx','0deg');stack.style.setProperty('--ry','0deg');});}
function groupButtons(selector,button){document.querySelectorAll(selector).forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});}
const fmt=(x,n)=>x===null?'—':Number(x).toFixed(n);
fetch('assets/current/results.json').then(r=>{if(!r.ok)throw Error('Data unavailable');return r.json();}).then(data=>{
 function main(group){const rows=data.main[group],full=rows.find(r=>r.method==='VPEvolve'),baseline=rows.filter(r=>!['Initial recipe','VPEvolve'].includes(r.method)).sort((a,b)=>a.max-b.max)[0];
 $('#result-main').innerHTML=`${fmt(full.max,3)} <small>nm</small>`;
 $('#result-comparison').textContent=`${((1-full.max/baseline.max)*100).toFixed(2)}% below ${baseline.method}`;
 $('#comparison-bars').innerHTML=[rows[0],baseline,full].map(r=>`<div class="bar-row ${r===full?'ours':''}"><span>${r.method}</span><div><i style="width:${r.max/Math.max(...rows.map(v=>v.max))*100}%"></i></div><b>${fmt(r.max,3)}</b></div>`).join('');
 $('#results-body').innerHTML=rows.map(r=>`<tr class="${r.method==='VPEvolve'?'ours':''}"><th scope="row">${r.method}</th><td>${fmt(r.max,3)}</td><td>${fmt(r.avg,3)}</td><td>${fmt(r.pvb,6)}</td><td>${r.mrc}</td><td>${fmt(r.success,0)}</td><td>${r.calls??'—'}</td></tr>`).join('');
 }
 function ablation(group){const rows=data.ablation[group],full=rows[2],frozen=rows[1];
 $('#ablation-cards').innerHTML=rows.map((r,i)=>`<article class="ablation-card ${i===2?'ours':''}"><span>0${i+1} / ${['RECORD ACCESS OFF','STARTING RECORDS ONLY','STARTING + NEW RECORDS'][i]}</span><h3>${r.method}</h3><strong>${fmt(r.max,3)}<small> nm</small></strong><p>Mean window-max EPE</p><div class="ablation-bar"><i style="width:${100*r.max/Math.max(...rows.map(x=>x.max))}%"></i></div><dl><div><dt>Avg. EPE</dt><dd>${fmt(r.avg,3)} nm</dd></div><div><dt>PVB</dt><dd>${fmt(r.pvb,6)} µm</dd></div><div><dt>MRC</dt><dd>${r.mrc}</dd></div><div><dt>Success</dt><dd>${fmt(r.success,1)}%</dd></div><div><dt>OPC / LLM</dt><dd>${r.opccalls} / ${r.llmcalls}</dd></div></dl></article>`).join('');
 $('#ablation-takeaway').textContent=`With the same initial bank, access to newly accumulated cards lowers mean window-max EPE by ${data.ablationReductionPct[group].toFixed(2)}%${group==='all'?'. Three paired wins, three ties.':group==='poly'?'. The benefit is concentrated on Poly.':'. Metal1 is nearly tied.'}`;
 }
 document.querySelectorAll('[data-group]').forEach(b=>b.addEventListener('click',()=>{groupButtons('[data-group]',b);main(b.dataset.group);}));
 document.querySelectorAll('[data-ablation]').forEach(b=>b.addEventListener('click',()=>{groupButtons('[data-ablation]',b);ablation(b.dataset.ablation);}));
 main('all');ablation('all');
 const trace=data.trajectories.find(r=>r.layer==='poly'), pts=trace.points;
 const x=v=>30+v/trace.opc_submitted*440,y=v=>175-v/trace.initial.edge_normal_max_epe_nm*140;
 let path='';pts.forEach((p,i)=>{path+=i?` H${x(p.opc_calls)} V${y(p.retained_metrics.edge_normal_max_epe_nm)}`:`M${x(p.opc_calls)},${y(p.retained_metrics.edge_normal_max_epe_nm)}`;});
 document.querySelectorAll('.trajectory-preview .trace-line,.trajectory-preview .trace-glow').forEach(el=>el.setAttribute('d',path));
 const end=pts[pts.length-1];$('.trajectory-preview circle').setAttribute('cx',String(x(end.opc_calls)));$('.trajectory-preview circle').setAttribute('cy',String(y(end.retained_metrics.edge_normal_max_epe_nm)));

}).catch(()=>{$('#results-body').innerHTML='<tr><td colspan="7">Results could not load. <a href="assets/current/results.json">Open the result file</a> or refresh this page.</td></tr>';$('#ablation-cards').textContent='The result file could not load. Please refresh.';});
