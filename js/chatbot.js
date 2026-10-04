/**
 * MAMEKA MAHODAYAM - Official Digital AI Chatbot Widget (js/chatbot.js)
 * Floating Newspaper-Branded Chatbot for Website News & Reporter Enquiries.
 */

(function () {
  if (window.MamekaChatbotInitialized) return;
  window.MamekaChatbotInitialized = true;

  // Injected Scoped CSS Styles
  const styleContent = `
    #mameka-chat-launcher {
      position: fixed;
      bottom: 25px;
      right: 25px;
      z-index: 999999;
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
      color: #ffffff;
      border: 2px solid #ffffff;
      box-shadow: 0 8px 24px rgba(220, 38, 38, 0.45);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      outline: none;
      user-select: none;
    }
    #mameka-chat-launcher:hover {
      transform: scale(1.1) translateY(-2px);
      box-shadow: 0 12px 30px rgba(220, 38, 38, 0.6);
    }
    #mameka-chat-launcher:active {
      transform: scale(0.95);
    }

    #mameka-chat-launcher .launcher-emblem {
      font-size: 26px;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    #mameka-chat-launcher .pulse-ring {
      position: absolute;
      top: -4px;
      left: -4px;
      right: -4px;
      bottom: -4px;
      border-radius: 50%;
      border: 2px solid #dc2626;
      animation: mmPulse 2s infinite cubic-bezier(0.45, 0, 0.55, 1);
      pointer-events: none;
    }

    @keyframes mmPulse {
      0% { transform: scale(1); opacity: 0.8; }
      50% { transform: scale(1.18); opacity: 0; }
      100% { transform: scale(1); opacity: 0; }
    }

    #mameka-chat-modal {
      position: fixed;
      bottom: 95px;
      right: 25px;
      z-index: 999999;
      width: 380px;
      max-width: calc(100vw - 32px);
      height: 530px;
      max-height: calc(100vh - 120px);
      background-color: #ffffff;
      border-radius: 18px;
      box-shadow: 0 20px 45px rgba(15, 23, 42, 0.25);
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
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
      border-bottom: 3px solid #dc2626;
    }

    .mm-chat-header-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .mm-chat-brand-badge {
      width: 40px;
      height: 40px;
      background: #dc2626;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      box-shadow: 0 3px 10px rgba(220, 38, 38, 0.5);
    }
    .mm-chat-title {
      font-size: 15px;
      font-weight: 800;
      margin: 0;
      line-height: 1.2;
      color: #ffffff;
    }
    .mm-chat-sub {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 2px;
      font-weight: 500;
    }

    .mm-chat-close {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: #cbd5e1;
      font-size: 18px;
      cursor: pointer;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }
    .mm-chat-close:hover {
      background: #dc2626;
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
      max-width: 88%;
      padding: 12px 15px;
      border-radius: 14px;
      font-size: 13.5px;
      line-height: 1.55;
      word-wrap: break-word;
    }

    .mm-msg.bot {
      background-color: #ffffff;
      color: #1e293b;
      align-self: flex-start;
      border-bottom-left-radius: 3px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
    }

    .mm-msg.bot a {
      color: #dc2626;
      font-weight: 700;
      text-decoration: underline;
    }

    .mm-msg.user {
      background-color: #dc2626;
      color: #ffffff;
      align-self: flex-end;
      border-bottom-right-radius: 3px;
      box-shadow: 0 2px 6px rgba(220, 38, 38, 0.25);
    }

    .mm-chat-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 10px;
    }

    .mm-chip-btn {
      background-color: #ffffff;
      color: #0f172a;
      border: 1px solid #cbd5e1;
      border-radius: 18px;
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .mm-chip-btn:hover {
      background-color: #dc2626;
      color: #ffffff;
      border-color: #dc2626;
    }

    .mm-chat-footer {
      padding: 12px 16px;
      background-color: #ffffff;
      border-top: 1px solid #e2e8f0;
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .mm-chat-input {
      flex: 1;
      border: 1.5px solid #cbd5e1;
      border-radius: 24px;
      padding: 10px 16px;
      font-size: 13.5px;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .mm-chat-input:focus {
      border-color: #dc2626;
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    }

    .mm-chat-send {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: #dc2626;
      color: #ffffff;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      transition: background-color 0.2s, transform 0.1s;
      flex-shrink: 0;
    }
    .mm-chat-send:hover {
      background-color: #991b1b;
      transform: scale(1.05);
    }

    .mm-typing-indicator {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 14px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      align-self: flex-start;
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
    }
    .mm-dot {
      width: 6px;
      height: 6px;
      background: #dc2626;
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

  const conversationHistory = [];

  function buildUI() {
    if (document.getElementById('mameka-chat-launcher')) return;

    // Floating Circular Button (No text label, clean emblem logo)
    const launcher = document.createElement('button');
    launcher.id = 'mameka-chat-launcher';
    launcher.setAttribute('aria-label', 'మమేక మహోదయం డిజిటల్ సహాయకుడు');
    launcher.title = 'మమేక మహోదయం AI సహాయకుడు';
    launcher.innerHTML = `
      <div class="pulse-ring"></div>
      <div class="launcher-emblem">📰</div>
    `;

    // Modal Box
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
          మా వెబ్‌సైట్‌లోని <strong>తాజా వార్తలు</strong>, <strong>విలేఖరుల వివరాలు</strong>, లేదా ఇతర సమాచారం గురించి నన్ను ఏమైనా అడగండి.
          <div class="mm-chat-chips">
            <button class="mm-chip-btn" data-query="తాజా వార్తలు ఏమిటి?">📰 తాజా వార్తలు</button>
            <button class="mm-chip-btn" data-query="విలేఖరులు మరియు సంపాదకీయ బృందం వివరాలు">👥 విలేఖరుల వివరాలు</button>
            <button class="mm-chip-btn" data-query="ఈ-పేపర్ ఎలా చూడాలి?">📖 ఈ-పేపర్</button>
            <button class="mm-chip-btn" data-query="కార్యాలయ సంప్రదింపు వివరాలు">📞 సంప్రదించండి</button>
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
