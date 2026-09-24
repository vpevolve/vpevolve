'use strict';
const $ = (s) => document.querySelector(s);
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const stages = {
 global: ['RECIPE-WIDE INTERVENTION','Tune settings across the layout.','The actor reads the recipe, process manuals, and measured layout feedback before proposing a global parameter edit. The commercial tool evaluates the candidate under fixed quality limits.',['recipe & layout','global edit','physical evaluation'],'Global edits share one ten-trial budget with local rules and diagnostic experiments.'],
 local: ['SPATIALLY SCOPED INTERVENTION','Write a rule for the remaining hotspot.','Layout tools connect a measured EPE hotspot to its design edge and surrounding geometry. The actor proposes a bounded local rule; deterministic checks compile it and the commercial tool measures the result.',['hotspot geometry','matched edge','local rule'],'The agent compares the original focus, the new worst location, and the full scoring region.'],
 memory: ['SELF-EVOLVING SKILL BANK','Turn every trial into a better next decision.','After each evaluation, an LLM reflector analyzes the local and global response. An LLM curator distills evidence-linked judgments, checks counterexamples, and suggests tests. The actor retrieves relevant skills before its next trial.',['trial record','reflect & curate','retrieve skill'],'The recipe and Skill Bank evolve during a run; model weights and harness code remain fixed.']
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
 function online(){const layers=data.online.layers,labels={poly:'Poly',metal1:'Metal1'};
 $('#online-cards').innerHTML=Object.entries(layers).map(([key,row])=>{const drop=(1-row.final.max/row.initial.max)*100;return `<article class="online-card"><span>${labels[key]} · 10 WINDOWS</span><strong>${drop.toFixed(1)}<small>%</small></strong><p>Lower mean window-maximum EPE</p><div class="online-endpoints"><b>${fmt(row.initial.max,3)} nm</b><i>→</i><b>${fmt(row.final.max,3)} nm</b></div></article>`;}).join('');
 $('#online-table-body').innerHTML=Object.entries(layers).map(([key,row])=>`<tr><th scope="row">${labels[key]}</th><td>${fmt(row.initial.max,3)} → <b>${fmt(row.final.max,3)}</b></td><td>${fmt(row.initial.avg,3)} → <b>${fmt(row.final.avg,3)}</b></td><td>${fmt(row.initial.pvb,3)} → <b>${fmt(row.final.pvb,3)}</b></td><td>${row.final.success}</td><td>${row.final.opccalls} / ${row.final.llmcalls}</td></tr>`).join('');
 }
 function main(group){const rows=data.main[group],full=rows.find(r=>r.method==='Direct reuse'),baseline=rows.filter(r=>!['Initial recipe','Direct reuse'].includes(r.method)).sort((a,b)=>a.max-b.max)[0];
 $('#result-main').innerHTML=`${fmt(full.max,3)} <small>nm</small>`;
 $('#result-comparison').textContent=`${((1-full.max/baseline.max)*100).toFixed(2)}% below ${baseline.method}`;
 $('#comparison-bars').innerHTML=[rows[0],baseline,full].map(r=>`<div class="bar-row ${r===full?'ours':''}"><span>${r.method}</span><div><i style="width:${r.max/Math.max(...rows.map(v=>v.max))*100}%"></i></div><b>${fmt(r.max,3)}</b></div>`).join('');
 $('#results-body').innerHTML=rows.map(r=>`<tr class="${r.method==='Direct reuse'?'ours':''}"><th scope="row">${r.method}</th><td>${fmt(r.max,3)}</td><td>${fmt(r.avg,3)}</td><td>${fmt(r.pvb,6)}</td><td>${r.mrc}</td><td>${fmt(r.success,0)}</td><td>${r.calls??'—'}</td></tr>`).join('');
 }
 function ablation(group){const rows=data.ablation[group],full=rows.find(r=>r.arm==='reviewed'),frozen=rows.find(r=>r.arm==='frozen');
 const tags={nohistory:'RECORD ACCESS OFF',frozen:'STARTING RECORDS',nolocal:'GLOBAL ACTIONS ONLY',full:'DIRECT ONLINE REUSE',reviewed:'FACTS + REVIEWED REUSE'};
 $('#ablation-cards').innerHTML=rows.map((r,i)=>`<article class="ablation-card ${r.arm==='reviewed'?'ours':''}"><span>0${i+1} / ${tags[r.arm]}</span><h3>${r.method}</h3><strong>${fmt(r.max,3)}<small> nm</small></strong><p>Mean window-max EPE</p><div class="ablation-bar"><i style="width:${100*r.max/Math.max(...rows.map(x=>x.max))}%"></i></div><dl><div><dt>Avg. EPE</dt><dd>${fmt(r.avg,3)} nm</dd></div><div><dt>PVB</dt><dd>${fmt(r.pvb,6)} µm</dd></div><div><dt>MRC</dt><dd>${r.mrc}</dd></div><div><dt>OPC / LLM</dt><dd>${r.opccalls} / ${r.llmcalls}</dd></div></dl></article>`).join('');
 $('#ablation-takeaway').textContent=group==='all'?'Reviewed reuse lowers mean window-max EPE by 7.4% versus direct reuse and 2.1% versus the frozen bank. The gain is concentrated in Poly.':group==='poly'?'Reviewed reuse reaches 6.368 nm, versus 7.309 nm with a frozen bank. Keeping trial facts and checking applicability improve the aggregate Poly result.':'The frozen bank remains strongest on Metal1: 15.342 nm versus 15.811 nm for reviewed reuse. Local correction provides the clearest benefit on these windows.';
 }
 $('#continuation-body').innerHTML=['poly','metal1','all'].map(g=>{const r=data.continuation[g],k='edge_normal_max_epe_nm';return `<tr><th scope="row">${{poly:'Poly',metal1:'Metal1',all:'Overall'}[g]}</th><td>${fmt(r.start,3)}</td><td>${fmt(r.global[k],3)}</td><td><b>${fmt(r.local[k],3)}</b></td><td>${fmt(100*(1-r.local[k]/r.start),1)}%</td></tr>`;}).join('');
 document.querySelectorAll('[data-group]').forEach(b=>b.addEventListener('click',()=>{groupButtons('[data-group]',b);main(b.dataset.group);}));
 document.querySelectorAll('[data-ablation]').forEach(b=>b.addEventListener('click',()=>{groupButtons('[data-ablation]',b);ablation(b.dataset.ablation);}));
 online();main('all');ablation('all');
 const trace=data.trajectories.find(r=>r.layer==='poly'), pts=trace.points;
 const x=v=>30+v/trace.opc_submitted*440,y=v=>175-v/trace.initial.edge_normal_max_epe_nm*140;
 let path='';pts.forEach((p,i)=>{path+=i?` H${x(p.opc_calls)} V${y(p.retained_metrics.edge_normal_max_epe_nm)}`:`M${x(p.opc_calls)},${y(p.retained_metrics.edge_normal_max_epe_nm)}`;});
 document.querySelectorAll('.trajectory-preview .trace-line,.trajectory-preview .trace-glow').forEach(el=>el.setAttribute('d',path));
 const end=pts[pts.length-1];if($('.trajectory-preview circle'))$('.trajectory-preview circle').setAttribute('cx',String(x(end.opc_calls)));if($('.trajectory-preview circle'))$('.trajectory-preview circle').setAttribute('cy',String(y(end.retained_metrics.edge_normal_max_epe_nm)));

}).catch(()=>{$('#online-cards').textContent='The result file could not load. Please refresh.';$('#online-table-body').innerHTML='<tr><td colspan="6">Results could not load. <a href="assets/current/results.json">Open the result file</a> or refresh this page.</td></tr>';$('#results-body').innerHTML='<tr><td colspan="7">Results could not load. <a href="assets/current/results.json">Open the result file</a> or refresh this page.</td></tr>';$('#ablation-cards').textContent='The result file could not load. Please refresh.';});

// Keep the paper's diagrams intact; offer full-resolution inspection on small screens.
(()=>{
 let dialog,opener;
 document.querySelectorAll('[data-paper-zoom]').forEach(link=>link.addEventListener('click',event=>{
  event.preventDefault();opener=link;
  if(!dialog){
   dialog=document.createElement('dialog');dialog.className='paper-dialog';dialog.setAttribute('aria-label','Paper figure enlarged');
   dialog.innerHTML='<div class="paper-dialog-toolbar"><span>Paper figure · full composition</span><div><button data-paper-size aria-pressed="false">Zoom to 100%</button><button data-paper-close aria-label="Close paper figure">Close ×</button></div></div><div class="paper-dialog-viewport"><img alt=""></div>';
   document.body.append(dialog);
   dialog.querySelector('[data-paper-close]').onclick=()=>dialog.close();
   dialog.querySelector('[data-paper-size]').onclick=e=>{const zoom=dialog.classList.toggle('is-zoomed');e.target.textContent=zoom?'Fit to screen':'Zoom to 100%';e.target.setAttribute('aria-pressed',String(zoom));};
   dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
   dialog.addEventListener('close',()=>opener?.focus());
  }
  const source=link.closest('.paper-figure').querySelector('img'),img=dialog.querySelector('img');img.src=source.src;img.alt=source.alt;
  dialog.classList.remove('is-zoomed');const size=dialog.querySelector('[data-paper-size]');size.textContent='Zoom to 100%';size.setAttribute('aria-pressed','false');dialog.showModal();dialog.querySelector('.paper-dialog-viewport').scrollTo(0,0);
 }));
})();
