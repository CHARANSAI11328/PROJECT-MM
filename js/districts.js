/**
 * MAMEKA MAHODAYAM - Dynamic District Navigation & Selector Engine
 * Dynamically builds and syncs District Tabs & Dropdowns for all 26 AP Districts.
 */

document.addEventListener('DOMContentLoaded', () => {
  const districtsConfig = (typeof MAMEKA_DISTRICTS !== 'undefined') ? MAMEKA_DISTRICTS : null;

  // 1. Populate District Selector Components Dynamically if Config Loaded
  if (districtsConfig) {
    const allDistricts = districtsConfig.getAllDistricts();

    document.querySelectorAll('.district-selector-bar').forEach(bar => {
      const dropdown = bar.querySelector('.district-select-dropdown');
      const navWrap = bar.querySelector('.district-nav-wrap');

      // Populate Dropdown
      if (dropdown && dropdown.options.length <= 1) {
        dropdown.innerHTML = allDistricts.map(d => `
          <option value="${d.code}">${d.name_te} (${d.name_en})</option>
        `).join('');
      }

      // Populate Nav Tabs
      if (navWrap && navWrap.children.length <= 1) {
        navWrap.innerHTML = allDistricts.map((d, index) => `
          <button class="district-tab-btn ${index === 0 ? 'active' : ''}" role="tab" type="button" data-district="${d.code}">
            ${d.name_te}
          </button>
        `).join('');
      }
    });
  }

  // 2. Convert Vertical Mouse Wheel Scrolling to Smooth Horizontal Scrolling
  const navContainers = document.querySelectorAll('.district-nav-wrap');
  navContainers.forEach(container => {
    container.addEventListener('wheel', (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        container.scrollLeft += e.deltaY * 1.5;
      }
    }, { passive: false });
  });

  // 3. Attach Interactive Sync Logic
  const districtBars = document.querySelectorAll('.district-selector-bar');
  districtBars.forEach(bar => {
    const nav = bar.querySelector('.district-nav-wrap');
    const leftBtn = bar.querySelector('.scroll-arrow.left');
    const rightBtn = bar.querySelector('.scroll-arrow.right');
    const dropdown = bar.querySelector('.district-select-dropdown');

    // Scroll Arrow Buttons
    if (nav && leftBtn) {
      leftBtn.addEventListener('click', () => {
        nav.scrollBy({ left: -240, behavior: 'smooth' });
      });
    }
    if (nav && rightBtn) {
      rightBtn.addEventListener('click', () => {
        nav.scrollBy({ left: 240, behavior: 'smooth' });
      });
    }

    // Dropdown to Tab Button Sync
    if (dropdown && nav) {
      dropdown.addEventListener('change', (e) => {
        const selectedVal = e.target.value;
        const targetBtn = Array.from(nav.querySelectorAll('.district-tab-btn')).find(btn => {
          return btn.getAttribute('data-district') === selectedVal ||
                 btn.getAttribute('data-district-slug') === selectedVal;
        });

        if (targetBtn) {
          nav.querySelectorAll('.district-tab-btn').forEach(b => b.classList.remove('active'));
          targetBtn.classList.add('active');
          targetBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      });
    }

    // Tab Button Click to Dropdown Sync
    if (nav && dropdown) {
      nav.addEventListener('click', (e) => {
        const btn = e.target.closest('.district-tab-btn');
        if (btn) {
          nav.querySelectorAll('.district-tab-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const distCode = btn.getAttribute('data-district') || btn.getAttribute('data-district-slug');
          if (distCode) {
            dropdown.value = distCode;
            dropdown.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      });
    }
  });

  // 4. Initial Active State Sync based on URL
  const searchParams = new URLSearchParams(window.location.search);
  let activeDistrict = searchParams.get('d');
  
  // Support pathname routing e.g. /district/bapatla
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  if (!activeDistrict && pathParts.length >= 2 && pathParts[0] === 'district') {
    activeDistrict = pathParts[1];
  }

  if (activeDistrict) {
    document.querySelectorAll('.district-selector-bar').forEach(bar => {
      const dropdown = bar.querySelector('.district-select-dropdown');
      const nav = bar.querySelector('.district-nav-wrap');
      if (dropdown) dropdown.value = activeDistrict;
      if (nav) {
        const activeBtn = Array.from(nav.querySelectorAll('.district-tab-btn')).find(btn => 
          btn.getAttribute('data-district') === activeDistrict
        );
        if (activeBtn) {
          nav.querySelectorAll('.district-tab-btn').forEach(b => b.classList.remove('active'));
          activeBtn.classList.add('active');
          activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }
    });
  }
});
