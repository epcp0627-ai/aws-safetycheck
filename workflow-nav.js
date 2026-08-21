(() => {
  document.addEventListener('click', e => {
    const button = e.target.closest('.flow-context [data-vgo]');
    if (!button) return;
    const id = button.dataset.vgo;
    const nav = document.querySelector(`.nav [data-v="${CSS.escape(id)}"]`);
    if (nav) nav.click();
  });
})();
