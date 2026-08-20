(() => {
  const actions = document.querySelector('.saas-actions');
  if (!actions || document.getElementById('installerPolicyLink')) return;

  const link = document.createElement('a');
  link.id = 'installerPolicyLink';
  link.className = 'btn';
  link.href = './infra/customer-installer-policy.json';
  link.download = 'customer-installer-policy.json';
  link.textContent = '설치 최소권한 JSON';
  actions.prepend(link);

  const guide = document.querySelector('.saas-connect-guide');
  if (guide) {
    const box = document.createElement('div');
    box.className = 'installer-policy-note';
    box.innerHTML = `
      <div class="installer-note-title">설치 담당자에게 필요한 권한</div>
      <p>
        이 JSON은 <code>aws-safetycheck-readonly</code> 스택과<br>
        <code>SafetyCheckReadOnlyRole</code>만 관리할 수 있도록 제한한 설치용 정책입니다.
      </p>
      <div class="installer-note-grid">
        <div><span>설치 담당자</span><b>스택 / IAM Role 생성 가능</b></div>
        <div><span>SafetyCheck 런타임 Role</span><b>조회 전용 · 수정/삭제 불가</b></div>
      </div>
      <small>설치가 끝난 뒤에는 설치 담당자의 해당 임시 권한을 제거해도 SafetyCheck 분석에는 영향이 없습니다.</small>`;
    guide.appendChild(box);
  }

  const style = document.createElement('style');
  style.textContent = `
    .installer-policy-note{margin-top:16px;padding:15px 0 0;border-top:1px solid #213653}
    .installer-note-title{font-size:13px;font-weight:800;color:#dce8f4;margin-bottom:7px}
    .installer-policy-note p{margin:0 0 12px!important;font-size:12px!important;line-height:1.7!important;color:#9fb2c6!important}
    .installer-policy-note code{color:#9cd2ff;background:#0c2238;padding:2px 5px;border-radius:5px}
    .installer-note-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}
    .installer-note-grid div{padding:10px 11px;border:1px solid #213653;border-radius:9px;background:#07131f}
    .installer-note-grid span{display:block;font-size:10px;color:#7f93a9;margin-bottom:3px}
    .installer-note-grid b{display:block;font-size:11px;color:#d5e0ec;line-height:1.45}
    .installer-policy-note>small{display:block;font-size:10px;color:#8195aa;line-height:1.55}
    @media(max-width:650px){.installer-note-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);
})();
