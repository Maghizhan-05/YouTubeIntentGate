(function () {
  'use strict';
  const inputs = [...document.querySelectorAll('input[name="mode"]')];
  const status = document.getElementById('status');
  const names = { off: 'Off', intention: 'Intention Gate', 'no-doomscroll': 'No Doomscroll', 'watch-later': 'Watch Later' };
  async function initialize() {
    try {
      const mode = await IntentGateStorage.getMode();
      inputs.find(input => input.value === mode).checked = true;
      status.textContent = `${names[mode]} is active · Changes apply immediately`;
    } catch { status.textContent = 'Could not read mode. Try reopening the popup.'; }
  }
  for (const input of inputs) input.addEventListener('change', async () => {
    if (!input.checked) return;
    try {
      await IntentGateStorage.setMode(input.value);
      status.textContent = `${names[input.value]} is active · Changes apply immediately`;
    } catch { status.textContent = 'Could not save mode. Try again.'; }
  });
  void initialize();
})();
