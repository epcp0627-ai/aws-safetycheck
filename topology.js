(() => {
  const main = document.querySelector('main');
  const nav = document.querySelector('.nav');
  if (!main || !nav) return;

  const navBtn = document.createElement('button');
  navBtn.dataset.v = 'topology';
  navBtn.innerHTML = '◇ <span>아키텍처</span>';
  nav.appendChild(navBtn);

  const section = document.createElement('section');
  section.id = 'topology';
  section.className = 'view';
  section.innerHTML = `
    <div class="panel topology-hero">
      <div>
        <div class="kicker">AWS ARCHITECTURE EXPORT</div>
        <h3>실제 AWS 리소스로 구성도 생성</h3>
        <p class="muted">ReadOnly 메타데이터를 기반으로 VPC, Subnet, EC2, ALB/NLB, RDS, Lambda, S3, CloudFront 등 주요 리소스를 배치하고 draw.io 편집 파일로 출력합니다.</p>
      </div>
      <div class="topology-actions">
        <button class="btn" id="topologyRefresh">현재 인벤토리 보기</button>
        <button class="btn primary" id="downloadDrawio">draw.io 다운로드</button>
      </div>
    </div>
    <div class="grid topology-stats" id="topologyStats"></div>
    <article class="panel" style="margin-top:16px">
      <div class="head"><div><div class="kicker">INVENTORY COVERAGE</div><h3>수집된 AWS 구성</h3></div><span class="muted" id="topologyState">AWS 연결 필요</span></div>
      <div id="topologyInventory" class="topology-inventory"><p class="muted">먼저 ReadOnly AWS 계정을 연결하세요.</p></div>
    </article>
    <article class="panel topology-note" style="margin-top:16px">
      <b>출력 기준</b>
      <p class="muted">draw.io의 AWS4 라이브러리 아이콘을 사용합니다. 자동 생성된 연결선은 AWS API에서 확인 가능한 관계만 표시하며 애플리케이션 내부 호출 관계는 추정하지 않습니다.</p>
    </article>`;
  main.appendChild(section);

  const style = document.createElement('style');
  style.textContent = `
    .topology-hero{display:flex;align-items:center;justify-content:space-between;gap:24px}
    .topology-hero h3{font-size:24px;margin:4px 0 8px}
    .topology-hero p{max-width:850px}
    .topology-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
    .topology-stats{grid-template-columns:repeat(5,1fr);margin-top:16px}
    .topology-stats .panel{padding:16px}.topology-stats b{display:block;font-size:25px;margin-top:4px}
    .topology-inventory{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
    .topology-inventory .inv{border:1px solid var(--line);border-radius:11px;padding:12px;background:#091726}
    .topology-inventory .inv b{display:block;font-size:16px;margin-bottom:3px}.topology-inventory .inv small{color:var(--m)}
    @media(max-width:1000px){.topology-stats{grid-template-columns:repeat(2,1fr)}.topology-inventory{grid-template-columns:1fr 1fr}.topology-hero{align-items:flex-start;flex-direction:column}}
    @media(max-width:650px){.topology-inventory{grid-template-columns:1fr}.topology-stats{grid-template-columns:1fr 1fr}}
  `;
  document.head.appendChild(style);

  function openTopology() {
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'topology'));
    document.querySelectorAll('.nav button').forEach(b => b.classList.toggle('active', b === navBtn));
    const title = document.getElementById('title');
    if (title) title.textContent = 'AWS 실제 구성도를 자동으로 생성합니다';
    refreshInventory();
  }
  navBtn.onclick = openTopology;

  const arr = (v) => Array.isArray(v) ? v : [];
  const topo = () => window.SafetyCheckLive?.getSnapshot?.()?.topology || null;
  const count = (t, key) => arr(t?.[key]).length;

  function refreshInventory() {
    const t = topo();
    const state = document.getElementById('topologyState');
    const stats = document.getElementById('topologyStats');
    const inv = document.getElementById('topologyInventory');
    if (!t) {
      if (state) state.textContent = 'AWS 연결 필요';
      if (stats) stats.innerHTML = '';
      if (inv) inv.innerHTML = '<p class="muted">ReadOnly AWS 연결 후 자동으로 인벤토리를 표시합니다.</p>';
      return;
    }
    if (state) state.textContent = `${t.region || ''} · Live ReadOnly`;
    const cards = [
      ['VPC', count(t,'vpcs')], ['Subnet', count(t,'subnets')], ['EC2', count(t,'instances')], ['Load Balancer', count(t,'loadBalancers')], ['RDS', count(t,'rds')]
    ];
    stats.innerHTML = cards.map(([k,v]) => `<article class="panel"><small class="muted">${k}</small><b>${v}</b></article>`).join('');
    const groups = [
      ['네트워크', count(t,'vpcs') + count(t,'subnets') + count(t,'internetGateways') + count(t,'natGateways')],
      ['컴퓨팅', count(t,'instances') + count(t,'lambda') + count(t,'ecs') + count(t,'eks')],
      ['로드밸런싱', count(t,'loadBalancers') + count(t,'targetGroups') + count(t,'autoScalingGroups')],
      ['데이터베이스', count(t,'rds') + count(t,'elasticache') + count(t,'dynamodb')],
      ['스토리지', count(t,'s3') + count(t,'efs')],
      ['엣지/보안', count(t,'cloudfront') + count(t,'route53') + count(t,'waf')],
      ['API/서버리스', count(t,'apiGateway') + count(t,'lambda')],
      ['태그 인벤토리', Object.values(t.inventory?.taggedServiceCounts || {}).reduce((a,b)=>a+b,0)]
    ];
    inv.innerHTML = groups.map(([k,v]) => `<div class="inv"><b>${k}</b><small>${v}개 리소스/항목</small></div>`).join('');
  }
  document.getElementById('topologyRefresh').onclick = refreshInventory;
  document.addEventListener('safetycheck:live-applied', refreshInventory);

  function esc(v) { return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;'); }
  const serviceColor = {
    ec2:'#D05C17', lambda:'#D05C17', ecs:'#D05C17', eks:'#D05C17',
    rds:'#3334B9', elasticache:'#3334B9', dynamodb:'#3334B9',
    s3:'#277116', efs:'#277116',
    cloudfront:'#5A30B5', route_53:'#5A30B5', api_gateway:'#5A30B5', elastic_load_balancing:'#5A30B5', vpc:'#5A30B5',
    waf:'#C7131F', cloudtrail:'#BC1356'
  };
  function awsStyle(icon) {
    const fill = serviceColor[icon] || '#5A30B5';
    return `sketch=0;outlineConnect=0;fontColor=#EAF1F8;gradientColor=none;fillColor=${fill};strokeColor=#ffffff;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=11;fontStyle=0;aspect=fixed;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.${icon};`;
  }
  const nodeStyle = 'rounded=1;whiteSpace=wrap;html=1;fontColor=#EAF1F8;fillColor=#12243A;strokeColor=#55708E;fontSize=11;';
  const edgeStyle = 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=block;endFill=1;strokeColor=#91A5BD;fontColor=#91A5BD;fontSize=10;';

  function buildDrawio(t) {
    let seq = 2, cells = [], ids = new Map();
    const id = () => `c${seq++}`;
    const addNode = (key, value, style, x, y, w=78, h=78) => {
      const cid = id(); ids.set(key,cid);
      cells.push(`<mxCell id="${cid}" value="${esc(value)}" style="${style}" vertex="1" parent="1"><mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>`);
      return cid;
    };
    const addBox = (key, value, x, y, w, h, kind='vpc') => {
      const cid=id(); ids.set(key,cid);
      const color=kind==='vpc'?'#248814':'#147EBA', fill=kind==='vpc'?'#E9F7E9':'#E6F2F8';
      cells.push(`<mxCell id="${cid}" value="${esc(value)}" style="rounded=0;whiteSpace=wrap;html=1;verticalAlign=top;align=left;spacingTop=7;spacingLeft=9;fontSize=13;fontStyle=1;strokeColor=${color};fillColor=${fill};fontColor=#232F3E;dashed=1;" vertex="1" parent="1"><mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>`);
      return cid;
    };
    const addEdge = (fromKey,toKey,label='') => {
      const s=ids.get(fromKey), d=ids.get(toKey); if(!s||!d)return;
      const cid=id();cells.push(`<mxCell id="${cid}" value="${esc(label)}" style="${edgeStyle}" edge="1" parent="1" source="${s}" target="${d}"><mxGeometry relative="1" as="geometry"/></mxCell>`);
    };

    addNode('title',`AWS SafetyCheck · ${t.region || ''}\nReadOnly architecture snapshot`,nodeStyle,30,20,360,54);
    let gx=430, gy=20, gcol=0;
    const globalPlace=(key,label,icon)=>{ const x=gx+(gcol%8)*120,y=gy+Math.floor(gcol/8)*125;gcol++;return addNode(key,label,awsStyle(icon),x,y); };
    arr(t.route53).slice(0,8).forEach(z=>globalPlace(`r53:${z.id}`,`Amazon Route 53\n${z.name}`,'route_53'));
    arr(t.cloudfront).slice(0,12).forEach(d=>globalPlace(`cf:${d.id}`,`Amazon CloudFront\n${d.id}`,'cloudfront'));
    arr(t.waf).slice(0,8).forEach(w=>globalPlace(`waf:${w.arn}`,`AWS WAF\n${w.name}`,'waf'));
    arr(t.apiGateway).slice(0,10).forEach(a=>globalPlace(`api:${a.id}`,`Amazon API Gateway\n${a.name}`,'api_gateway'));
    arr(t.s3).slice(0,15).forEach(b=>globalPlace(`s3:${b.name}`,`Amazon S3\n${b.name}`,'s3'));

    let vpcY = 270;
    const subnetPos = new Map();
    arr(t.vpcs).forEach((v,vi)=>{
      const subs=arr(t.subnets).filter(s=>s.vpcId===v.id); const rows=Math.max(1,Math.ceil(subs.length/4)); const vh=150+rows*235;
      addBox(`vpc:${v.id}`,`Amazon VPC · ${v.name || v.id} · ${v.cidr || ''}`,30,vpcY,1500,vh,'vpc');
      addNode(`vpcicon:${v.id}`,'Amazon VPC',awsStyle('vpc'),45,vpcY+38,60,60);
      subs.forEach((s,si)=>{
        const col=si%4,row=Math.floor(si/4), x=125+col*345,y=vpcY+75+row*225;
        addBox(`subnet:${s.id}`,`${s.name || s.id}\n${s.az || ''} · ${s.cidr || ''}`,x,y,320,195,'subnet'); subnetPos.set(s.id,{x,y});
      });
      arr(t.internetGateways).filter(g=>arr(g.vpcIds).includes(v.id)).forEach((g,i)=>addNode(`igw:${g.id}`,`Internet Gateway\n${g.id}`,'sketch=0;html=1;aspect=fixed;shape=mxgraph.aws4.internet_gateway;fillColor=#5A30B5;strokeColor=none;fontColor=#EAF1F8;verticalLabelPosition=bottom;verticalAlign=top;align=center;fontSize=10;',1370,vpcY+35+i*90,64,64));
      arr(t.loadBalancers).filter(l=>l.vpcId===v.id).forEach((l,i)=>addNode(`lb:${l.arn}`,`${l.type==='network'?'Network':'Application'} Load Balancer\n${l.name}`,awsStyle('elastic_load_balancing'),170+i*115,vpcY+12,70,70));
      arr(t.natGateways).filter(n=>n.vpcId===v.id).forEach((n,i)=>{const p=subnetPos.get(n.subnetId)||{x:1180,y:vpcY+100+i*90};addNode(`nat:${n.id}`,`NAT Gateway\n${n.id}`,'sketch=0;html=1;aspect=fixed;shape=mxgraph.aws4.nat_gateway;fillColor=#5A30B5;strokeColor=none;fontColor=#EAF1F8;verticalLabelPosition=bottom;verticalAlign=top;align=center;fontSize=10;',p.x+230,p.y+18,58,58);});
      const slots = new Map();
      const placeInSubnet=(subnetId,key,label,icon)=>{const p=subnetPos.get(subnetId);if(!p)return false;const n=slots.get(subnetId)||0;slots.set(subnetId,n+1);const x=p.x+18+(n%4)*72,y=p.y+60+Math.floor(n/4)*88;addNode(key,label,awsStyle(icon),x,y,58,58);return true;};
      arr(t.instances).filter(x=>x.vpcId===v.id).slice(0,60).forEach(x=>placeInSubnet(x.subnetId,`ec2:${x.id}`,`Amazon EC2\n${x.name || x.id}`,'ec2'));
      arr(t.rds).filter(x=>x.vpcId===v.id).slice(0,30).forEach(x=>{const sid=arr(x.subnetIds)[0];placeInSubnet(sid,`rds:${x.id}`,`Amazon RDS\n${x.id}`,'rds');});
      arr(t.lambda).filter(x=>x.vpcId===v.id).slice(0,30).forEach(x=>{const sid=arr(x.subnetIds)[0];placeInSubnet(sid,`lambda:${x.name}`,`AWS Lambda\n${x.name}`,'lambda');});
      arr(t.autoScalingGroups).filter(g=>arr(g.instanceIds).some(i=>arr(t.instances).find(x=>x.id===i&&x.vpcId===v.id))).forEach((g,i)=>addNode(`asg:${g.name}`,`Auto Scaling Group\n${g.name}\nDesired ${g.desired}`,nodeStyle,1080,vpcY+45+i*72,220,52));
      vpcY += vh + 35;
    });

    let sy=vpcY+20, sx=30, sc=0;
    const standalone=(key,label,icon)=>{const x=sx+(sc%10)*140,y=sy+Math.floor(sc/10)*120;sc++;addNode(key,label,awsStyle(icon),x,y);};
    arr(t.lambda).filter(x=>!x.vpcId).slice(0,20).forEach(x=>standalone(`lambda:${x.name}`,`AWS Lambda\n${x.name}`,'lambda'));
    arr(t.elasticache).slice(0,15).forEach(x=>standalone(`cache:${x.id}`,`Amazon ElastiCache\n${x.id}`,'elasticache'));
    arr(t.dynamodb).slice(0,20).forEach(x=>standalone(`ddb:${x.name}`,`Amazon DynamoDB\n${x.name}`,'dynamodb'));
    arr(t.efs).slice(0,15).forEach(x=>standalone(`efs:${x.id}`,`Amazon EFS\n${x.name || x.id}`,'efs'));
    arr(t.ecs).slice(0,10).forEach(x=>standalone(`ecs:${x.arn}`,`Amazon ECS\n${x.name}`,'ecs'));
    arr(t.eks).slice(0,10).forEach(x=>standalone(`eks:${x.name}`,`Amazon EKS\n${x.name}`,'eks'));

    arr(t.cloudfront).forEach(d=>arr(d.origins).forEach(o=>{
      const lb=arr(t.loadBalancers).find(l=>l.dns===o.domain); if(lb)addEdge(`cf:${d.id}`,`lb:${lb.arn}`,'origin');
      const b=arr(t.s3).find(x=>o.domain.includes(x.name)); if(b)addEdge(`cf:${d.id}`,`s3:${b.name}`,'origin');
    }));
    arr(t.waf).forEach(w=>arr(t.cloudfront).filter(d=>d.webAclId===w.arn).forEach(d=>addEdge(`waf:${w.arn}`,`cf:${d.id}`,'protects')));
    arr(t.targetGroups).forEach((tg,i)=>{
      if(!arr(tg.loadBalancerArns).some(a=>ids.has(`lb:${a}`)))return;
      const parent=arr(tg.loadBalancerArns).find(a=>ids.has(`lb:${a}`));
      const lb=arr(t.loadBalancers).find(l=>l.arn===parent); const y=lb?300+i*55:300+i*55;
      addNode(`tg:${tg.arn}`,`Target Group\n${tg.name}\n${tg.protocol || ''}:${tg.port || ''}`,nodeStyle,1260,y,190,48); addEdge(`lb:${parent}`,`tg:${tg.arn}`,'targets');
      arr(tg.targets).filter(x=>x.id).forEach(x=>{if(ids.has(`ec2:${x.id}`))addEdge(`tg:${tg.arn}`,`ec2:${x.id}`,x.state || '');});
    });
    arr(t.autoScalingGroups).forEach(g=>arr(g.instanceIds).forEach(i=>addEdge(`asg:${g.name}`,`ec2:${i}`,'member')));

    const trails=window.SafetyCheckLive?.getSnapshot?.()?.cloudtrail?.trails || [];
    trails.forEach((tr,i)=>{if(!ids.has(`trail:${tr.name}`))globalPlace(`trail:${tr.name}`,`AWS CloudTrail\n${tr.name}`,'cloudtrail');if(tr.s3Bucket)addEdge(`trail:${tr.name}`,`s3:${tr.s3Bucket}`,'logs');});

    cells.push(`<mxCell id="${id()}" value="자동 생성: AWS SafetyCheck · ReadOnly metadata · 수동 검증 권장" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontSize=11;fontColor=#666666;" vertex="1" parent="1"><mxGeometry x="30" y="${sy + Math.ceil(sc/10)*120 + 120}" width="650" height="30" as="geometry"/></mxCell>`);
    const model=`<mxGraphModel dx="1800" dy="1200" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1800" pageHeight="1400" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>${cells.join('')}</root></mxGraphModel>`;
    return `<mxfile host="app.diagrams.net" modified="${new Date().toISOString()}" agent="AWS SafetyCheck" version="24.7.17"><diagram id="aws-safetycheck" name="AWS Architecture">${model}</diagram></mxfile>`;
  }

  document.getElementById('downloadDrawio').onclick = () => {
    const t = topo();
    if (!t) return alert('먼저 ReadOnly AWS 계정을 연결해 주세요.');
    const xml = buildDrawio(t);
    const blob = new Blob([xml], {type:'application/vnd.jgraph.mxfile'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `aws-safetycheck-${t.region || 'architecture'}-${new Date().toISOString().slice(0,10)}.drawio`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  };
})();
