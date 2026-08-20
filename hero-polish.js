(() => {
  const hero = document.querySelector('#dash .heroCard');
  const orb = hero?.querySelector('.orb');
  if (!hero || !orb) return;

  const style = document.createElement('style');
  style.textContent = `
    #dash .heroCard{
      position:relative;
      isolation:isolate;
      min-height:320px;
      padding:34px 36px;
      background:
        radial-gradient(circle at 82% 28%,rgba(75,145,255,.18),transparent 28%),
        linear-gradient(135deg,rgba(18,43,72,.98),rgba(8,24,42,.98));
      border-color:#2b4e75;
      overflow:hidden;
    }
    #dash .heroCard:before{
      content:"";
      position:absolute;
      inset:auto -80px -120px auto;
      width:300px;height:300px;border-radius:50%;
      background:radial-gradient(circle,rgba(88,169,255,.16),transparent 68%);
      z-index:-1;
    }
    #dash .heroCard:after{
      content:"";
      position:absolute;
      left:0;top:0;bottom:0;width:4px;
      background:linear-gradient(180deg,#5fb4ff,#6c69ff);
      box-shadow:0 0 28px rgba(88,169,255,.45);
    }
    #dash .heroCard h2{
      max-width:720px;
      font-size:clamp(34px,3.1vw,48px)!important;
      letter-spacing:-.035em;
      line-height:1.14!important;
      margin:16px 0 13px!important;
    }
    #dash .heroCard p.muted{
      max-width:760px;
      font-size:16px!important;
      line-height:1.7!important;
      color:#b7c9dc!important;
      margin-bottom:20px;
    }
    #dash .heroCard .sev{
      display:inline-flex;align-items:center;gap:7px;
      padding:7px 11px!important;
      font-size:11px!important;
      letter-spacing:.02em;
      border:1px solid rgba(93,174,255,.28);
      background:rgba(64,137,220,.13);
      color:#a8d9ff;
    }
    #dash .heroCard .sev:before{content:"●";font-size:8px;color:#67d7a0}
    .hero-status-row{display:flex;gap:8px;flex-wrap:wrap;margin:18px 0 22px}
    .hero-status{
      display:flex;align-items:center;gap:7px;
      border:1px solid #294563;background:rgba(7,22,38,.62);
      color:#9fb4ca;border-radius:999px;padding:7px 10px;font-size:12px;font-weight:700;
    }
    .hero-status i{width:7px;height:7px;border-radius:50%;background:#49647f;box-shadow:0 0 0 3px rgba(73,100,127,.12)}
    .hero-status.on{color:#d8f6e7;border-color:rgba(98,214,154,.35);background:rgba(98,214,154,.08)}
    .hero-status.on i{background:#62d69a;box-shadow:0 0 0 3px rgba(98,214,154,.12)}
    .hero-status.partial{color:#d9ecff;border-color:rgba(88,169,255,.35);background:rgba(88,169,255,.08)}
    .hero-status.partial i{background:#58a9ff;box-shadow:0 0 0 3px rgba(88,169,255,.12)}
    #dash .heroCard .btn.primary{
      padding:12px 17px!important;border-radius:11px!important;font-size:14px!important;
      box-shadow:0 10px 26px rgba(51,105,224,.25);
    }
    #dash .heroCard .orb{
      width:218px!important;height:218px!important;min-width:218px;
      border:1px solid rgba(92,172,255,.5)!important;
      background:radial-gradient(circle at 50% 42%,rgba(51,102,177,.24),rgba(7,21,38,.88) 67%);
      box-shadow:inset 0 0 0 18px rgba(8,26,47,.72),0 0 50px rgba(57,133,215,.15)!important;
      position:relative;
    }
    #dash .heroCard .orb:before,
    #dash .heroCard .orb:after{
      content:"";position:absolute;border-radius:50%;border:1px solid rgba(94,172,255,.15)
    }
    #dash .heroCard .orb:before{inset:13px}
    #dash .heroCard .orb:after{inset:33px;border-style:dashed}
    .readiness{position:relative;z-index:2;text-align:center;display:grid;gap:1px}
    .readiness small{font-size:11px;color:#91a9c1;font-weight:800;letter-spacing:.08em}
    .readiness strong{font-size:39px;line-height:1.08;letter-spacing:-.04em}
    .readiness span{font-size:11px;color:#a9bed2}
    .readiness-bar{position:absolute;left:26px;right:26px;bottom:26px;height:4px;background:#18324c;border-radius:99px;overflow:hidden;z-index:3}
    .readiness-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#58a9ff,#62d69a);transition:width .35s ease}
    @media(max-width:900px){#dash .heroCard{padding:28px}.hero-status-row{margin-bottom:18px}#dash .heroCard .orb{width:180px!important;height:180px!important;min-width:180px}.readiness strong{font-size:32px}}
    @media(max-width:700px){#dash .heroCard{min-height:auto}.hero-status-row{display:grid;grid-template-columns:1fr 1fr}#dash .heroCard .orb{display:none!important}}
  `;
  document.head.appendChild(style);

  const textBlock = hero.firstElementChild;
  if (textBlock && !textBlock.querySelector('.hero-status-row')) {
    const statusRow = document.createElement('div');
    statusRow.className = 'hero-status-row';
    statusRow.innerHTML = `
      <span class="hero-status" id="heroCis"><i></i>CIS Finding</span>
      <span class="hero-status" id="heroAws"><i></i>AWS ReadOnly</span>
      <span class="hero-status partial" id="heroCost"><i></i>비용 영향 분석</span>`;
    const btn = textBlock.querySelector('.btn.primary');
    btn?.before(statusRow);
  }

  orb.innerHTML = `
    <div class="readiness">
      <small>ANALYSIS READY</small>
      <strong id="readinessScore">30%</strong>
      <span id="readinessText">기본 분석 준비</span>
    </div>
    <div class="readiness-bar"><i id="readinessFill"></i></div>`;

  const hasReport = () => {
    const s = document.getElementById('reportStatus')?.textContent || '';
    return !!s && !/보고서 없음/.test(s);
  };
  const hasLive = () => sessionStorage.getItem('safetycheck-live') === '1' || /Live AWS/i.test(document.getElementById('mode')?.textContent || '');

  function update() {
    const report = hasReport();
    const live = hasLive();
    if (live) sessionStorage.setItem('safetycheck-live','1');
    let score = 30, label = '기본 분석 준비';
    if (report && !live) { score = 62; label = 'CIS 보고서 반영'; }
    if (!report && live) { score = 78; label = '실제 리소스 연결'; }
    if (report && live) { score = 100; label = '정밀 분석 준비 완료'; }

    const scoreEl = document.getElementById('readinessScore');
    const textEl = document.getElementById('readinessText');
    const fillEl = document.getElementById('readinessFill');
    if (scoreEl) scoreEl.textContent = `${score}%`;
    if (textEl) textEl.textContent = label;
    if (fillEl) fillEl.style.width = `${score}%`;
    document.getElementById('heroCis')?.classList.toggle('on', report);
    document.getElementById('heroAws')?.classList.toggle('on', live);
    document.getElementById('heroCost')?.classList.toggle('on', report && live);
  }

  const targets = [document.getElementById('reportStatus'), document.getElementById('mode')].filter(Boolean);
  const obs = new MutationObserver(update);
  targets.forEach(t => obs.observe(t,{childList:true,subtree:true,characterData:true}));
  update();
})();
