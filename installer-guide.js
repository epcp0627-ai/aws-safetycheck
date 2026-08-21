(() => {
  const actions = document.querySelector('.saas-extra-actions');
  if (!actions || document.getElementById('installerPolicyLink')) return;

  const link = document.createElement('a');
  link.id = 'installerPolicyLink';
  link.href = './infra/customer-installer-policy.json';
  link.download = 'customer-installer-policy.json';
  link.textContent = '설치 최소권한 JSON';
  actions.appendChild(link);
})();
