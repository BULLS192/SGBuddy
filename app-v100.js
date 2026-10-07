const core=window.SGBUDDY_CORE;
if(core){
  const {state,$,toast}=core;
  const VERSION='1.0.0';
  window.__SGBUDDY_CLIENT_VERSION__=VERSION;
  if($('#appVersion'))$('#appVersion').textContent='v'+VERSION;
  $('#accountButton')?.classList.add('v1-header-account-hidden');
  let network=document.querySelector('#v1NetworkStatus');
  if(!network){network=document.createElement('div');network.id='v1NetworkStatus';network.className='v1-network-status hidden';network.setAttribute('role','status');network.setAttribute('aria-live','polite');document.body.appendChild(network)}
  function updateNetwork(){const offline=navigator.onLine===false;network.classList.toggle('hidden',!offline);network.textContent=offline?'Offline · showing saved information and last-known weather where available':''}
  addEventListener('online',()=>{updateNetwork();toast('Back online')});addEventListener('offline',()=>{updateNetwork();toast('SGBuddy is offline')});updateNetwork();
  if(!document.querySelector('#v1PrivacyCard')){
    const card=document.createElement('section');card.id='v1PrivacyCard';card.className='privacy-card card';
    card.innerHTML='<div class="label">PRIVACY & DATA</div><h3>Private by design</h3><div class="privacy-grid"><div><strong>Precise location</strong><span>Used in the current browser session for nearby transport and routing. Coordinates are not added to account preferences.</span></div><div><strong>Saved addresses</strong><span>Guest mode keeps them on this device. Cross-device address sync uses your signed-in account.</span></div><div><strong>Legacy device link</strong><span>Carries mode and transport favourites only. Home, Work, Hotel and recent destination history are excluded.</span></div><div><strong>Data freshness</strong><span>SGBuddy labels degraded or cached observations instead of presenting them as fresh.</span></div></div>';
    const settings=$('#settingsCard');if(settings)settings.insertAdjacentElement('afterend',card);else $('#accountSection')?.insertAdjacentElement('afterend',card);
  }
  if($('#profileDescription'))$('#profileDescription').textContent='Legacy device links sync transport favourites and mode only. Saved addresses sync privately through your signed-in SGBuddy account.';
  const legacyTitle=document.querySelector('.profile-summary h3');if(legacyTitle)legacyTitle.textContent='Legacy device link';
  $('#installButton')?.setAttribute('aria-label','Install SGBuddy as an app');
  document.documentElement.dataset.sgbuddyVersion=VERSION;
}