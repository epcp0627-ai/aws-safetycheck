(() => {
  if (document.getElementById('safetycheckFinalA11yPolish')) return;

  const nav = document.querySelector('.nav');
  if (!nav) return;

  // 1) Architecture is an optional tool, not STEP 4.
  const topologyContext = document.querySelector('#topology .flow-context-copy');
  if (topologyContext) {
    const oldTitle = topologyContext.querySelector(':scope > b, :scope > h2');
    if (oldTitle) oldTitle.textContent = '선택 도구 · 전체 구조 확인 및 문서 출력';
    const desc = topologyContext.querySelector(':scope > span');
    if (desc) desc.textContent = '필수 분석 단계가 아닙니다. ReadOnly AWS 연결 후 실제 VPC, Subnet, EC2, RDS, Load Balancer 구성을 확인하거나 draw.io 파일로 내보낼 때 사용합니다.';
  }

  // 2) Give every main view a real H2 before card-level H3 headings.
  document.querySelectorAll('.view .flow-context-copy').forEach(copy => {
    const current = copy.querySelector(':scope > b');
    if (!current) return;
    const h2 = document.createElement('h2');
    h2.className = 'flow-context-title';
    h2.innerHTML = current.innerHTML;
    current.replaceWith(h2);
  });

  // Earlier compatibility code used ARIA to pretend H3s were H2s. Now that a real H2 exists,
  // restore the natural H2 -> H3 hierarchy.
  document.querySelectorAll('.view h3[role="heading"]').forEach(h => {
    h.removeAttribute('role');
    h.removeAttribute('aria-level');
  });

  // 3) Keep number/icon in a fixed column and title + description in one flexible column.
  nav.querySelectorAll('button').forEach(button => {
    if (button.querySelector('.nav-copy')) return;
    const title = button.querySelector(':scope > span');
    const desc = button.querySelector(':scope > small');
    if (!title && !desc) return;
    const copy = document.createElement('span');
    copy.className = 'nav-copy';
    if (title) copy.appendChild(title);
    if (desc) copy.appendChild(desc);
    button.appendChild(copy);
  });

  const style = document.createElement('style');
  style.id = 'safetycheckFinalA11yPolish';
  style.textContent = `
    .flow-context-title{
      margin:0;
      color:#edf5fb;
      font-size:18px!important;
      font-weight:760;
      line-height:1.4!important;
      letter-spacing:-.02em!important;
    }

    .nav button{
      grid-template-columns:32px minmax(0,1fr)!important;
      column-gap:10px!important;
      align-items:center!important;
    }
    .nav button>.nav-no{
      grid-column:1!important;
      grid-row:1!important;
      align-self:center!important;
    }
    .nav-copy{
      grid-column:2!important;
      grid-row:1!important;
      display:flex!important;
      flex-direction:column!important;
      min-width:0!important;
      width:100%!important;
      gap:2px!important;
      overflow:visible!important;
    }
    .nav-copy>span{
      display:block!important;
      min-width:0!important;
      width:100%!important;
      white-space:normal!important;
      word-break:keep-all!important;
      overflow-wrap:normal!important;
      line-height:1.35!important;
    }
    .nav-copy>small{
      display:block!important;
      min-width:0!important;
      width:100%!important;
      margin:0!important;
      white-space:normal!important;
      word-break:keep-all!important;
      line-height:1.35!important;
    }

    @media(max-width:700px){
      aside .nav button{
        grid-template-columns:32px minmax(0,1fr)!important;
        gap:10px!important;
        align-items:center!important;
        width:100%!important;
      }
      aside .nav .nav-copy{
        min-width:0!important;
        width:auto!important;
      }
      aside .nav .nav-copy>span{
        font-size:15px!important;
        font-weight:720!important;
      }
      aside .nav .nav-copy>small{
        font-size:12px!important;
        color:#91a5b8!important;
      }
      .flow-context-title{font-size:17px!important}
    }
  `;
  document.head.appendChild(style);
})();
