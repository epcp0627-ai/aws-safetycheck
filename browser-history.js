(() => {
  // Remove the old in-page back/forward buttons. Browser navigation is used instead.
  document.querySelector('.history-nav')?.remove();

  // Keep AWS connection reachable at the top of every screen.
  const actions = document.querySelector('header .actions');
  const connect = document.getElementById('connect');
  const newBtn = document.getElementById('new');
  if (actions && connect) {
    connect.classList.remove('full');
    connect.classList.add('top-connect');
    connect.textContent = 'AWS 계정 연결';
    if (newBtn && newBtn.parentElement === actions) actions.insertBefore(connect, newBtn);
    else actions.appendChild(connect);
  }

  const style = document.createElement('style');
  style.textContent = `
    .history-nav{display:none!important}
    header .actions{flex-wrap:wrap;justify-content:flex-end}
    .top-connect{white-space:nowrap;border-color:#31577b!important;background:#0e2945!important;font-weight:750}
    @media(max-width:650px){
      header{gap:12px;flex-direction:column}
      header .actions{width:100%;justify-content:flex-start}
      header .actions .btn{flex:1;min-width:132px}
      header .demo{display:none}
    }
  `;
  document.head.appendChild(style);

  const views = () => [...document.querySelectorAll('.view')];
  const currentView = () => document.querySelector('.view.active')?.id || 'dash';
  const validView = id => !!id && !!document.getElementById(id)?.classList.contains('view');
  let restoring = false;

  function openView(id) {
    if (!validView(id)) return;
    const navButton = document.querySelector(`[data-v="${CSS.escape(id)}"]`);
    if (navButton) {
      navButton.click();
      return;
    }
    views().forEach(v => v.classList.toggle('active', v.id === id));
  }

  function urlFor(id) {
    const url = new URL(location.href);
    url.hash = id === 'dash' ? '' : `#${id}`;
    return `${url.pathname}${url.search}${url.hash}`;
  }

  function recordView(id) {
    if (restoring || !validView(id)) return;
    const stateView = history.state?.safetyView;
    if (stateView === id) return;
    history.pushState({ ...(history.state || {}), safetyView: id }, '', urlFor(id));
  }

  // Track all regular sidebar/data-source navigation after the app has switched views.
  document.addEventListener('click', e => {
    const trigger = e.target.closest('[data-v],[data-vgo]');
    if (!trigger || restoring) return;
    const expected = trigger.dataset.v || trigger.dataset.vgo;
    setTimeout(() => {
      const id = currentView();
      recordView(validView(id) ? id : expected);
    }, 0);
  });

  // Also catch programmatic view changes that do not originate from a navigation button.
  const observer = new MutationObserver(() => {
    if (restoring) return;
    const id = currentView();
    if (validView(id) && history.state?.safetyView !== id) recordView(id);
  });
  views().forEach(v => observer.observe(v, { attributes: true, attributeFilter: ['class'] }));

  window.addEventListener('popstate', e => {
    const fromHash = location.hash.replace(/^#/, '');
    const id = e.state?.safetyView || (validView(fromHash) ? fromHash : 'dash');
    restoring = true;
    openView(id);
    setTimeout(() => { restoring = false; }, 0);
  });

  // Honor a copied/deep-linked tab URL, then make the current entry browser-history aware.
  const requested = location.hash.replace(/^#/, '');
  const initial = validView(requested) ? requested : currentView();
  restoring = true;
  if (initial !== currentView()) openView(initial);
  history.replaceState({ ...(history.state || {}), safetyView: initial }, '', urlFor(initial));
  setTimeout(() => { restoring = false; }, 0);
})();
