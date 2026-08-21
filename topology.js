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
        <p class="muted">Overview + VPC별 페이지로 나눠 draw.io 파일을 생성합니다. VPC 안에서는 AZ와 Subnet을 분리하고 AWS API로 확인된 연결만 선으로 표시합니다.</p>
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
      <b>구성도 해석 기준</b>
      <div class="topology-legend">
        <span><i class="solid-line"></i> AWS 설정/Target 상태로 확인된 연결</span>
        <span><i class="no-line"></i> 애플리케이션 내부 호출은 추정하지 않음</span>
      </div>
      <p class="muted">draw.io의 AWS4 라이브러리 아이콘을 사용합니다. 멀티 리전 계정은 Overview에서 리전별 VPC를 구분하고 각 VPC는 별도 페이지로 출력합니다.</p>
    </article>`;
  main.appendChild(section);

  const style = document.createElement('style');
  style.textContent = `
    .topology-hero{display:flex;align-items:center;justify-content:space-between;gap:24px}
    .topology-hero h3{font-size:24px;margin:4px 0 8px}.topology-hero p{max-width:850px}
    .topology-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
    .topology-stats{grid-template-columns:repeat(6,1fr);margin-top:16px}.topology-stats .panel{padding:16px}.topology-stats b{display:block;font-size:25px;margin-top:4px}
    .topology-inventory{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.topology-inventory .inv{border:1px solid var(--line);border-radius:11px;padding:12px;background:#091726}.topology-inventory .inv b{display:block;font-size:16px;margin-bottom:3px}.topology-inventory .inv small{color:var(--m);line-height:1.55}
    .topology-legend{display:flex;gap:18px;flex-wrap:wrap;margin:12px 0}.topology-legend span{font-size:12px;color:#c5d4e2;display:flex;align-items:center;gap:7px}.topology-legend i{display:inline-block;width:30px;height:0;border-top:2px solid #91a5bd}.topology-legend .no-line{border-top-style:dashed;opacity:.35}
    @media(max-width:1100px){.topology-stats{grid-template-columns:repeat(3,1fr)}.topology-inventory{grid-template-columns:1fr 1fr}.topology-hero{align-items:flex-start;flex-direction:column}}
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

  const arr = v => Array.isArray(v) ? v : [];
  const snap = () => window.SafetyCheckLive?.getSnapshot?.() || null;
  const topo = () => snap()?.topology || null;
  const count = (t, key) => arr(t?.[key]).length;
  const esc = v => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');

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
    const regions = arr(t.regions).length ? arr(t.regions) : [...new Set(arr(t.vpcs).map(v=>v.region).filter(Boolean))];
    if (state) state.textContent = `${regions.length || 1}개 리전 · Live ReadOnly`;
    const cards = [
      ['리전', regions.length || 1], ['VPC', count(t,'vpcs')], ['Subnet', count(t,'subnets')], ['EC2', count(t,'instances')], ['Load Balancer', count(t,'loadBalancers')], ['RDS', count(t,'rds')]
    ];
    stats.innerHTML = cards.map(([k,v]) => `<article class="panel"><small class="muted">${k}</small><b>${v}</b></article>`).join('');
    const groups = [
      ['네트워크', count(t,'vpcs') + count(t,'subnets') + count(t,'internetGateways') + count(t,'natGateways') + count(t,'vpcEndpoints'), 'VPC / Subnet / IGW / NAT / Endpoint'],
      ['컴퓨팅', count(t,'instances') + count(t,'lambda') + count(t,'ecs') + count(t,'eks'), 'EC2 / Lambda / ECS / EKS'],
      ['로드밸런싱', count(t,'loadBalancers') + count(t,'targetGroups') + count(t,'autoScalingGroups'), 'ALB/NLB / Target Group / ASG'],
      ['데이터베이스', count(t,'rds') + count(t,'elasticache') + count(t,'dynamodb'), 'RDS / ElastiCache / DynamoDB'],
      ['스토리지', count(t,'s3') + count(t,'efs'), 'S3 / EFS'],
      ['글로벌/엣지', count(t,'cloudfront') + count(t,'route53') + count(t,'waf'), 'CloudFront / Route 53 / WAF']
    ];
    inv.innerHTML = groups.map(([k,v,d]) => `<div class="inv"><b>${k}</b><small>${v}개 리소스/항목<br>${d}</small></div>`).join('');
  }
  document.getElementById('topologyRefresh').onclick = refreshInventory;
  document.addEventListener('safetycheck:live-applied', refreshInventory);

  const serviceColor = {
    ec2:'#D05C17', lambda:'#D05C17', ecs:'#D05C17', eks:'#D05C17',
    rds:'#3334B9', elasticache:'#3334B9', dynamodb:'#3334B9',
    s3:'#277116', efs:'#277116',
    cloudfront:'#5A30B5', route_53:'#5A30B5', api_gateway:'#5A30B5', elastic_load_balancing:'#5A30B5', vpc:'#5A30B5',
    waf:'#C7131F', cloudtrail:'#BC1356'
  };
  const awsStyle = icon => `sketch=0;outlineConnect=0;fontColor=#232F3E;gradientColor=none;fillColor=${serviceColor[icon]||'#5A30B5'};strokeColor=#ffffff;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=10;aspect=fixed;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.${icon};`;
  const boxStyle = (stroke,fill) => `rounded=0;whiteSpace=wrap;html=1;verticalAlign=top;align=left;spacingTop=7;spacingLeft=9;fontSize=12;fontStyle=1;strokeColor=${stroke};fillColor=${fill};fontColor=#232F3E;dashed=1;`;
  const nodeStyle = 'rounded=1;whiteSpace=wrap;html=1;fontColor=#232F3E;fillColor=#F5F7FA;strokeColor=#8294A8;fontSize=10;';
  const edgeStyle = 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=block;endFill=1;strokeColor=#5E7184;fontColor=#5E7184;fontSize=9;';

  function pageBuilder(name) {
    let seq=2; const cells=[]; const ids=new Map();
    const next=()=>`${name.replace(/[^A-Za-z0-9]/g,'')}_${seq++}`;
    const add=(key,value,style,x,y,w=70,h=70,parent='1')=>{const id=next();ids.set(key,id);cells.push(`<mxCell id="${id}" value="${esc(value)}" style="${style}" vertex="1" parent="${parent}"><mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>`);return id;};
    const box=(key,value,x,y,w,h,stroke='#147EBA',fill='#EAF5FB')=>add(key,value,boxStyle(stroke,fill),x,y,w,h);
    const edge=(from,to,label='')=>{const s=ids.get(from),d=ids.get(to);if(!s||!d)return;const id=next();cells.push(`<mxCell id="${id}" value="${esc(label)}" style="${edgeStyle}" edge="1" parent="1" source="${s}" target="${d}"><mxGeometry relative="1" as="geometry"/></mxCell>`);};
    const xml=()=>`<mxGraphModel dx="1600" dy="1000" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1654" pageHeight="1169" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>${cells.join('')}</root></mxGraphModel>`;
    return {add,box,edge,xml,ids};
  }

  function routeTableForSubnet(t, subnet) {
    const tables=arr(t.routeTables).filter(r=>r.vpcId===subnet.vpcId && (!r.region || !subnet.region || r.region===subnet.region));
    return tables.find(r=>arr(r.associations).some(a=>a.SubnetId===subnet.id)) || tables.find(r=>arr(r.associations).some(a=>a.Main===true));
  }

  function subnetClass(t, subnet) {
    const rt=routeTableForSubnet(t,subnet);
    const hasIgw=arr(rt?.routes).some(r=>(r.DestinationCidrBlock==='0.0.0.0/0'||r.DestinationIpv6CidrBlock==='::/0') && String(r.GatewayId||'').startsWith('igw-'));
    if(hasIgw) return 'PUBLIC';
    return 'PRIVATE';
  }

  function overviewPage(t, s) {
    const p=pageBuilder('Overview');
    p.add('title',`AWS SafetyCheck Architecture Overview\nAccount ${s?.account||''} · ${arr(t.regions).join(', ')||t.region||''}`,nodeStyle,30,20,500,56);
    let x=600,y=25,idx=0;
    const global=(key,label,icon)=>{const gx=x+(idx%7)*130,gy=y+Math.floor(idx/7)*115;idx++;p.add(key,label,awsStyle(icon),gx,gy,64,64);};
    arr(t.route53).forEach(z=>global(`r53:${z.id}`,`Route 53\n${z.name}`,'route_53'));
    arr(t.cloudfront).forEach(d=>global(`cf:${d.id}`,`CloudFront\n${d.id}`,'cloudfront'));
    arr(t.waf).forEach(w=>global(`waf:${w.arn}`,`AWS WAF\n${w.name}`,'waf'));
    arr(t.apiGateway).forEach(a=>global(`api:${a.id}`,`API Gateway\n${a.name}`,'api_gateway'));
    arr(t.s3).slice(0,40).forEach(b=>global(`s3:${b.name}`,`Amazon S3\n${b.name}`,'s3'));

    const topY=250+Math.ceil(Math.max(1,idx)/7)*115;
    arr(t.vpcs).forEach((v,i)=>{
      const vx=60+(i%3)*500,vy=topY+Math.floor(i/3)*190;
      const subs=arr(t.subnets).filter(z=>z.vpcId===v.id && (!v.region||!z.region||z.region===v.region));
      const ecs=arr(t.instances).filter(z=>z.vpcId===v.id && (!v.region||!z.region||z.region===v.region));
      const dbs=arr(t.rds).filter(z=>z.vpcId===v.id && (!v.region||!z.region||z.region===v.region));
      const lbs=arr(t.loadBalancers).filter(z=>z.vpcId===v.id && (!v.region||!z.region||z.region===v.region));
      p.box(`vpc:${v.region||''}:${v.id}`,`${v.region||''} · ${v.name||v.id}\n${v.cidr||''}`,vx,vy,430,145,'#248814','#EDF8ED');
      p.add(`vpci:${v.region||''}:${v.id}`,'Amazon VPC',awsStyle('vpc'),vx+18,vy+40,55,55);
      p.add(`sum:${v.region||''}:${v.id}`,`Subnet ${subs.length}\nEC2 ${ecs.length}\nLB ${lbs.length}\nRDS ${dbs.length}`,nodeStyle,vx+100,vy+42,160,58);
    });

    for(const cf of arr(t.cloudfront)){
      for(const o of arr(cf.origins)){
        const lb=arr(t.loadBalancers).find(l=>l.dns && o.domain && (o.domain===l.dns || o.domain.includes(l.dns)));
        const b=arr(t.s3).find(b=>o.domain && o.domain.startsWith(`${b.name}.`));
        if(lb){
          const key=`ovlb:${lb.arn}`;
          if(!p.ids.has(key)) p.add(key,`${lb.type==='network'?'NLB':'ALB'}\n${lb.name}`,awsStyle('elastic_load_balancing'),1120,topY-90+arr(t.loadBalancers).indexOf(lb)*75,58,58);
          p.edge(`cf:${cf.id}`,key,'origin');
        } else if(b) p.edge(`cf:${cf.id}`,`s3:${b.name}`,'origin');
      }
    }
    for(const w of arr(t.waf)) for(const cf of arr(t.cloudfront)) if(cf.webAclId && (cf.webAclId===w.arn || cf.webAclId.includes(w.name||'___'))) p.edge(`waf:${w.arn}`,`cf:${cf.id}`,'associated');
    return p.xml();
  }

  function vpcPage(t,v) {
    const region=v.region||t.region||'';
    const name=`${region}-${v.name||v.id}`.slice(0,50);
    const p=pageBuilder(name);
    p.add('title',`${region} · ${v.name||v.id}\n${v.cidr||''}`,nodeStyle,30,20,480,56);
    p.box('vpcbox',`Amazon VPC · ${v.name||v.id} · ${v.cidr||''}`,30,100,1540,940,'#248814','#F2FBF2');
    p.add('vpcicon','Amazon VPC',awsStyle('vpc'),48,135,58,58);

    const subs=arr(t.subnets).filter(s=>s.vpcId===v.id && (!region||!s.region||s.region===region));
    const azs=[...new Set(subs.map(s=>s.az||'unknown'))].sort();
    const colW=Math.max(310,Math.floor(1380/Math.max(1,Math.min(4,azs.length))));
    const pos=new Map();
    azs.forEach((az,ai)=>{
      const col=ai%4,row=Math.floor(ai/4), ax=130+col*colW, ay=160+row*410;
      p.box(`az:${az}`,`Availability Zone · ${az}`,ax,ay,colW-18,380,'#8796A5','#F8FAFC');
      const azSubs=subs.filter(s=>(s.az||'unknown')===az).sort((a,b)=>subnetClass(t,a).localeCompare(subnetClass(t,b)));
      azSubs.forEach((s,si)=>{
        const kind=subnetClass(t,s), sy=ay+45+si*150;
        const fill=kind==='PUBLIC'?'#EAF6FF':'#F4F0FF', stroke=kind==='PUBLIC'?'#147EBA':'#6B55B5';
        p.box(`subnet:${s.id}`,`${kind} SUBNET\n${s.name||s.id}\n${s.cidr||''}`,ax+18,sy,colW-54,135,stroke,fill);
        pos.set(s.id,{x:ax+18,y:sy,w:colW-54,h:135,kind});
      });
    });

    arr(t.internetGateways).filter(g=>arr(g.vpcIds).includes(v.id) && (!region||!g.region||g.region===region)).forEach((g,i)=>p.add(`igw:${g.id}`,`Internet Gateway\n${g.id}`,'sketch=0;html=1;aspect=fixed;shape=mxgraph.aws4.internet_gateway;fillColor=#5A30B5;strokeColor=none;fontColor=#232F3E;verticalLabelPosition=bottom;verticalAlign=top;align=center;fontSize=9;',1430,125+i*78,58,58));

    const slots=new Map();
    const place=(subnetId,key,label,icon)=>{
      const z=pos.get(subnetId); if(!z)return false; const n=slots.get(subnetId)||0; slots.set(subnetId,n+1);
      const nx=z.x+10+(n%4)*66, ny=z.y+54+Math.floor(n/4)*70; p.add(key,label,awsStyle(icon),nx,ny,52,52); return true;
    };

    arr(t.instances).filter(x=>x.vpcId===v.id && (!region||!x.region||x.region===region)).forEach(x=>place(x.subnetId,`ec2:${x.id}`,`EC2\n${x.name||x.id}`,'ec2'));
    arr(t.rds).filter(x=>x.vpcId===v.id && (!region||!x.region||x.region===region)).forEach(x=>place(arr(x.subnetIds)[0],`rds:${x.id}`,`RDS\n${x.id}`,'rds'));
    arr(t.lambda).filter(x=>x.vpcId===v.id && (!region||!x.region||x.region===region)).forEach(x=>place(arr(x.subnetIds)[0],`lambda:${x.name}`,`Lambda\n${x.name}`,'lambda'));
    arr(t.natGateways).filter(x=>x.vpcId===v.id && (!region||!x.region||x.region===region)).forEach(x=>place(x.subnetId,`nat:${x.id}`,`NAT GW\n${x.id}`,'vpc'));
    arr(t.vpcEndpoints).filter(x=>x.vpcId===v.id && (!region||!x.region||x.region===region)).forEach((x,i)=>{
      const sid=arr(x.subnetIds)[0]; if(!place(sid,`vpce:${x.id}`,`VPC Endpoint\n${(x.serviceName||'').split('.').pop()}`, 'vpc')) p.add(`vpce:${x.id}`,`VPC Endpoint\n${x.id}`,nodeStyle,1250,230+i*60,170,44);
    });

    const lbs=arr(t.loadBalancers).filter(x=>x.vpcId===v.id && (!region||!x.region||x.region===region));
    lbs.forEach((lb,i)=>p.add(`lb:${lb.arn}`,`${lb.type==='network'?'Network':'Application'} Load Balancer\n${lb.name}`,awsStyle('elastic_load_balancing'),180+i*125,112,62,62));
    const tgs=arr(t.targetGroups).filter(x=>x.vpcId===v.id && (!region||!x.region||x.region===region));
    tgs.forEach((tg,i)=>{
      p.add(`tg:${tg.arn}`,`Target Group\n${tg.name}\n${tg.protocol||''}:${tg.port||''}`,nodeStyle,210+i*155,875,140,55);
      arr(tg.loadBalancerArns).forEach(a=>p.edge(`lb:${a}`,`tg:${tg.arn}`,'listener/target'));
      arr(tg.targets).forEach(target=>{
        if(p.ids.has(`ec2:${target.id}`)) p.edge(`tg:${tg.arn}`,`ec2:${target.id}`,target.state||'target');
      });
    });
    const asgs=arr(t.autoScalingGroups).filter(g=>arr(g.instanceIds).some(id=>p.ids.has(`ec2:${id}`)));
    asgs.forEach((g,i)=>{
      p.add(`asg:${g.name}`,`Auto Scaling Group\n${g.name}\nDesired ${g.desired}`,nodeStyle,1180,830+i*65,250,52);
      arr(g.instanceIds).forEach(id=>p.edge(`asg:${g.name}`,`ec2:${id}`,'member'));
    });

    return {name,xml:p.xml()};
  }

  function buildDrawio(t,s) {
    const pages=[{name:'Overview',xml:overviewPage(t,s)}];
    arr(t.vpcs).forEach(v=>pages.push(vpcPage(t,v)));
    const diagrams=pages.map((p,i)=>`<diagram id="page-${i+1}" name="${esc(p.name)}">${p.xml}</diagram>`).join('');
    return `<?xml version="1.0" encoding="UTF-8"?><mxfile host="app.diagrams.net" modified="${new Date().toISOString()}" agent="AWS SafetyCheck" version="24.7.17" type="device">${diagrams}</mxfile>`;
  }

  document.getElementById('downloadDrawio').onclick = () => {
    const s=snap(), t=s?.topology;
    if(!t) return alert('먼저 ReadOnly AWS 계정을 연결해 주세요.');
    const xml=buildDrawio(t,s);
    const blob=new Blob([xml],{type:'application/xml;charset=utf-8'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`aws-safetycheck-${s.account||'architecture'}-${new Date().toISOString().slice(0,10)}.drawio`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  };
})();