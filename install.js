const $ = id => document.getElementById(id);
const dialog = $('install-dialog');
const displayMode = window.matchMedia('(display-mode: standalone)');
let pendingPrompt = null;
let installationCompleted = false;
const installed = () => installationCompleted || displayMode.matches || navigator.standalone === true;
const appleMobile = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;

function syncInstall() {
  $('install-app').textContent = installed() ? '✓ App Installed' : '↓ Install App';
  $('install-app').disabled = installed();
  $('install-now').hidden = installed() || !pendingPrompt;
  if (installed()) $('install-status').textContent = 'Voice Bridge is installed. Open it from your home screen or app launcher.';
}

function openInstructions() {
  syncInstall();
  if (!installed()) $('install-status').textContent = pendingPrompt ? 'Your browser is ready to install Voice Bridge.' : 'Follow these steps to add Voice Bridge to your device.';
  const steps = appleMobile() ? [
    'Open the official Voice Bridge link in Safari.',
    'Tap Share, then Add to Home Screen. If necessary, find it under More.',
    'Turn on Open as Web App if shown, then tap Add.'
  ] : /android/i.test(navigator.userAgent) ? [
    'Open the official Voice Bridge link in Chrome, Edge, or Samsung Internet.',
    'Use Install Voice Bridge above, or open the browser menu and choose Install app or Add to Home screen.',
    'Confirm, then open Voice Bridge from your home screen.'
  ] : [
    'Open the official Voice Bridge link in Chrome or Edge.',
    'Use Install Voice Bridge above, or click the install icon in the address bar or browser menu.',
    'Confirm, then launch Voice Bridge from your app launcher.'
  ];
  $('install-steps').replaceChildren(...steps.map(text => {
    const item = document.createElement('li');
    item.textContent = text;
    return item;
  }));
  if (!dialog.open) dialog.showModal();
}

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  pendingPrompt = event;
  syncInstall();
});
window.addEventListener('appinstalled', () => {
  installationCompleted = true;
  pendingPrompt = null;
  syncInstall();
});
displayMode.addEventListener?.('change', syncInstall);
$('install-app').addEventListener('click', openInstructions);
$('close-install').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
});
$('install-now').addEventListener('click', async () => {
  const prompt = pendingPrompt;
  if (!prompt) return openInstructions();
  $('install-now').disabled = true;
  try {
    await prompt.prompt();
    const choice = await prompt.userChoice;
    pendingPrompt = null;
    syncInstall();
    if (!installed()) $('install-status').textContent = choice.outcome === 'accepted' ? 'Installation requested. Your browser will finish adding Voice Bridge.' : 'Installation dismissed. You can try again from the browser menu.';
  } catch {
    pendingPrompt = null;
    syncInstall();
    $('install-status').textContent = 'Your browser could not open installation. Follow the steps below.';
  } finally {
    $('install-now').disabled = false;
  }
});
syncInstall();

if ('serviceWorker' in navigator && window.isSecureContext) {
  try {
    await navigator.serviceWorker.register('./sw.js', {scope: './'});
    await navigator.serviceWorker.ready;
    $('offline-status').textContent = 'App ready for offline opening · translation needs downloaded models';
  } catch {
    $('offline-status').textContent = 'Offline setup could not finish. Reopen the app online to retry.';
  }
} else {
  $('offline-status').textContent = 'Open the official secure website to install and enable offline opening.';
}
