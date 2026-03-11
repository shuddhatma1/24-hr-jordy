(function () {
  'use strict';

  // 1. Find the script tag and read data-bot-id
  var script =
    document.currentScript || document.querySelector('script[data-bot-id]');
  if (!script) return;

  var botId = script.getAttribute('data-bot-id');
  if (!botId) return;

  // 2. Derive base URL — prefer explicit data-base-url, fall back to script.src
  var baseUrl = script.getAttribute('data-base-url') || '';
  if (!baseUrl) {
    var src = script.src || '';
    baseUrl = src.replace(/\/widget\.js(\?.*)?$/, '');
  }
  if (!baseUrl) return;

  // 3. Optional overrides via data attributes
  var brandColor = script.getAttribute('data-color') || '#3B82F6';

  // 4. State
  var isOpen = false;
  // Default open icon (chat SVG) — replaced with sport emoji once bot config loads
  var openIcon =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
  var CLOSE_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

  // 5. Sport → emoji mapping (matches WelcomeCard.tsx)
  var SPORT_EMOJIS = {
    soccer: '\u26BD',
    basketball: '\uD83C\uDFC0',
    nfl: '\uD83C\uDFC8',
    baseball: '\u26BE',
  };

  // 6. Create floating button (bottom-right corner)
  var bubble = document.createElement('div');
  bubble.setAttribute('role', 'button');
  bubble.setAttribute('tabindex', '0');
  bubble.setAttribute('aria-label', 'Open chat');
  Object.assign(bubble.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: brandColor,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: '999999',
    transition: 'transform 0.2s, background-color 0.3s',
    border: 'none',
  });
  bubble.innerHTML = openIcon;

  // 7. Fetch bot config to personalize bubble (non-blocking, best-effort)
  fetch(baseUrl + '/api/bots/' + encodeURIComponent(botId))
    .then(function (r) {
      return r.ok ? r.json() : null;
    })
    .then(function (bot) {
      if (!bot) return;
      // Apply brand color (API overrides data-color attr unless already set by user)
      if (bot.primary_color && !script.getAttribute('data-color')) {
        brandColor = bot.primary_color;
        bubble.style.backgroundColor = brandColor;
        spinner.style.borderTopColor = brandColor;
      }
      // Replace generic chat icon with sport emoji
      var emoji = SPORT_EMOJIS[bot.sport] || '\uD83D\uDCAC';
      openIcon =
        '<span style="font-size:26px;line-height:1;user-select:none">' +
        emoji +
        '</span>';
      if (!isOpen) {
        bubble.innerHTML = openIcon;
        var label = (bot.bot_name || 'bot').slice(0, 100);
        bubble.setAttribute('aria-label', 'Chat with ' + label);
      }
    })
    .catch(function () {
      /* keep defaults — widget works fine without config */
    });

  // 8. Create panel (hidden by default)
  var panel = document.createElement('div');
  Object.assign(panel.style, {
    position: 'fixed',
    bottom: '88px',
    right: '20px',
    width: '400px',
    height: '600px',
    maxHeight: 'calc(100vh - 108px)',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    zIndex: '999999',
    display: 'none',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
  });

  // 9. Loading indicator — shown until iframe finishes loading
  var loader = document.createElement('div');
  Object.assign(loader.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#fafaf9',
    zIndex: '1',
    transition: 'opacity 0.3s',
  });
  var spinner = document.createElement('div');
  Object.assign(spinner.style, {
    width: '32px',
    height: '32px',
    border: '3px solid #e5e7eb',
    borderTopColor: brandColor,
    borderRadius: '50%',
    animation: '__jordy-widget-spin 0.8s linear infinite',
  });
  loader.appendChild(spinner);

  // Inject spinner keyframes
  var styleEl = document.createElement('style');
  styleEl.textContent =
    '@keyframes __jordy-widget-spin{to{transform:rotate(360deg)}}';
  document.head.appendChild(styleEl);

  panel.appendChild(loader);

  // 10. Create iframe inside panel
  var iframe = document.createElement('iframe');
  iframe.src =
    baseUrl + '/chat/' + encodeURIComponent(botId) + '?embed=true';
  iframe.title = 'Chat';
  iframe.setAttribute('allow', 'clipboard-write');
  Object.assign(iframe.style, {
    width: '100%',
    height: '100%',
    border: 'none',
    background: '#fafaf9',
  });

  // Hide loader once iframe content has loaded
  iframe.addEventListener('load', function () {
    loader.style.opacity = '0';
    setTimeout(function () {
      loader.style.display = 'none';
    }, 300);
  });

  panel.appendChild(iframe);

  // 11. Toggle open/close
  function toggle() {
    isOpen = !isOpen;
    panel.style.display = isOpen ? 'block' : 'none';
    bubble.setAttribute('aria-label', isOpen ? 'Close chat' : 'Open chat');
    bubble.innerHTML = isOpen ? CLOSE_SVG : openIcon;
  }

  bubble.addEventListener('click', toggle);
  bubble.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  });

  // 12. Mobile responsiveness — adjust panel size on small screens
  function applyLayout() {
    if (window.innerWidth <= 640) {
      Object.assign(panel.style, {
        width: '100%',
        height: 'calc(100% - 80px)',
        bottom: '80px',
        right: '0',
        borderRadius: '16px 16px 0 0',
        maxHeight: 'none',
      });
    } else {
      Object.assign(panel.style, {
        width: '400px',
        height: '600px',
        bottom: '88px',
        right: '20px',
        borderRadius: '16px',
        maxHeight: 'calc(100vh - 108px)',
      });
    }
  }

  window.addEventListener('resize', applyLayout);
  applyLayout();

  // 13. Listen for close-chat messages from the iframe
  window.addEventListener('message', function (e) {
    if (e.source !== iframe.contentWindow) return;
    if (e.data && e.data.type === 'close-chat' && isOpen) {
      toggle();
    }
  });

  // 14. Append to DOM
  document.body.appendChild(panel);
  document.body.appendChild(bubble);
})();
