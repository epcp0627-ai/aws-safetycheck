(() => {
  const status=document.getElementById('reportStatus');
  if(!status)return;
  let last='';
  const sync=()=>{
    const text=status.textContent||'';
    if(text===last)return;
    last=text;
    if(/갱신 완료|CIS 실패 Control 적용/.test(text)){
      document.dispatchEvent(new CustomEvent('safetycheck:report-loaded'));
    }
  };
  new MutationObserver(sync).observe(status,{childList:true,subtree:true,characterData:true});
})();
