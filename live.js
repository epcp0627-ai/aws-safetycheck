(() => {
  const API_URL = 'https://c6o05b2a9i.execute-api.us-east-1.amazonaws.com/analyze';
  const dlg = document.getElementById('awsDlg');
  const testBtn = document.getElementById('test');
  if (!dlg || !testBtn) return;

  const inputs = dlg.querySelectorAll('input');
  const roleInput = inputs[0];
  const externalInput = inputs[1];
  if (roleInput) {
    roleInput.id = 'roleArn';
    roleInput.value = '';
    roleInput.placeholder = 'arn:aws:iam::123456789012:role/SafetyCheckReadOnlyRole';
  }
  if (externalInput) {
    externalInput.id = 'externalId';
    externalInput.value = '';
    externalInput.type = 'password';
    externalInput.placeholder = 'ReadOnly Role 생성 시 입력한 External ID';
  }

  if (!document.getElementById('accessToken')) {
    const label = document.createElement('label');
    label.innerHTML = 'API Access Token<input id="accessToken" type="password" autocomplete="off" placeholder="서비스 스택 업데이트 시 입력한 ApiAccessToken">';
    testBtn.before(label);
  }

  const notice = dlg.querySelector('.notice');
  if (notice) {
    notice.textContent = 'Live ReadOnly 연결입니다. 입력값은 이 페이지에서 API 호출에만 사용하며 GitHub 저장소에는 저장하지 않습니다.';
  }

  testBtn.onclick = async () => {
    const roleArn = document.getElementById('roleArn')?.value.trim();
    const externalId = document.getElementById('externalId')?.value.trim();
    const token = document.getElementById('accessToken')?.value.trim();
    if (!roleArn || !externalId || !token) {
      alert('Role ARN, External ID, API Access Token을 모두 입력해 주세요.');
      return;
    }

    const oldText = testBtn.textContent;
    testBtn.disabled = true;
    testBtn.textContent = '연결 확인 중...';
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-safetycheck-token': token
        },
        body: JSON.stringify({
          action: 'ec2.2-impact',
          roleArn,
          externalId
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);

      const mode = document.getElementById('mode');
      const modeSub = document.getElementById('modeSub');
      if (mode) mode.textContent = 'Live AWS';
      if (modeSub) modeSub.textContent = `${data.defaultSecurityGroups?.length ?? 0}개 Default SG 조회됨`;
      dlg.close();
      alert('ReadOnly AWS 연결 성공. 실제 EC2/VPC/Security Group 조회가 확인되었습니다.');
    } catch (e) {
      alert(`연결 실패: ${e.message}`);
    } finally {
      testBtn.disabled = false;
      testBtn.textContent = oldText;
    }
  };
})();
