(() => {
  const SERVICE_ACCOUNT_ID = '369503741621';
  const ROLE_TEMPLATE = './infra/customer-readonly-role.yaml';
  const dlg = document.getElementById('awsDlg');
  const testBtn = document.getElementById('test');
  if (!dlg || !testBtn) return;

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
    <strong>고객 AWS에는 ReadOnly Role 하나만 설치합니다.</strong>
    <p>API Gateway와 Lambda는 SafetyCheck 운영 계정에 이미 구성되어 있습니다. 고객은 서비스 스택을 만들 필요가 없습니다.</p>
    <div class="saas-steps">
      <span><b>1</b> External ID 준비</span>
      <span><b>2</b> ReadOnly YAML 배포</span>
      <span><b>3</b> RoleArn 입력</span>
      <span><b>4</b> 연결 및 자동 분석</span>
    </div>
    <div class="saas-actions">
      <a class="btn" href="${ROLE_TEMPLATE}" download="customer-readonly-role.yaml">ReadOnly YAML 받기</a>
      <button type="button" class="btn" id="genExternalId">External ID 생성</button>
      <button type="button" class="btn" id="copyExternalId">External ID 복사</button>
    </div>
    <small>SafetyCheckAccountId는 템플릿에 기본값 ${SERVICE_ACCOUNT_ID}로 이미 입력되어 있습니다.</small>`;

  const notice = dlg.querySelector('.notice');
  if (notice) {
    notice.textContent = 'RoleArn과 External ID만으로 연결합니다. Access Key를 요구하거나 저장하지 않습니다.';
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
    if (para) para.textContent = '고객 계정에는 customer-readonly-role.yaml 한 개만 배포합니다.';
    if (list) list.innerHTML = `
      <li>SafetyCheck 공용 API/Lambda는 이미 운영됨</li>
      <li>고객 AWS에는 ReadOnly IAM Role만 생성</li>
      <li>RoleArn + External ID로 STS AssumeRole</li>
      <li>CIS 보고서와 실제 리소스 상태를 자동 결합 분석</li>`;
    const tails = [...card.querySelectorAll('p.muted')];
    const tail = tails[tails.length - 1];
    if (tail) tail.textContent = '리소스 생성·수정·삭제 권한은 포함하지 않습니다.';
  }

  const style = document.createElement('style');
  style.textContent = `
    .saas-connect-guide{margin:14px 0 18px;padding:16px;border:1px solid #2f5278;border-radius:13px;background:#081a2c}
    .saas-connect-guide strong{display:block;font-size:16px;margin:5px 0 4px}
    .saas-connect-guide p{margin:0 0 12px;color:#a9bbcf;font-size:13px}
    .saas-label{font-size:10px;font-weight:900;letter-spacing:.14em;color:#62d69a}
    .saas-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:12px 0}
    .saas-steps span{padding:9px;border:1px solid #213653;border-radius:9px;background:#0b1727;font-size:11px;color:#cbd9e7}
    .saas-steps b{display:inline-grid;place-items:center;width:19px;height:19px;border-radius:99px;background:#173a5d;color:#9cd2ff;margin-right:4px}
    .saas-actions{display:flex;flex-wrap:wrap;gap:7px;margin:10px 0}
    .saas-actions .btn{font-size:12px;text-decoration:none}
    .saas-connect-guide small{color:#91a5bd}
    @media(max-width:650px){.saas-steps{grid-template-columns:1fr 1fr}}
  `;
  document.head.appendChild(style);
})();