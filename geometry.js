/* Real, co-registered GDS renderings. No interpolation between measured trials. */
'use strict';
(() => {
 const base=new URL('assets/current/geometry/',document.currentScript.src);
 const ready=fetch(new URL('geometry.json?v=metal27',base)).then(r=>{if(!r.ok)throw Error('Geometry unavailable');return r.json();});
 const colors={target:'#f4c27a',mask:'#748fcf',sraf:'#c697f2',contour:'#6eefca',pvb:'#f392ad'};
 const labels={target:'Target layout',mask:'Main mask',sraf:'Assist features',contour:'Resist contour',pvb:'Variation band'};
 const order=['pvb','mask','sraf','target','contour'];
 const url=name=>new URL(name,base).href;
 const scale=(c,view)=>`<span class="geometry-scale" style="width:${100*c.viewport[view].scale_bar_um/c.viewport[view].width_um}%"><i></i>${view==='zoom'?'100 nm':'2 µm'}</span>`;
 const images=(frame,view,keys)=>keys.map(k=>`<img src="${url(frame.assets[view][k])}" alt="${labels[k]||k}" draggable="false" data-plane="${k}">`).join('');
 const cache=new Map();
 function preload(urls){return Promise.all(urls.map(src=>{if(!cache.has(src))cache.set(src,new Promise((resolve,reject)=>{const i=new Image();i.onload=resolve;i.onerror=()=>{cache.delete(src);reject(Error('A geometry image could not load'));};i.src=src;}));return cache.get(src);}));}
 function tile(frame,c,view,title,subtitle,keys){return `<figure class="geometry-tile"><figcaption><b>${title}</b><span>${subtitle}</span></figcaption><button class="geometry-picture" aria-label="Enlarge ${title}" data-enlarge>${images(frame,view,keys)}${scale(c,view)}<span class="enlarge-hint">↗</span></button></figure>`;}
 let dialog;
 document.addEventListener('click',e=>{const button=e.target.closest('[data-enlarge]');if(!button)return;
  if(!dialog){dialog=document.createElement('dialog');dialog.className='geometry-dialog';dialog.innerHTML='<button class="geometry-close" aria-label="Close enlarged image">×</button><div class="geometry-picture"></div>';document.body.append(dialog);dialog.querySelector('.geometry-close').onclick=()=>dialog.close();dialog.onclick=ev=>{if(ev.target===dialog)dialog.close();};}
  dialog.querySelector('.geometry-picture').innerHTML=button.innerHTML;dialog.showModal();
 });
 window.VPEGeometry={ready,url,images,scale,tile,preload};
 const mount=document.getElementById('physical-microscope');if(!mount){ready.catch(()=>{});return;}
 ready.then(g=>{
  let c=g.cases[0],slot=c.frames.length-1,view='zoom',exploded=false;
  mount.innerHTML=`<div class="microscope-toolbar"><div class="segmented"><button data-geo-case="poly" class="active" aria-pressed="true">Poly02</button><button data-geo-case="metal1" aria-pressed="false">Metal27</button><button data-geo-case="metal29" aria-pressed="false">Metal29 · prior</button></div><div class="geometry-tools"><div class="segmented"><button data-geo-view="zoom" class="active" aria-pressed="true">600 nm detail</button><button data-geo-view="core" aria-pressed="false">10 µm window</button></div><button class="explode-toggle" aria-pressed="false">Separate layers ↗</button></div></div>
  <div class="microscope-body"><div class="microscope-stage"><div class="microscope-planes"></div><div class="microscope-scale"></div><span class="microscope-coordinate">FIXED R0 HOTSPOT</span></div><aside class="microscope-controls"><p class="eyebrow">PHYSICAL LAYERS</p><h3>Look beneath<br>the numbers.</h3><p class="microscope-help">Toggle a layer to see how the corrected mask prints against its target.</p><div class="layer-switches">${['target','mask','sraf','contour','pvb'].map(k=>`<label style="--key:${colors[k]}"><input type="checkbox" data-layer="${k}" checked><i></i>${labels[k]}</label>`).join('')}</div><div class="microscope-readout"></div><div class="segmented microscope-snapshot"><button data-snapshot="initial" aria-pressed="false">Original R0</button><button data-snapshot="final" class="active" aria-pressed="true">Final retained</button></div><p class="microscope-help">Actual simulated geometry. A fixed crop makes each measured change visible.</p></aside></div>`;
  function render(){const frame=c.frames[slot];
   mount.querySelector('.microscope-planes').innerHTML=order.map((k,i)=>`<div class="microscope-plane" data-layer-plane="${k}" style="--depth:${i};--key:${colors[k]}"><img src="${url(frame.assets[view][k])}" alt="${labels[k]} at OPC ${slot}"><span>${labels[k]}</span></div>`).join('');
   mount.querySelector('.microscope-scale').innerHTML=scale(c,view);
   mount.querySelector('.microscope-coordinate').textContent=view==='zoom'?'FIXED R0 HOTSPOT · 600 × 600 nm':'SCORING CORE · 10 × 10 µm';
   mount.querySelector('.microscope-readout').innerHTML=`<span>${slot===0?'ORIGINAL R0':frame.kind==='repeat'?'VERIFIED ENDPOINT':`RETAINED · OPC ${slot}`}</span><strong>${frame.metrics.edge_normal_max_epe_nm.toFixed(3)} <small>nm</small></strong><p>Maximum EPE across the scoring core</p>`;
   mount.querySelectorAll('[data-snapshot]').forEach(b=>{const active=b.dataset.snapshot==='initial'?slot===0:slot===c.frames.length-1;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
   updateLayers();
   const middle=c.frames.find(f=>f.kind==='candidate'&&f.retained_frame===f.opc_calls);
   const frames=[c.frames[0],middle,c.frames.at(-1)];
   document.getElementById('geometry-film').innerHTML=frames.map((f,i)=>`<button class="film-frame ${f.opc_calls===slot?'active':''}" data-film-slot="${f.opc_calls}" aria-pressed="${f.opc_calls===slot}"><div class="film-picture"><img src="${url(f.assets[view].overlay)}" alt="${c.layer} combined geometry at OPC ${f.opc_calls}">${scale(c,view)}</div><span>${['01 / Original R0','02 / First retained improvement','03 / Verified endpoint'][i]}</span><b>${f.metrics.edge_normal_max_epe_nm.toFixed(3)} <small>nm Max EPE</small></b></button>`).join('');
  }
  function updateLayers(){mount.querySelectorAll('[data-layer]').forEach(input=>{mount.querySelector(`[data-layer-plane="${input.dataset.layer}"]`).hidden=!input.checked;});mount.querySelector('.microscope-stage').classList.toggle('exploded',exploded);}
  mount.addEventListener('change',updateLayers);
  mount.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
   if(b.dataset.geoCase){c=g.cases.find(x=>(x.view_id||x.layer)===b.dataset.geoCase);slot=c.frames.length-1;mount.querySelectorAll('[data-geo-case]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});render();}
   if(b.dataset.geoView){view=b.dataset.geoView;mount.querySelectorAll('[data-geo-view]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});render();}
   if(b.dataset.snapshot){slot=b.dataset.snapshot==='initial'?0:c.frames.length-1;render();}
   if(b.classList.contains('explode-toggle')){exploded=!exploded;b.setAttribute('aria-pressed',String(exploded));b.textContent=exploded?'Align layers ↙':'Separate layers ↗';updateLayers();}
  });
  document.getElementById('geometry-film').addEventListener('click',e=>{const b=e.target.closest('[data-film-slot]');if(b){slot=Number(b.dataset.filmSlot);render();}});
  render();
 }).catch(()=>{mount.innerHTML='<p class="geometry-loading" role="status">Geometry could not load. Please refresh to try again.</p>';});
})();
