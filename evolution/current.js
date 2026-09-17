'use strict';
const $=s=>document.querySelector(s);
let data,study,index=0,timer=null;
const maxKey='edge_normal_max_epe_nm',meanKey='edge_normal_mean_epe_nm',pvbKey='pv_band_area_per_target_edge_um',mrcKey='mrc_total_result_count';
const f=(n,p=3)=>Number(n).toFixed(p);
function pause(){if(timer)clearInterval(timer);timer=null;$('#play').textContent='▶ Play';$('#play').setAttribute('aria-label','Play measured trials');}
function chart(key,label,unit){
 const points=study.points,values=points.flatMap(p=>[p.retained_metrics[key],p.candidate_metrics?.[key]]).filter(v=>v!=null),cap=key===pvbKey?study.initial[key]*1.02:null;
 if(cap)values.push(cap);
 let min=key===pvbKey?Math.min(...values):0,max=Math.max(...values);
 if(key===mrcKey)max=Math.max(1,max);
 const pad=(max-min||1)*.15;max+=pad;min=key===pvbKey?min-pad:0;
 const x=v=>52+v/study.opc_submitted*285,y=v=>195-(v-min)/(max-min)*145;
 let path='';points.forEach((p,i)=>{const X=x(p.opc_calls),Y=y(p.retained_metrics[key]);path+=i?` H${X} V${Y}`:`M${X},${Y}`;});
 const digits=key===pvbKey?5:key===mrcKey?0:1;
 const tickValues=key===mrcKey?[0,1]:[min,min+(max-min)/2,max];
 const grid=tickValues.map(v=>`<path class="grid" d="M52 ${y(v)}H337"/><text class="axis-text" x="45" y="${y(v)+4}" text-anchor="end">${f(v,digits)}</text>`).join('');
 const ticks=[...new Set([0,Math.floor(study.opc_submitted/2),study.opc_submitted])].map(v=>`<text class="axis-text" x="${x(v)}" y="216" text-anchor="middle">${v}</text>`).join('');
 const marks=points.map((p,i)=>{if(!p.candidate_metrics||p.candidate_metrics[key]==null)return '';const X=x(p.opc_calls),Y=y(p.candidate_metrics[key]),title=`${p.kind==='repeat'?'Repeat':'Candidate '+p.slot}: ${f(p.candidate_metrics[key],digits)} ${unit}`;
 if(p.kind==='repeat')return `<path d="M${X} ${Y-4}l4 4-4 4-4-4z" stroke="#9de7cf" fill="#081c23"><title>${title}</title></path>`;
 if(!p.feasible)return `<path d="M${X-4} ${Y-4}l8 8m-8 0l8-8" stroke="#e7ad97" stroke-width="1.4"><title>${title} · infeasible</title></path>`;
 return `<circle cx="${X}" cy="${Y}" r="3.7" stroke="#9de7cf" fill="${p.retained?'#9de7cf':'#081c23'}"><title>${title}</title></circle>`;
 }).join('');
 return `<article class="trace-chart"><h3>${label}<small>${unit}</small></h3><svg viewBox="0 0 360 238" role="img" aria-label="${label} of retained recipe and measured candidates over ${study.opc_submitted} actual OPC calls">${grid}${cap?`<path class="cap" d="M52 ${y(cap)}H337"/>`:''}<path class="cursor" d="M${x(points[index].opc_calls)} 35V195"/><path class="path" d="${path}"/>${marks}${ticks}<text class="axis-text" x="194" y="236" text-anchor="middle">Cumulative OPC calls</text></svg></article>`;
}
function render(){
 const p=study.points[index],m=p.retained_metrics;$('#trial').value=String(index);$('#trial-label').textContent=p.kind==='initial'?'R0':p.kind==='repeat'?`OPC ${p.opc_calls} · repeat`:`OPC ${p.opc_calls}`;
 $('#trace-summary').textContent=`${study.points.filter(x=>x.kind==='candidate').length} candidates + 1 repeat · ${study.llm_reserved} model calls · completed`;
 $('#trace-graphs').innerHTML=chart(maxKey,'Maximum EPE','nm')+chart(pvbKey,'PVB / target edge','µm')+chart(mrcKey,'MRC violations','count');
 const initial=p.kind==='initial',repeat=p.kind==='repeat';
 $('#event-type').textContent=initial?'ORIGINAL R0':repeat?'ENDPOINT REPEAT':`CANDIDATE ${p.slot} / GLOBAL EDIT`;
 $('#event-title').textContent=initial?'Before the first trial.':repeat?'The endpoint reproduces.':p.retained?'A new retained recipe.':p.feasible?'Feasible, without improvement.':'Measured, then rejected.';
 $('#event-body').textContent=initial?'This window’s original recipe fixes the reference quality limits for the entire search.':repeat?'An independent physical evaluation reproduces the retained ranking metrics. This checks repeatability of the endpoint, not stability across search seeds.':`Candidate Max EPE: ${f(p.candidate_metrics[maxKey])} nm. ${p.retained?'It satisfies the fixed quality limits and improves the recipe ranking.':p.feasible?'The retained recipe is better under the fixed ranking.':'It does not satisfy all fixed quality limits. The prior retained recipe remains the working reference.'}`;
 $('#event-tags').innerHTML=(initial?['Fixed 10 × 10 µm core','Original R0']:repeat?['Repeat verified','No local actions']:[p.feasible?'Quality checks pass':'Quality checks fail',p.retained?'Retained':'Not retained']).map((s,i)=>`<span class="${!initial&&!repeat&&!p.feasible&&i===0?'bad':''}">${s}</span>`).join('');
 $('#selected-metrics').innerHTML=[['Retained Max EPE',f(m[maxKey]),'nm'],['Retained Avg. EPE',f(m[meanKey]),'nm'],['Retained PVB',f(m[pvbKey],6),'µm'],['Retained MRC',m[mrcKey],'violations']].map(([label,v,u])=>`<div><dt>${label}</dt><dd>${v} <small>${u}</small></dd></div>`).join('');
 $('#stop-explanation').textContent=`${study.layer==='poly'?'Poly02':'Metal29'}: ${f(study.initial[maxKey])} → ${f(study.current[maxKey])} nm maximum EPE. Retained PVB changes by ${f(100*(study.current[pvbKey]/study.initial[pvbKey]-1),2)}%, within the fixed 2% cap. The remaining candidate allowance is unused.`;
 $('#previous').disabled=index===0;$('#next').disabled=index===study.points.length-1;
 renderGeometry();
}
fetch('../assets/current/results.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(d=>{data=d;study=d.trajectories[0];index=study.points.length-1;$('#trial').disabled=false;$('#trial').max=String(index);render();
 document.querySelectorAll('[data-case]').forEach(b=>b.addEventListener('click',()=>{pause();study=data.trajectories.find(r=>r.layer===b.dataset.case);index=study.points.length-1;$('#trial').max=String(index);document.querySelectorAll('[data-case]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});render();}));
 $('#trial').addEventListener('input',e=>{pause();index=Number(e.target.value);render();});$('#previous').addEventListener('click',()=>{pause();index=Math.max(0,index-1);render();});$('#next').addEventListener('click',()=>{pause();index=Math.min(study.points.length-1,index+1);render();});
 $('#play').addEventListener('click',()=>{if(timer){pause();return;}if(index===study.points.length-1)index=0;render();$('#play').textContent='Ⅱ Pause';$('#play').setAttribute('aria-label','Pause measured trials');timer=setInterval(()=>{index++;render();if(index===study.points.length-1)pause();},1100);});
}).catch(()=>{$('#trace-summary').textContent='The recorded data could not load.';$('#trace-graphs').innerHTML='<p class="trace-error">Please refresh, or open the result data using the download link above.</p>';});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});

let geometryData,imageMode='retained',imageView='zoom',imageRequest=0;
async function renderGeometry(){
 if(!geometryData||!study)return;
 const request=++imageRequest,c=geometryData.cases.find(c=>c.case_id===study.case_id);
 if(!c||c.report_sha256!==study.report_sha256){$('#image-state').textContent='Geometry and trajectory sources do not match.';$('#iteration-images').replaceChildren();return;}
 const p=study.points[index],candidate=c.frames.find(f=>f.opc_calls===p.opc_calls),frame=imageMode==='candidate'?candidate:c.frames.find(f=>f.opc_calls===candidate.retained_frame);
 const view=imageView,tiles=[['Layout','Original target',['target']],['OPC mask','Main mask + assist features',['mask','sraf','target']],['Resist','Nominal printed contour',['target','contour']],['PVB','Process variation band',['pvb','target']]];
 $('#iteration-images').setAttribute('aria-busy','true');
 $('#image-state').textContent='Loading geometry for the selected trial…';
 try{
  await VPEGeometry.preload([...new Set(tiles.flatMap(t=>t[2]))].map(k=>VPEGeometry.url(frame.assets[view][k])));
  if(request!==imageRequest)return;
  $('#iteration-images').innerHTML=tiles.map(([title,subtitle,keys])=>VPEGeometry.tile(frame,c,view,title,subtitle,keys)).join('');
  $('#iteration-images').dataset.frame=String(frame.opc_calls);
  $('#iteration-images').dataset.view=view;
  $('#iteration-images').setAttribute('aria-busy','false');
  const source=frame.kind==='initial'?'original R0':frame.kind==='repeat'?'endpoint repeat':`OPC ${frame.opc_calls}`;
  const state=imageMode==='candidate'&&p.kind==='candidate'?`This candidate · ${p.retained?'retained':p.feasible?'not retained':'rejected'}`:imageMode==='retained'?'Retained recipe':'Measured geometry';
  $('#image-state').textContent=`${state} · images from ${source} · ${f(frame.metrics[maxKey])} nm Max EPE across the full core.`;
 }catch(e){if(request===imageRequest){$('#iteration-images').replaceChildren();$('#iteration-images').setAttribute('aria-busy','false');$('#image-state').textContent='These images could not load. Change the trial or refresh to try again.';}}
}
VPEGeometry.ready.then(g=>{geometryData=g;renderGeometry();}).catch(()=>{$('#image-state').textContent='Geometry could not load. Please refresh.';});
for(const [attribute,set] of [['imageMode',value=>imageMode=value],['imageView',value=>imageView=value]]){
 const selector=attribute==='imageMode'?'[data-image-mode]':'[data-image-view]';
 document.querySelectorAll(selector).forEach(b=>b.addEventListener('click',()=>{set(b.dataset[attribute]);document.querySelectorAll(selector).forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});renderGeometry();}));
}
