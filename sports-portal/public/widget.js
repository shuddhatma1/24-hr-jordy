(function () {
  'use strict';

  // 1. Find the script tag and read data-bot-id
  var script =
    document.currentScript || document.querySelector('script[data-bot-id]');
  if (!script) return;

  var botId = script.getAttribute('data-bot-id');
  if (!botId) return;

  // 2. Derive base URL from script.src (strip /widget.js and optional query string)
  var src = script.src || '';
  var baseUrl = src.replace(/\/widget\.js(\?.*)?$/, '');
  if (!baseUrl) return;

  // 3. State
  var isOpen = false;

  // 4. SVG icons (inline — no external dependencies)
  var CHAT_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
  var CLOSE_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

  // 5. Create floating button (bottom-right corner)
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
    backgroundColor: '#3B82F6',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: '999999',
    transition: 'transform 0.2s',
    border: 'none',
  });
  bubble.innerHTML = CHAT_SVG;

  // 6. Create panel (hidden by default)
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

  // 7. Create iframe inside panel
  var iframe = document.createElement('iframe');
  iframe.src =
    baseUrl + '/chat/' + encodeURIComponent(botId) + '?embed=true';
  iframe.title = 'Chat';
  iframe.setAttribute('allow', 'clipboard-write');
  Object.assign(iframe.style, {
    width: '100%',
    height: '100%',
    border: 'none',
  });
  panel.appendChild(iframe);

  // 8. Toggle open/close
  function toggle() {
    isOpen = !isOpen;
    panel.style.display = isOpen ? 'block' : 'none';
    bubble.setAttribute('aria-label', isOpen ? 'Close chat' : 'Open chat');
    bubble.innerHTML = isOpen ? CLOSE_SVG : CHAT_SVG;
  }

  bubble.addEventListener('click', toggle);
  bubble.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  });

  // 9. Mobile responsiveness — adjust panel size on small screens
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

  // 10. Append to DOM
  document.body.appendChild(panel);
  document.body.appendChild(bubble);
})();
