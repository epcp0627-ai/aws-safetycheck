(() => {
  if (document.getElementById('safetycheckAuditFixes')) return;

  const main = document.querySelector('main');
  const header = main?.querySelector('header');
  const nav = document.querySelector('.nav');
  const findings = document.getElementById('findings');
  const analyze = document.getElementById('analyze');
  const topology = document.getElementById('topology');
  if (!main || !header || !nav) return;

  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const nowText = () => new Intl.DateTimeFormat('ko-KR', {dateStyle:'medium', timeStyle:'short'}).format(new Date());
  let wasReal = false;
  let collectedAt = '';

  function getState() {
    const reportText = document.getElementById('reportStatus')?.textContent || '';
    const report = !!reportText && !/보고서 없음/.test(reportText);
    const snapshot = window.SafetyCheckLive?.getSnapshot?.() || null;
    const live = !!snapshot || /Live AWS/i.test(document.getElementById('mode')?.textContent || '');
    const real = report || live;
    const selected = real && sessionStorage.getItem('safetycheck-finding-selected') === '1';
    const result = document.getElementById('result');
    const analyzed = real && selected && sessionStorage.getItem('safetycheck-analysis-done') === '1' && result && !result.classList.contains('hidden');
    return {reportText, report, snapshot, live, real, selected, analyzed};
  }

  function openView(id) {
    document.querySelector(`.nav [data-v="${CSS.escape(id)}"]`)?.click();
  }

  /* Demo / real-data banner */
  const banner = document.createElement('div');
  banner.id = 'dataModeBanner';
  banner.className = 'data-mode-banner';
  banner.innerHTML = '<div><b>샘플 데이터로 보는 데모</b><span>현재 보안 항목과 위험 점수는 실제 AWS 계정 분석 결과가 아닙니다.</span></div><button class="btn" type="button">실제 데이터 연결</button>';
  banner.querySelector('button').onclick = () => openView('sources');
  header.after(banner);

  function ensureMeta(section, id) {
    if (!section) return null;
    const el = document.createElement('div');
    el.id = id;
    el.className = 'result-data-meta';
    const context = section.querySelector('.flow-context');
    if (context) context.after(el); else section.prepend(el);
    return el;
  }
  const findingsMeta = ensureMeta(findings, 'findingsDataMeta');
  const analyzeMeta = ensureMeta(analyze, 'analyzeDataMeta');

  /* Terminology cleanup */
  const findingsNav = nav.querySelector('[data-v="findings"]');
  if (findingsNav) {
    const span = findingsNav.querySelector('span');
    const small = findingsNav.querySelector('small');
    if (span) span.textContent = '보안 항목';
    if (small) small.textContent = 'Findings · 실패 항목';
  }
  const findingsFlow = document.querySelector('[data-workflow-go="findings"]');
  if (findingsFlow) {
    const title = findingsFlow.querySelector('.workflow-step-top b');
    const small = findingsFlow.querySelector('.workflow-step-top small');
    if (title) title.textContent = '보안 항목';
    if (small) small.textContent = 'Findings · 실패 항목 확인';
  }
  const findingsHeading = findings?.querySelector('.head h3');
  if (findingsHeading) findingsHeading.textContent = '실패 보안 항목';

  /* Architecture is an optional tool, not required step 4 */
  const topologyNav = nav.querySelector('[data-v="topology"]');
  if (topologyNav) {
    const no = topologyNav.querySelector('.nav-no');
    const small = topologyNav.querySelector('small');
    if (no) no.textContent = '◇';
    if (small) small.textContent = '선택 도구';
  }
  const topologyFlow = document.querySelector('[data-workflow-go="topology"]');
  if (topologyFlow) {
    const no = topologyFlow.querySelector('.workflow-number');
    if (no) { no.textContent = '선택'; no.classList.add('optional-tool-number'); }
  }

  /* Mobile navigation drawer */
  const menuBtn = document.createElement('button');
  menuBtn.type = 'button';
  menuBtn.id = 'mobileMenuBtn';
  menuBtn.className = 'btn mobile-menu-btn';
  menuBtn.setAttribute('aria-label','메뉴 열기');
  menuBtn.setAttribute('aria-expanded','false');
  menuBtn.innerHTML = '<span aria-hidden="true">☰</span><span>메뉴</span>';
  header.querySelector('.actions')?.prepend(menuBtn);

  const backdrop = document.createElement('div');
  backdrop.className = 'mobile-nav-backdrop';
  backdrop.hidden = true;
  document.body.appendChild(backdrop);

  function setMenu(open) {
    document.body.classList.toggle('mobile-nav-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    backdrop.hidden = !open;
  }
  menuBtn.onclick = () => setMenu(!document.body.classList.contains('mobile-nav-open'));
  backdrop.onclick = () => setMenu(false);
  nav.addEventListener('click', e => { if (e.target.closest('button')) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* Accessibility */
  nav.setAttribute('role','navigation');
  nav.setAttribute('aria-label','SafetyCheck 주요 메뉴');
  document.getElementById('q')?.setAttribute('aria-label','보안 항목 검색');
  document.getElementById('s')?.setAttribute('aria-label','심각도 필터');
  $$('.closeAws').forEach(b => b.setAttribute('aria-label','AWS 계정 연결 창 닫기'));
  $$('.closeReport').forEach(b => b.setAttribute('aria-label','CIS 보고서 가져오기 창 닫기'));
  $$('.view h3').forEach(h => { h.setAttribute('role','heading'); h.setAttribute('aria-level','2'); });
  for (const [dlgId, label] of [['awsDlg','awsDialogTitle'],['reportDlg','reportDialogTitle']]) {
    const dlg = document.getElementById(dlgId);
    const h = dlg?.querySelector('h3');
    if (dlg && h) { h.id ||= label; dlg.setAttribute('aria-labelledby',h.id); }
  }
  function syncNavA11y() {
    $$('.nav button').forEach(b => {
      if (b.classList.contains('active')) b.setAttribute('aria-current','page');
      else b.removeAttribute('aria-current');
      b.setAttribute('aria-label', b.textContent.replace(/\s+/g,' ').trim());
    });
  }
  new MutationObserver(syncNavA11y).observe(nav,{subtree:true,attributes:true,attributeFilter:['class']});
  syncNavA11y();

  /* Collapsed security/trust explanation */
  const sources = document.getElementById('sources');
  if (sources) {
    const trust = document.createElement('details');
    trust.id = 'trustDetails';
    trust.className = 'trust-details panel';
    trust.innerHTML = `
      <summary>권한과 데이터 처리 방식 보기</summary>
      <div class="trust-grid">
        <div><b>AWS 권한</b><span>리소스 메타데이터 조회용 Describe/List/Get 계열만 허용하며 생성·수정·삭제 권한은 포함하지 않습니다.</span></div>
        <div><b>연결 방식</b><span>Access Key 대신 STS AssumeRole + External ID를 사용하고 고객 Role은 SafetyCheck 서비스 Lambda Role만 신뢰합니다.</span></div>
        <div><b>데이터 처리</b><span>고객 리소스용 별도 DB는 현재 없으며 Lambda 실행 로그는 CloudWatch에서 7일 보존하도록 구성되어 있습니다.</span></div>
        <div><b>연결 해제</b><span>고객 AWS의 <code>aws-safetycheck-readonly</code> CloudFormation 스택을 삭제하면 조회 권한이 제거됩니다.</span></div>
      </div>`;
    sources.appendChild(trust);
  }

  function reportName(text) {
    const first = String(text || '').split(/\n/)[0].trim();
    return first && !/보고서 없음/.test(first) ? first : '';
  }

  function metaHtml(s) {
    if (!s.real) return '<span class="meta-sample"><b>SAMPLE</b> 실제 데이터가 연결되지 않았습니다.</span>';
    const parts = [];
    const source = [];
    if (s.report) source.push(`CIS 보고서${reportName(s.reportText) ? ` · ${reportName(s.reportText)}` : ''}`);
    if (s.live) source.push('AWS 읽기 전용 조회');
    if (s.snapshot?.account) parts.push(`<span><b>계정</b> ${s.snapshot.account}</span>`);
    const regions = s.snapshot?.regions || (s.snapshot?.region ? [s.snapshot.region] : []);
    if (regions.length) parts.push(`<span><b>리전</b> ${regions.join(', ')}</span>`);
    parts.push(`<span><b>출처</b> ${source.join(' + ')}</span>`);
    parts.push(`<span><b>수집 시각</b> ${collectedAt || nowText()}</span>`);
    return parts.join('');
  }

  function decorateRows(s) {
    const labels = ['보안 항목','설명','심각도','서비스 영향','비용','작업'];
    $$('#rows tr').forEach(tr => {
      const controlCell = tr.querySelector('td:first-child');
      const control = controlCell?.childNodes[0]?.textContent?.trim() || controlCell?.textContent.trim() || '보안 항목';
      [...tr.children].forEach((td,i) => {
        const label = labels[i] || '정보';
        if (td.dataset.label !== label) td.dataset.label = label;
      });
      tr.querySelector('.one')?.setAttribute('aria-label', `${control} 영향 분석`);
      const existing = tr.querySelector('.sample-row-tag');
      if (!s.real && !existing && controlCell) {
        const tag = document.createElement('span');
        tag.className = 'sample-row-tag';
        tag.textContent = 'SAMPLE';
        controlCell.appendChild(tag);
      }
      if (s.real) existing?.remove();
    });

    $$('#priority .finding').forEach(card => {
      const existing = card.querySelector('.sample-watermark');
      if (!s.real && !existing) {
        const mark = document.createElement('span');
        mark.className = 'sample-watermark';
        mark.textContent = 'SAMPLE';
        card.appendChild(mark);
      }
      if (s.real) existing?.remove();
    });
  }

  function decorateAnalysis(s) {
    const result = document.getElementById('result');
    if (!result || result.classList.contains('hidden')) return;
    const type = s.real ? 'real' : 'sample';
    let badge = result.querySelector('.analysis-source-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.className = 'analysis-source-badge';
      result.prepend(badge);
    }
    if (badge.dataset.type === type) return;
    badge.dataset.type = type;
    badge.className = `analysis-source-badge ${type}`;
    badge.innerHTML = s.real
      ? `<b>실제 데이터 기반</b><span>${s.live ? 'AWS 리소스 상태 반영' : 'CIS 보고서 기반'}${s.live && s.report ? ' + CIS 보고서' : ''}</span>`
      : '<b>SAMPLE</b><span>제품 동작을 보여주기 위한 샘플이며 실제 계정 분석이 아닙니다.</span>';
  }

  function updateTopology(s) {
    if (!topology) return;
    for (const b of [document.getElementById('topologyRefresh'), document.getElementById('downloadDrawio')]) {
      if (!b) continue;
      b.disabled = !s.live;
      b.setAttribute('aria-disabled', String(!s.live));
      b.title = s.live ? '' : 'AWS 읽기 전용 연결 후 사용할 수 있습니다.';
    }
    let gate = document.getElementById('topologyGate');
    if (!gate) {
      gate = document.createElement('div');
      gate.id = 'topologyGate';
      gate.className = 'topology-gate';
      gate.innerHTML = '<div><b>AWS 연결 후 사용 가능</b><span>아키텍처와 draw.io 출력에는 실제 AWS 리소스 메타데이터가 필요합니다.</span></div><button class="btn primary" type="button">AWS 계정 연결</button>';
      gate.querySelector('button').onclick = () => document.getElementById('connect')?.click();
      topology.querySelector('.topology-hero')?.after(gate);
    }
    gate.hidden = s.live;
  }

  function updateProgress(s) {
    const completed = Number(s.real) + Number(s.selected) + Number(s.analyzed);
    const pct = Math.round(completed / 3 * 100);
    const progressText = document.getElementById('commandProgressText');
    const progressPct = document.getElementById('commandProgressPct');
    const progressBar = document.getElementById('commandProgressBar');
    if (progressText) progressText.textContent = `${completed} / 3`;
    if (progressPct) progressPct.textContent = `${pct}%`;
    if (progressBar) progressBar.style.width = `${pct}%`;

    const state = document.getElementById('commandState');
    const stateSub = document.getElementById('commandStateSub');
    const next = document.getElementById('commandNext');
    const nextSub = document.getElementById('commandNextSub');
    const nextBtn = document.getElementById('commandNextBtn');

    if (!s.real) {
      if (state) { state.className='command-value need'; state.innerHTML='<i class="command-dot"></i><span>실제 데이터 준비 필요</span>'; }
      if (stateSub) stateSub.textContent='현재 샘플 데이터가 표시 중입니다.';
      if (next) next.textContent='실제 데이터 연결';
      if (nextSub) nextSub.textContent='1단계는 화면 방문이 아니라 보고서 업로드 또는 AWS 연결 성공으로 완료됩니다.';
      if (nextBtn) { nextBtn.textContent='1단계 시작'; nextBtn.onclick=()=>openView('sources'); }
    } else if (!s.selected) {
      if (state) { state.className=`command-value ${s.live ? 'good':'partial'}`; state.innerHTML=`<i class="command-dot"></i><span>${s.live ? '실제 AWS 데이터 준비됨' : 'CIS 보고서 준비됨'}</span>`; }
      if (stateSub) stateSub.textContent='1단계 완료';
      if (next) next.textContent='조치할 보안 항목 선택';
      if (nextSub) nextSub.textContent='목록 방문만으로 완료되지 않으며 실제 분석 대상을 선택해야 합니다.';
      if (nextBtn) { nextBtn.textContent='2단계 이동'; nextBtn.onclick=()=>openView('findings'); }
    } else if (!s.analyzed) {
      if (state) { state.className='command-value good'; state.innerHTML='<i class="command-dot"></i><span>분석 대상 선택됨</span>'; }
      if (stateSub) stateSub.textContent='2단계 완료';
      if (next) next.textContent='변경 영향 분석 실행';
      if (nextSub) nextSub.textContent='서비스 영향, 장애 위험, 비용, 롤백 가능성을 확인합니다.';
      if (nextBtn) { nextBtn.textContent='3단계 이동'; nextBtn.onclick=()=>openView('analyze'); }
    } else {
      if (state) { state.className='command-value good'; state.innerHTML='<i class="command-dot"></i><span>필수 분석 완료</span>'; }
      if (stateSub) stateSub.textContent='필수 3단계 완료';
      if (next) next.textContent=s.live ? '선택 도구 · 아키텍처' : '다른 보안 항목 분석';
      if (nextSub) nextSub.textContent=s.live ? '필요하면 실제 구조를 확인하거나 draw.io로 출력하세요.' : 'AWS 연결 시 아키텍처 도구도 사용할 수 있습니다.';
      if (nextBtn) { nextBtn.textContent=s.live?'아키텍처 보기':'추가 분석'; nextBtn.onclick=()=>openView(s.live?'topology':'findings'); }
    }

    const setGuide = (id,text,kind) => {
      const el = document.querySelector(`[data-workflow-state="${id}"]`);
      if (el) { el.textContent=text; el.dataset.kind=kind; }
    };
    setGuide('sources', s.real ? (s.live && s.report ? '완료 · 보고서 + AWS' : s.live ? '완료 · AWS' : '완료 · 보고서') : '여기서 시작', s.real?'done':'start');
    setGuide('findings', s.selected ? '완료 · 대상 선택' : s.real ? '선택 필요' : '1단계 필요', s.selected?'done':s.real?'ready':'locked');
    setGuide('analyze', s.analyzed ? '완료 · 분석 실행' : s.selected ? '분석 필요' : '2단계 필요', s.analyzed?'done':s.selected?'ready':'locked');
    setGuide('topology', s.live ? '선택 도구 · 사용 가능' : 'AWS 연결 필요', s.live?'ready':'locked');
  }

  function updateAll() {
    let s = getState();
    if (s.real !== wasReal) {
      sessionStorage.removeItem('safetycheck-finding-selected');
      sessionStorage.removeItem('safetycheck-analysis-done');
      if (s.real) collectedAt = nowText();
      wasReal = s.real;
      s = getState();
    }
    document.body.classList.toggle('sample-mode', !s.real);
    banner.hidden = s.real;
    const meta = metaHtml(s);
    if (findingsMeta && findingsMeta.innerHTML !== meta) findingsMeta.innerHTML = meta;
    if (analyzeMeta && analyzeMeta.innerHTML !== meta) analyzeMeta.innerHTML = meta;
    decorateRows(s);
    decorateAnalysis(s);
    updateTopology(s);
    updateProgress(s);
  }

  /* Completion is tied to successful data/action state, never screen visits. */
  document.addEventListener('click', e => {
    const rowBtn = e.target.closest('#rows .one');
    if (rowBtn && getState().real) {
      sessionStorage.setItem('safetycheck-finding-selected','1');
      sessionStorage.removeItem('safetycheck-analysis-done');
      setTimeout(() => {
        const result = document.getElementById('result');
        if (result && !result.classList.contains('hidden')) sessionStorage.setItem('safetycheck-analysis-done','1');
        updateAll();
      },80);
    }
    if (e.target.closest('#run') && getState().real) {
      if ((document.getElementById('change')?.value || '').trim()) sessionStorage.setItem('safetycheck-finding-selected','1');
      setTimeout(() => {
        const result = document.getElementById('result');
        if (result && !result.classList.contains('hidden')) sessionStorage.setItem('safetycheck-analysis-done','1');
        updateAll();
      },100);
    }
  });

  const observeContent = el => el && new MutationObserver(() => queueMicrotask(updateAll)).observe(el,{childList:true,subtree:true,characterData:true});
  observeContent(document.getElementById('reportStatus'));
  observeContent(document.getElementById('mode'));
  observeContent(document.getElementById('rows'));
  observeContent(document.getElementById('priority'));
  const result = document.getElementById('result');
  if (result) new MutationObserver(() => queueMicrotask(updateAll)).observe(result,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  document.addEventListener('safetycheck:live-applied', () => { collectedAt=nowText(); queueMicrotask(updateAll); });
  document.addEventListener('safetycheck:report-loaded', () => { collectedAt=nowText(); queueMicrotask(updateAll); });

  const style = document.createElement('style');
  style.id = 'safetycheckAuditFixes';
  style.textContent = `
    .data-mode-banner{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:-6px 0 18px;padding:13px 15px;border:1px solid #765a28;border-radius:11px;background:#2b2316;color:#f4d99d}.data-mode-banner>div{display:flex;align-items:baseline;gap:10px;min-width:0}.data-mode-banner b{font-size:14px;white-space:nowrap}.data-mode-banner span{font-size:13px;line-height:1.5;color:#d8c294}.data-mode-banner .btn{flex:0 0 auto;font-size:13px!important;padding:8px 11px!important;background:#3a2f1d!important;border-color:#806431!important;color:#ffe4aa!important}
    .result-data-meta{display:flex;flex-wrap:wrap;gap:7px 14px;margin:0 0 14px;padding:10px 12px;border:1px solid #28435e;border-radius:10px;background:#091827;color:#aebdcc;font-size:12.5px;line-height:1.5}.result-data-meta span{display:inline-flex;gap:5px}.result-data-meta b{color:#edf5fb}.meta-sample{color:#e1bd73!important}.meta-sample b{padding:2px 6px;border-radius:999px;background:#3b2e19;color:#ffd27d!important;font-size:10px}
    .sample-row-tag,.sample-watermark{display:inline-flex;margin-left:7px;padding:2px 6px;border-radius:999px;background:#3a2d18;color:#ffd174;font-size:9.5px;font-weight:850;vertical-align:middle}.sample-watermark{position:absolute;right:10px;top:9px;margin:0}.sample-mode #priority .finding{position:relative;padding-right:70px!important}
    .analysis-source-badge{display:flex;align-items:center;gap:8px;margin:0 0 13px;padding:9px 11px;border-radius:9px;font-size:12.5px}.analysis-source-badge b{font-size:11px;padding:3px 7px;border-radius:999px}.analysis-source-badge span{color:#b9c8d6}.analysis-source-badge.sample{background:#2b2316;border:1px solid #715626}.analysis-source-badge.sample b{background:#4a371d;color:#ffd47d}.analysis-source-badge.real{background:#10281f;border:1px solid #28543e}.analysis-source-badge.real b{background:#173b2e;color:#82e0ad}
    .topology-gate{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:14px 0 0;padding:13px 15px;border:1px solid #2c4862;border-radius:11px;background:#0a1928}.topology-gate[hidden]{display:none!important}.topology-gate div{display:grid;gap:2px}.topology-gate b{font-size:14px}.topology-gate span{font-size:12.5px;color:#9fb0c0}.topology-actions button:disabled{opacity:.42;cursor:not-allowed;filter:saturate(.55)}
    .optional-tool-number{width:auto!important;min-width:42px!important;padding:0 7px!important;border-radius:999px!important;font-size:10px!important}.trust-details{margin-top:16px;padding:0!important;overflow:hidden}.trust-details>summary{cursor:pointer;padding:15px 17px;font-weight:700;color:#dce7f1;list-style:none}.trust-details>summary::-webkit-details-marker{display:none}.trust-details>summary:after{content:'＋';float:right;color:#8aa0b5}.trust-details[open]>summary:after{content:'－'}.trust-grid{display:grid;grid-template-columns:1fr 1fr;gap:1px;border-top:1px solid #1b3047;background:#1b3047}.trust-grid>div{display:grid;gap:4px;padding:14px 16px;background:#0a1827}.trust-grid b{font-size:13px}.trust-grid span{font-size:12.5px;line-height:1.65;color:#aab9c7}
    .mobile-menu-btn,.mobile-nav-backdrop{display:none}#rows td:nth-child(2){overflow-wrap:anywhere;word-break:break-word}

    @media(max-width:700px){
      main{padding:16px 12px 24px!important}header{display:flex!important;flex-direction:row!important;align-items:center!important;gap:10px!important;margin-bottom:16px!important}header>div:first-child{min-width:0;flex:1}header .eyebrow{display:none}header h1{font-size:20px!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:0!important}header .actions{width:auto!important;display:flex!important;justify-content:flex-end!important;flex-wrap:nowrap!important;gap:7px!important}header .actions #new{display:none!important}header .actions #connect{flex:0 0 auto!important;min-width:0!important;width:auto!important;padding:9px 10px!important;font-size:12.5px!important}.mobile-menu-btn{display:inline-flex!important;align-items:center;gap:5px;flex:0 0 auto!important;min-width:0!important;width:auto!important;padding:9px 10px!important;font-size:12.5px!important}
      aside{position:fixed!important;display:flex!important;flex-direction:column!important;left:0;top:0;bottom:0;width:min(310px,84vw)!important;padding:22px 16px!important;border:0!important;border-right:1px solid #263e57!important;background:#081321!important;z-index:1002;transform:translateX(-102%);transition:transform .2s ease;overflow:auto}body.mobile-nav-open aside{transform:translateX(0)}aside .brand{display:block!important;margin:0 0 22px!important;font-size:20px!important}aside .brand small{display:block!important;font-size:12px!important}aside .nav{display:grid!important;gap:7px!important;width:100%}aside .nav button{display:grid!important;width:100%!important;grid-template-columns:30px 1fr!important;text-align:left!important;padding:12px!important}aside .nav button span,aside .nav button small{display:block!important}aside .side{display:block!important;margin-top:auto!important;padding-top:18px}.mobile-nav-backdrop{position:fixed;display:block;inset:0;background:#0009;z-index:1001}.mobile-nav-backdrop[hidden]{display:none!important}
      .data-mode-banner{align-items:flex-start;flex-direction:column;margin-top:0;padding:12px}.data-mode-banner>div{display:grid;gap:3px}.data-mode-banner b{font-size:13.5px}.data-mode-banner span{font-size:12.5px}.data-mode-banner .btn{width:100%}
      #findings article.panel{padding:0!important;background:transparent!important;border:0!important}#findings .filters{padding:12px!important;border:1px solid #1b3047!important;border-radius:11px!important;margin-bottom:12px!important}#findings table,#findings tbody,#findings tr,#findings td{display:block!important;width:100%!important;max-width:100%!important}#findings thead{display:none!important}#findings tbody{display:grid!important;gap:11px!important}#findings tr{position:relative;padding:13px 14px!important;border:1px solid #263d56!important;border-radius:12px;background:#0a1928}#findings td{min-width:0!important;border:0!important;padding:6px 0!important;font-size:14px!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important}#findings td:before{content:attr(data-label);display:block;margin-bottom:2px;color:#859aae;font-size:11px;font-weight:700}#findings td:nth-child(1){font-size:16px!important;padding-top:0!important}#findings td:nth-child(1):before{display:none}#findings td:nth-child(2){font-size:14px!important;line-height:1.65!important}#findings td:last-child{padding-bottom:0!important}#findings td:last-child:before{display:none}#findings td:last-child .btn{width:100%;margin-top:3px}
      .result-data-meta{display:grid;gap:5px;font-size:12px}.result-data-meta span{display:flex;flex-wrap:wrap}.topology-gate{align-items:stretch;flex-direction:column}.topology-gate .btn{width:100%}.trust-grid{grid-template-columns:1fr}
    }
  `;
  document.head.appendChild(style);
  updateAll();
})();
