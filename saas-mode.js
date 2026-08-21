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
  if (external) external.placeholder = 'CloudFormation에 사용한 External ID';
  if (role) role.placeholder = 'CloudFormation Outputs의 RoleArn';

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
  guide.className = 'saas-connect-guide compact';
  guide.innerHTML = `
    <div class="saas-connect-top">
      <div>
        <b>처음 연결이라면</b>
        <span>ReadOnly Role을 한 번 설치한 뒤 RoleArn만 가져오면 됩니다.</span>
      </div>
      <button type="button" class="btn primary" id="quickInstall">ReadOnly Role 설치 준비</button>
    </div>
    <div class="saas-mini-flow"><span>1 YAML 받기</span><i>→</i><span>2 CloudFormation 생성</span><i>→</i><span>3 RoleArn 붙여넣기</span></div>
    <div class="saas-install-status" id="saasInstallStatus"></div>
    <details class="saas-more">
      <summary>설치 옵션 / 권한 정보</summary>
      <div class="saas-extra-actions">
        <a href="${ROLE_TEMPLATE}" download="customer-readonly-role.yaml">원본 YAML</a>
        <button type="button" id="genExternalId">External ID 새로 생성</button>
        <button type="button" id="copyExternalId">External ID 복사</button>
      </div>
      <small>SafetyCheckAccountId ${SERVICE_ACCOUNT_ID} · 런타임 Role은 조회 전용이며 리소스를 생성·수정·삭제하지 않습니다.</small>
    </details>`;

  const notice = dlg.querySelector('.notice');
  if (notice) {
    notice.innerHTML = '<b>RoleArn + External ID</b>만 있으면 연결됩니다. Access Key는 사용하지 않습니다.';
    notice.after(guide);
  } else {
    dlg.querySelector('.modal')?.prepend(guide);
  }

  const quickBtn = document.getElementById('quickInstall');
  const genBtn = document.getElementById('genExternalId');
  const copyBtn = document.getElementById('copyExternalId');
  const status = document.getElementById('saasInstallStatus');

  if (quickBtn) quickBtn.onclick = async () => {
    const externalId = ensureExternalId();
    if (!externalId) return alert('External ID 입력란을 찾지 못했습니다.');
    const old = quickBtn.textContent;
    quickBtn.disabled = true;
    quickBtn.textContent = '설치 파일 준비 중...';
    if (status) status.textContent = '';
    try {
      await downloadTailoredTemplate(externalId);
      window.open(cloudFormationCreateUrl, '_blank', 'noopener');
      if (status) status.innerHTML = `YAML 다운로드 완료 · CloudFormation에서 파일을 업로드하고 <b>${STACK_NAME}</b> 스택을 생성하세요.`;
    } catch (e) {
      if (status) status.textContent = `설치 준비 실패: ${e.message}`;
      else alert(`설치 준비 실패: ${e.message}`);
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
    if (para) para.textContent = '고객 AWS에는 ReadOnly IAM Role 1개만 생성합니다.';
    if (list) list.innerHTML = `
      <li>RoleArn + External ID로 연결</li>
      <li>리소스 메타데이터만 ReadOnly 조회</li>
      <li>CIS Findings와 실제 AWS 상태 결합 분석</li>`;
    const tails = [...card.querySelectorAll('p.muted')];
    const tail = tails[tails.length - 1];
    if (tail) tail.innerHTML = '<b>생성·수정·삭제 권한은 없습니다.</b>';
  }

  const style = document.createElement('style');
  style.textContent = `
    .saas-connect-guide.compact{margin:12px 0 14px;padding:14px 15px;border:1px solid #2b4c6d;border-radius:12px;background:#081a2c}
    .saas-connect-top{display:flex;align-items:center;justify-content:space-between;gap:14px}
    .saas-connect-top b{display:block;font-size:13px;color:#edf5ff;margin-bottom:3px}
    .saas-connect-top span{display:block;color:#91a5bd;font-size:11px;line-height:1.45}
    .saas-connect-top .btn{flex:0 0 auto;white-space:nowrap;padding:9px 12px;font-size:11px}
    .saas-mini-flow{display:flex;align-items:center;gap:7px;margin-top:11px;color:#8fa5ba;font-size:10px;flex-wrap:wrap}
    .saas-mini-flow span{padding:5px 7px;border:1px solid #203853;border-radius:7px;background:#091624}
    .saas-mini-flow i{font-style:normal;color:#517395}
    .saas-install-status{min-height:0;margin-top:8px;color:#8fcca9;font-size:10px;line-height:1.5}
    .saas-install-status:empty{display:none}
    .saas-more{margin-top:9px;border-top:1px solid #1d344d;padding-top:8px}
    .saas-more summary{cursor:pointer;color:#7f97ad;font-size:10px;user-select:none}
    .saas-extra-actions{display:flex;flex-wrap:wrap;gap:10px;margin:9px 0 7px}
    .saas-extra-actions a,.saas-extra-actions button{appearance:none;border:0;background:none;padding:0;color:#8dc8ff;font:inherit;font-size:10px;cursor:pointer;text-decoration:none}
    .saas-more>small{display:block;color:#758a9f;font-size:9px;line-height:1.5}
    #awsDlg .notice{padding:9px 11px!important;font-size:11px;line-height:1.5!important}
    @media(max-width:650px){.saas-connect-top{align-items:stretch;flex-direction:column}.saas-connect-top .btn{width:100%}.saas-mini-flow i{display:none}}
  `;
  document.head.appendChild(style);
})();