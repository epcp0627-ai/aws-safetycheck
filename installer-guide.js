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
    const p = document.createElement('p');
    p.className = 'installer-policy-note';
    p.innerHTML = '<b>설치 담당자 권한:</b> 이 JSON은 <code>aws-safetycheck-readonly</code> 스택과 <code>SafetyCheckReadOnlyRole</code>만 생성·업데이트·삭제할 수 있게 제한한 설치용 정책입니다. SafetyCheck 런타임 Role 자체에는 생성·수정·삭제 권한이 없습니다.';
    guide.appendChild(p);
  }

  const style = document.createElement('style');
  style.textContent = `.installer-policy-note{margin-top:12px!important;padding-top:10px;border-top:1px solid #213653;font-size:12px!important;line-height:1.55}.installer-policy-note code{color:#9cd2ff}`;
  document.head.appendChild(style);
})();
