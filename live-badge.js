(() => {
  const style=document.createElement('style');
  style.textContent='.live-badge{display:inline-block;margin-left:7px;padding:2px 6px;border-radius:999px;border:1px solid #2d7d61;background:#62d69a16;color:#78e2ad;font-size:10px;font-weight:800;vertical-align:middle}';
  document.head.appendChild(style);
  const rows=document.getElementById('rows');
  if(!rows)return;
  function paint(){
    let live=false; try{live=F.some(x=>x.live)}catch(_){}
    if(!live)return;
    rows.querySelectorAll('tr').forEach(tr=>{
      const td=tr.querySelectorAll('td');
      if(td.length<5)return;
      [td[3],td[4]].forEach(cell=>{if(!cell.querySelector('.live-badge')){const b=document.createElement('span');b.className='live-badge';b.textContent='LIVE';cell.appendChild(b)}});
    });
  }
  new MutationObserver(paint).observe(rows,{childList:true,subtree:true});
  document.addEventListener('safetycheck:live-applied',()=>setTimeout(paint,0));
})();
