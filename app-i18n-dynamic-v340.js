/* V3.4 runtime-backed first-party UI. Never traverse or translate arbitrary provider content. */
import {DYNAMIC_KEYS,dynamicText} from './lib/i18n-dynamic-v340.mjs';
window.SGBUDDY_DYNAMIC_I18N={
 text:(key,fields={})=>dynamicText(window.SGBUDDY_LANGUAGE||'en',key,fields),
 keys:DYNAMIC_KEYS.length
};
document.dispatchEvent(new Event('sgbuddy:translations-ready'));
