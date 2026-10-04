/**
 * MAMEKA MAHODAYAM - Official AI Chatbot Widget (js/chatbot.js)
 * Fully self-contained floating chatbot for news, reporters, and website inquiries.
 */

(function () {
  if (window.MamekaChatbotInitialized) return;
  window.MamekaChatbotInitialized = true;

  // Injected CSS Styles
  const styleContent = `
    #mameka-chat-launcher {
      position: fixed;
      bottom: 25px;
      right: 25px;
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 10px;
      background: linear-[#0f172a, #1e293b];
      background-color: #0f172a;
      color: #ffffff;
      border: 2px solid #dc2626;
      border-radius: 50px;
      padding: 10px 18px 10px 14px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
      cursor: pointer;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    #mameka-chat-launcher:hover {
      transform: translateY(-4px) scale(1.03);
      box-shadow: 0 14px 30px rgba(220, 38, 38, 0.4);
      border-color: #ef4444;
    }
    #mameka-chat-launcher .launcher-icon {
      font-size: 24px;
      line-height: 1;
      position: relative;
    }
    #mameka-chat-launcher .online-pulse {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 10px;
      height: 10px;
      background-color: #22c55e;
      border: 2px solid #0f172a;
      border-radius: 50%;
    }
    #mameka-chat-launcher .launcher-text {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.3px;
      color: #ffffff;
    }

    #mameka-chat-modal {
      position: fixed;
      bottom: 90px;
      right: 25px;
      z-index: 999999;
      width: 380px;
      max-width: calc(100vw - 32px);
      height: 520px;
      max-height: calc(100vh - 120px);
      background-color: #ffffff;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      transition: all 0.3s ease;
      opacity: 0;
      transform: translateY(20px) scale(0.95);
      pointer-events: none;
    }

    #mameka-chat-modal.open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }

    .mm-chat-header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #ffffff;
      padding: 14px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #dc2626;
    }

    .mm-chat-header-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .mm-chat-avatar {
      width: 38px;
      height: 38px;
      background: #dc2626;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      box-shadow: 0 2px 8px rgba(220, 38, 38, 0.5);
    }
    .mm-chat-title {
      font-size: 15px;
      font-weight: 700;
      margin: 0;
      line-height: 1.2;
    }
    .mm-chat-sub {
      font-size: 11px;
      color: #cbd5e1;
      margin-top: 2px;
    }

    .mm-chat-close {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 20px;
      cursor: pointer;
      padding: 4px;
      line-height: 1;
      border-radius: 4px;
      transition: color 0.2s;
    }
    .mm-chat-close:hover {
      color: #ffffff;
    }

    .mm-chat-body {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      background-color: #f8fafc;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .mm-msg {
      max-width: 85%;
      padding: 12px 14px;
      border-radius: 14px;
      font-size: 13.5px;
      line-height: 1.5;
      word-wrap: break-word;
    }

    .mm-msg.bot {
      background-color: #ffffff;
      color: #1e293b;
      align-self: flex-start;
      border-bottom-left-radius: 2px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.03);
    }

    .mm-msg.bot a {
      color: #dc2626;
      font-weight: 600;
      text-decoration: underline;
    }

    .mm-msg.user {
      background-color: #dc2626;
      color: #ffffff;
      align-self: flex-end;
      border-bottom-right-radius: 2px;
    }

    .mm-chat-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 6px;
    }

    .mm-chip-btn {
      background-color: #edf2f7;
      color: #0f172a;
      border: 1px solid #cbd5e1;
      border-radius: 20px;
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .mm-chip-btn:hover {
      background-color: #dc2626;
      color: #ffffff;
      border-color: #dc2626;
    }

    .mm-chat-footer {
      padding: 12px;
      background-color: #ffffff;
      border-top: 1px solid #e2e8f0;
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .mm-chat-input {
      flex: 1;
      border: 1px solid #cbd5e1;
      border-radius: 24px;
      padding: 10px 16px;
      font-size: 13.5px;
      outline: none;
      transition: border-color 0.2s;
    }
    .mm-chat-input:focus {
      border-color: #dc2626;
    }

    .mm-chat-send {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background-color: #dc2626;
      color: #ffffff;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      transition: background-color 0.2s, transform 0.1s;
    }
    .mm-chat-send:hover {
      background-color: #b91c1c;
      transform: scale(1.05);
    }

    .mm-typing-indicator {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 8px 12px;
      background: #f1f5f9;
      border-radius: 12px;
      align-self: flex-start;
      font-size: 12px;
      color: #64748b;
    }
    .mm-dot {
      width: 6px;
      height: 6px;
      background: #94a3b8;
      border-radius: 50%;
      animation: mmBounce 1.4s infinite ease-in-out both;
    }
    .mm-dot:nth-child(1) { animation-delay: -0.32s; }
    .mm-dot:nth-child(2) { animation-delay: -0.16s; }

    @keyframes mmBounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1.0); }
    }
  `;

  // Inject Styles
  const styleEl = document.createElement('style');
  styleEl.id = 'mameka-chatbot-styles';
  styleEl.textContent = styleContent;
  document.head.appendChild(styleEl);

  // Chatbot State
  const conversationHistory = [];

  function buildUI() {
    if (document.getElementById('mameka-chat-launcher')) return;

    // Launcher Button
    const launcher = document.createElement('button');
    launcher.id = 'mameka-chat-launcher';
    launcher.setAttribute('aria-label', 'మమేక AI సహాయకుడిని సంప్రదించండి');
    launcher.innerHTML = `
      <div class="launcher-icon">
        🤖
        <span class="online-pulse"></span>
      </div>
      <span class="launcher-text">మమేక AI</span>
    `;

    // Modal Box
    const modal = document.createElement('div');
    modal.id = 'mameka-chat-modal';
    modal.innerHTML = `
      <div class="mm-chat-header">
        <div class="mm-chat-header-info">
          <div class="mm-chat-avatar">🤖</div>
          <div>
            <h3 class="mm-chat-title">మమేక AI సహాయకుడు</h3>
            <div class="mm-chat-sub">మమేక మహోదయం వార్తలు & వివరాలు</div>
          </div>
        </div>
        <button class="mm-chat-close" id="mm-chat-close-btn" aria-label="ముగించు">&times;</button>
      </div>

      <div class="mm-chat-body" id="mm-chat-body">
        <div class="mm-msg bot">
          నమస్తే! 👋 నేను <strong>మమేక మహోదయం AI సహాయకుడిని</strong>.<br/><br/>
          మా వెబ్‌సైట్‌లోని <strong>తాజా వార్తలు</strong>, <strong>విలేఖరుల వివరాలు</strong>, లేదా ఇతర వెబ్‌సైట్ సమాచారం గురించి నన్ను ఏమైనా అడగండి.
          <div class="mm-chat-chips">
            <button class="mm-chip-btn" data-query="తాజా వార్తలు ఏమిటి?">📰 తాజా వార్తలు</button>
            <button class="mm-chip-btn" data-query="విలేఖరులు మరియు సంపాదకీయ బృందం వివరాలు">👥 విలేఖరుల వివరాలు</button>
            <button class="mm-chip-btn" data-query="ఈ-పేపర్ ఎలా చూడాలి?">📖 ఈ-పేపర్ సమాచారం</button>
            <button class="mm-chip-btn" data-query="సంప్రదించే వివరాలు">📞 సంప్రదించే వివరాలు</button>
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

    // Event Listeners
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

      // Append typing indicator
      const typingEl = document.createElement('div');
      typingEl.className = 'mm-typing-indicator';
      typingEl.id = 'mm-typing-indicator';
      typingEl.innerHTML = `<span>AI సమాధానం సిద్ధం చేస్తోంది</span> <div class="mm-dot"></div><div class="mm-dot"></div><div class="mm-dot"></div>`;
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
          
          // Store conversation history
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
      
      // Simple markdown link parser for clickable HTML links
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
