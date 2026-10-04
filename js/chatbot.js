/**
 * MAMEKA MAHODAYAM - Official Digital AI Chatbot Widget (js/chatbot.js)
 * Fully Floating Newspaper-Branded Chatbot for Website News & Reporter Enquiries.
 */

(function () {
  if (window.MamekaChatbotInitialized) return;
  window.MamekaChatbotInitialized = true;

  // Injected Scoped CSS Styles with Strict Viewport Floating Position Overrides
  const styleContent = `
    #mameka-chat-launcher {
      position: fixed !important;
      bottom: 30px !important;
      right: 30px !important;
      top: auto !important;
      left: auto !important;
      z-index: 2147483647 !important;
      width: 60px !important;
      height: 60px !important;
      border-radius: 50% !important;
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%) !important;
      color: #ffffff !important;
      border: 3px solid #ffffff !important;
      box-shadow: 0 10px 28px rgba(220, 38, 38, 0.55) !important;
      cursor: pointer !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease !important;
      outline: none !important;
      user-select: none !important;
      margin: 0 !important;
      padding: 0 !important;
      float: none !important;
      clear: both !important;
    }

    #mameka-chat-launcher:hover {
      transform: scale(1.1) translateY(-3px) !important;
      box-shadow: 0 14px 34px rgba(220, 38, 38, 0.68) !important;
    }

    #mameka-chat-launcher:active {
      transform: scale(0.95) !important;
    }

    #mameka-chat-launcher .launcher-emblem {
      font-size: 28px !important;
      line-height: 1 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }

    #mameka-chat-launcher .pulse-ring {
      position: absolute !important;
      top: -4px !important;
      left: -4px !important;
      right: -4px !important;
      bottom: -4px !important;
      border-radius: 50% !important;
      border: 2px solid #dc2626 !important;
      animation: mmPulse 2s infinite cubic-bezier(0.45, 0, 0.55, 1) !important;
      pointer-events: none !important;
    }

    @keyframes mmPulse {
      0% { transform: scale(1); opacity: 0.8; }
      50% { transform: scale(1.18); opacity: 0; }
      100% { transform: scale(1); opacity: 0; }
    }

    #mameka-chat-modal {
      position: fixed !important;
      bottom: 102px !important;
      right: 30px !important;
      top: auto !important;
      left: auto !important;
      z-index: 2147483647 !important;
      width: 390px !important;
      max-width: calc(100vw - 40px) !important;
      height: 540px !important;
      max-height: calc(100vh - 130px) !important;
      background-color: #ffffff !important;
      border-radius: 18px !important;
      box-shadow: 0 20px 50px rgba(15, 23, 42, 0.28) !important;
      border: 1px solid #e2e8f0 !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
      opacity: 0 !important;
      transform: translateY(20px) scale(0.95) !important;
      pointer-events: none !important;
      margin: 0 !important;
    }

    #mameka-chat-modal.open {
      opacity: 1 !important;
      transform: translateY(0) scale(1) !important;
      pointer-events: auto !important;
    }

    .mm-chat-header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%) !important;
      color: #ffffff !important;
      padding: 14px 18px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      border-bottom: 3px solid #dc2626 !important;
    }

    .mm-chat-header-info {
      display: flex !important;
      align-items: center !important;
      gap: 12px !important;
    }

    .mm-chat-brand-badge {
      width: 40px !important;
      height: 40px !important;
      background: #dc2626 !important;
      border-radius: 10px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 22px !important;
      box-shadow: 0 3px 10px rgba(220, 38, 38, 0.5) !important;
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
      color: #94a3b8 !important;
      margin-top: 2px !important;
      font-weight: 500 !important;
    }

    .mm-chat-close {
      background: rgba(255, 255, 255, 0.1) !important;
      border: none !important;
      color: #cbd5e1 !important;
      font-size: 18px !important;
      cursor: pointer !important;
      width: 28px !important;
      height: 28px !important;
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
      background-color: #f8fafc !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 12px !important;
    }

    .mm-msg {
      max-width: 88% !important;
      padding: 12px 15px !important;
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
      border: 1px solid #e2e8f0 !important;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03) !important;
    }

    .mm-msg.bot a {
      color: #dc2626 !important;
      font-weight: 700 !important;
      text-decoration: underline !important;
    }

    .mm-msg.user {
      background-color: #dc2626 !important;
      color: #ffffff !important;
      align-self: flex-end !important;
      border-bottom-right-radius: 3px !important;
      box-shadow: 0 2px 6px rgba(220, 38, 38, 0.25) !important;
    }

    .mm-chat-chips {
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 6px !important;
      margin-top: 10px !important;
    }

    .mm-chip-btn {
      background-color: #ffffff !important;
      color: #0f172a !important;
      border: 1px solid #cbd5e1 !important;
      border-radius: 18px !important;
      padding: 6px 12px !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      cursor: pointer !important;
      transition: all 0.2s ease !important;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05) !important;
    }

    .mm-chip-btn:hover {
      background-color: #dc2626 !important;
      color: #ffffff !important;
      border-color: #dc2626 !important;
    }

    .mm-chat-footer {
      padding: 12px 16px !important;
      background-color: #ffffff !important;
      border-top: 1px solid #e2e8f0 !important;
      display: flex !important;
      gap: 8px !important;
      align-items: center !important;
    }

    .mm-chat-input {
      flex: 1 !important;
      border: 1.5px solid #cbd5e1 !important;
      border-radius: 24px !important;
      padding: 10px 16px !important;
      font-size: 13.5px !important;
      outline: none !important;
      transition: border-color 0.2s, box-shadow 0.2s !important;
    }

    .mm-chat-input:focus {
      border-color: #dc2626 !important;
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1) !important;
    }

    .mm-chat-send {
      width: 40px !important;
      height: 40px !important;
      border-radius: 50% !important;
      background-color: #dc2626 !important;
      color: #ffffff !important;
      border: none !important;
      cursor: pointer !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 15px !important;
      transition: background-color 0.2s, transform 0.1s !important;
      flex-shrink: 0 !important;
    }

    .mm-chat-send:hover {
      background-color: #991b1b !important;
      transform: scale(1.05) !important;
    }

    .mm-typing-indicator {
      display: inline-flex !important;
      align-items: center !important;
      gap: 6px !important;
      padding: 10px 14px !important;
      background: #ffffff !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 12px !important;
      align-self: flex-start !important;
      font-size: 12px !important;
      color: #64748b !important;
      font-weight: 500 !important;
    }

    .mm-dot {
      width: 6px !important;
      height: 6px !important;
      background: #dc2626 !important;
      border-radius: 50% !important;
      animation: mmBounce 1.4s infinite ease-in-out both !important;
    }
    .mm-dot:nth-child(1) { animation-delay: -0.32s !important; }
    .mm-dot:nth-child(2) { animation-delay: -0.16s !important; }

    @media (max-width: 600px) {
      #mameka-chat-launcher {
        bottom: 24px !important;
        right: 20px !important;
        width: 54px !important;
        height: 54px !important;
      }
      #mameka-chat-modal {
        bottom: 88px !important;
        right: 15px !important;
        left: 15px !important;
        width: auto !important;
        max-width: none !important;
        height: calc(100vh - 110px) !important;
        max-height: 560px !important;
      }
    }
  `;

  // Inject Styles
  const styleEl = document.createElement('style');
  styleEl.id = 'mameka-chatbot-styles';
  styleEl.textContent = styleContent;
  document.head.appendChild(styleEl);

  const conversationHistory = [];

  function buildUI() {
    if (document.getElementById('mameka-chat-launcher')) return;

    const launcher = document.createElement('button');
    launcher.id = 'mameka-chat-launcher';
    launcher.setAttribute('aria-label', 'మమేక మహోదయం డిజిటల్ సహాయకుడు');
    launcher.title = 'మమేక మహోదయం AI సహాయకుడు';
    launcher.innerHTML = `
      <div class="pulse-ring"></div>
      <div class="launcher-emblem">📰</div>
    `;

    const modal = document.createElement('div');
    modal.id = 'mameka-chat-modal';
    modal.innerHTML = `
      <div class="mm-chat-header">
        <div class="mm-chat-header-info">
          <div class="mm-chat-brand-badge">📰</div>
          <div>
            <h3 class="mm-chat-title">మమేక మహోదయం</h3>
            <div class="mm-chat-sub">డిజిటల్ AI సహాయకుడు</div>
          </div>
        </div>
        <button class="mm-chat-close" id="mm-chat-close-btn" aria-label="ముగించు">&times;</button>
      </div>

      <div class="mm-chat-body" id="mm-chat-body">
        <div class="mm-msg bot">
          నమస్తే! 📰 <strong>మమేక మహోదయం</strong> డిజిటల్ సహాయకుడికి స్వాగతం.<br/><br/>
          మా వెబ్‌సైట్‌లోని <strong>వార్తలు</strong>, <strong>విలేఖరుల వివరాలు</strong>, లేదా ఇతర సమాచారం గురించి నన్ను ఏమైనా అడగండి.
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

    document.body.appendChild(launcher);
    document.body.appendChild(modal);

    const inputEl = document.getElementById('mm-chat-input');
    const sendBtn = document.getElementById('mm-chat-send-btn');
    const closeBtn = document.getElementById('mm-chat-close-btn');
    const bodyEl = document.getElementById('mm-chat-body');

    function toggleChat() {
      modal.classList.toggle('open');
      if (modal.classList.contains('open')) {
        inputEl.focus();
      }
    }

    launcher.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);

    bodyEl.addEventListener('click', (e) => {
      if (e.target.classList.contains('mm-chip-btn')) {
        const query = e.target.getAttribute('data-query');
        if (query) {
          handleSendMessage(query);
        }
      }
    });

    sendBtn.addEventListener('click', () => {
      const val = inputEl.value.trim();
      if (val) {
        handleSendMessage(val);
      }
    });

    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = inputEl.value.trim();
        if (val) {
          handleSendMessage(val);
        }
      }
    });

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
        const res = await fetch('/api/chatbot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userText,
            history: conversationHistory
          })
        });

        const indicator = document.getElementById('mm-typing-indicator');
        if (indicator) indicator.remove();

        if (res.ok) {
          const data = await res.json();
          const botReply = data.reply || "క్షమించండి, సమాధానం పొందుపరచలేకపోయాము.";
          appendMessage(botReply, 'bot');
          
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

    function appendMessage(text, sender) {
      const msgDiv = document.createElement('div');
      msgDiv.className = `mm-msg ${sender}`;
      
      let formattedText = escapeHtml(text)
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_self">$1</a>')
        .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>')
        .replace(/\n/g, '<br/>');

      msgDiv.innerHTML = formattedText;
      bodyEl.appendChild(msgDiv);
      scrollToBottom();
    }

    function scrollToBottom() {
      bodyEl.scrollTop = bodyEl.scrollHeight;
    }

    function escapeHtml(unsafe) {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildUI);
  } else {
    buildUI();
  }
})();
