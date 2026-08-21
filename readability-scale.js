(() => {
  if (document.getElementById('safetycheckReadabilityScale')) return;

  const style = document.createElement('style');
  style.id = 'safetycheckReadabilityScale';
  style.textContent = `
    /* Final readability layer: intentionally loaded last. */
    body{font-size:17px!important;line-height:1.72!important}
    main{max-width:1640px!important}

    h1{font-size:32px!important}
    h2{font-size:29px!important}
    h3{font-size:23px!important}
    h4{font-size:18px!important}

    .muted{font-size:15px!important;color:#bcc9d6!important}
    .eyebrow,.kicker,.saas-label{font-size:12px!important}

    .nav button{font-size:15px!important;padding:13px 14px!important}
    .nav button>small{font-size:12px!important;color:#9fb0c0!important}
    .btn,button,input,select,textarea{font-size:15px!important}

    .command-label{font-size:12.5px!important;color:#a4b4c4!important}
    .command-value{font-size:17px!important}
    .command-sub{font-size:13.5px!important;color:#a8b8c7!important;line-height:1.6!important}
    .command-progress-row b{font-size:17px!important}
    .command-progress-row span{font-size:13px!important}

    #dash .heroCard p.muted{font-size:16px!important}
    #dash .hero-status{font-size:12.5px!important}

    /* Workflow was the least readable section in desktop screenshots. */
    #workflowGuide{padding:24px 25px!important}
    #workflowGuide .kicker{font-size:12px!important}
    #workflowGuide .workflow-head h3{font-size:24px!important;margin:5px 0 7px!important}
    #workflowGuide .workflow-head p{
      font-size:15px!important;
      line-height:1.72!important;
      max-width:1180px!important;
      color:#b9c8d6!important;
    }
    #workflowGuide .workflow-grid{margin-top:18px!important}
    #workflowGuide .workflow-step{
      min-height:190px!important;
      padding:18px 18px 17px!important;
    }
    #workflowGuide .workflow-number{
      width:32px!important;
      height:32px!important;
      font-size:13px!important;
    }
    #workflowGuide .workflow-step-top{grid-template-columns:34px 1fr auto!important;gap:10px!important}
    #workflowGuide .workflow-step-top b{font-size:17px!important;line-height:1.35!important}
    #workflowGuide .workflow-step-top small{
      font-size:13px!important;
      line-height:1.45!important;
      color:#9fb1c1!important;
    }
    #workflowGuide .workflow-state{
      font-size:11.5px!important;
      padding:5px 8px!important;
    }
    #workflowGuide .workflow-step p{
      font-size:14.5px!important;
      line-height:1.72!important;
      margin:13px 0 12px!important;
      color:#b3c2d0!important;
    }
    #workflowGuide .workflow-action{
      font-size:13.5px!important;
      line-height:1.5!important;
      font-weight:750!important;
    }
    #workflowGuide .workflow-tip{
      margin-top:14px!important;
      font-size:13px!important;
      line-height:1.65!important;
      color:#aabac8!important;
    }
    #workflowGuide .workflow-tip b{font-size:13px!important;color:#eef5fb!important}

    .flow-context-copy>b{font-size:16px!important}
    .flow-context-copy>span{font-size:14px!important;line-height:1.65!important}

    .stats span{font-size:14px!important}
    .stats small{font-size:12.5px!important}
    .stats b{font-size:29px!important}

    .finding p,.finding-ko{font-size:14px!important;line-height:1.65!important}
    th{font-size:13px!important}
    td{font-size:14.5px!important}
    .sourceCard p,.sourceCard li,.detail p,.detail li,.note,.notice{font-size:14.5px!important;line-height:1.7!important}
    .modal label{font-size:14.5px!important}
    .region-option b{font-size:14px!important}
    .region-option small,#regionPicker .region-status{font-size:12px!important}

    @media(max-width:1100px){
      #workflowGuide .workflow-grid{grid-template-columns:1fr 1fr!important}
      #workflowGuide .workflow-step{min-height:175px!important}
    }

    @media(max-width:700px){
      body{font-size:16px!important}
      h1{font-size:28px!important}
      h2{font-size:25px!important}
      h3{font-size:21px!important}
      .muted{font-size:14.5px!important}
      #workflowGuide{padding:20px!important}
      #workflowGuide .workflow-head h3{font-size:22px!important}
      #workflowGuide .workflow-head p{font-size:14.5px!important}
      #workflowGuide .workflow-grid{grid-template-columns:1fr!important}
      #workflowGuide .workflow-step{min-height:auto!important;padding:17px!important}
      #workflowGuide .workflow-step p{font-size:14px!important}
      td{font-size:14px!important}
    }
  `;
  document.head.appendChild(style);
})();
