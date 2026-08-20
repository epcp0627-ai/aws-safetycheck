(() => {
  // ---------- In-app back / forward navigation ----------
  const headerActions = document.querySelector('header .actions');
  const views = [...document.querySelectorAll('.view')];
  if (headerActions && views.length) {
    const navBox = document.createElement('div');
    navBox.className = 'history-nav';
    navBox.innerHTML = `
      <button class="btn history-btn" id="pageBack" type="button" title="뒤로 가기" aria-label="뒤로 가기">←</button>
      <button class="btn history-btn" id="pageForward" type="button" title="앞으로 가기" aria-label="앞으로 가기">→</button>`;
    headerActions.prepend(navBox);

    const style = document.createElement('style');
    style.textContent = `
      .history-nav{display:flex;gap:6px;margin-right:4px}
      .history-btn{min-width:38px;text-align:center!important;font-size:17px;padding:7px 10px!important}
      .history-btn:disabled{opacity:.32;cursor:not-allowed}
      .finding-ko{display:block;margin-top:4px;color:#91a5bd;font-size:11px;line-height:1.45}
    `;
    document.head.appendChild(style);

    const currentView = () => document.querySelector('.view.active')?.id || 'dash';
    let historyStack = [currentView()];
    let historyIndex = 0;
    let suppress = false;

    const backBtn = document.getElementById('pageBack');
    const forwardBtn = document.getElementById('pageForward');
    const update = () => {
      backBtn.disabled = historyIndex <= 0;
      forwardBtn.disabled = historyIndex >= historyStack.length - 1;
    };
    const openView = (id) => {
      const btn = document.querySelector(`[data-v="${CSS.escape(id)}"]`);
      if (btn) btn.click();
      else {
        views.forEach(v => v.classList.toggle('active', v.id === id));
      }
    };
    const record = (id) => {
      if (!id || suppress || historyStack[historyIndex] === id) return;
      historyStack = historyStack.slice(0, historyIndex + 1);
      historyStack.push(id);
      historyIndex = historyStack.length - 1;
      update();
    };

    const observer = new MutationObserver(() => record(currentView()));
    views.forEach(v => observer.observe(v, { attributes:true, attributeFilter:['class'] }));

    backBtn.onclick = () => {
      if (historyIndex <= 0) return;
      historyIndex--;
      suppress = true;
      openView(historyStack[historyIndex]);
      setTimeout(() => { suppress = false; update(); }, 0);
    };
    forwardBtn.onclick = () => {
      if (historyIndex >= historyStack.length - 1) return;
      historyIndex++;
      suppress = true;
      openView(historyStack[historyIndex]);
      setTimeout(() => { suppress = false; update(); }, 0);
    };
    update();
  }

  // ---------- Korean translations for CIS findings ----------
  const KO = {
    'IAM.6':'루트 사용자에 하드웨어 MFA를 활성화해야 합니다.',
    'EC2.2':'기본 보안 그룹은 인바운드 또는 아웃바운드 트래픽을 허용하지 않아야 합니다.',
    'EC2.53':'EC2 보안 그룹은 원격 서버 관리 포트에 0.0.0.0/0에서의 인바운드 접근을 허용하지 않아야 합니다.',
    'IAM.28':'IAM Access Analyzer의 외부 액세스 분석기를 활성화해야 합니다.',
    'RDS.13':'RDS 자동 마이너 버전 업그레이드를 활성화해야 합니다.',
    'RDS.5':'RDS DB 인스턴스는 다중 가용 영역(Multi-AZ)으로 구성해야 합니다.',
    'S3.5':'S3 버킷은 SSL/TLS를 사용하는 요청만 허용해야 합니다.',
    'EC2.6':'모든 VPC에서 VPC Flow Logs를 활성화해야 합니다.',
    'ACCOUNT.1':'AWS 계정에 보안 연락처 정보를 등록해야 합니다.',
    'CLOUDTRAIL.2':'CloudTrail 저장 데이터 암호화를 활성화해야 합니다.',
    'CLOUDTRAIL.5':'CloudTrail을 CloudWatch Logs와 연동해야 합니다.',
    'CLOUDTRAIL.7':'CloudTrail 로그 버킷에 서버 액세스 로깅을 구성해야 합니다.',
    'EC2.7':'EBS 기본 암호화를 활성화해야 합니다.',
    'IAM.3':'IAM 사용자 액세스 키는 90일 이내에 교체해야 합니다.',
    'S3.1':'S3 Block Public Access 설정을 활성화해야 합니다.',
    'S3.20':'S3 버킷의 보안 관련 권장 설정을 충족해야 합니다.',
    'EC2.13':'보안 그룹은 SSH(22) 포트를 인터넷 전체에 공개하지 않아야 합니다.',
    'EC2.14':'보안 그룹은 RDP(3389) 포트를 인터넷 전체에 공개하지 않아야 합니다.',
    'IAM.4':'루트 사용자 액세스 키가 존재하지 않아야 합니다.',
    'IAM.5':'루트 사용자에 MFA를 활성화해야 합니다.',
    'IAM.7':'IAM 사용자 비밀번호 정책은 권장 보안 기준을 충족해야 합니다.',
    'IAM.8':'사용하지 않는 IAM 사용자 자격 증명은 제거해야 합니다.',
    'IAM.9':'IAM 사용자에게 직접 연결된 인라인 정책 사용을 최소화해야 합니다.',
    'RDS.3':'RDS DB 인스턴스는 퍼블릭 액세스를 허용하지 않아야 합니다.',
    'RDS.6':'RDS 스냅샷은 퍼블릭 액세스를 허용하지 않아야 합니다.',
    'RDS.7':'RDS 저장 데이터 암호화를 활성화해야 합니다.',
    'S3.2':'S3 버킷은 퍼블릭 읽기 액세스를 금지해야 합니다.',
    'S3.3':'S3 버킷은 퍼블릭 쓰기 액세스를 금지해야 합니다.',
    'S3.8':'S3 Block Public Access 설정을 버킷 수준에서 활성화해야 합니다.',
    'CLOUDTRAIL.1':'CloudTrail을 활성화하고 로그를 기록해야 합니다.',
    'CLOUDTRAIL.4':'CloudTrail 로그 파일 무결성 검증을 활성화해야 합니다.'
  };

  const exactTitle = {
    'Hardware MFA should be enabled for the root user':'루트 사용자에 하드웨어 MFA를 활성화해야 합니다.',
    'Default security groups should not allow inbound or outbound traffic':'기본 보안 그룹은 인바운드 또는 아웃바운드 트래픽을 허용하지 않아야 합니다.',
    'EC2 security groups should not allow ingress from 0.0.0.0/0 to remote server administration ports':'EC2 보안 그룹은 원격 서버 관리 포트에 0.0.0.0/0에서의 인바운드 접근을 허용하지 않아야 합니다.',
    'IAM Access Analyzer external access analyzer should be enabled':'IAM Access Analyzer의 외부 액세스 분석기를 활성화해야 합니다.',
    'RDS automatic minor version upgrades should be enabled':'RDS 자동 마이너 버전 업그레이드를 활성화해야 합니다.',
    'RDS DB instances should be configured with multiple Availability Zones':'RDS DB 인스턴스는 다중 가용 영역(Multi-AZ)으로 구성해야 합니다.',
    'S3 buckets should require requests to use SSL':'S3 버킷은 SSL/TLS를 사용하는 요청만 허용해야 합니다.',
    'VPC flow logging should be enabled in all VPCs':'모든 VPC에서 VPC Flow Logs를 활성화해야 합니다.',
    'Security contact information should be provided for an AWS account.':'AWS 계정에 보안 연락처 정보를 등록해야 합니다.',
    'Security contact information should be provided for an AWS account':'AWS 계정에 보안 연락처 정보를 등록해야 합니다.',
    'CloudTrail should have encryption at-rest enabled':'CloudTrail 저장 데이터 암호화를 활성화해야 합니다.'
  };

  function fallbackTranslate(title) {
    const t = String(title || '').trim();
    if (!t) return '한글 설명을 준비 중입니다.';
    if (/should be enabled/i.test(t)) return '해당 보안 기능 또는 설정을 활성화해야 합니다.';
    if (/should not allow/i.test(t)) return '해당 리소스가 위험한 접근 또는 트래픽을 허용하지 않도록 제한해야 합니다.';
    if (/should be encrypted|encryption/i.test(t)) return '해당 리소스의 암호화 설정을 활성화해야 합니다.';
    if (/should be configured/i.test(t)) return '해당 리소스를 CIS 권장 구성으로 설정해야 합니다.';
    if (/should require/i.test(t)) return '해당 리소스가 CIS에서 요구하는 보안 조건을 강제하도록 설정해야 합니다.';
    if (/should be provided/i.test(t)) return '해당 계정 또는 리소스에 필요한 보안 정보를 등록해야 합니다.';
    return '이 CIS Finding의 권장 보안 설정을 충족하도록 조치해야 합니다.';
  }

  function decorateRows() {
    document.querySelectorAll('#rows tr').forEach(tr => {
      const cells = tr.querySelectorAll('td');
      if (cells.length < 2) return;
      const id = cells[0].textContent.trim().toUpperCase();
      const findingCell = cells[1];
      if (findingCell.querySelector('.finding-ko')) return;
      const english = [...findingCell.childNodes]
        .filter(n => n.nodeType === Node.TEXT_NODE)
        .map(n => n.textContent)
        .join(' ')
        .trim() || findingCell.textContent.trim();
      const ko = KO[id] || exactTitle[english] || fallbackTranslate(english);
      const sub = document.createElement('span');
      sub.className = 'finding-ko';
      sub.textContent = ko;
      findingCell.appendChild(sub);
    });
  }

  const rows = document.getElementById('rows');
  if (rows) {
    const rowObserver = new MutationObserver(decorateRows);
    rowObserver.observe(rows, { childList:true, subtree:true });
    decorateRows();
  }
})();