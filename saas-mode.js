(() => {
  const SERVICE_ACCOUNT_ID = '369503741621';
  const ROLE_TEMPLATE = './infra/customer-readonly-role.yaml';
  const INSTALL_REGION = 'ap-northeast-1';
  const STACK_NAME = 'aws-safetycheck-readonly';
  const dlg = document.getElementById('awsDlg');
  const testBtn = document.getElementById('test');
  if (!dlg || !testBtn) return;

  const external = document.getElementById('externalId');
  const role = document.getElementById('roleArn');
  if (external) external.placeholder = 'ReadOnly Role 스택에 입력한 External ID';
  if (role) role.placeholder = 'CloudFormation 출력의 RoleArn';

  const randomExternalId = () => {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    return 'sc-' + [...bytes].map(v => v.toString(16).padStart(2,'0')).join('');
  };

  const ensureExternalId = () => {
    if (!external) return '';
    if (!external.value.trim()) external.value = randomExternalId();
    return external.value.trim();
  };

  const cloudFormationCreateUrl = `https://${INSTALL_REGION}.console.aws.amazon.com/cloudformation/home?region=${INSTALL_REGION}#/stacks/create/template`;

  async function downloadTailoredTemplate(externalId) {
    const res = await fetch(ROLE_TEMPLATE, { cache:'no-store' });
    if (!res.ok) throw new Error(`YAML 다운로드 실패: HTTP ${res.status}`);
    let text = await res.text();
    const marker = '  ExternalId:\n    Type: String\n';
    if (!text.includes(marker)) throw new Error('ExternalId 파라미터 위치를 찾지 못했습니다.');
    text = text.replace(marker, `  ExternalId:\n    Type: String\n    Default: '${externalId}'\n`);
    const blob = new Blob([text], { type:'text/yaml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customer-readonly-role.yaml';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  const guide = document.createElement('div');
  guide.className = 'saas-connect-guide';
  guide.innerHTML = `
    <div class="saas-label">SHARED SAAS MODE</div>
    <h4>고객 AWS에는 ReadOnly Role 하나만 설치합니다</h4>
    <p class="saas-desc">
      API Gateway와 Lambda는 SafetyCheck 운영 계정에 이미 구성되어 있습니다.<br>
      고객 AWS에는 별도의 서비스 스택을 만들 필요가 없습니다.
    </p>

    <div class="saas-quick">
      <div>
        <strong>빠른 설치</strong>
        <small>External ID가 자동 입력된 전용 YAML을 내려받고 CloudFormation 새 스택 화면을 바로 엽니다.</small>
      </div>
      <button type="button" class="btn primary" id="quickInstall">CloudFormation 설치 시작</button>
    </div>

    <div class="saas-steps">
      <div class="saas-step"><b>1</b><div><strong>전용 YAML 자동 생성</strong><small>현재 External ID를 YAML 기본값에 자동 반영</small></div></div>
      <div class="saas-step"><b>2</b><div><strong>CloudFormation 업로드</strong><small>다운로드된 YAML 선택 · 스택 이름 ${STACK_NAME}</small></div></div>
      <div class="saas-step"><b>3</b><div><strong>RoleArn 확인</strong><small>스택 생성 완료 후 Outputs의 RoleArn 복사</small></div></div>
      <div class="saas-step"><b>4</b><div><strong>연결 및 자동 분석</strong><small>RoleArn을 붙여넣고 연결 실행</small></div></div>
    </div>

    <div class="saas-actions">
      <a class="btn" href="${ROLE_TEMPLATE}" download="customer-readonly-role.yaml">원본 YAML 받기</a>
      <button type="button" class="btn" id="genExternalId">External ID 새로 생성</button>
      <button type="button" class="btn" id="copyExternalId">External ID 복사</button>
    </div>

    <div class="saas-account-box">
      <span>SafetyCheckAccountId</span>
      <code>${SERVICE_ACCOUNT_ID}</code>
      <small>원본 YAML과 전용 YAML 모두 기본값으로 이미 입력되어 있습니다.</small>
    </div>`;

  const notice = dlg.querySelector('.notice');
  if (notice) {
    notice.innerHTML = '연결에 필요한 값은 <b>RoleArn</b>과 <b>External ID</b> 두 가지입니다.<br>Access Key와 API Access Token은 요구하거나 저장하지 않습니다.';
    notice.after(guide);
  } else {
    dlg.querySelector('.modal')?.prepend(guide);
  }

  const quickBtn = document.getElementById('quickInstall');
  const genBtn = document.getElementById('genExternalId');
  const copyBtn = document.getElementById('copyExternalId');

  if (quickBtn) quickBtn.onclick = async () => {
    const externalId = ensureExternalId();
    if (!externalId) return alert('External ID 입력란을 찾지 못했습니다.');
    const old = quickBtn.textContent;
    quickBtn.disabled = true;
    quickBtn.textContent = '설치 파일 준비 중...';
    try {
      await downloadTailoredTemplate(externalId);
      window.open(cloudFormationCreateUrl, '_blank', 'noopener');
      alert(`customer-readonly-role.yaml을 다운로드했습니다.\n\nCloudFormation에서:\n1. Upload a template file 선택\n2. 방금 받은 YAML 업로드\n3. 스택 이름: ${STACK_NAME}\n4. IAM 리소스 생성 승인 후 생성\n\nExternal ID와 SafetyCheckAccountId는 YAML에 이미 입력되어 있습니다.`);
    } catch (e) {
      alert(`설치 준비 실패: ${e.message}`);
    } finally {
      quickBtn.disabled = false;
      quickBtn.textContent = old;
    }
  };

  if (genBtn) genBtn.onclick = () => {
    if (external) external.value = randomExternalId();
  };

  if (copyBtn) copyBtn.onclick = async () => {
    const value = ensureExternalId();
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      const old = copyBtn.textContent;
      copyBtn.textContent = '복사됨';
      setTimeout(() => copyBtn.textContent = old, 1200);
    } catch (_) {
      external?.select();
    }
  };

  const openButtons = [document.getElementById('connect'), document.getElementById('sourceConnect')].filter(Boolean);
  openButtons.forEach(btn => btn.addEventListener('click', () => {
    setTimeout(() => ensureExternalId(), 0);
  }));

  const sourceConnect = document.getElementById('sourceConnect');
  const card = sourceConnect?.closest('.sourceCard');
  if (card) {
    const title = card.querySelector('h3');
    const para = card.querySelector('p.muted');
    const list = card.querySelector('ul');
    if (title) title.textContent = 'ReadOnly AWS 계정 연결';
    if (para) para.innerHTML = '고객 AWS에는 <b>ReadOnly IAM Role 1개</b>만 생성합니다.';
    if (list) list.innerHTML = `
      <li>전용 YAML 자동 생성으로 설치 입력 최소화</li>
      <li>RoleArn + External ID로 STS AssumeRole</li>
      <li>단일 리전 또는 활성 리전 전체 ReadOnly 분석</li>
      <li>CIS 보고서 + 실제 AWS 상태 + 아키텍처 인벤토리 결합</li>`;
    const tails = [...card.querySelectorAll('p.muted')];
    const tail = tails[tails.length - 1];
    if (tail) tail.innerHTML = 'SafetyCheck Role에는 <b>리소스 생성·수정·삭제 권한이 없습니다.</b>';
  }

  const style = document.createElement('style');
  style.textContent = `
    .saas-connect-guide{margin:18px 0 20px;padding:20px;border:1px solid #2f5278;border-radius:14px;background:#081a2c}
    .saas-connect-guide h4{margin:7px 0 8px;font-size:18px;line-height:1.45;color:#f1f6fb}
    .saas-desc{margin:0 0 16px!important;color:#a9bbcf!important;font-size:14px!important;line-height:1.75!important}
    .saas-label{font-size:10px;font-weight:900;letter-spacing:.14em;color:#62d69a}
    .saas-quick{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:14px 0 16px;padding:14px 15px;border:1px solid #31577b;border-radius:12px;background:linear-gradient(135deg,#0d2238,#0a1828)}
    .saas-quick strong{display:block;font-size:14px;color:#edf5ff;margin-bottom:4px}
    .saas-quick small{display:block;color:#9eb2c8;font-size:11px;line-height:1.55;max-width:350px}
    .saas-quick .btn{flex:0 0 auto;white-space:nowrap;padding:10px 14px}
    .saas-steps{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:16px 0 18px}
    .saas-step{display:flex;align-items:flex-start;gap:10px;padding:13px 14px;border:1px solid #213653;border-radius:11px;background:#0b1727;min-height:72px}
    .saas-step>b{flex:0 0 25px;display:grid;place-items:center;width:25px;height:25px;border-radius:50%;background:#173a5d;color:#9cd2ff;font-size:12px}
    .saas-step strong{display:block;font-size:13px;line-height:1.4;color:#e6eef7;margin-bottom:4px}
    .saas-step small{display:block;color:#91a5bd;font-size:11px;line-height:1.5}
    .saas-actions{display:flex;flex-wrap:wrap;gap:9px;margin:4px 0 16px}
    .saas-actions .btn{font-size:12px;text-decoration:none;padding:9px 12px}
    .saas-account-box{padding:12px 14px;border:1px solid #213653;border-radius:10px;background:#07131f}
    .saas-account-box span{display:block;font-size:11px;color:#91a5bd;margin-bottom:5px}
    .saas-account-box code{display:block;font-size:14px;color:#9cd2ff;margin-bottom:6px;word-break:break-all}
    .saas-account-box small{display:block;color:#91a5bd;line-height:1.55}
    #awsDlg .notice{line-height:1.65!important}
    @media(max-width:650px){.saas-steps{grid-template-columns:1fr}.saas-connect-guide{padding:16px}.saas-quick{align-items:stretch;flex-direction:column}.saas-quick .btn{width:100%}}
  `;
  document.head.appendChild(style);
})();