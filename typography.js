(() => {
  if (document.getElementById('safetycheckTypography')) return;

  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
  fontLink.crossOrigin = 'anonymous';
  document.head.appendChild(fontLink);

  const style = document.createElement('style');
  style.id = 'safetycheckTypography';
  style.textContent = `
    :root{
      --t:#f2f6fb;
      --m:#a9b9ca;
    }

    html{-webkit-text-size-adjust:100%}
    body,
    button,
    input,
    select,
    textarea,
    dialog{
      font-family:"Pretendard Variable",Pretendard,"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif!important;
      font-feature-settings:"kern" 1;
      text-rendering:optimizeLegibility;
      -webkit-font-smoothing:antialiased;
      -moz-osx-font-smoothing:grayscale;
    }

    body{
      font-size:15px!important;
      line-height:1.68!important;
      letter-spacing:-.012em;
    }

    h1,h2,h3,h4,
    .brand,
    .head h3,
    .heroCard h2,
    .workflow-head h3,
    .topology-hero h3{
      letter-spacing:-.028em!important;
      line-height:1.28!important;
      font-weight:720!important;
      word-break:keep-all;
    }

    h1{font-size:29px!important}
    .heroCard h2{font-size:34px!important;line-height:1.2!important}
    .head h3{font-size:20px!important}

    p,li,td,.detail p,.detail li,.muted,.notice{
      word-break:keep-all;
      overflow-wrap:anywhere;
    }

    .muted{color:#a9b9ca!important}
    .note,.notice{line-height:1.7!important}

    .eyebrow,.kicker,.saas-label{
      font-size:11px!important;
      letter-spacing:.075em!important;
      line-height:1.35!important;
      font-weight:780!important;
    }

    .nav button{
      font-size:13px!important;
      line-height:1.35!important;
    }
    .nav button>span{font-weight:680!important}
    .nav button>small{
      font-size:10.5px!important;
      line-height:1.35!important;
      color:#8fa1b3!important;
    }
    .nav-no{font-size:11px!important}

    .btn,
    button,
    input,
    select,
    textarea{
      font-size:13px;
      line-height:1.45;
    }
    .btn{font-weight:620}

    th{
      font-size:11px!important;
      letter-spacing:.015em;
      font-weight:720!important;
      color:#9eb0c1!important;
    }
    td{font-size:13px!important;line-height:1.55!important}

    .finding p,
    .finding-ko,
    .sourceCard li,
    .detail p,
    .detail li,
    .workflow-step p,
    .saas-desc{
      font-size:12.5px!important;
      line-height:1.65!important;
    }

    .sev,.rec,.badge,.demo,.workflow-state{
      font-size:10.5px!important;
      letter-spacing:0!important;
    }

    .workflow-step-top b{font-size:14px!important}
    .workflow-step-top small,
    .workflow-action,
    .flow-context-copy>span{
      font-size:11.5px!important;
      line-height:1.55!important;
    }

    .modal label,
    .region-compact-head b,
    .external-id-caption>span{
      font-size:12.5px!important;
      font-weight:650!important;
    }
    .region-option b{font-size:12px!important}
    .region-option small,
    #regionPicker .region-status{
      font-size:10.5px!important;
    }

    code,.tree,.saas-account-box code{
      font-family:"SFMono-Regular",Consolas,"Liberation Mono",monospace!important;
      letter-spacing:0!important;
    }

    @media(max-width:650px){
      body{font-size:14px!important}
      h1{font-size:25px!important}
      .heroCard h2{font-size:29px!important}
      td{font-size:12.5px!important}
    }
  `;
  document.head.appendChild(style);
})();
