(() => {
  const nav = document.querySelector('.nav');
  const dash = document.getElementById('dash');
  if (!nav || !dash || document.getElementById('workflowGuide')) return;

  const FLOW = [
    {
      id: 'sources',
      no: 1,
      title: '데이터 소스',
      short: '분석할 데이터 준비',
      desc: 'CIS 보고서를 가져오고, 가능하면 ReadOnly AWS도 연결합니다. 둘을 같이 쓰면 Finding과 실제 리소스 상태를 결합할 수 있습니다.',
      action: '데이터 준비하기'
    },
    {
      id: 'findings',
      no: 2,
      title: 'Findings',
      short: '실패 항목 확인',
      desc: '실패한 CIS Control을 확인하고 우선순위를 정합니다. ReadOnly AWS가 연결되어 있으면 서비스 영향과 비용 판단이 실제 리소스 기준으로 갱신됩니다.',
      action: 'Findings 확인'
    },
    {
      id: 'analyze',
      no: 3,
      title: '변경 영향 분석',
      short: '조치 전 What-if 분석',
      desc: '선택한 Control을 실제로 변경하기 전에 장애 가능성, 영향 리소스, 비용 변화, 롤백 가능성을 확인합니다.',
      action: '변경 영향 분석'
    },
    {
      id: 'topology',
      no: 4,
      title: '아키텍처',
      short: '전체 구조 확인 · 선택',
      desc: 'ReadOnly AWS에서 수집한 실제 리소스를 VPC와 Subnet 기준으로 확인하고 draw.io 구성도로 내보냅니다. 분석 보조 및 문서화 단계입니다.',
      action: '아키텍처 보기'
    }
  ];

  function navButton(id) {
    return nav.querySelector(`[data-v="${CSS.escape(id)}"]`);
  }

  // Dashboard is an overview. The actual workflow starts at Data Sources.
  const dashBtn = navButton('dash');
  if (dashBtn) dashBtn.innerHTML = '▦ <span>대시보드</span><small>진행 현황</small>';

  const labels = {
    sources: ['1', '데이터 소스', '먼저 시작'],
    findings: ['2', 'Findings', '실패 항목 확인'],
    analyze: ['3', '변경 영향 분석', '조치 전 검토'],
    topology: ['4', '아키텍처', '구성 확인 · 선택']
  };

  Object.entries(labels).forEach(([id, [no, title, sub]]) => {
    const b = navButton(id);
    if (!b) return;
    b.innerHTML = `<b class="nav-no">${no}</b><span>${title}</span><small>${sub}</small>`;
  });

  // Force the menu into the actual usage order regardless of when dynamic tabs were created.
  ['dash', 'sources', 'findings', 'analyze', 'topology'].forEach(id => {
    const b = navButton(id);
    if (b) nav.appendChild(b);
  });

  const guide = document.createElement('article');
  guide.id = 'workflowGuide';
  guide.className = 'panel workflow-guide';
  guide.innerHTML = `
    <div class="workflow-head">
      <div>
        <div class="kicker">RECOMMENDED WORKFLOW</div>
        <h3>처음이면 이 순서대로 진행하세요</h3>
        <p>대시보드는 <b>진행 현황을 보는 화면</b>이고 실제 작업은 <b>데이터 소스 → Findings → 변경 영향 분석</b> 순서입니다. 아키텍처는 ReadOnly AWS 연결 후 사용하는 보조/문서화 단계입니다.</p>
      </div>
      <div class="workflow-route"><span>1</span><i></i><span>2</span><i></i><span>3</span><i></i><span class="optional">4</span></div>
    </div>
    <div class="workflow-grid">
      ${FLOW.map(s => `
        <button class="workflow-step" type="button" data-workflow-go="${s.id}">
          <div class="workflow-step-top">
            <span class="workflow-number">${s.no}</span>
            <div><b>${s.title}</b><small>${s.short}</small></div>
            <em class="workflow-state" data-workflow-state="${s.id}">대기</em>
          </div>
          <p>${s.desc}</p>
          <span class="workflow-action">${s.action} →</span>
        </button>`).join('')}
    </div>
    <div class="workflow-tip">
      <b>가장 권장하는 사용법</b>
      <span>CIS 보고서 업로드 + ReadOnly AWS 연결 → Findings 확인 → 조치할 Control의 변경 영향 분석 → 필요 시 아키텍처 구성도 출력</span>
    </div>`;

  const hero = dash.querySelector('.hero');
  if (hero) hero.after(guide);
  else dash.prepend(guide);

  const sectionCopy = {
    sources: {
      title: 'STEP 1 · 분석할 데이터를 먼저 준비합니다',
      text: 'CIS 보고서만으로도 시작할 수 있지만, 서비스 영향과 실제 리소스 관계까지 보려면 ReadOnly AWS 연결을 함께 사용하는 것을 권장합니다.',
      prev: 'dash', next: 'findings', nextText: '다음 · Findings 확인'
    },
    findings: {
      title: 'STEP 2 · 실패한 Finding 중 무엇을 조치할지 고릅니다',
      text: 'Control ID, 심각도, 서비스 영향, 비용 정보를 보고 우선 검토 대상을 선택합니다. AWS가 연결되어 있으면 LIVE 표시가 붙은 결과를 우선 참고하세요.',
      prev: 'sources', next: 'analyze', nextText: '다음 · 변경 영향 분석'
    },
    analyze: {
      title: 'STEP 3 · 실제 변경 전에 What-if 분석을 합니다',
      text: '조치하려는 Control 또는 변경 내용을 입력해 장애 가능성, 영향 리소스, 비용 변화와 롤백 가능성을 확인합니다. 이 단계가 SafetyCheck의 핵심 단계입니다.',
      prev: 'findings', next: 'topology', nextText: '선택 · 아키텍처 확인'
    },
    topology: {
      title: 'STEP 4 · 전체 구조를 확인하거나 문서로 내보냅니다',
      text: '필수 조치 단계는 아닙니다. ReadOnly AWS 연결 후 실제 VPC/Subnet/EC2/RDS/Load Balancer 등의 배치를 확인하고 draw.io 파일로 출력할 때 사용합니다.',
      prev: 'analyze', next: null, nextText: ''
    }
  };

  Object.entries(sectionCopy).forEach(([id, cfg]) => {
    const section = document.getElementById(id);
    if (!section || section.querySelector('.flow-context')) return;
    const box = document.createElement('div');
    box.className = 'flow-context';
    box.innerHTML = `
      <div class="flow-context-copy">
        <b>${cfg.title}</b>
        <span>${cfg.text}</span>
      </div>
      <div class="flow-context-actions">
        ${cfg.prev ? `<button class="btn" type="button" data-vgo="${cfg.prev}">← 이전</button>` : ''}
        ${cfg.next ? `<button class="btn primary" type="button" data-vgo="${cfg.next}">${cfg.nextText}</button>` : ''}
      </div>`;
    section.prepend(box);
  });

  function openView(id) {
    const btn = navButton(id);
    if (btn) btn.click();
    else {
      document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === id));
    }
  }

  guide.querySelectorAll('[data-workflow-go]').forEach(b => {
    b.addEventListener('click', () => openView(b.dataset.workflowGo));
  });

  function sourceState() {
    const reportText = document.getElementById('reportStatus')?.textContent || '';
    const report = !!reportText && !/보고서 없음/.test(reportText);
    const live = !!window.SafetyCheckLive?.getSnapshot?.() || /Live AWS/i.test(document.getElementById('mode')?.textContent || '');
    return { report, live, ready: report || live };
  }

  function setState(id, text, kind='wait') {
    const el = guide.querySelector(`[data-workflow-state="${id}"]`);
    if (!el) return;
    el.textContent = text;
    el.dataset.kind = kind;
  }

  function refreshStates() {
    const s = sourceState();
    if (s.report && s.live) setState('sources', '완료 · Report + Live', 'done');
    else if (s.live) setState('sources', '사용 가능 · Live AWS', 'done');
    else if (s.report) setState('sources', '사용 가능 · Report', 'partial');
    else setState('sources', '여기서 시작', 'start');

    let findingCount = '';
    const countText = document.getElementById('count')?.textContent || '';
    const m = countText.match(/(\d+)/);
    if (m) findingCount = m[1];
    else if (Array.isArray(window.F)) findingCount = String(window.F.length);
    if (s.ready) setState('findings', findingCount ? `${findingCount}개 확인 가능` : '확인 가능', 'ready');
    else setState('findings', '1단계 필요', 'locked');

    const analysisDone = sessionStorage.getItem('safetycheck-analysis-done') === '1';
    if (analysisDone) setState('analyze', '분석 실행됨', 'done');
    else if (s.ready) setState('analyze', '사용 가능', 'ready');
    else setState('analyze', '1단계 필요', 'locked');

    if (s.live) setState('topology', '사용 가능', 'ready');
    else setState('topology', 'Live AWS 필요', 'locked');
  }

  const run = document.getElementById('run');
  if (run) run.addEventListener('click', () => {
    setTimeout(() => {
      const result = document.getElementById('result');
      if (result && !result.classList.contains('hidden')) {
        sessionStorage.setItem('safetycheck-analysis-done', '1');
        refreshStates();
      }
    }, 50);
  });

  document.addEventListener('safetycheck:live-applied', refreshStates);
  document.addEventListener('safetycheck:report-loaded', refreshStates);
  const reportStatus = document.getElementById('reportStatus');
  if (reportStatus) new MutationObserver(refreshStates).observe(reportStatus, {childList:true, subtree:true, characterData:true});
  const mode = document.getElementById('mode');
  if (mode) new MutationObserver(refreshStates).observe(mode, {childList:true, subtree:true, characterData:true});
  refreshStates();

  const style = document.createElement('style');
  style.textContent = `
    .nav button{display:grid!important;grid-template-columns:26px 1fr;column-gap:8px;align-items:center}
    .nav button>span{font-weight:720}.nav button>small{grid-column:2;display:block;color:#6f849a;font-size:9px;line-height:1.25;margin-top:-2px}
    .nav-no{grid-row:1/3;width:23px;height:23px;border-radius:7px;display:grid;place-items:center;background:#102943;color:#8dc8ff;font-size:10px}
    .nav button.active .nav-no{background:#285d92;color:white}.nav button[data-v="dash"]{grid-template-columns:26px 1fr}.nav button[data-v="dash"]>small{grid-column:2}

    .workflow-guide{margin:16px 0 18px;padding:24px!important}
    .workflow-head{display:flex;justify-content:space-between;gap:28px;align-items:flex-start;margin-bottom:18px}
    .workflow-head h3{font-size:22px;margin:4px 0 7px}.workflow-head p{margin:0;max-width:850px;color:#a8bbce;font-size:14px;line-height:1.7}.workflow-head p b{color:#e9f2fb}
    .workflow-route{display:flex;align-items:center;min-width:250px;padding-top:12px}.workflow-route span{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:#1c5689;color:white;font-size:11px;font-weight:900}.workflow-route span.optional{background:#23384e;color:#b6c8da}.workflow-route i{height:1px;flex:1;background:#365675}
    .workflow-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
    .workflow-step{appearance:none;text-align:left;color:inherit;border:1px solid #223b58;background:#091827;border-radius:13px;padding:15px;cursor:pointer;transition:.15s ease;min-height:190px}
    .workflow-step:hover{border-color:#3d74aa;transform:translateY(-1px);background:#0c1d2f}
    .workflow-step-top{display:grid;grid-template-columns:30px 1fr auto;gap:9px;align-items:start}.workflow-number{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;background:#153e64;color:#9ed1ff;font-size:11px;font-weight:900}.workflow-step-top b{display:block;font-size:14px;color:#edf5fc}.workflow-step-top small{display:block;margin-top:2px;color:#7f95aa;font-size:10px}.workflow-step p{margin:13px 0 12px;color:#9fb2c5;font-size:12px;line-height:1.65}.workflow-action{font-size:11px;font-weight:800;color:#89c6ff}
    .workflow-state{font-style:normal;font-size:9px;font-weight:850;padding:4px 7px;border-radius:99px;background:#152437;color:#8398ad;white-space:nowrap}.workflow-state[data-kind="start"]{background:#183b61;color:#9bd0ff}.workflow-state[data-kind="done"]{background:#17392e;color:#7ee0ac}.workflow-state[data-kind="partial"]{background:#3a3020;color:#ffd27d}.workflow-state[data-kind="ready"]{background:#142f43;color:#8fd1ff}.workflow-state[data-kind="locked"]{background:#242c36;color:#82909e}
    .workflow-tip{display:grid;grid-template-columns:auto 1fr;gap:12px;margin-top:14px;padding:12px 14px;border:1px solid #284562;border-radius:10px;background:#071521;font-size:11px;line-height:1.55}.workflow-tip b{color:#e8f1f9}.workflow-tip span{color:#91a7bb}

    .flow-context{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-bottom:16px;padding:15px 17px;border:1px solid #28445f;border-radius:13px;background:linear-gradient(90deg,#0b1d31,#0a1727)}
    .flow-context-copy{display:grid;gap:4px}.flow-context-copy>b{font-size:14px;color:#eef5fb}.flow-context-copy>span{font-size:12px;color:#99aec1;line-height:1.6;max-width:900px}.flow-context-actions{display:flex;gap:7px;flex:0 0 auto}.flow-context-actions .btn{font-size:11px;white-space:nowrap}

    @media(max-width:1150px){.workflow-grid{grid-template-columns:1fr 1fr}.workflow-route{display:none}}
    @media(max-width:1000px){.nav button{display:flex!important;justify-content:center}.nav button>small,.nav button>span,.nav-no{display:none!important}}
    @media(max-width:700px){.workflow-guide{padding:17px!important}.workflow-head{display:block}.workflow-grid{grid-template-columns:1fr}.workflow-step{min-height:auto}.flow-context{align-items:flex-start;flex-direction:column}.flow-context-actions{width:100%}.flow-context-actions .btn{flex:1}.workflow-tip{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);
})();
