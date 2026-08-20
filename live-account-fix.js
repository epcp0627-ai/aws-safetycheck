(() => {
  document.addEventListener('safetycheck:live-applied',()=>{
    try{
      const s=window.SafetyCheckLive?.getSnapshot?.();
      const x=F.find(v=>String(v.id).toUpperCase()==='ACCOUNT.1');
      if(!s||!x)return;
      const ok=!!s.accountData?.securityContact;
      Object.assign(x,{live:true,risk:ok?10:25,impact:'서비스 영향 없음',ic:'impact-none',scope:'계정 보안 연락처',impactDetail:`Security alternate contact는 ${ok?'등록됨':'미등록/조회 불가'} 상태입니다. 런타임 서비스에는 영향이 없습니다.`,cost:{before:'$0 직접 비용',after:'$0 직접 비용',delta:'$0',one:'$0',drivers:['계정 연락처 설정 자체 과금 없음'],conf:'높음'},rb:'가능',res:[`Security contact: ${ok?'OK':'MISSING'}`]});
      if(typeof renderRows==='function')renderRows();
    }catch(e){console.error(e)}
  });
})();
