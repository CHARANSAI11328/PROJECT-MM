/**
 * MAMEKA MAHODAYAM - Official Digital AI Chatbot (js/chatbot.js)
 * Clean Top-Bar Integrated Newspaper Assistant with Official AI Emblem
 */

(function () {
  // 1. Immediate Global Toggle Definition (Guarantees top button ALWAYS works instantly)
  window.toggleMamekaChat = function (forceState) {
    if (typeof window.__mamekaOpenChatInternal === 'function') {
      window.__mamekaOpenChatInternal(forceState);
    } else {
      // If UI is not built yet, build it immediately and toggle
      buildChatbotUI();
      if (typeof window.__mamekaOpenChatInternal === 'function') {
        window.__mamekaOpenChatInternal(forceState);
      }
    }
  };

  // 2. Active Cleanup: Destroy any old bottom launcher element completely
  function purgeBottomLauncher() {
    const oldLaunchers = document.querySelectorAll('#mameka-chat-launcher, .pulse-ring, .launcher-emblem');
    oldLaunchers.forEach(el => el.remove());
  }
  purgeBottomLauncher();

  if (window.MamekaChatbotInitialized) return;
  window.MamekaChatbotInitialized = true;

  // 3. Injected Scoped CSS Styles (Top-bar Dropdown + Bottom Launcher Hard Suppressed)
  const styleContent = `
    /* HARD SUPPRESS ANY FLOATING LAUNCHER FROM PAST CACHE */
    #mameka-chat-launcher {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
      position: fixed !important;
      bottom: -9999px !important;
      right: -9999px !important;
      width: 0 !important;
      height: 0 !important;
      overflow: hidden !important;
      z-index: -1 !important;
    }

    #mameka-chat-modal {
      position: fixed !important;
      top: 52px !important;
      right: 20px !important;
      bottom: auto !important;
      left: auto !important;
      z-index: 2147483647 !important;
      width: 400px !important;
      max-width: calc(100vw - 24px) !important;
      height: 580px !important;
      max-height: calc(100vh - 75px) !important;
      background-color: #ffffff !important;
      border-radius: 18px !important;
      box-shadow: 0 20px 60px rgba(15, 23, 42, 0.32), 0 4px 16px rgba(0, 0, 0, 0.08) !important;
      border: 1.5px solid #fbcfe8 !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important;
      opacity: 0 !important;
      transform: translateY(-10px) scale(0.97) !important;
      pointer-events: none !important;
      margin: 0 !important;
    }

    #mameka-chat-modal.open {
      opacity: 1 !important;
      transform: translateY(0) scale(1) !important;
      pointer-events: auto !important;
    }

    .mm-chat-header {
      background: linear-gradient(135deg, #831843 0%, #be185d 100%) !important;
      color: #ffffff !important;
      padding: 12px 16px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      border-bottom: 3px solid #ffcc00 !important;
    }

    .mm-chat-header-info {
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
    }

    .mm-chat-brand-badge {
      width: 38px !important;
      height: 38px !important;
      background: #ffffff !important;
      border-radius: 50% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
      border: 1.5px solid #ffcc00 !important;
      flex-shrink: 0 !important;
      overflow: hidden !important;
    }

    .mm-chat-brand-badge img {
      width: 32px !important;
      height: 32px !important;
      object-fit: contain !important;
    }

    .mm-chat-title {
      font-size: 15px !important;
      font-weight: 800 !important;
      margin: 0 !important;
      line-height: 1.2 !important;
      color: #ffffff !important;
    }

    .mm-chat-sub {
      font-size: 11px !important;
      color: #fce7f3 !important;
      margin-top: 2px !important;
      font-weight: 500 !important;
    }

    .mm-chat-close {
      background: rgba(255, 255, 255, 0.18) !important;
      border: none !important;
      color: #ffffff !important;
      font-size: 18px !important;
      cursor: pointer !important;
      width: 30px !important;
      height: 30px !important;
      border-radius: 50% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      transition: all 0.2s ease !important;
    }

    .mm-chat-close:hover {
      background: #dc2626 !important;
      color: #ffffff !important;
    }

    .mm-chat-body {
      flex: 1 !important;
      padding: 16px !important;
      overflow-y: auto !important;
      background-color: #fdfafc !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 12px !important;
    }

    .mm-msg {
      max-width: 88% !important;
      padding: 11px 14px !important;
      border-radius: 14px !important;
      font-size: 13.5px !important;
      line-height: 1.55 !important;
      word-wrap: break-word !important;
    }

    .mm-msg.bot {
      background-color: #ffffff !important;
      color: #1e293b !important;
      align-self: flex-start !important;
      border-bottom-left-radius: 3px !important;
      border: 1px solid #fbcfe8 !important;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04) !important;
    }

    .mm-msg.bot a {
      color: #be185d !important;
      font-weight: 700 !important;
      text-decoration: underline !important;
    }

    .mm-msg.user {
      background: linear-gradient(135deg, #be185d 0%, #9d174d 100%) !important;
      color: #ffffff !important;
      align-self: flex-end !important;
      border-bottom-right-radius: 3px !important;
      box-shadow: 0 2px 6px rgba(190, 24, 93, 0.28) !important;
    }

    .mm-chat-chips {
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 6px !important;
      margin-top: 10px !important;
    }

    .mm-chip-btn {
      background-color: #ffffff !important;
      color: #831843 !important;
      border: 1px solid #fbcfe8 !important;
      border-radius: 18px !important;
      padding: 5px 11px !important;
      font-size: 11.5px !important;
      font-weight: 600 !important;
      cursor: pointer !important;
      transition: all 0.2s ease !important;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04) !important;
    }

    .mm-chip-btn:hover {
      background-color: #be185d !important;
      color: #ffffff !important;
      border-color: #be185d !important;
    }

    .mm-action-pill-btn {
      display: inline-flex !important;
      align-items: center !important;
      gap: 6px !important;
      background: linear-gradient(135deg, #831843 0%, #be185d 100%) !important;
      color: #ffffff !important;
      border: 1px solid #f472b6 !important;
      border-radius: 20px !important;
      padding: 7px 14px !important;
      font-size: 12px !important;
      font-weight: 700 !important;
      cursor: pointer !important;
      margin-top: 10px !important;
      box-shadow: 0 3px 10px rgba(190, 24, 93, 0.3) !important;
      transition: all 0.2s ease !important;
      text-decoration: none !important;
    }

    .mm-action-pill-btn:hover {
      background: linear-gradient(135deg, #9d174d 0%, #db2777 100%) !important;
      transform: translateY(-1px) !important;
    }

    .mm-chat-footer {
      padding: 12px 14px !important;
      background-color: #ffffff !important;
      border-top: 1px solid #fbcfe8 !important;
      display: flex !important;
      gap: 8px !important;
      align-items: center !important;
    }

    .mm-chat-input {
      flex: 1 !important;
      border: 1.5px solid #e2e8f0 !important;
      border-radius: 22px !important;
      padding: 9px 14px !important;
      font-size: 13.5px !important;
      outline: none !important;
      background-color: #f8fafc !important;
      color: #1e293b !important;
      transition: border-color 0.2s ease !important;
      font-family: inherit !important;
    }

    .mm-chat-input:focus {
      border-color: #be185d !important;
      background-color: #ffffff !important;
    }

    .mm-chat-send {
      width: 38px !important;
      height: 38px !important;
      background: linear-gradient(135deg, #831843 0%, #be185d 100%) !important;
      color: #ffffff !important;
      border: none !important;
      border-radius: 50% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      cursor: pointer !important;
      font-size: 15px !important;
      box-shadow: 0 2px 6px rgba(190, 24, 93, 0.3) !important;
      transition: all 0.2s ease !important;
      flex-shrink: 0 !important;
    }

    .mm-chat-send:hover {
      transform: scale(1.05) !important;
      background: #be185d !important;
    }

    .mm-typing-indicator {
      display: inline-flex !important;
      align-items: center !important;
      gap: 6px !important;
      padding: 10px 14px !important;
      background: #ffffff !important;
      border: 1px solid #fbcfe8 !important;
      border-radius: 12px !important;
      align-self: flex-start !important;
      font-size: 12px !important;
      color: #831843 !important;
      font-weight: 500 !important;
    }

    .mm-dot {
      width: 6px !important;
      height: 6px !important;
      background: #be185d !important;
      border-radius: 50% !important;
      animation: mmBounce 1.4s infinite ease-in-out both !important;
    }
    .mm-dot:nth-child(1) { animation-delay: -0.32s !important; }
    .mm-dot:nth-child(2) { animation-delay: -0.16s !important; }

    @keyframes mmBounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1.0); }
    }

    @media (max-width: 600px) {
      #mameka-chat-modal {
        top: 56px !important;
        bottom: 64px !important;
        right: 8px !important;
        left: 8px !important;
        width: auto !important;
        max-width: none !important;
        height: auto !important;
        max-height: calc(100vh - 124px) !important;
        border-radius: 16px !important;
      }
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.id = 'mameka-chatbot-styles';
  styleEl.textContent = styleContent;
  document.head.appendChild(styleEl);

  const conversationHistory = [];

  function buildChatbotUI() {
    purgeBottomLauncher();

    let modal = document.getElementById('mameka-chat-modal');
    if (modal) return;

    modal = document.createElement('div');
    modal.id = 'mameka-chat-modal';
    modal.innerHTML = `
      <div class="mm-chat-header">
        <div class="mm-chat-header-info">
          <div class="mm-chat-brand-badge">
            <img src="/icons/logo-official.png" alt="మమేక మహోదయం AI" />
          </div>
          <div>
            <h3 class="mm-chat-title">మమేక మహోదయం</h3>
            <div class="mm-chat-sub">డిజిటల్ AI సహాయకుడు (AI Assistant)</div>
          </div>
        </div>
        <button class="mm-chat-close" id="mm-chat-close-btn" aria-label="ముగించు">&times;</button>
      </div>

      <div class="mm-chat-body" id="mm-chat-body">
        <div class="mm-msg bot">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
            <img src="/icons/logo-official.png" alt="AI" style="width: 20px; height: 20px; border-radius: 50%; object-fit: contain; background: #fff;" />
            <strong style="color: #831843;">మమేక AI సహాయకుడు</strong>
          </div>
          నమస్తే! <strong>మమేక మహోదయం</strong> అధికారిక డిజిటల్ AI సహాయకుడికి స్వాగతం.<br/><br/>
          మా వెబ్‌సైట్‌లోని <strong>తాజా వార్తలు</strong>, <strong>ఈ-పేపర్</strong>, లేదా <strong>విలేఖరుల వివరాలు</strong> గురించి నన్ను ఏమైనా అడగండి.
          <div class="mm-chat-chips">
            <button class="mm-chip-btn" data-query="మా వెబ్‌సైట్‌లో ఎన్ని వార్తలు ఉన్నాయి?">📰 మొత్తం వార్తలు</button>
            <button class="mm-chip-btn" data-query="వాకా శ్రీనివాసరావు గారి హోదా ఏమిటి?">👤 సంపాదకుల వివరాలు</button>
            <button class="mm-chip-btn" data-query="విలేఖరుల మరియు సంపాదకీయ బృందం వివరాలు">👥 విలేఖరుల బృందం</button>
            <button class="mm-chip-btn" data-query="ఈ-పేపర్ ఎలా చూడాలి?">📖 ఈ-పేపర్</button>
          </div>
        </div>
      </div>

      <div class="mm-chat-footer">
        <input type="text" id="mm-chat-input" class="mm-chat-input" placeholder="వార్తలు లేదా విలేఖరుల గురించి అడగండి..." />
        <button id="mm-chat-send-btn" class="mm-chat-send" aria-label="పంపు">➤</button>
      </div>
    `;

    document.body.appendChild(modal);

    const inputEl = document.getElementById('mm-chat-input');
    const sendBtn = document.getElementById('mm-chat-send-btn');
    const closeBtn = document.getElementById('mm-chat-close-btn');
    const bodyEl = document.getElementById('mm-chat-body');

    window.__mamekaOpenChatInternal = function (forceState) {
      if (typeof forceState === 'boolean') {
        modal.classList.toggle('open', forceState);
      } else {
        modal.classList.toggle('open');
      }
      if (modal.classList.contains('open')) {
        setTimeout(() => inputEl.focus(), 100);
      }
    };

    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      modal.classList.remove('open');
    });

    sendBtn.addEventListener('click', () => {
      const val = inputEl.value.trim();
      if (val) handleSendMessage(val);
    });

    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = inputEl.value.trim();
        if (val) handleSendMessage(val);
      }
    });

    bodyEl.addEventListener('click', (e) => {
      if (e.target.classList.contains('mm-chip-btn')) {
        const query = e.target.getAttribute('data-query');
        if (query) handleSendMessage(query);
      } else if (e.target.classList.contains('mm-action-pill-btn') || e.target.closest('.mm-action-pill-btn')) {
        const btn = e.target.classList.contains('mm-action-pill-btn') ? e.target : e.target.closest('.mm-action-pill-btn');
        const actData = btn.getAttribute('data-action');
        if (actData) {
          try {
            const act = JSON.parse(actData);
            executeWebsiteAction(act);
          } catch (err) {}
        }
      }
    });

    function executeWebsiteAction(act) {
      if (!act || !act.type) return;
      switch (act.type) {
        case 'NAVIGATE':
          if (act.url) window.location.href = act.url;
          break;
        case 'SWITCH_LANGUAGE':
          if (window.i18n && typeof window.i18n.setLanguage === 'function') {
            window.i18n.setLanguage(act.lang || 'te');
          } else {
            const url = new URL(window.location.href);
            url.searchParams.set('lang', act.lang || 'te');
            window.location.href = url.toString();
          }
          break;
        case 'SEARCH':
          if (act.query) {
            window.location.href = '/search.html?q=' + encodeURIComponent(act.query);
          } else if (act.url) {
            window.location.href = act.url;
          }
          break;
        case 'SCROLL':
          if (act.target) {
            const el = document.querySelector(act.target);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }
          break;
        case 'FILTER_DISTRICT':
          if (act.district) {
            window.location.href = act.url || (`/district.html?d=${act.district}`);
          }
          break;
        case 'FILTER_CATEGORY':
          if (act.category) {
            window.location.href = act.url || (`/category.html?c=${act.category}`);
          }
          break;
      }
    }

    async function handleSendMessage(userText) {
      inputEl.value = '';
      appendMessage(userText, 'user');

      const typingEl = document.createElement('div');
      typingEl.className = 'mm-typing-indicator';
      typingEl.id = 'mm-typing-indicator';
      typingEl.innerHTML = `<span>సమాధానం లోడ్ అవుతోంది</span> <div class="mm-dot"></div><div class="mm-dot"></div><div class="mm-dot"></div>`;
      bodyEl.appendChild(typingEl);
      scrollToBottom();

      try {
        const pageText = (document.querySelector('article, main, #main-content')?.innerText || '').slice(0, 500);

        const res = await fetch('/api/chatbot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userText,
            history: conversationHistory,
            currentPageUrl: window.location.pathname + window.location.search,
            currentPageTitle: document.title,
            pageExcerpt: pageText,
            lang: localStorage.getItem('mm_lang') || 'te'
          })
        });

        const indicator = document.getElementById('mm-typing-indicator');
        if (indicator) indicator.remove();

        if (res.ok) {
          const data = await res.json();
          const botReply = data.reply || "క్షమించండి, సమాధానం పొందుపరచలేకపోయాము.";
          appendMessage(botReply, 'bot', data.action);
          
          conversationHistory.push({ role: 'user', text: userText });
          conversationHistory.push({ role: 'model', text: botReply });
        } else {
          appendMessage("క్షమించండి, సర్వర్ కనెక్షన్ లోపం సంభవించింది. దయచేసి మళ్లీ ప్రయత్నించండి.", 'bot');
        }
      } catch (err) {
        const indicator = document.getElementById('mm-typing-indicator');
        if (indicator) indicator.remove();
        appendMessage("క్షమించండి, నెట్‌వర్క్ లోపం సంభవించింది.", 'bot');
      }
    }

    function appendMessage(text, sender, actionObj) {
      const msgDiv = document.createElement('div');
      msgDiv.className = `mm-msg ${sender}`;
      
      let formattedText = escapeHtml(text)
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_self">$1</a>')
        .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>')
        .replace(/\n/g, '<br/>');

      if (actionObj && actionObj.label) {
        const actJson = escapeHtml(JSON.stringify(actionObj));
        formattedText += `<br/><button class="mm-action-pill-btn" data-action="${actJson}">${escapeHtml(actionObj.label)}</button>`;
      }

      msgDiv.innerHTML = formattedText;
      bodyEl.appendChild(msgDiv);
      scrollToBottom();
    }

    function scrollToBottom() {
      bodyEl.scrollTop = bodyEl.scrollHeight;
    }

    function escapeHtml(unsafe) {
      return (unsafe || '')
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }
  }

  // 4. Capture-phase Global Click Listener: ALWAYS opens modal when top AI button is tapped
  document.addEventListener('click', function (e) {
    const trigger = e.target.closest('#mobile-top-ai-btn, .mobile-ai-badge, .top-ai-header-btn, .top-ai-btn, [data-open-ai-chat]');
    if (trigger) {
      e.preventDefault();
      e.stopPropagation();
      window.toggleMamekaChat();
      return;
    }

    // Dismiss when clicking outside modal
    const modal = document.getElementById('mameka-chat-modal');
    if (modal && modal.classList.contains('open')) {
      const isInside = modal.contains(e.target);
      if (!isInside) {
        modal.classList.remove('open');
      }
    }
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildChatbotUI);
  } else {
    buildChatbotUI();
  }

  // Continuous watcher to purge any rogue bottom launcher injected by stale cache
  setInterval(purgeBottomLauncher, 800);
})();
