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
      --t:#f4f7fb;
      --m:#b7c5d3;
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
      font-size:17px!important;
      line-height:1.7!important;
      letter-spacing:-.012em;
    }

    h1,h2,h3,h4,
    .brand,
    .head h3,
    .heroCard h2,
    .workflow-head h3,
    .topology-hero h3{
      letter-spacing:-.028em!important;
      line-height:1.3!important;
      font-weight:720!important;
      word-break:keep-all;
    }

    h1{font-size:32px!important}
    h2{font-size:28px!important}
    h3{font-size:23px!important}
    h4{font-size:18px!important}
    .heroCard h2{font-size:38px!important;line-height:1.2!important}
    .head h3{font-size:22px!important}

    p,li,td,.detail p,.detail li,.muted,.notice{
      word-break:keep-all;
      overflow-wrap:anywhere;
    }

    .muted{color:#b7c5d3!important;font-size:15px!important}
    .note,.notice{font-size:15px!important;line-height:1.72!important}

    .eyebrow,.kicker,.saas-label{
      font-size:12px!important;
      letter-spacing:.07em!important;
      line-height:1.4!important;
      font-weight:780!important;
    }

    .nav button{
      font-size:15px!important;
      line-height:1.4!important;
    }
    .nav button>span{font-weight:690!important}
    .nav button>small{
      font-size:12px!important;
      line-height:1.4!important;
      color:#a4b4c4!important;
    }
    .nav-no{font-size:12px!important}

    .btn,
    button,
    input,
    select,
    textarea{
      font-size:15px!important;
      line-height:1.5!important;
    }
    .btn{font-weight:630}

    th{
      font-size:12.5px!important;
      letter-spacing:.01em;
      font-weight:720!important;
      color:#adbdcc!important;
    }
    td{font-size:14.5px!important;line-height:1.62!important}

    .finding p,
    .finding-ko,
    .sourceCard li,
    .detail p,
    .detail li,
    .workflow-step p,
    .saas-desc{
      font-size:14px!important;
      line-height:1.7!important;
    }

    .sev,.rec,.badge,.demo,.workflow-state{
      font-size:11.5px!important;
      letter-spacing:0!important;
    }

    .workflow-step-top b{font-size:16px!important}
    .workflow-step-top small,
    .workflow-action,
    .flow-context-copy>span{
      font-size:13px!important;
      line-height:1.6!important;
    }

    .modal label,
    .region-compact-head b,
    .external-id-caption>span{
      font-size:14px!important;
      font-weight:650!important;
    }
    .region-option b{font-size:13.5px!important}
    .region-option small,
    #regionPicker .region-status{
      font-size:11.5px!important;
    }

    code,.tree,.saas-account-box code{
      font-family:"SFMono-Regular",Consolas,"Liberation Mono",monospace!important;
      letter-spacing:0!important;
    }

    @media(max-width:650px){
      body{font-size:16px!important}
      h1{font-size:28px!important}
      h2{font-size:25px!important}
      h3{font-size:21px!important}
      .heroCard h2{font-size:32px!important}
      td{font-size:14px!important}
      .muted{font-size:14px!important}
    }
  `;
  document.head.appendChild(style);
})();
