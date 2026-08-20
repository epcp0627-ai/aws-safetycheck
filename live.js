(() => {
  const API_URL = 'https://c6o05b2a9i.execute-api.us-east-1.amazonaws.com/analyze';
  const dlg = document.getElementById('awsDlg');
  const testBtn = document.getElementById('test');
  if (!dlg || !testBtn) return;

  const inputs = dlg.querySelectorAll('input');
  const roleInput = inputs[0];
  const externalInput = inputs[1];
  if (roleInput) { roleInput.id='roleArn'; roleInput.value=''; roleInput.placeholder='arn:aws:iam::123456789012:role/SafetyCheckReadOnlyRole'; }
  if (externalInput) { externalInput.id='externalId'; externalInput.value=''; externalInput.type='password'; externalInput.placeholder='ReadOnly Role 생성 시 입력한 External ID'; }
  if (!document.getElementById('accessToken')) {
    const label=document.createElement('label');
    label.innerHTML='API Access Token<input id="accessToken" type="password" autocomplete="off" placeholder="서비스 스택의 ApiAccessToken">';
    testBtn.before(label);
  }
  const notice=dlg.querySelector('.notice');
  if (notice) notice.textContent='Live ReadOnly 연결입니다. 연결 후 현재 AWS 리소스 상태를 읽어 Findings의 서비스 영향/비용을 다시 계산합니다.';

  let session=null, snapshot=null;
  const money0={before:'$0 직접 비용',after:'$0 직접 비용',delta:'$0',one:'$0',drivers:['설정 변경 자체는 과금 없음'],conf:'높음'};
  const c=(before,after,delta,drivers,conf='중간',one='$0')=>({before,after,delta,one,drivers,conf});
  const generic=(x,ev)=>({
    ...x,live:true,impact:'Live 상세 검토 필요',ic:'impact-possible',scope:'실제 AWS 리소스',risk:Math.max(x.risk||45,45),
    impactDetail:'AWS ReadOnly 조회는 완료됐지만 이 Control은 전용 영향 규칙이 아직 없어 보수적으로 검토 필요로 표시합니다.',
    cost:c('현재 구성 확인됨','조치 방식별 상이','조치별 상이',['대상 서비스','리전/SKU','사용량'],'낮음'),
    res:ev?.length?ev:['AWS ReadOnly 세션 정상'],rb:'조치별 확인',liveEvidence:ev||[]
  });

  function analyzeOne(x,s){
    const id=String(x.id||'').toUpperCase();
    const ec2=s.ec2||{}, rds=s.rds||{}, ct=s.cloudtrail||{}, s3=s.s3||{}, iam=s.iam||{}, acct=s.account||{};
    if(id==='EC2.2'){
      const g=ec2.defaultSecurityGroups||[], attached=g.reduce((n,v)=>n+(v.enis||[]).length,0), rules=g.reduce((n,v)=>n+(v.ruleCount||0),0);
      return {...x,live:true,risk:attached?85:22,impact:attached?'영향 가능':'직접 영향 낮음',ic:attached?'impact-high':'impact-low',scope:'Default SG 연결 리소스',
        impactDetail:attached?`Default SG에 실제 ENI ${attached}개가 연결되어 있습니다. 규칙 제거 전 해당 리소스가 현재 규칙에 의존하는지 확인해야 합니다.`:'Default SG 연결 ENI가 없어 규칙 제거의 직접 서비스 영향은 낮습니다.',
        cost:money0,rb:'가능',res:g.flatMap(v=>[`${v.groupId} · 규칙 ${v.ruleCount}개 · ENI ${(v.enis||[]).length}개`,...(v.enis||[]).slice(0,3).map(e=>`↳ ${e.id} · ${e.description||e.type}`)]),liveEvidence:[`Default SG ${g.length}개`,`연결 ENI ${attached}개`,`규칙 ${rules}개`]};
    }
    if(id==='EC2.53'||id==='EC2.13'||id==='EC2.14'){
      let a=ec2.adminOpen||[]; if(id==='EC2.13')a=a.filter(v=>(v.ports||[]).includes(22)); if(id==='EC2.14')a=a.filter(v=>(v.ports||[]).includes(3389));
      const enis=a.reduce((n,v)=>n+(v.eniCount||0),0);
      return {...x,live:true,risk:a.length?82:15,impact:a.length?'관리 접속 영향 가능':'현재 직접 영향 없음',ic:a.length?'impact-high':'impact-none',scope:'SSH/RDP 관리 경로',
        impactDetail:a.length?`인터넷 전체에 원격 관리 포트를 공개한 Security Group ${a.length}개를 확인했습니다. CIDR 제한 시 기존 관리자 접속 경로가 차단될 수 있습니다.`:'인터넷 전체에 원격 관리 포트를 공개한 Security Group을 찾지 못했습니다.',cost:money0,rb:'가능',
        res:a.map(v=>`${v.groupId} ${v.name||''} · ${v.ports.join(',')} · ENI ${v.eniCount}`),liveEvidence:[`위험 SG ${a.length}개`,`연결 ENI ${enis}개`]};
    }
    if(id==='EC2.6'){
      const miss=ec2.vpcsWithoutFlowLogs||[];
      return {...x,live:true,risk:25,impact:'직접 영향 없음',ic:'impact-none',scope:'관측/로깅',impactDetail:`VPC ${ec2.vpcCount||0}개 중 Flow Logs 미활성 VPC가 ${miss.length}개입니다. 네트워크 경로는 변경하지 않습니다.`,
        cost:c('현재 Flow Logs 구성','누락 VPC에 Flow Logs 추가','로그 수집·저장량만큼 증가',['Flow Log 데이터량','CloudWatch Logs 또는 S3','보존 기간','Logs Insights 쿼리'],'중간'),rb:'가능',res:miss.length?miss:['모든 VPC에 ACTIVE Flow Log 확인'],liveEvidence:[`미활성 ${miss.length}개`]};
    }
    if(id==='EC2.7'){
      const u=ec2.unencryptedVolumes||[];
      return {...x,live:true,risk:ec2.ebsEncryptionDefault?18:35,impact:'기존 서비스 영향 없음',ic:'impact-none',scope:'향후 EBS 볼륨',impactDetail:`EBS 기본 암호화는 ${ec2.ebsEncryptionDefault?'활성':'비활성'}이며 현재 비암호화 볼륨은 ${u.length}개입니다. 기본 암호화는 기존 볼륨을 자동 변경하지 않습니다.`,
        cost:c('현재 EBS 구성','새 볼륨 기본 암호화','AWS 관리형 키면 직접 증가 거의 없음',['고객 관리형 KMS 키 사용 시 키/요청 비용'],'중간'),rb:'가능',res:u.map(v=>`${v.id} · ${v.size}GiB`).slice(0,15)};
    }
    if(id==='RDS.5'){
      const single=(rds.instances||[]).filter(v=>!v.multiAZ);
      return {...x,live:true,risk:single.length?66:10,impact:single.length?'DB 변경 영향 가능':'현재 조치 불필요',ic:single.length?'impact-possible':'impact-none',scope:'RDS DB 연결/성능',impactDetail:`RDS ${(rds.instances||[]).length}개 중 Single-AZ가 ${single.length}개입니다. Multi-AZ 전환은 구성과 부하에 따라 지연 또는 짧은 연결 영향을 검토해야 합니다.`,
        cost:c(`Single-AZ ${single.length}개`,`Multi-AZ Standby 포함`,'DB 비용 상당 증가 가능',['DB 인스턴스 클래스','엔진','스토리지','I/O','리전'],'실제 리소스 기반 중간'),rb:'가능',res:single.map(v=>`${v.id} · ${v.class} · ${v.engine} · ${v.storage}GiB`)};
    }
    if(id==='RDS.13'){
      const off=(rds.instances||[]).filter(v=>!v.autoMinor);
      return {...x,live:true,risk:off.length?35:10,impact:'즉시 영향 없음 · 향후 유지보수 영향',ic:'impact-low',scope:'RDS 유지보수',impactDetail:`자동 마이너 업그레이드 비활성 RDS가 ${off.length}개입니다. 활성화 자체보다 향후 Maintenance Window의 엔진 업그레이드/재시작을 고려해야 합니다.`,cost:money0,rb:'가능',res:off.map(v=>`${v.id} · ${v.engine} ${v.version}`)};
    }
    if(id==='RDS.3'){
      const p=(rds.instances||[]).filter(v=>v.publiclyAccessible);
      return {...x,live:true,risk:p.length?80:10,impact:p.length?'접속 경로 영향 가능':'현재 조치 불필요',ic:p.length?'impact-high':'impact-none',scope:'RDS 네트워크 접근',impactDetail:`PubliclyAccessible=true RDS가 ${p.length}개입니다. 비공개 전환 전 애플리케이션/운영자 접속 경로를 확인해야 합니다.`,cost:money0,rb:'가능',res:p.map(v=>v.id)};
    }
    if(id==='RDS.7'){
      const u=(rds.instances||[]).filter(v=>!v.encrypted);
      return {...x,live:true,risk:u.length?55:10,impact:u.length?'마이그레이션 영향 가능':'현재 조치 불필요',ic:u.length?'impact-possible':'impact-none',scope:'RDS 저장 데이터',impactDetail:`StorageEncrypted=false RDS가 ${u.length}개입니다. 기존 DB 암호화는 단순 토글이 아니라 스냅샷/복원 등 마이그레이션 계획이 필요할 수 있습니다.`,cost:c('현재 DB 비용','암호화 DB/스냅샷 구성','KMS/스냅샷 작업에 따라 증가 가능',['KMS 키/요청','스냅샷 저장량','마이그레이션 중 중복 DB'],'중간'),rb:'계획 필요',res:u.map(v=>v.id)};
    }
    if(id==='S3.5'){
      const miss=(s3.buckets||[]).filter(v=>!v.sslEnforced);
      return {...x,live:true,risk:miss.length?25:10,impact:miss.length?'HTTP 클라이언트 조건부 영향':'현재 조치 불필요',ic:miss.length?'impact-low':'impact-none',scope:'S3 클라이언트',impactDetail:`검사한 버킷 ${(s3.buckets||[]).length}개 중 SSL/TLS 강제 정책 미확인 버킷이 ${miss.length}개입니다. HTTPS에는 영향이 없고 HTTP 요청만 차단됩니다.`,cost:money0,rb:'가능',res:miss.map(v=>v.name)};
    }
    if(id==='S3.1'||id==='S3.8'){
      const b=s3.accountBpa||{}, ok=['BlockPublicAcls','IgnorePublicAcls','BlockPublicPolicy','RestrictPublicBuckets'].every(k=>b[k]);
      return {...x,live:true,risk:ok?10:60,impact:ok?'현재 조치 불필요':'퍼블릭 사용 중이면 영향 가능',ic:ok?'impact-none':'impact-possible',scope:'S3 퍼블릭 접근',impactDetail:`계정 수준 Block Public Access는 ${ok?'4개 모두 활성':'일부 비활성'}입니다. 활성화 전 정적 웹호스팅 또는 외부 공개 버킷 사용 여부를 확인해야 합니다.`,cost:money0,rb:'가능',res:Object.entries(b).map(([k,v])=>`${k}: ${v?'ON':'OFF'}`)};
    }
    if(id==='S3.2'||id==='S3.3'||id==='S3.20'){
      const pub=(s3.buckets||[]).filter(v=>v.public===true);
      return {...x,live:true,risk:pub.length?75:15,impact:pub.length?'외부 공개 서비스 영향 가능':'현재 직접 영향 낮음',ic:pub.length?'impact-high':'impact-low',scope:'S3 공개 정책',impactDetail:`GetBucketPolicyStatus 기준 Public 버킷이 ${pub.length}개입니다. 공개 차단 전 실제 외부 제공 용도인지 확인해야 합니다.`,cost:money0,rb:'가능',res:pub.map(v=>v.name)};
    }
    if(id==='CLOUDTRAIL.2'){
      const miss=(ct.trails||[]).filter(v=>!v.kmsKeyId);
      return {...x,live:true,risk:miss.length?45:10,impact:'애플리케이션 영향 낮음',ic:'impact-low',scope:'감사 로그 전달',impactDetail:`Trail ${(ct.trails||[]).length}개 중 KMS 암호화 미적용 Trail이 ${miss.length}개입니다. Key Policy 오류 시 CloudTrail 로그 전달이 실패할 수 있습니다.`,cost:c('기존 CloudTrail/S3','SSE-KMS','KMS 키/요청 비용 증가',['KMS 고객 관리형 키 월 비용','GenerateDataKey/Encrypt 요청량'],'중간'),rb:'가능',res:miss.map(v=>v.name)};
    }
    if(id==='CLOUDTRAIL.5'){
      const miss=(ct.trails||[]).filter(v=>!v.cloudWatchLogs);
      return {...x,live:true,risk:25,impact:'직접 서비스 영향 없음',ic:'impact-none',scope:'CloudTrail → CloudWatch Logs',impactDetail:`CloudWatch Logs 미연동 Trail이 ${miss.length}개입니다. 애플리케이션 요청 경로와 분리되어 있으나 로그 수집/저장 비용이 증가합니다.`,cost:c('현재 로그 구성','CloudWatch Logs 연동','로그 수집·저장량만큼 증가',['이벤트량','Logs 수집 GB','보존기간','Insights 쿼리'],'중간'),rb:'가능',res:miss.map(v=>v.name)};
    }
    if(id==='CLOUDTRAIL.7'){
      const miss=(ct.trails||[]).filter(v=>v.s3Bucket&&!v.s3AccessLogging);
      return {...x,live:true,risk:20,impact:'직접 서비스 영향 없음',ic:'impact-none',scope:'CloudTrail S3 로그 버킷',impactDetail:`Server Access Logging 미설정 CloudTrail 로그 버킷이 ${miss.length}개입니다. 로그 객체 저장/요청 비용이 추가됩니다.`,cost:c('현재 S3 로그 비용','Server Access Logging 추가','S3 저장/PUT 요청 비용 증가',['로그 객체 수','S3 저장량','PUT 요청','Lifecycle'],'중간'),rb:'가능',res:miss.map(v=>`${v.name} → ${v.s3Bucket}`)};
    }
    if(id==='CLOUDTRAIL.1'||id==='CLOUDTRAIL.4'){
      const bad=(ct.trails||[]).filter(v=>id==='CLOUDTRAIL.1'?!v.isLogging:!v.logFileValidation);
      return {...x,live:true,risk:bad.length?55:10,impact:'서비스 트래픽 영향 없음',ic:'impact-none',scope:'감사 로그',impactDetail:`조건 미충족 Trail이 ${bad.length}개입니다. 변경은 애플리케이션 트래픽보다 감사 로그 신뢰성에 영향을 줍니다.`,cost:id==='CLOUDTRAIL.1'?c('현재 Trail 구성','로깅 활성','CloudTrail/S3 이벤트량에 따라 증가',['관리 이벤트/데이터 이벤트','S3 저장량'],'중간'):money0,rb:'가능',res:bad.map(v=>v.name)};
    }
    if(id==='IAM.6'||id==='IAM.5'){
      return {...x,live:true,risk:30,impact:'서비스 런타임 영향 없음',ic:'impact-none',scope:'Root 로그인 보안',impactDetail:`Root MFA 상태는 ${iam.accountMfa?'활성':'비활성'}로 조회됩니다. IAM API만으로 하드웨어 MFA 유형을 완전히 판별하기 어려워 Hardware MFA 여부는 CIS 보고서 결과를 함께 봐야 합니다.`,cost:c('$0 AWS 설정','$0 AWS 설정','$0 AWS 직접 비용',['하드웨어 보안키 구매비는 AWS 요금이 아님'],'중간','보안키 구매비 가능'),rb:'가능',res:[`AccountMFAEnabled: ${iam.accountMfa}`]};
    }
    if(id==='IAM.4'){
      return {...x,live:true,risk:iam.rootAccessKeys?90:10,impact:iam.rootAccessKeys?'자격증명 교체 영향 가능':'현재 조치 불필요',ic:iam.rootAccessKeys?'impact-high':'impact-none',scope:'Root Access Key',impactDetail:`Root Access Key 존재 여부: ${iam.rootAccessKeys?'있음':'없음'}. 사용 중 키라면 삭제 전 사용처 확인이 필요합니다.`,cost:money0,rb:'조건부',res:[`AccountAccessKeysPresent: ${iam.rootAccessKeys}`]};
    }
    if(id==='IAM.3'){
      const old=iam.oldAccessKeys||[];
      return {...x,live:true,risk:old.length?92:15,impact:old.length?'사용 중 키 비활성 시 서비스 중단 가능':'현재 직접 영향 없음',ic:old.length?'impact-high':'impact-none',scope:'CI/CD·배치·외부 연동',impactDetail:`90일 초과 Access Key가 ${old.length}개입니다. 사용처 확인 없이 비활성화하면 자동화/외부 연동이 실패할 수 있습니다.`,cost:money0,rb:'조건부',res:old.map(v=>`${v.user} · ****${v.last4} · ${v.ageDays}일 · ${v.status}`)};
    }
    if(id==='IAM.28'){
      const active=(iam.analyzers||[]).filter(v=>v.status==='ACTIVE'&&(v.type==='ACCOUNT'||v.type==='ORGANIZATION'));
      return {...x,live:true,risk:active.length?15:35,impact:'서비스 영향 없음',ic:'impact-none',scope:'외부 접근 분석',impactDetail:`활성 External Access Analyzer가 ${active.length}개입니다. Analyzer는 접근 경로를 변경하지 않고 분석 결과만 생성합니다.`,cost:c('현재 Analyzer 구성','External Access Analyzer 활성','직접 리소스 비용 영향 낮음',['추가 유료 분석 기능 사용 시 별도 확인'],'중간'),rb:'가능',res:(iam.analyzers||[]).map(v=>`${v.name} · ${v.type} · ${v.status}`)};
    }
    if(id==='ACCOUNT.1'){
      return {...x,live:true,risk:acct.securityContact?10:25,impact:'서비스 영향 없음',ic:'impact-none',scope:'계정 보안 연락처',impactDetail:`Security alternate contact는 ${acct.securityContact?'등록됨':'미등록/조회 불가'} 상태입니다. 런타임 서비스에 영향이 없습니다.`,cost:money0,rb:'가능',res:[`Security contact: ${acct.securityContact?'OK':'MISSING'}`]};
    }
    const ev=[]; if(id.startsWith('EC2'))ev.push(`VPC ${ec2.vpcCount||0}개`); if(id.startsWith('RDS'))ev.push(`RDS ${(rds.instances||[]).length}개`); if(id.startsWith('S3'))ev.push(`S3 ${(s3.buckets||[]).length}개 검사`); if(id.startsWith('CLOUDTRAIL'))ev.push(`Trail ${(ct.trails||[]).length}개`); if(id.startsWith('IAM'))ev.push(`IAM 사용자 ${iam.userCount||0}명`);
    return generic(x,ev);
  }

  function refreshStats(){
    const stats=document.querySelectorAll('#dash .stats article');
    if(!stats.length)return;
    const high=F.filter(x=>(x.risk||0)>=60).length;
    const impacts=F.filter(x=>!['직접 영향 없음','서비스 영향 없음','현재 조치 불필요','현재 직접 영향 없음','기존 서비스 영향 없음'].includes(x.impact)).length;
    const costs=F.filter(x=>x.cost&&!/^\$0(?:\b|\s)/.test(String(x.cost.delta||''))).length;
    if(stats[1]?.querySelector('b'))stats[1].querySelector('b').textContent=high;
    if(stats[2]?.querySelector('b'))stats[2].querySelector('b').textContent=impacts;
    if(stats[3]?.querySelector('b'))stats[3].querySelector('b').textContent=costs;
  }

  function applySnapshot(){
    if(!snapshot)return;
    for(let i=0;i<F.length;i++) F[i]=analyzeOne(F[i],snapshot);
    if(typeof renderRows==='function')renderRows();
    if(typeof renderPriority==='function')renderPriority();
    refreshStats();
    document.dispatchEvent(new CustomEvent('safetycheck:live-applied',{detail:{count:F.length}}));
  }

  async function callSnapshot(roleArn,externalId,token){
    const res=await fetch(API_URL,{method:'POST',headers:{'content-type':'application/json','x-safetycheck-token':token},body:JSON.stringify({action:'snapshot',roleArn,externalId})});
    const data=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(data.message||`HTTP ${res.status}`);
    return data;
  }

  testBtn.onclick=async()=>{
    const roleArn=document.getElementById('roleArn')?.value.trim(), externalId=document.getElementById('externalId')?.value.trim(), token=document.getElementById('accessToken')?.value.trim();
    if(!roleArn||!externalId||!token)return alert('Role ARN, External ID, API Access Token을 모두 입력해 주세요.');
    const old=testBtn.textContent; testBtn.disabled=true; testBtn.textContent='실제 리소스 분석 중...';
    try{
      snapshot=await callSnapshot(roleArn,externalId,token); session={roleArn,externalId,token}; applySnapshot();
      const mode=document.getElementById('mode'),sub=document.getElementById('modeSub'); if(mode)mode.textContent='Live AWS'; if(sub)sub.textContent=`${snapshot.account||''} · ${snapshot.region||''}`;
      dlg.close(); alert(`ReadOnly AWS 연결 성공. 현재 Findings ${F.length}개의 서비스 영향/비용을 Live 데이터로 갱신했습니다.`);
    }catch(e){alert(`연결 실패: ${e.message}`)}finally{testBtn.disabled=false;testBtn.textContent=old;}
  };

  document.addEventListener('safetycheck:report-loaded',()=>{ if(snapshot)applySnapshot(); });
  window.SafetyCheckLive={getSnapshot:()=>snapshot,reapply:applySnapshot};
})();
