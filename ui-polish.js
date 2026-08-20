(() => {
  // Data Sources: show report import first, then Live AWS connection.
  const sourceGrid = document.querySelector('#sources .source');
  if (sourceGrid) {
    const cards = [...sourceGrid.querySelectorAll('.sourceCard')];
    const reportCard = cards.find(card => card.textContent.includes('CIS 보고서만 가져오기'));
    const liveCard = cards.find(card => card.textContent.includes('ReadOnly AWS 계정 연결'));
    if (reportCard && liveCard && reportCard.compareDocumentPosition(liveCard) & Node.DOCUMENT_POSITION_PRECEDING) {
      sourceGrid.insertBefore(reportCard, liveCard);
    }
  }

  const style = document.createElement('style');
  style.id = 'readability-polish';
  style.textContent = `
    /* Global readability */
    body{font-size:16px!important;line-height:1.65!important;letter-spacing:-.01em}
    main{max-width:1600px!important;padding:36px!important}
    .brand{font-size:20px!important;line-height:1.35}
    .brand small{font-size:12px!important;margin-top:3px}
    .nav button{font-size:15px!important;padding:12px 14px!important;line-height:1.45}
    header{margin-bottom:28px!important}
    h1{font-size:30px!important;line-height:1.3!important}
    h2{line-height:1.25!important}
    h3{font-size:21px!important;line-height:1.4!important}
    h4{font-size:16px!important;margin:18px 0 10px}
    .eyebrow,.kicker{font-size:11px!important;letter-spacing:.13em!important}
    .muted{font-size:14px!important;line-height:1.65!important}
    .panel{padding:25px!important}
    .heroCard h2{font-size:36px!important}
    .heroCard p{font-size:15px!important}
    .btn{font-size:14px!important;padding:11px 14px!important;line-height:1.4}
    .demo,.sev,.rec,.badge{font-size:11px!important}
    .account{font-size:14px!important}
    .account small{font-size:12px!important}

    /* Dashboard */
    .stats b{font-size:32px!important}
    .stats span{font-size:14px!important}
    .stats small{font-size:12px!important}
    .finding{padding:14px!important;gap:12px!important}
    .finding p{font-size:13px!important;line-height:1.55!important}

    /* Findings table */
    th{font-size:12px!important;padding:13px 12px!important;white-space:nowrap}
    td{font-size:14px!important;padding:15px 12px!important;line-height:1.55!important;vertical-align:middle}
    #rows td:nth-child(1){font-weight:800;white-space:nowrap}
    #rows td:nth-child(2){min-width:420px}
    .finding-ko{font-size:13px!important;line-height:1.55!important;margin-top:5px!important;color:#a9bbce!important}
    .filters input,.filters select,textarea,.modal input{font-size:14px!important;padding:12px 13px!important}

    /* Analysis */
    .analysis textarea{min-height:175px!important}
    .chips button{font-size:13px!important;padding:8px 10px!important}
    .metric{padding:14px!important}
    .metric small{font-size:12px!important;margin-bottom:3px}
    .metric b{font-size:15px!important}
    .detail{padding:15px!important}
    .detail p,.detail li{font-size:14px!important;line-height:1.65!important}
    .kv{grid-template-columns:120px 1fr!important;gap:8px 12px!important;font-size:14px}
    .tree,.steps div{font-size:14px!important;line-height:1.6!important;padding:12px!important}

    /* Data sources */
    .source{gap:20px!important}
    .sourceCard{padding:22px!important}
    .sourceCard h3{font-size:21px!important;margin:10px 0!important}
    .sourceCard p{font-size:14px!important;line-height:1.65!important}
    .sourceCard li{font-size:14px!important;line-height:1.7!important;margin:4px 0}
    .note{font-size:14px!important;line-height:1.65!important;padding:14px!important}
    .reportStatus{font-size:14px!important;line-height:1.6!important;padding:12px!important}

    /* Dialogs */
    .modal{padding:25px!important}
    .modal label{font-size:14px!important}
    .notice{font-size:14px!important;line-height:1.6!important}

    @media(max-width:1000px){
      main{padding:26px!important}
      h1{font-size:27px!important}
      .heroCard h2{font-size:32px!important}
    }
    @media(max-width:650px){
      body{font-size:15px!important}
      main{padding:20px 14px!important}
      h1{font-size:24px!important}
      h3{font-size:19px!important}
      .panel{padding:19px!important}
      th{font-size:11px!important}
      td{font-size:13px!important;padding:13px 10px!important}
      #rows td:nth-child(2){min-width:300px}
      .finding-ko{font-size:12px!important}
    }
  `;
  document.head.appendChild(style);
})();
