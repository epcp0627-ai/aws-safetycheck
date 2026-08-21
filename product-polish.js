(() => {
  if (document.getElementById('safetycheckProductPolish')) return;

  const dash = document.getElementById('dash');
  const hero = dash?.querySelector('.hero');
  const heroCard = dash?.querySelector('.heroCard');
  const workflow = document.getElementById('workflowGuide');
  if (!dash || !hero || !heroCard) return;

  const style = document.createElement('style');
  style.id = 'safetycheckProductPolish';
  style.textContent = `
    :root{
      --surface:#0b1828;
      --surface-2:#0e1d2f;
      --surface-3:#102238;
      --border-soft:#1b3047;
      --border-strong:#315371;
      --accent:#5daeff;
      --accent-soft:#102b46;
      --success:#6ed9a2;
      --success-soft:#102d25;
      --warning:#f3c36b;
      --warning-soft:#342b1b;
      --danger:#ff8585;
      --danger-soft:#371f25;
    }

    /* Reduce the feeling that every piece of content is a card. */
    .panel{
      background:var(--surface)!important;
      border-color:var(--border-soft)!important;
      box-shadow:none!important;
    }
    .sourceCard,.detail,.metric,.topology-inventory .inv{
      background:var(--surface)!important;
      border-color:var(--border-soft)!important;
      box-shadow:none!important;
    }
    .note,.notice{
      background:#0c2034!important;
      border-color:#24435f!important;
    }
    .btn{border-color:#29445e!important}
    .btn.primary{
      background:#287fce!important;
      box-shadow:none!important;
    }
    .btn.primary:hover{background:#3190e4!important}

    /* Dashboard command center */
    .dashboard-command{
      display:grid;
      grid-template-columns:1.05fr 1.35fr .8fr;
      gap:0;
      margin:0 0 16px;
      border:1px solid var(--border-strong);
      border-radius:15px;
      overflow:hidden;
      background:#091725;
    }
    .command-cell{
      min-width:0;
      padding:17px 19px;
      border-right:1px solid var(--border-soft);
    }
    .command-cell:last-child{border-right:0}
    .command-label{
      display:block;
      margin-bottom:7px;
      color:#8398ac;
      font-size:11px;
      font-weight:720;
      letter-spacing:.02em;
    }
    .command-value{
      display:flex;
      align-items:center;
      gap:8px;
      min-height:24px;
      color:#edf5fc;
      font-size:15px;
      font-weight:700;
      line-height:1.45;
    }
    .command-dot{width:8px;height:8px;border-radius:50%;background:#61788d;flex:0 0 auto}
    .command-value.good .command-dot{background:var(--success)}
    .command-value.partial .command-dot{background:var(--warning)}
    .command-value.need .command-dot{background:var(--accent)}
    .command-sub{display:block;margin-top:3px;color:#8da2b6;font-size:11.5px;line-height:1.5}
    .command-next{display:flex;align-items:center;justify-content:space-between;gap:14px}
    .command-next-copy{min-width:0}
    .command-next .btn{flex:0 0 auto;white-space:nowrap;padding:9px 12px!important}
    .command-progress-row{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:7px}
    .command-progress-row b{font-size:15px;color:#eff6fc}
    .command-progress-row span{font-size:11px;color:#8da2b6}
    .command-progress{height:6px;border-radius:99px;overflow:hidden;background:#172b3d}
    .command-progress>i{display:block;height:100%;width:0;background:var(--accent);border-radius:99px;transition:width .2s ease}

    /* Hero now explains the product instead of competing with workflow status. */
    #dash .hero{grid-template-columns:1fr!important}
    #dash .hero>article:not(.heroCard){display:none!important}
    #dash .heroCard{
      min-height:235px!important;
      padding:27px 30px!important;
      border-color:var(--border-soft)!important;
      background:linear-gradient(135deg,#0e2135,#0a1827)!important;
    }
    #dash .heroCard:after{width:3px!important;background:var(--accent)!important;box-shadow:none!important}
    #dash .heroCard h2{font-size:clamp(30px,2.6vw,39px)!important;margin:12px 0 10px!important}
    #dash .heroCard p.muted{max-width:800px;font-size:14px!important;line-height:1.7!important;margin-bottom:14px!important}
    #dash .heroCard .orb{width:155px!important;height:155px!important;min-width:155px!important;box-shadow:none!important}
    #dash .heroCard .readiness strong{font-size:29px!important}
    #dash .heroCard .readiness-bar{left:22px!important;right:22px!important;bottom:21px!important}
    #dash .hero-status-row{margin:12px 0 15px!important}
    #dash .hero-status{padding:5px 8px!important;font-size:11px!important;background:#0b1a2a!important}

    /* Workflow: keep the explanation, remove four heavy nested boxes. */
    #workflowGuide{
      padding:19px 20px!important;
      border-color:var(--border-soft)!important;
      background:#091725!important;
    }
    #workflowGuide .workflow-head{margin-bottom:14px!important}
    #workflowGuide .workflow-head h3{font-size:19px!important;margin-bottom:4px!important}
    #workflowGuide .workflow-head p{font-size:12.5px!important;line-height:1.6!important;max-width:920px!important}
    #workflowGuide .workflow-route{display:none!important}
    #workflowGuide .workflow-grid{
      display:grid!important;
      grid-template-columns:repeat(4,1fr)!important;
      gap:0!important;
      border:1px solid var(--border-soft);
      border-radius:12px;
      overflow:hidden;
    }
    #workflowGuide .workflow-step{
      min-height:142px!important;
      padding:13px 14px!important;
      border:0!important;
      border-right:1px solid var(--border-soft)!important;
      border-radius:0!important;
      background:#0b1928!important;
      transform:none!important;
    }
    #workflowGuide .workflow-step:last-child{border-right:0!important}
    #workflowGuide .workflow-step:hover{background:#102338!important}
    #workflowGuide .workflow-step p{font-size:11.5px!important;line-height:1.55!important;margin:9px 0!important}
    #workflowGuide .workflow-action{font-size:11px!important}
    #workflowGuide .workflow-tip{
      display:flex!important;
      gap:8px!important;
      margin-top:10px!important;
      padding:0!important;
      border:0!important;
      background:transparent!important;
      color:#8196aa!important;
    }

    /* Make dashboard stats read like a summary strip, not another row of cards. */
    #dash .stats{
      gap:0!important;
      border:1px solid var(--border-soft);
      border-radius:13px;
      overflow:hidden;
      background:#091725;
      margin:15px 0!important;
    }
    #dash .stats .panel{
      border:0!important;
      border-right:1px solid var(--border-soft)!important;
      border-radius:0!important;
      padding:15px 17px!important;
      background:transparent!important;
    }
    #dash .stats .panel:last-child{border-right:0!important}
    #dash .stats b{font-size:26px!important;line-height:1.2!important;margin:3px 0!important}
    #dash .stats span{color:#bdcbd8!important;font-size:12.5px!important}
    #dash .stats small{color:#8095a9!important;font-size:11px!important}

    /* More semantic states. */
    .safe,.impact-none{color:var(--success)!important}
    .review,.impact-possible{color:var(--warning)!important}
    .stop,.impact-high{color:var(--danger)!important}
    .impact-low{color:#8bc9ff!important}
    .workflow-state[data-kind="done"]{background:var(--success-soft)!important;color:var(--success)!important}
    .workflow-state[data-kind="partial"]{background:var(--warning-soft)!important;color:var(--warning)!important}
    .workflow-state[data-kind="start"],.workflow-state[data-kind="ready"]{background:var(--accent-soft)!important;color:#91ccff!important}
    .workflow-state[data-kind="locked"]{background:#1a2530!important;color:#7f91a2!important}

    /* Avoid dense border-on-border layouts in secondary screens. */
    .flow-context{border-color:var(--border-soft)!important;background:#0a1929!important}
    .filters{background:#091725!important}
    .sourceCard{border-radius:12px!important}
    .topology-note{background:#091725!important}

    @media(max-width:1050px){
      .dashboard-command{grid-template-columns:1fr 1fr}
      .command-cell:nth-child(2){border-right:0}
      .command-cell:last-child{grid-column:1/-1;border-top:1px solid var(--border-soft)}
      #workflowGuide .workflow-grid{grid-template-columns:1fr 1fr!important}
      #workflowGuide .workflow-step:nth-child(2){border-right:0!important}
      #workflowGuide .workflow-step:nth-child(-n+2){border-bottom:1px solid var(--border-soft)!important}
    }
    @media(max-width:700px){
      .dashboard-command{grid-template-columns:1fr}
      .command-cell{border-right:0!important;border-bottom:1px solid var(--border-soft)}
      .command-cell:last-child{grid-column:auto;border-bottom:0}
      .command-next{align-items:flex-start;flex-direction:column}
      .command-next .btn{width:100%}
      #dash .heroCard{padding:22px!important}
      #dash .heroCard .orb{display:none!important}
      #workflowGuide .workflow-grid{grid-template-columns:1fr!important}
      #workflowGuide .workflow-step{border-right:0!important;border-bottom:1px solid var(--border-soft)!important}
      #workflowGuide .workflow-step:last-child{border-bottom:0!important}
      #workflowGuide .workflow-tip{flex-direction:column!important}
      #dash .stats{grid-template-columns:1fr 1fr!important}
      #dash .stats .panel:nth-child(2){border-right:0!important}
      #dash .stats .panel:nth-child(-n+2){border-bottom:1px solid var(--border-soft)!important}
    }
  `;
  document.head.appendChild(style);

  const command = document.createElement('section');
  command.className = 'dashboard-command';
  command.innerHTML = `
    <div class="command-cell">
      <span class="command-label">현재 상태</span>
      <div class="command-value need" id="commandState"><i class="command-dot"></i><span>데이터 준비 필요</span></div>
      <span class="command-sub" id="commandStateSub">CIS 보고서 또는 ReadOnly AWS를 연결하세요.</span>
    </div>
    <div class="command-cell command-next">
      <div class="command-next-copy">
        <span class="command-label">다음 할 일</span>
        <div class="command-value" id="commandNext">데이터 소스 준비</div>
        <span class="command-sub" id="commandNextSub">분석할 Finding과 실제 AWS 상태를 준비합니다.</span>
      </div>
      <button class="btn primary" type="button" id="commandNextBtn">시작</button>
    </div>
    <div class="command-cell">
      <span class="command-label">진행</span>
      <div class="command-progress-row"><b id="commandProgressText">0 / 3</b><span id="commandProgressPct">0%</span></div>
      <div class="command-progress"><i id="commandProgressBar"></i></div>
      <span class="command-sub">아키텍처 출력은 선택 단계</span>
    </div>`;
  hero.before(command);

  const sourceReady = () => {
    const reportText = document.getElementById('reportStatus')?.textContent || '';
    const report = !!reportText && !/보고서 없음/.test(reportText);
    const live = !!window.SafetyCheckLive?.getSnapshot?.() || /Live AWS/i.test(document.getElementById('mode')?.textContent || '');
    return { report, live, ready: report || live };
  };

  const analyzed = () => sessionStorage.getItem('safetycheck-analysis-done') === '1' ||
    !document.getElementById('result')?.classList.contains('hidden');

  function openView(id) {
    const btn = document.querySelector(`.nav [data-v="${CSS.escape(id)}"]`);
    if (btn) btn.click();
  }

  function updateCommand() {
    const s = sourceReady();
    const done = analyzed();
    const findingReady = s.ready;

    const state = document.getElementById('commandState');
    const stateSub = document.getElementById('commandStateSub');
    const next = document.getElementById('commandNext');
    const nextSub = document.getElementById('commandNextSub');
    const nextBtn = document.getElementById('commandNextBtn');

    let completed = 0;
    if (s.ready) completed++;
    if (findingReady) completed++;
    if (done) completed++;

    if (!s.ready) {
      state.className = 'command-value need';
      state.innerHTML = '<i class="command-dot"></i><span>데이터 준비 필요</span>';
      stateSub.textContent = 'CIS 보고서 또는 ReadOnly AWS를 연결하세요.';
      next.textContent = '데이터 소스 준비';
      nextSub.textContent = '보고서를 가져오고 가능하면 ReadOnly AWS도 연결합니다.';
      nextBtn.textContent = '1단계 시작';
      nextBtn.onclick = () => openView('sources');
    } else if (!done) {
      state.className = `command-value ${s.live ? 'good' : 'partial'}`;
      state.innerHTML = `<i class="command-dot"></i><span>${s.live && s.report ? 'Report + Live 준비 완료' : s.live ? 'Live AWS 연결됨' : 'CIS 보고서 준비됨'}</span>`;
      stateSub.textContent = s.live ? '실제 AWS 상태를 반영해 분석할 수 있습니다.' : 'ReadOnly AWS를 추가하면 영향 판정 정확도가 올라갑니다.';
      next.textContent = 'Findings에서 조치 대상 선택';
      nextSub.textContent = '실패 Control과 위험도를 확인한 뒤 분석할 항목을 고릅니다.';
      nextBtn.textContent = '2단계 이동';
      nextBtn.onclick = () => openView('findings');
    } else {
      state.className = 'command-value good';
      state.innerHTML = '<i class="command-dot"></i><span>변경 영향 분석 완료</span>';
      stateSub.textContent = '필요하면 다른 Control을 추가 분석하거나 구성도를 출력하세요.';
      next.textContent = '추가 분석 또는 아키텍처 확인';
      nextSub.textContent = '결과를 검토하고 다음 변경이나 문서화 단계로 이동합니다.';
      nextBtn.textContent = s.live ? '아키텍처 보기' : '추가 분석';
      nextBtn.onclick = () => openView(s.live ? 'topology' : 'analyze');
    }

    const progressText = document.getElementById('commandProgressText');
    const progressPct = document.getElementById('commandProgressPct');
    const progressBar = document.getElementById('commandProgressBar');
    const pct = Math.round((completed / 3) * 100);
    if (progressText) progressText.textContent = `${completed} / 3`;
    if (progressPct) progressPct.textContent = `${pct}%`;
    if (progressBar) progressBar.style.width = `${pct}%`;

    const heroStart = document.getElementById('start');
    if (heroStart) {
      if (!s.ready) {
        heroStart.textContent = '데이터 준비 시작';
        heroStart.onclick = () => openView('sources');
      } else {
        heroStart.textContent = 'Findings 확인';
        heroStart.onclick = () => openView('findings');
      }
    }
  }

  const observe = el => el && new MutationObserver(updateCommand).observe(el, {childList:true,subtree:true,characterData:true,attributes:true});
  observe(document.getElementById('reportStatus'));
  observe(document.getElementById('mode'));
  observe(document.getElementById('result'));
  document.addEventListener('safetycheck:live-applied', updateCommand);
  document.addEventListener('safetycheck:report-loaded', updateCommand);
  document.getElementById('run')?.addEventListener('click', () => setTimeout(updateCommand, 80));

  updateCommand();
})();
