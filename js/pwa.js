/**
 * MAMEKA MAHODAYAM (మమేక మహోదయం) - PWA Client Controller (js/pwa.js)
 * Manages Service Worker lifecycle, Web App Install Banners, and Native Standalone Integration.
 */

(function () {
  'use strict';

  // 1. Service Worker Registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('✓ [PWA] Service Worker registered successfully with scope:', registration.scope);

          // Handle automatic updates when new content/features are deployed
          registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('⚡ [PWA] New version available in background.');
                }
              });
            }
          });
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration notice:', err);
        });
    });
  }

  // 2. Detection of Standalone Mode (Already running as installed app)
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://') ||
    window.location.search.includes('source=pwa') ||
    window.location.search.includes('utm_source=pwa');

  if (isStandalone) {
    document.documentElement.classList.add('is-pwa-standalone');
    console.log('✓ [PWA] Running in Standalone Native Newspaper Mode');
    return; // Don't show install prompts if already running as installed app
  }

  // 3. Platform Detection
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  let deferredPrompt = null;
  const DISMISS_KEY = 'mameka_pwa_banner_dismissed_at';
  const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24 Hours

  function isDismissedRecently() {
    try {
      const dismissed = localStorage.getItem(DISMISS_KEY);
      if (!dismissed) return false;
      return Date.now() - parseInt(dismissed, 10) < DISMISS_DURATION_MS;
    } catch (e) {
      return false;
    }
  }

  function markDismissed() {
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch (e) {}
  }

  // 4. Inject Scoped PWA Banner Styles
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    #mameka-pwa-banner {
      position: fixed;
      bottom: 74px;
      left: 16px;
      right: 16px;
      max-width: 480px;
      margin: 0 auto;
      z-index: 2147483640;
      background: linear-gradient(135deg, #1e111a 0%, #2a081a 100%);
      border: 1.5px solid #ffcc00;
      border-radius: 18px;
      padding: 14px 16px;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45), 0 0 18px rgba(255, 204, 0, 0.2);
      display: flex;
      align-items: center;
      gap: 12px;
      color: #ffffff;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      animation: mmPwaSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes mmPwaSlideUp {
      from { transform: translateY(40px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .mm-pwa-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: #8a084b;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
      flex-shrink: 0;
      object-fit: cover;
      border: 1.5px solid #ffcc00;
    }

    .mm-pwa-info {
      flex: 1;
      min-width: 0;
    }

    .mm-pwa-title {
      font-size: 14px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .mm-pwa-badge {
      font-size: 10px;
      background: #ffcc00;
      color: #1a020d;
      font-weight: 800;
      padding: 1px 6px;
      border-radius: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .mm-pwa-desc {
      font-size: 11.5px;
      color: #cbd5e1;
      line-height: 1.35;
    }

    .mm-pwa-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }

    .mm-pwa-install-btn {
      background: linear-gradient(135deg, #ffcc00 0%, #e6b800 100%);
      color: #1a020d;
      border: none;
      padding: 8px 14px;
      border-radius: 20px;
      font-size: 12.5px;
      font-weight: 800;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      box-shadow: 0 4px 12px rgba(255, 204, 0, 0.35);
      transition: transform 0.2s ease, filter 0.2s ease;
      white-space: nowrap;
    }

    .mm-pwa-install-btn:active {
      transform: scale(0.96);
    }

    .mm-pwa-close-btn {
      background: rgba(255, 255, 255, 0.12);
      border: none;
      color: #e2e8f0;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .mm-pwa-close-btn:hover {
      background: rgba(255, 255, 255, 0.25);
    }

    /* iOS Modal Guide */
    #mameka-ios-guide {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 2147483645;
      background: #ffffff;
      border-top-left-radius: 24px;
      border-top-right-radius: 24px;
      padding: 24px 20px 34px;
      box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.3);
      border-top: 3px solid #d81b7a;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      text-align: center;
      animation: mmPwaSlideUp 0.3s ease-out;
    }

    .ios-step-box {
      background: #fdf2f8;
      border-radius: 14px;
      padding: 14px;
      margin: 14px 0;
      font-size: 13.5px;
      color: #1e293b;
      line-height: 1.6;
      border: 1px dashed #f472b6;
    }

    /* Responsive adjustments */
    @media (min-width: 768px) {
      #mameka-pwa-banner {
        bottom: 24px;
        left: auto;
        right: 104px; /* leaves room for chatbot */
        width: 380px;
      }
    }
  `;
  document.head.appendChild(styleEl);

  // 5. Render Banner Function
  function showPwaInstallBanner() {
    if (document.getElementById('mameka-pwa-banner') || isDismissedRecently()) {
      return;
    }

    const banner = document.createElement('div');
    banner.id = 'mameka-pwa-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'మమేక మహోదయం యాప్ ఇన్‌స్టాల్');

    banner.innerHTML = `
      <img src="/icons/icon-192.png" alt="Mameka Logo" class="mm-pwa-icon" />
      <div class="mm-pwa-info">
        <div class="mm-pwa-title">
          <span>మమేక మహోదయం</span>
          <span class="mm-pwa-badge">యాప్</span>
        </div>
        <div class="mm-pwa-desc">హోమ్ స్క్రీన్‌పై ఇన్‌స్టాల్ చేసి, వేగంగా ఈ-పేపర్ & వార్తలు చదవండి</div>
      </div>
      <div class="mm-pwa-actions">
        <button type="button" class="mm-pwa-install-btn" id="mm-pwa-install-action">
          📲 ఇన్‌స్టాల్
        </button>
        <button type="button" class="mm-pwa-close-btn" id="mm-pwa-dismiss-action" aria-label="తర్వాత">✕</button>
      </div>
    `;

    document.body.appendChild(banner);

    const installBtn = document.getElementById('mm-pwa-install-action');
    const dismissBtn = document.getElementById('mm-pwa-dismiss-action');

    installBtn.addEventListener('click', triggerInstallFlow);
    dismissBtn.addEventListener('click', () => {
      banner.remove();
      markDismissed();
    });
  }

  // 6. Trigger App Installation Flow
  async function triggerInstallFlow() {
    const banner = document.getElementById('mameka-pwa-banner');

    if (deferredPrompt) {
      // Android / Chrome / Edge native install prompt
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      console.log('[PWA] User choice:', choiceResult.outcome);
      if (choiceResult.outcome === 'accepted') {
        if (banner) banner.remove();
      }
      deferredPrompt = null;
    } else if (isIOS && isSafari) {
      // iOS Safari Custom Guide Sheet
      if (banner) banner.remove();
      showIOSGuide();
    } else {
      // Fallback for browsers that support menu install
      alert('మమేక మహోదయం యాప్‌ను ఇన్‌స్టాల్ చేయడానికి బ్రౌజర్ మెనూ (⋮) లో "Install App" లేదా "Add to Home Screen" ను ఎంచుకోండి.');
    }
  }

  // 7. iOS Safari Add-to-Home-Screen Guide Modal
  function showIOSGuide() {
    if (document.getElementById('mameka-ios-guide')) return;

    const guide = document.createElement('div');
    guide.id = 'mameka-ios-guide';
    guide.innerHTML = `
      <div style="font-size: 28px; margin-bottom: 6px;">📲</div>
      <h3 style="margin: 0 0 6px 0; color: #8a084b; font-size: 1.15rem; font-weight: 800;">ఐఫోన్ / ఐప్యాడ్‌లో ఇన్‌స్టాల్ చేయండి</h3>
      <p style="margin: 0; color: #64748b; font-size: 0.85rem;">యాప్ స్టోర్ అవసరం లేకుండా కేవలం 2 స్టెప్పుల్లో హోమ్ స్క్రీన్‌కు జోడించండి:</p>
      <div class="ios-step-box">
        1. క్రింది సఫారీ బార్‌లో <strong>షేర్ బటన్ [⎋]</strong> నొక్కండి.<br/>
        2. కొద్దిగా క్రిందికి స్క్రోల్ చేసి <strong>"Add to Home Screen (+)"</strong> ఎంచుకోండి.
      </div>
      <button type="button" id="mm-ios-close-btn" style="background: #8a084b; color: #fff; border: none; padding: 10px 24px; border-radius: 20px; font-weight: bold; cursor: pointer;">అర్థమైంది (Done)</button>
    `;

    document.body.appendChild(guide);
    document.getElementById('mm-ios-close-btn').addEventListener('click', () => {
      guide.remove();
      markDismissed();
    });
  }

  // 8. Event Listeners for PWA triggers
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent default mini-infobar on mobile Chrome
    e.preventDefault();
    deferredPrompt = e;
    console.log('[PWA] beforeinstallprompt event captured');

    // Show prompt after a small 2-second delay so user sees the page first
    setTimeout(() => {
      showPwaInstallBanner();
    }, 2000);
  });

  window.addEventListener('appinstalled', () => {
    console.log('✓ [PWA] Mameka Mahodayam app successfully installed on device!');
    const banner = document.getElementById('mameka-pwa-banner');
    if (banner) banner.remove();
    deferredPrompt = null;
  });

  // If on iOS and not dismissed, show banner after 3 seconds
  if (isIOS && isSafari && !isDismissedRecently()) {
    setTimeout(() => {
      showPwaInstallBanner();
    }, 3000);
  }

  // 9. Expose global trigger for manual buttons (in header, nav drawer, or footer)
  window.mamekaInstallApp = triggerInstallFlow;
})();
