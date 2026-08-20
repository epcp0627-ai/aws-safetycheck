(() => {
  const SERVICE_ACCOUNT_ID = '369503741621';
  const ROLE_TEMPLATE = './infra/customer-readonly-role.yaml';
  const SERVICE_API_HOST = 'c6o05b2a9i.execute-api.us-east-1.amazonaws.com';
  const dlg = document.getElementById('awsDlg');
  const testBtn = document.getElementById('test');
  if (!dlg || !testBtn) return;

  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    const url = typeof input === 'string' ? input : (input?.url || '');
    if (url.includes(SERVICE_API_HOST)) {
      const headers = new Headers(init.headers || {});
      headers.delete('x-safetycheck-token');
      headers.delete('X-SafetyCheck-Token');
      init = { ...init, headers };
    }
    return nativeFetch(input, init);
  };

  const token = document.getElementById('accessToken');
  if (token) {
    token.value = 'shared-saas-service';
    const label = token.closest('label');
    if (label) label.style.display = 'none';
  }

  const external = document.getElementById('externalId');
  const role = document.getElementById('roleArn');
  if (external) external.placeholder = 'ReadOnly Role 스택에 입력한 External ID';
  if (role) role.placeholder = 'CloudFormation 출력의 RoleArn';

  const randomExternalId = () => {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    return 'sc-' + [...bytes].map(v => v.toString(16).padStart(2,'0')).join('');
  };

  const guide = document.createElement('div');
  guide.className = 'saas-connect-guide';
  guide.innerHTML = `
    <div class="saas-label">SHARED SAAS MODE</div>
    <h4>고객 AWS에는 ReadOnly Role 하나만 설치합니다</h4>
    <p class="saas-desc">
      API Gateway와 Lambda는 SafetyCheck 운영 계정에 이미 구성되어 있습니다.<br>
      고객 AWS에는 별도의 서비스 스택을 만들 필요가 없습니다.
    </p>

    <div class="saas-steps">
      <div class="saas-step"><b>1</b><div><strong>External ID 준비</strong><small>사이트에서 생성하거나 직접 24자 이상 값 준비</small></div></div>
      <div class="saas-step"><b>2</b><div><strong>ReadOnly YAML 배포</strong><small>고객 AWS CloudFormation에 업로드</small></div></div>
      <div class="saas-step"><b>3</b><div><strong>RoleArn 확인</strong><small>스택 Outputs의 RoleArn 복사</small></div></div>
      <div class="saas-step"><b>4</b><div><strong>연결 및 자동 분석</strong><small>RoleArn + External ID 입력 후 연결</small></div></div>
    </div>

    <div class="saas-actions">
      <a class="btn" href="${ROLE_TEMPLATE}" download="customer-readonly-role.yaml">ReadOnly YAML 받기</a>
      <button type="button" class="btn" id="genExternalId">External ID 생성</button>
      <button type="button" class="btn" id="copyExternalId">External ID 복사</button>
    </div>

    <div class="saas-account-box">
      <span>SafetyCheckAccountId</span>
      <code>${SERVICE_ACCOUNT_ID}</code>
      <small>customer-readonly-role.yaml에 기본값으로 이미 입력되어 있으므로 그대로 사용하면 됩니다.</small>
    </div>`;

  const notice = dlg.querySelector('.notice');
  if (notice) {
    notice.innerHTML = '연결에 필요한 값은 <b>RoleArn</b>과 <b>External ID</b> 두 가지입니다.<br>Access Key는 요구하거나 저장하지 않습니다.';
    notice.after(guide);
  } else {
    dlg.querySelector('.modal')?.prepend(guide);
  }

  const genBtn = document.getElementById('genExternalId');
  const copyBtn = document.getElementById('copyExternalId');
  if (genBtn) genBtn.onclick = () => {
    if (external) external.value = randomExternalId();
  };
  if (copyBtn) copyBtn.onclick = async () => {
    if (!external?.value) external.value = randomExternalId();
    try {
      await navigator.clipboard.writeText(external.value);
      const old = copyBtn.textContent;
      copyBtn.textContent = '복사됨';
      setTimeout(() => copyBtn.textContent = old, 1200);
    } catch (_) {
      external?.select();
    }
  };

  const openButtons = [document.getElementById('connect'), document.getElementById('sourceConnect')].filter(Boolean);
  openButtons.forEach(btn => btn.addEventListener('click', () => {
    setTimeout(() => { if (external && !external.value) external.value = randomExternalId(); }, 0);
  }));

  const sourceConnect = document.getElementById('sourceConnect');
  const card = sourceConnect?.closest('.sourceCard');
  if (card) {
    const title = card.querySelector('h3');
    const para = card.querySelector('p.muted');
    const list = card.querySelector('ul');
    if (title) title.textContent = 'ReadOnly AWS 계정 연결';
    if (para) para.innerHTML = '고객 AWS에는 <b>customer-readonly-role.yaml</b> 한 개만 배포합니다.';
    if (list) list.innerHTML = `
      <li>SafetyCheck 공용 API / Lambda는 운영 계정에 이미 구성</li>
      <li>고객 AWS에는 ReadOnly IAM Role만 생성</li>
      <li>RoleArn + External ID로 STS AssumeRole</li>
      <li>CIS 보고서와 실제 AWS 상태를 자동 결합 분석</li>`;
    const tails = [...card.querySelectorAll('p.muted')];
    const tail = tails[tails.length - 1];
    if (tail) tail.innerHTML = 'SafetyCheck Role에는 <b>리소스 생성·수정·삭제 권한이 없습니다.</b>';
  }

  const style = document.createElement('style');
  style.textContent = `
    .saas-connect-guide{margin:18px 0 20px;padding:20px;border:1px solid #2f5278;border-radius:14px;background:#081a2c}
    .saas-connect-guide h4{margin:7px 0 8px;font-size:18px;line-height:1.45;color:#f1f6fb}
    .saas-desc{margin:0 0 18px!important;color:#a9bbcf!important;font-size:14px!important;line-height:1.75!important}
    .saas-label{font-size:10px;font-weight:900;letter-spacing:.14em;color:#62d69a}
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
    @media(max-width:650px){.saas-steps{grid-template-columns:1fr}.saas-connect-guide{padding:16px}}
  `;
  document.head.appendChild(style);
})();