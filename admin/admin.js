// MAMEKA MAHODAYAM - Admin Portal Client Engine (Production Real CMS)
function initAdminApp() {
    // Top-level DOM Elements
    const loginView = document.getElementById('login-view');
    const dashboardView = document.getElementById('dashboard-view');
    const loginForm = document.getElementById('login-form');
    const loginAlert = document.getElementById('login-alert');
    const logoutBtn = document.getElementById('logout-btn');
    const adminUsernameDisplay = document.getElementById('admin-username-display');
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const adminSidebar = document.getElementById('admin-sidebar');

    // Route / View Sections
    const views = {
        dashboard: document.getElementById('view-dashboard'),
        'create-news': document.getElementById('view-create-news'),
        media: document.getElementById('view-media'),
        editions: document.getElementById('view-editions'),
        'edition-detail': document.getElementById('view-edition-detail'),
        upload: document.getElementById('view-upload'),
        articles: document.getElementById('view-articles'),
        'article-edit': document.getElementById('view-article-edit'),
        reporters: document.getElementById('view-reporters'),
        settings: document.getElementById('view-settings')
    };

    // State Variables
    let activeEditionId = null;
    let activeArticleId = null;
    let currentArticleData = null;
    let currentZoomScale = 1.0;

    // Mobile Drawer Controller
    const sidebarBackdrop = document.getElementById('admin-sidebar-backdrop');
    function toggleMobileSidebar(open) {
        if (!adminSidebar) return;
        const shouldOpen = (open !== undefined) ? open : !adminSidebar.classList.contains('mobile-open');
        if (shouldOpen) {
            adminSidebar.classList.add('mobile-open');
            if (sidebarBackdrop) sidebarBackdrop.classList.add('active');
            document.body.classList.add('sidebar-open-lock');
        } else {
            adminSidebar.classList.remove('mobile-open');
            if (sidebarBackdrop) sidebarBackdrop.classList.remove('active');
            document.body.classList.remove('sidebar-open-lock');
        }
    }

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMobileSidebar();
        });
    }

    if (sidebarBackdrop) {
        sidebarBackdrop.addEventListener('click', () => {
            toggleMobileSidebar(false);
        });
    }

    const mobileSidebarClose = document.getElementById('mobile-sidebar-close');
    if (mobileSidebarClose) {
        mobileSidebarClose.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMobileSidebar(false);
        });
    }

    const sidebarLogoutBtn = document.getElementById('sidebar-logout-btn');
    if (sidebarLogoutBtn) {
        sidebarLogoutBtn.addEventListener('click', () => {
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_username');
            window.location.hash = '#/dashboard';
            checkAuth();
        });
    }

    // Auto-close sidebar on mobile when any sidebar navigation link is clicked
    if (adminSidebar) {
        adminSidebar.querySelectorAll('.sidebar-nav a').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 992) {
                    toggleMobileSidebar(false);
                }
            });
        });
    }

    function getApiBaseUrl() {
        if (window.API_BASE_URL) return window.API_BASE_URL.replace(/\/$/, '');
        const saved = localStorage.getItem('mm_api_base_url');
        if (saved && saved.trim()) return saved.trim().replace(/\/$/, '');
        if (window.location.protocol === 'file:' || !window.location.host || window.location.origin === 'null') {
            return 'http://localhost:3000';
        }
        return '';
    }

    // Centralized API Fetch Wrapper with 401/403 Auto-Logout Interceptor
    async function apiFetch(url, options = {}) {
        const token = localStorage.getItem('admin_token');
        const headers = options.headers || {};
        if (token && !headers['Authorization']) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        options.headers = headers;

        const baseUrl = getApiBaseUrl();
        const fullUrl = (url.startsWith('http://') || url.startsWith('https://'))
            ? url
            : `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;

        try {
            const response = await fetch(fullUrl, options);
            if (response.status === 401 || response.status === 403) {
                // Ignore 401/403 on login endpoint to allow login error message display
                if (!url.includes('/api/auth/login')) {
                    localStorage.removeItem('admin_token');
                    localStorage.removeItem('admin_username');
                    checkAuth();
                }
            }
            return response;
        } catch (err) {
            console.error(`API Fetch Error for ${fullUrl}:`, err);
            throw err;
        }
    }

    // Helper: Download High-Res Reporter QR Code via Authenticated Blob Fetch
    window.downloadReporterQR = async function(id, name) {
        try {
            const downloadUrl = `/api/admin/reporters/${encodeURIComponent(id)}/download-qr`;
            const response = await apiFetch(downloadUrl);
            if (!response.ok) {
                let errorMsg = 'డౌన్‌లోడ్ విఫలమైంది (Download failed)';
                try {
                    const errJson = await response.json();
                    if (errJson && errJson.error) errorMsg = errJson.error;
                } catch (_) {}
                alert('QR కోడ్ డౌన్‌లోడ్ లోపం: ' + errorMsg);
                return;
            }
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            const cleanName = (name || 'Reporter').replace(/[\\/:*?"<>|]/g, '_').trim();
            a.download = `Reporter_${cleanName}_ID_QR.png`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
        } catch (err) {
            console.error('Download QR error:', err);
            alert('QR కోడ్ డౌన్‌లోడ్ లోపం: ' + err.message);
        }
    };

    // Check Auth Token & Verify Session on Initialization
    checkAuth();
    window.addEventListener('hashchange', handleRoute);

    async function checkAuth() {
        const token = localStorage.getItem('admin_token');
        if (token) {
            if (loginView) loginView.style.display = 'none';
            if (dashboardView) dashboardView.style.display = 'flex';
            const user = localStorage.getItem('admin_username') || 'admin';
            if (adminUsernameDisplay) adminUsernameDisplay.textContent = user;
            const sidebarAdminUsername = document.getElementById('sidebar-admin-username');
            if (sidebarAdminUsername) sidebarAdminUsername.textContent = user;
            initDropdowns();
            handleRoute();
        } else {
            if (dashboardView) dashboardView.style.display = 'none';
            if (loginView) loginView.style.display = 'block';
        }
    }

    // ----------------------------------------------------------------------
    // CLIENT ROUTER
    // ----------------------------------------------------------------------
    function handleRoute() {
        const hash = window.location.hash || '#/dashboard';
        const parts = hash.replace('#/', '').split('/');
        const routeName = parts[0] || 'dashboard';
        const routeParam = parts[1] || null;

        // Hide all view sections
        Object.keys(views).forEach(key => {
            if (views[key]) views[key].style.display = 'none';
        });

        // Update active class in sidebar nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-view') === routeName) {
                item.classList.add('active');
            }
        });

        // Update active class in mobile bottom quick nav bar
        document.querySelectorAll('.mobile-nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-view') === routeName) {
                item.classList.add('active');
            }
        });

        // Route dispatcher
        switch (routeName) {
            case 'create-news':
                if (views['create-news']) views['create-news'].style.display = 'block';
                initCreateNewsView();
                break;

            case 'media':
                if (views.media) views.media.style.display = 'block';
                loadMediaLibraryView();
                break;

            case 'editions':
                if (routeParam) {
                    activeEditionId = routeParam;
                    if (views['edition-detail']) views['edition-detail'].style.display = 'block';
                    loadEditionDetailView(routeParam);
                } else {
                    if (views.editions) views.editions.style.display = 'block';
                    loadEditionsListView();
                }
                break;

            case 'upload':
                if (views.upload) views.upload.style.display = 'block';
                initUploadView();
                break;

            case 'articles':
                if (routeParam) {
                    activeArticleId = routeParam;
                    if (views['article-edit']) views['article-edit'].style.display = 'block';
                    loadArticleEditView(routeParam);
                } else {
                    if (views.articles) views.articles.style.display = 'block';
                    loadArticlesListView();
                }
                break;

            case 'reporters':
                if (views.reporters) views.reporters.style.display = 'block';
                loadReportersView();
                break;

            case 'settings':
                if (views.settings) views.settings.style.display = 'block';
                break;

            case 'dashboard':
            default:
                if (views.dashboard) views.dashboard.style.display = 'block';
                loadDashboardView();
                break;
        }

        toggleMobileSidebar(false);
    }

    // ----------------------------------------------------------------------
    // AUTHENTICATION
    // ----------------------------------------------------------------------
    // Password Show/Hide Toggle
    const togglePasswordBtn = document.getElementById('toggle-password-btn');
    const passwordInput = document.getElementById('password');
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', () => {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            const openEye = togglePasswordBtn.querySelector('.eye-open-icon');
            const closedEye = togglePasswordBtn.querySelector('.eye-closed-icon');
            if (openEye && closedEye) {
                openEye.style.display = isPassword ? 'none' : 'block';
                closedEye.style.display = isPassword ? 'block' : 'none';
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            const loginBtn = document.getElementById('login-btn');

            loginAlert.style.display = 'none';
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<span>పరిశీలిస్తోంది... (Authenticating...)</span>';

            try {
                const response = await apiFetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const contentType = response.headers.get('content-type') || '';
                let data = {};
                if (contentType.includes('application/json')) {
                    data = await response.json();
                } else {
                    const text = await response.text();
                    console.error('Non-JSON server response on login:', text);
                }

                if (response.ok && data.token) {
                    localStorage.setItem('admin_token', data.token);
                    localStorage.setItem('admin_username', data.user ? data.user.username : username);
                    checkAuth();
                } else {
                    loginAlert.textContent = data.error || (response.status === 404 ? 'API Backend server not reachable.' : 'లాగిన్ విఫలమైంది / Invalid credentials');
                    loginAlert.style.display = 'block';
                }
            } catch (err) {
                console.error('Login error:', err);
                loginAlert.textContent = 'సర్వర్ కనెక్షన్ లోపం / Server connection failed';
                loginAlert.style.display = 'block';
            } finally {
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<span>లాగిన్ అవ్వండి / Log In to CMS</span>';
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_username');
            window.location.hash = '#/dashboard';
            checkAuth();
        });
    }

    // ----------------------------------------------------------------------
    // DASHBOARD VIEW LOGIC
    // ----------------------------------------------------------------------
    async function loadDashboardView() {
        const token = localStorage.getItem('admin_token');
        if (!token) return;

        try {
            const res = await apiFetch('/api/admin/stats');
            if (res && res.ok) {
                const data = await res.json();
                const stats = data.stats || {};
                const elEditions = document.getElementById('stat-total-editions');
                const elPublished = document.getElementById('stat-published-articles');
                const elPending = document.getElementById('stat-pending-articles');

                if (elEditions) elEditions.textContent = stats.total_editions || 0;
                if (elPublished) elPublished.textContent = stats.published_articles || 0;
                if (elPending) elPending.textContent = stats.pending_review_articles || 0;
            }
        } catch (err) {
            console.error('Failed to load stats:', err);
        }

        try {
            const res = await apiFetch('/api/admin/media');
            if (res && res.ok) {
                const data = await res.json();
                const elMedia = document.getElementById('stat-total-media');
                if (elMedia) elMedia.textContent = (data.media || []).length;
            }
        } catch (err) {
            console.error('Failed to load media count:', err);
        }

        try {
            const res = await apiFetch('/api/admin/editions');
            if (res && res.ok) {
                const data = await res.json();
                renderDashEditionsTable(data.editions || []);
            }
        } catch (err) {
            console.error('Failed to load dash editions:', err);
        }

        try {
            const res = await apiFetch('/api/admin/articles?limit=5');
            if (res && res.ok) {
                const data = await res.json();
                renderDashArticlesTable(data.articles || []);
            }
        } catch (err) {
            console.error('Failed to load dash articles:', err);
        }
    }

    function renderDashEditionsTable(editions) {
        const tbody = document.getElementById('dash-editions-table-body');
        if (!tbody) return;

        if (editions.length === 0) {
            tbody.innerHTML = `<tr class="empty-row"><td colspan="4">ఇంకా ఏ సంచికలూ అప్‌లోడ్ కాలేదు. (No daily editions uploaded yet.)</td></tr>`;
            return;
        }

        tbody.innerHTML = editions.slice(0, 5).map(ed => `
            <tr>
                <td><strong>${ed.edition_date || 'N/A'}</strong></td>
                <td>${escapeHTML(ed.edition_name || 'మమేక మహోదయం ప్రధాన సంచిక')}</td>
                <td>${getStatusBadgeHTML(ed.status)}</td>
                <td>
                    <a href="#/editions/${ed.id}" class="btn btn-outline-sm">👁️ చూడండి</a>
                </td>
            </tr>
        `).join('');
    }

    function renderDashArticlesTable(articles) {
        const tbody = document.getElementById('dash-articles-table-body');
        if (!tbody) return;

        if (articles.length === 0) {
            tbody.innerHTML = `<tr class="empty-row"><td colspan="5">ఇంకా ఏ వార్తలూ సిస్టమ్‌లో లేవు. (No articles in system yet.)</td></tr>`;
            return;
        }

        tbody.innerHTML = articles.slice(0, 5).map(art => `
            <tr>
                <td>
                    <strong>${escapeHTML(art.title_te || art.title_en)}</strong>
                </td>
                <td><span class="status-badge badge-draft">${art.category || 'N/A'}</span></td>
                <td>${art.district ? `<span class="status-badge badge-uploaded">${art.district}</span>` : '-'}</td>
                <td>${getStatusBadgeHTML(art.status)}</td>
                <td>
                    <a href="#/articles/${art.id}" class="btn btn-outline-sm">✏️ Review</a>
                </td>
            </tr>
        `).join('');
    }

    // ----------------------------------------------------------------------
    // EDITIONS LIST VIEW LOGIC
    // ----------------------------------------------------------------------
    async function loadEditionsListView() {
        const token = localStorage.getItem('admin_token');
        if (!token) return;

        const tbody = document.getElementById('editions-list-table-body');
        if (tbody) tbody.innerHTML = `<tr class="empty-row"><td colspan="6">సంచికలు లోడ్ అవుతున్నాయి...</td></tr>`;

        try {
            const res = await apiFetch('/api/admin/editions');
            if (res && res.ok) {
                const data = await res.json();
                renderEditionsListTable(data.editions || []);
            }
        } catch (err) {
            console.error('Failed to load editions list:', err);
        }
    }

    const refreshEditionsBtn2 = document.getElementById('refresh-editions-btn-2');
    if (refreshEditionsBtn2) {
        refreshEditionsBtn2.addEventListener('click', loadEditionsListView);
    }

    function renderEditionsListTable(editions) {
        const tbody = document.getElementById('editions-list-table-body');
        if (!tbody) return;

        if (editions.length === 0) {
            tbody.innerHTML = `<tr class="empty-row"><td colspan="6">ఇంకా ఏ సంచికలూ అప్‌లోడ్ కాలేదు. (No daily editions uploaded yet.)</td></tr>`;
            return;
        }

        tbody.innerHTML = editions.map(ed => {
            const sizeMB = ed.file_size_bytes ? (ed.file_size_bytes / (1024 * 1024)).toFixed(2) + ' MB' : 'N/A';
            const isPublished = ed.status === 'published';
            const toggleStatusAction = isPublished ? 'uploaded' : 'published';
            const toggleLabel = isPublished ? 'Unpublish' : '🚀 Publish';

            return `
                <tr>
                    <td><strong>${ed.edition_date || 'N/A'}</strong></td>
                    <td>${escapeHTML(ed.edition_name || 'మమేక మహోదయం ప్రధాన సంచిక')}</td>
                    <td><span class="status-badge badge-draft">${ed.edition_type || 'main'}</span></td>
                    <td>${sizeMB}</td>
                    <td>${getStatusBadgeHTML(ed.status)}</td>
                    <td style="display:flex; gap:6px; flex-wrap:wrap;">
                        <a href="${ed.pdf_path}" target="_blank" class="btn btn-outline-sm">📄 PDF</a>
                        <a href="#/editions/${ed.id}" class="btn btn-outline-sm">👁️ వివరాలు (${ed.detected_articles_count || 0})</a>
                        <button type="button" class="btn btn-outline-sm" onclick="toggleEditionStatus('${ed.id}', '${toggleStatusAction}')">${toggleLabel}</button>
                        <button type="button" class="btn btn-danger-sm" onclick="deleteEdition('${ed.id}')">🗑️ తొలగించు</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    window.toggleEditionStatus = async function(editionId, newStatus) {
        const token = localStorage.getItem('admin_token');
        if (!token) return;

        try {
            const res = await apiFetch(`/api/admin/editions/${editionId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res && res.ok) {
                loadEditionsListView();
            } else {
                alert('స్థితి మార్పు విఫలమైంది / Status update failed');
            }
        } catch (err) {
            console.error('Failed to toggle edition status:', err);
        }
    };

    window.publishEditionAllArticles = async function(editionId) {
        if (!confirm('ఈ సంచికలోని అన్ని వార్తలు మరియు చిత్రాలను వెబ్‌సైట్‌లో లైవ్‌గా ప్రచురించాలనుకుంటున్నారా?')) return;
        const token = localStorage.getItem('admin_token');
        if (!token) return;

        try {
            const res = await apiFetch(`/api/admin/editions/${editionId}/publish-all`, {
                method: 'POST'
            });
            if (res && res.ok) {
                const data = await res.json();
                alert(data.message || 'అన్ని వార్తలు ప్రచురించబడ్డాయి!');
                loadEditionDetailView(editionId);
            } else {
                alert('ప్రచురణ విఫలమైంది / Publish failed');
            }
        } catch (err) {
            console.error('Failed to publish all articles:', err);
        }
    };

    window.deleteEdition = async function(editionId) {
        if (!confirm('మీరు నిశ్చయంగా ఈ సంచికను మరియు దాని వార్తలను పూర్తిగా తొలగించాలనుకుంటున్నారా?')) return;

        const token = localStorage.getItem('admin_token');
        if (!token) return;

        try {
            const res = await apiFetch(`/api/admin/editions/${editionId}`, {
                method: 'DELETE'
            });
            if (res && res.ok) {
                loadEditionsListView();
            } else {
                alert('సంచిక తొలగింపు విఫలమైంది / Delete failed');
            }
        } catch (err) {
            console.error('Failed to delete edition:', err);
        }
    };

    // ----------------------------------------------------------------------
    // SINGLE EDITION DETAIL VIEW LOGIC
    // ----------------------------------------------------------------------
    async function loadEditionDetailView(editionId) {
        const token = localStorage.getItem('admin_token');
        if (!token) return;

        try {
            const res = await apiFetch(`/api/editions/${editionId}`);
            if (res && res.ok) {
                const data = await res.json();
                renderEditionDetail(data.edition, data.articles || [], data.pages || []);
            }
        } catch (err) {
            console.error('Failed to load edition detail:', err);
        }
    }

    function renderEditionDetail(edition, articles, pages) {
        if (!edition) return;

        document.getElementById('edition-detail-title').textContent = `📰 ${edition.edition_name || 'సంచిక'} (${edition.edition_date || ''})`;

        const downloadLink = document.getElementById('edition-pdf-download-link');
        const iframe = document.getElementById('edition-pdf-iframe');

        if (downloadLink) downloadLink.href = edition.pdf_path || '#';
        if (iframe) iframe.src = edition.pdf_path || '';

        const metaBox = document.getElementById('edition-meta-info');
        if (metaBox) {
            const sizeMB = edition.file_size_bytes ? (edition.file_size_bytes / (1024 * 1024)).toFixed(2) + ' MB' : 'N/A';
            metaBox.innerHTML = `
                <p><strong>సంచిక ID:</strong> <code>${edition.id}</code></p>
                <p><strong>తేదీ:</strong> ${edition.edition_date}</p>
                <p><strong>మొత్తం పేజీలు:</strong> ${edition.total_pages || pages.length || 0}</p>
                <p><strong>ఫైల్ పేరు:</strong> ${edition.pdf_filename || 'N/A'}</p>
                <p><strong>సైజ్:</strong> ${sizeMB}</p>
                <p><strong>ప్రస్తుత స్థితి:</strong> ${getStatusBadgeHTML(edition.status)}</p>
            `;
        }

        const actionsBox = document.getElementById('edition-detail-actions');
        if (actionsBox) {
            const isPublished = edition.status === 'published';
            actionsBox.innerHTML = `
                <button type="button" class="btn btn-primary" style="background: linear-gradient(135deg, #16a34a, #15803d); color: white; font-weight: bold; font-size: 1rem; padding: 10px 18px; border: none; border-radius: 6px; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" onclick="toggleEditionStatus('${edition.id}', '${isPublished ? 'uploaded' : 'published'}')">
                    ${isPublished ? '🔴 అన్‌పబ్లిష్ చేయి (Unpublish Edition)' : '🚀 ఈ-పేపర్‌లో ప్రచురించు (Publish to E-Paper)'}
                </button>
            `;
        }
    }

    // ----------------------------------------------------------------------
    // UPLOAD & DIRECT PUBLISH VIEW LOGIC
    // ----------------------------------------------------------------------
    window.switchPublishMode = function(mode) {
        const directCard = document.getElementById('mode-direct-publish');
        const pdfCard = document.getElementById('mode-pdf-publish');
        const tabDirect = document.getElementById('tab-publish-direct');
        const tabPdf = document.getElementById('tab-publish-pdf');

        if (mode === 'direct') {
            if (directCard) directCard.style.display = 'block';
            if (pdfCard) pdfCard.style.display = 'none';
            if (tabDirect) tabDirect.classList.add('active');
            if (tabPdf) tabPdf.classList.remove('active');
        } else {
            if (directCard) directCard.style.display = 'none';
            if (pdfCard) pdfCard.style.display = 'block';
            if (tabDirect) tabDirect.classList.remove('active');
            if (tabPdf) tabPdf.classList.add('active');
        }
    };

    function initUploadView() {
        // A. DIRECT ARTICLE PUBLISHER LOGIC
        const pubTitleInput = document.getElementById('pub-title-te');
        const pubSubheadlineInput = document.getElementById('pub-subheadline-te');
        const pubCategoryInput = document.getElementById('pub-category');
        const pubContentInput = document.getElementById('pub-content-te');
        const pubImageFileInput = document.getElementById('pub-image-file');
        const pubImageUrlInput = document.getElementById('pub-image-url');
        const pubImgPreviewBox = document.getElementById('pub-img-preview-box');
        const pubImgPreviewTag = document.getElementById('pub-img-preview-tag');
        const directPubForm = document.getElementById('direct-publish-form');
        const directPubAlert = document.getElementById('direct-pub-alert');

        // Live Preview Update Function
        function updateLivePreview() {
            const title = pubTitleInput ? pubTitleInput.value.trim() : '';
            const subheadline = pubSubheadlineInput ? pubSubheadlineInput.value.trim() : '';
            const categoryText = pubCategoryInput && pubCategoryInput.options[pubCategoryInput.selectedIndex] ? pubCategoryInput.options[pubCategoryInput.selectedIndex].text : 'రాష్ట్ర వార్తలు';
            const body = pubContentInput ? pubContentInput.value.trim() : '';

            const prevTitle = document.getElementById('prev-title');
            const prevSub = document.getElementById('prev-subheadline');
            const prevBadge = document.getElementById('prev-badge');
            const prevBody = document.getElementById('prev-body');

            if (prevTitle) prevTitle.textContent = title || 'శీర్షిక ఇక్కడ కనిపిస్తుంది...';
            if (prevSub) prevSub.textContent = subheadline || '';
            if (prevBadge) prevBadge.textContent = categoryText;
            if (prevBody) prevBody.textContent = body ? (body.slice(0, 200) + (body.length > 200 ? '...' : '')) : 'వార్తా వివరాలు ఇక్కడ కనిపిస్తాయి...';
        }

        if (pubTitleInput) pubTitleInput.addEventListener('input', updateLivePreview);
        if (pubSubheadlineInput) pubSubheadlineInput.addEventListener('input', updateLivePreview);
        if (pubCategoryInput) pubCategoryInput.addEventListener('change', updateLivePreview);
        if (pubContentInput) pubContentInput.addEventListener('input', updateLivePreview);

        // Image File Selection Handler
        if (pubImageFileInput) {
            pubImageFileInput.addEventListener('change', async () => {
                if (pubImageFileInput.files.length) {
                    const file = pubImageFileInput.files[0];
                    const formData = new FormData();
                    formData.append('image_file', file);

                    try {
                        const res = await apiFetch('/api/admin/upload-image', {
                            method: 'POST',
                            body: formData
                        });
                        if (res && res.ok) {
                            const data = await res.json();
                            if (pubImageUrlInput) pubImageUrlInput.value = data.image_url;
                            if (pubImgPreviewTag) pubImgPreviewTag.src = data.image_url;
                            if (pubImgPreviewBox) pubImgPreviewBox.style.display = 'block';
                        }
                    } catch (e) {
                        console.error('Image upload failed:', e);
                    }
                }
            });
        }

        if (pubImageUrlInput) {
            pubImageUrlInput.addEventListener('input', () => {
                const url = pubImageUrlInput.value.trim();
                if (url) {
                    if (pubImgPreviewTag) pubImgPreviewTag.src = url;
                    if (pubImgPreviewBox) pubImgPreviewBox.style.display = 'block';
                } else {
                    if (pubImgPreviewBox) pubImgPreviewBox.style.display = 'none';
                }
            });
        }

        // Direct Publish Form Submit
        if (directPubForm) {
            directPubForm.onsubmit = async (e) => {
                e.preventDefault();
                const token = localStorage.getItem('admin_token');
                if (!token) return;

                const directPubBtn = document.getElementById('direct-pub-btn');
                const title_te = pubTitleInput ? pubTitleInput.value.trim() : '';
                const subheadline_te = pubSubheadlineInput ? pubSubheadlineInput.value.trim() : '';
                const category = pubCategoryInput ? pubCategoryInput.value : 'state';
                const district = document.getElementById('pub-district') ? document.getElementById('pub-district').value : '';
                const content_te = pubContentInput ? pubContentInput.value.trim() : '';
                const image_url = pubImageUrlInput ? pubImageUrlInput.value.trim() : '';

                if (!title_te) {
                    showAlert(directPubAlert, 'దయచేసి వార్తా శీర్షికను నమోదు చేయండి', 'error');
                    return;
                }
                if (!content_te) {
                    showAlert(directPubAlert, 'దయచేసి వార్త వివరాలను నమోదు చేయండి', 'error');
                    return;
                }

                if (directPubBtn) {
                    directPubBtn.disabled = true;
                    directPubBtn.textContent = 'ప్రచురించబడుతోంది... (Publishing...)';
                }

                try {
                    const res = await apiFetch('/api/admin/articles', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            title_te,
                            title_en: title_te,
                            subheadline_te,
                            category,
                            district: district || null,
                            content_te,
                            content_en: content_te,
                            image_url: image_url || null,
                            status: 'published',
                            show_on_homepage: 1,
                            featured: 1
                        })
                    });

                    const data = await res.json();
                    if (res && res.ok) {
                        showAlert(directPubAlert, '✓ వార్త విజయవంతంగా వెబ్‌సైట్‌లో ప్రచురించబడింది! (Article Published Live Successfully)', 'success');
                        directPubForm.reset();
                        if (pubImgPreviewBox) pubImgPreviewBox.style.display = 'none';
                        updateLivePreview();
                    } else {
                        showAlert(directPubAlert, (data && data.error) || 'ప్రచురణ విఫలమైంది', 'error');
                    }
                } catch (err) {
                    showAlert(directPubAlert, 'సర్వర్ లోపం ఏర్పడింది', 'error');
                } finally {
                    if (directPubBtn) {
                        directPubBtn.disabled = false;
                        directPubBtn.textContent = '🚀 వెబ్‌సైట్‌లో ప్రచురించు (Publish News Live)';
                    }
                }
            };
        }

        // B. PDF UPLOAD LOGIC
        const dateInput = document.getElementById('edition-date-2');
        if (dateInput && !dateInput.value) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }

        const dropZone = document.getElementById('drop-zone-2');
        const fileInput = document.getElementById('pdf-file-input-2');
        const selectedFileName = document.getElementById('selected-file-name-2');
        const uploadBtn = document.getElementById('upload-btn-2');
        const uploadAlert = document.getElementById('upload-alert-2');

        if (dropZone && fileInput) {
            dropZone.onclick = () => fileInput.click();

            dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('dragover'); };
            dropZone.ondragleave = () => dropZone.classList.remove('dragover');
            dropZone.ondrop = (e) => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
                if (e.dataTransfer.files.length) {
                    fileInput.files = e.dataTransfer.files;
                    handleUploadFileSelect(e.dataTransfer.files[0]);
                }
            };

            fileInput.onchange = () => {
                if (fileInput.files.length) {
                    handleUploadFileSelect(fileInput.files[0]);
                }
            };
        }

        function handleUploadFileSelect(file) {
            if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
                showAlert(uploadAlert, 'దయచేసి కేవలం PDF ఫైల్‌ను మాత్రమే ఎంచుకోండి (.pdf file only)', 'error');
                fileInput.value = '';
                if (selectedFileName) selectedFileName.style.display = 'none';
                if (uploadBtn) uploadBtn.disabled = true;
                return;
            }

            const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
            if (file.size > 100 * 1024 * 1024) {
                showAlert(uploadAlert, 'ఫైల్ పరిమాణం 100MB కంటే తక్కువగా ఉండాలి (PDF must be under 100MB)', 'error');
                fileInput.value = '';
                if (selectedFileName) selectedFileName.style.display = 'none';
                if (uploadBtn) uploadBtn.disabled = true;
                return;
            }
            if (selectedFileName) {
                selectedFileName.textContent = `📄 ${file.name} (${sizeMB} MB)`;
                selectedFileName.style.display = 'inline-block';
            }
            if (uploadBtn) uploadBtn.disabled = false;
            if (uploadAlert) uploadAlert.style.display = 'none';
        }

        const uploadForm = document.getElementById('upload-form-2');
        if (uploadForm) {
            uploadForm.onsubmit = async (e) => {
                e.preventDefault();
                const token = localStorage.getItem('admin_token');
                if (!token) return;

                const file = fileInput.files[0];
                if (!file) return;

                const formData = new FormData();
                formData.append('edition_date', dateInput.value);
                formData.append('edition_name', document.getElementById('edition-name-2').value.trim() || 'మమేక మహోదయం ప్రధాన సంచిక');
                formData.append('edition_type', document.getElementById('edition-type-2').value);
                formData.append('pdf_file', file);

                const progressBar = document.getElementById('upload-progress-bar-2');
                const progressContainer = document.getElementById('upload-progress-container-2');
                const progressText = document.getElementById('upload-progress-text-2');

                uploadBtn.disabled = true;
                if (progressContainer) progressContainer.style.display = 'block';
                if (progressBar) progressBar.style.width = '30%';
                if (progressText) progressText.textContent = '30%';

                try {
                    let res = await apiFetch('/api/admin/editions/upload', {
                        method: 'POST',
                        body: formData
                    });
                    let data = await res.json();

                    if (res.status === 409 || (data && data.duplicate)) {
                        if (confirm(`⚠️ ${data.message || 'ఈ తేదీకి సంచిక ఇప్పటికే ఉంది.'}\n\nమీరు పాత సంచిక స్థానంలో ఈ కొత్త సంచికను ప్రచురించాలనుకుంటున్నారా (Replace Edition)?`)) {
                            formData.append('replace', 'true');
                            res = await apiFetch('/api/admin/editions/upload', {
                                method: 'POST',
                                body: formData
                            });
                            data = await res.json();
                        } else {
                            showAlert(uploadAlert, 'అప్‌లోడ్ ప్రాసెస్ రద్దు చేయబడింది.', 'info');
                            uploadBtn.disabled = false;
                            return;
                        }
                    }

                    if (progressBar) progressBar.style.width = '100%';
                    if (progressText) progressText.textContent = '100%';

                    if (res && res.ok) {
                        showAlert(uploadAlert, `✓ సంచిక విజయవంతంగా ప్రచురించబడింది!`, 'success');
                        uploadForm.reset();
                        if (selectedFileName) selectedFileName.style.display = 'none';

                        // Show inline preview panel right below upload button
                        renderUploadInlinePreview(data.edition.id);
                        if (typeof loadEditionsListView === 'function') loadEditionsListView();
                    } else {
                        showAlert(uploadAlert, (data && data.error) || 'అప్‌లోడ్ విఫలమైంది', 'error');
                    }
                } catch (err) {
                    showAlert(uploadAlert, 'నెట్‌వర్క్ / సర్వర్ లోపం', 'error');
                } finally {
                    setTimeout(() => {
                        if (progressContainer) progressContainer.style.display = 'none';
                    }, 1000);
                }
            };
        }
    }

    // ----------------------------------------------------------------------
    // INLINE POST-UPLOAD EDITION PREVIEW & PUBLISH LOGIC
    // ----------------------------------------------------------------------
    let uploadPollInterval = null;

    async function renderUploadInlinePreview(editionId) {
        const previewContainer = document.getElementById('upload-post-preview-container');
        if (!previewContainer) return;

        previewContainer.style.display = 'block';
        previewContainer.scrollIntoView({ behavior: 'smooth' });

        const iframe = document.getElementById('upload-preview-iframe');
        const pdfLink = document.getElementById('upload-preview-pdf-link');
        const metaBox = document.getElementById('upload-preview-meta');
        const articlesTbody = document.getElementById('upload-detected-articles-tbody');
        const publishBtn = document.getElementById('upload-confirm-publish-btn');
        const alertBox = document.getElementById('upload-publish-alert');

        if (alertBox) alertBox.style.display = 'none';

        // Load edition detail data
        try {
            const res = await apiFetch(`/api/editions/${editionId}`);
            if (res && res.ok) {
                const data = await res.json();
                const edition = data.edition;
                const articles = data.articles || [];
                const pages = data.pages || [];

                if (iframe) iframe.src = edition.pdf_path || '';
                if (pdfLink) pdfLink.href = edition.pdf_path || '#';

                const sizeMB = edition.file_size_bytes ? (edition.file_size_bytes / (1024 * 1024)).toFixed(2) + ' MB' : 'N/A';
                if (metaBox) {
                    metaBox.innerHTML = `
                        <p><strong>సంచిక పేరు:</strong> ${escapeHTML(edition.edition_name || 'మమేక మహోదయం')}</p>
                        <p><strong>తేదీ:</strong> ${edition.edition_date}</p>
                        <p><strong>మొత్తం పేజీలు:</strong> ${edition.total_pages || pages.length || 0}</p>
                        <p><strong>ఫైల్ సైజ్:</strong> ${sizeMB}</p>
                        <p id="upload-preview-status-badge"><strong>స్థితి:</strong> ${getStatusBadgeHTML(edition.status)}</p>
                        <p><strong>గుర్తించిన వార్తలు:</strong> <strong>${articles.length}</strong> (Drafts)</p>
                    `;
                }

                // Render Articles Table
                if (articlesTbody) {
                    if (articles.length === 0) {
                        articlesTbody.innerHTML = `<tr class="empty-row"><td colspan="5">వార్తలు ఇంకా ప్రాసెస్ అవుతున్నాయి...</td></tr>`;
                    } else {
                        articlesTbody.innerHTML = articles.map(art => `
                            <tr>
                                <td><strong>${escapeHTML(art.title_te || art.title_en)}</strong></td>
                                <td><span class="status-badge badge-draft">P.${art.page_number || 1} | ${art.category || 'state'}</span></td>
                                <td>${art.district ? `<span class="status-badge badge-uploaded">${art.district}</span>` : '-'}</td>
                                <td>${getStatusBadgeHTML(art.status)}</td>
                                <td>
                                    <a href="#/articles/${art.id}" class="btn btn-outline-sm">✏️ Review</a>
                                </td>
                            </tr>
                        `).join('');
                    }
                }

                // Wire Publish Button
                if (publishBtn) {
                    const isAlreadyPublished = edition.status === 'published';
                    if (isAlreadyPublished) {
                        publishBtn.disabled = true;
                        publishBtn.textContent = '✅ ఇప్పటికే ప్రచురించబడింది (Already Published)';
                        publishBtn.style.background = '#64748b';
                    } else {
                        publishBtn.disabled = false;
                        publishBtn.textContent = '🚀 సంచికను ప్రచురించు (Publish Edition Live)';
                        publishBtn.style.background = '#16a34a';

                        publishBtn.onclick = async () => {
                            publishBtn.disabled = true;
                            publishBtn.textContent = 'ప్రచురించబడుతోంది...';

                            try {
                                const pubRes = await apiFetch(`/api/admin/editions/${editionId}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: 'published' })
                                });
                                if (pubRes && pubRes.ok) {
                                    showAlert(alertBox, '✓ దినపత్రిక సంచిక విజయవంతంగా ప్రచురించబడింది! (Edition Published Live Successfully)', 'success');
                                    publishBtn.textContent = '✅ విజయవంతంగా ప్రచురించబడింది (Published)';
                                    publishBtn.style.background = '#64748b';
                                    const statusBadgeEl = document.getElementById('upload-preview-status-badge');
                                    if (statusBadgeEl) {
                                        statusBadgeEl.innerHTML = `<strong>స్థితి:</strong> ${getStatusBadgeHTML('published')}`;
                                    }
                                } else {
                                    showAlert(alertBox, 'ప్రచురణ విఫలమైంది', 'error');
                                    publishBtn.disabled = false;
                                    publishBtn.textContent = '🚀 సంచికను ప్రచురించు (Publish Edition Live)';
                                }
                            } catch (e) {
                                showAlert(alertBox, 'సర్వర్ లోపం ఏర్పడింది', 'error');
                                publishBtn.disabled = false;
                                publishBtn.textContent = '🚀 సంచికను ప్రచురించు (Publish Edition Live)';
                            }
                        };
                    }
                }
            }
        } catch (err) {
            console.error('Failed to render inline preview:', err);
        }

        // Poll for processing status update
        if (uploadPollInterval) clearInterval(uploadPollInterval);
        const progressText = document.getElementById('upload-job-progress-text');

        uploadPollInterval = setInterval(async () => {
            try {
                const jobRes = await apiFetch(`/api/admin/editions/${editionId}/job`);
                if (jobRes && jobRes.ok) {
                    const jobData = await jobRes.json();
                    const job = jobData.job;
                    if (job) {
                        if (progressText) {
                            progressText.textContent = `⚙️ Stage: ${job.stage} (${job.progress_percent}%) - ${job.log_message || ''}`;
                        }
                        if (job.stage === 'completed' || job.stage === 'failed') {
                            clearInterval(uploadPollInterval);
                            if (progressText) {
                                progressText.textContent = job.stage === 'completed' ? '✅ Ingestion Completed!' : '❌ Ingestion Failed';
                            }
                            // Refresh article table & metadata
                            const refreshRes = await apiFetch(`/api/editions/${editionId}`);
                            if (refreshRes && refreshRes.ok) {
                                const refData = await refreshRes.json();
                                if (articlesTbody && refData.articles) {
                                    articlesTbody.innerHTML = refData.articles.map(art => `
                                        <tr>
                                            <td><strong>${escapeHTML(art.title_te || art.title_en)}</strong></td>
                                            <td><span class="status-badge badge-draft">P.${art.page_number || 1} | ${art.category || 'state'}</span></td>
                                            <td>${art.district ? `<span class="status-badge badge-uploaded">${art.district}</span>` : '-'}</td>
                                            <td>${getStatusBadgeHTML(art.status)}</td>
                                            <td>
                                                <a href="#/articles/${art.id}" class="btn btn-outline-sm">✏️ Review</a>
                                            </td>
                                        </tr>
                                    `).join('');
                                }
                            }
                        }
                    }
                }
            } catch (e) {
                clearInterval(uploadPollInterval);
            }
        }, 1500);
    }

    // ----------------------------------------------------------------------
    // ARTICLE MANAGEMENT VIEW LOGIC
    // ----------------------------------------------------------------------
    // ----------------------------------------------------------------------
    // ARTICLE MANAGEMENT VIEW LOGIC
    // ----------------------------------------------------------------------
    let currentActiveStatusTab = 'all';

    async function loadArticlesListView() {
        const token = localStorage.getItem('admin_token');
        if (!token) return;

        const tbody = document.getElementById('articles-management-table-body');
        if (tbody) tbody.innerHTML = `<tr class="empty-row"><td colspan="6">వార్తలు లోడ్ అవుతున్నాయి...</td></tr>`;

        const search = document.getElementById('art-filter-search')?.value || '';
        const statusSelect = document.getElementById('art-filter-status')?.value || '';
        const status = statusSelect || (currentActiveStatusTab !== 'all' ? currentActiveStatusTab : '');
        const category = document.getElementById('art-filter-category')?.value || '';
        const district = document.getElementById('art-filter-district')?.value || '';

        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (status) params.append('status', status);
        if (category) params.append('category', category);
        if (district) params.append('district', district);

        try {
            const res = await apiFetch(`/api/admin/articles?${params.toString()}`);
            if (res && res.ok) {
                const data = await res.json();
                if (data.status_counts) {
                    updateStatusTabBadges(data.status_counts);
                }
                renderArticlesManagementTable(data.articles || []);
            }
        } catch (err) {
            console.error('Failed to load articles list:', err);
        }
    }

    function updateStatusTabBadges(counts) {
        const cAll = document.getElementById('count-art-all');
        const cDraft = document.getElementById('count-art-draft');
        const cReview = document.getElementById('count-art-review');
        const cPub = document.getElementById('count-art-published');
        const cArch = document.getElementById('count-art-archived');

        if (cAll) cAll.textContent = counts.total || 0;
        if (cDraft) cDraft.textContent = counts.draft || 0;
        if (cReview) cReview.textContent = counts.review_pending || 0;
        if (cPub) cPub.textContent = counts.published || 0;
        if (cArch) cArch.textContent = counts.archived || 0;
    }

    document.querySelectorAll('[data-status-tab]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('[data-status-tab]').forEach(b => b.classList.remove('active'));
            const clicked = e.currentTarget;
            clicked.classList.add('active');
            currentActiveStatusTab = clicked.getAttribute('data-status-tab');
            const selectEl = document.getElementById('art-filter-status');
            if (selectEl) {
                selectEl.value = currentActiveStatusTab === 'all' ? '' : currentActiveStatusTab;
            }
            loadArticlesListView();
        });
    });

    ['art-filter-search', 'art-filter-status', 'art-filter-category', 'art-filter-district'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', (e) => {
                if (id === 'art-filter-status') {
                    const val = e.target.value || 'all';
                    currentActiveStatusTab = val;
                    document.querySelectorAll('[data-status-tab]').forEach(b => {
                        if (b.getAttribute('data-status-tab') === val) b.classList.add('active');
                        else b.classList.remove('active');
                    });
                }
                loadArticlesListView();
            });
            if (id === 'art-filter-search') {
                el.addEventListener('keyup', debounce(loadArticlesListView, 400));
            }
        }
    });

    const refreshArticlesBtn = document.getElementById('refresh-articles-btn');
    if (refreshArticlesBtn) refreshArticlesBtn.addEventListener('click', loadArticlesListView);

    function renderArticlesManagementTable(articles) {
        const tbody = document.getElementById('articles-management-table-body');
        if (!tbody) return;

        if (articles.length === 0) {
            tbody.innerHTML = `<tr class="empty-row"><td colspan="6">ఏ వార్తలూ కనుగొనబడలేదు. (No articles found matching filters)</td></tr>`;
            return;
        }

        tbody.innerHTML = articles.map(art => {
            const isPublished = art.status === 'published';
            const publicUrl = `/article.html?id=${encodeURIComponent(art.id)}${art.slug ? `&slug=${encodeURIComponent(art.slug)}` : ''}`;

            return `
                <tr>
                    <td>
                        <strong>${escapeHTML(art.title_te || art.title_en)}</strong>
                    </td>
                    <td><span class="status-badge badge-draft">${art.category || 'N/A'}</span></td>
                    <td>${art.district ? `<span class="status-badge badge-uploaded">${art.district}</span>` : '-'}</td>
                    <td>${art.edition_date || 'N/A'}</td>
                    <td>${getStatusBadgeHTML(art.status)}</td>
                    <td style="display:flex; gap:4px; flex-wrap:wrap;">
                        <a href="#/articles/${art.id}" class="btn btn-outline-sm" title="Review & Edit Article">✏️ Edit</a>
                        ${isPublished ? `
                            <a href="${publicUrl}" target="_blank" class="btn btn-outline-sm" style="color:var(--primary-color);" title="View Live Public Article">👁️ View Public</a>
                            <button type="button" class="btn btn-outline-sm" onclick="unpublishArticleQuick('${art.id}')" title="Unpublish Article">🛑 Unpublish</button>
                        ` : `
                            <button type="button" class="btn btn-primary" style="padding: 3px 8px; font-size: 0.78rem;" onclick="publishArticleQuick('${art.id}')" title="Publish Article Live">🚀 Quick Publish</button>
                        `}
                        <button type="button" class="btn btn-danger-sm" onclick="deleteArticle('${art.id}')" title="Delete Article">🗑️</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    window.publishArticleQuick = async function(articleId) {
        const token = localStorage.getItem('admin_token');
        if (!token) return;

        try {
            const res = await apiFetch(`/api/admin/articles/${articleId}/publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (res && res.ok) {
                loadArticlesListView();
            } else {
                alert(`ప్రచురణ విఫలమైంది: ${data.error || 'Validation error'}`);
            }
        } catch (err) {
            console.error('Failed to quick publish article:', err);
        }
    };

    window.unpublishArticleQuick = async function(articleId) {
        if (!confirm('ఈ వార్తను పబ్లిక్ వెబ్‌సైట్ నుండి తొలగించి డ్రాఫ్ట్ స్థానానికి మార్చాలనుకుంటున్నారా?')) return;

        const token = localStorage.getItem('admin_token');
        if (!token) return;

        try {
            const res = await apiFetch(`/api/admin/articles/${articleId}/unpublish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target_status: 'draft' })
            });
            if (res && res.ok) {
                loadArticlesListView();
            } else {
                alert('స్టేటస్ మార్పు విఫలమైంది');
            }
        } catch (err) {
            console.error('Failed to unpublish article:', err);
        }
    };

    window.deleteArticle = async function(articleId) {
        if (!confirm('మీరు ఈ వార్తను పూర్తిగా తొలగించాలనుకుంటున్నారా?')) return;

        const token = localStorage.getItem('admin_token');
        if (!token) return;

        try {
            const res = await apiFetch(`/api/admin/articles/${articleId}`, {
                method: 'DELETE'
            });
            if (res && res.ok) {
                loadArticlesListView();
            } else {
                alert('వార్త తొలగింపు విఫలమైంది');
            }
        } catch (err) {
            console.error('Failed to delete article:', err);
        }
    };

    // ----------------------------------------------------------------------
    // STEP 8 — ARTICLE REVIEW, WARNINGS & AUTHORITATIVE EDITOR ENGINE
    // ----------------------------------------------------------------------
    async function loadArticleEditView(articleId) {
        const token = localStorage.getItem('admin_token');
        if (!token) return;

        try {
            const res = await apiFetch(`/api/admin/articles/${articleId}`);
            if (res && res.ok) {
                const data = await res.json();
                currentArticleData = data.article;
                renderArticleEditForm(data.article, data.editionMedia || []);
            }
        } catch (err) {
            console.error('Failed to load article details:', err);
        }
    }

    function renderArticleEditForm(art, editionMedia = []) {
        if (!art) return;

        // 1. Fill Hidden & Form Fields
        document.getElementById('art-edit-id').value = art.id;
        document.getElementById('art-edit-title-te').value = art.title_te || art.title_en || '';
        const subInput = document.getElementById('art-edit-subheadline-te');
        if (subInput) subInput.value = art.subheadline_te || '';
        document.getElementById('art-edit-category').value = art.category || 'state';
        document.getElementById('art-edit-district').value = art.district || '';
        document.getElementById('art-edit-status').value = art.status || 'draft';
        document.getElementById('art-edit-author').value = art.author_name || 'మమేక మహోదయం డెస్క్';
        document.getElementById('art-edit-date').value = art.published_at ? art.published_at.split(' ')[0] : (art.edition_date || new Date().toISOString().split('T')[0]);
        document.getElementById('art-edit-homepage').checked = !!art.show_on_homepage;
        document.getElementById('art-edit-featured').checked = !!art.featured;
        document.getElementById('art-edit-breaking').checked = !!art.is_breaking;
        const sumInput = document.getElementById('art-edit-summary-te');
        if (sumInput) sumInput.value = art.summary_te || '';
        document.getElementById('art-edit-content-te').value = art.content_te || '';
        document.getElementById('art-raw-content-display').value = art.raw_extracted_text || art.content_te || '';

        // 2. Source Page Viewer Setup
        const pageImg = document.getElementById('art-source-page-img');
        const pdfLink = document.getElementById('open-full-pdf-link');
        if (pageImg) pageImg.src = art.page_image_path || '/uploads/pages/placeholder_page.png';
        if (pdfLink) pdfLink.href = art.pdf_path || '#';
        currentZoomScale = 1.0;
        applyZoomTransform();

        // 3. Image Manager Setup
        const imgPreview = document.getElementById('art-edit-img-preview');
        const imgPlaceholder = document.getElementById('art-edit-img-placeholder');
        const imgCaption = document.getElementById('art-edit-img-caption');

        let images = [];
        if (art.images_json) {
            try { images = JSON.parse(art.images_json); } catch(e) { images = []; }
        }
        if (!Array.isArray(images) || images.length === 0) {
            if (art.image_url) images = [art.image_url];
        }
        window.editImagesArray = images;
        if (typeof window.renderEditImagesGrid === 'function') window.renderEditImagesGrid();

        if (art.image_url) {
            if (imgPreview) { imgPreview.src = art.image_url; imgPreview.style.display = 'block'; }
            if (imgPlaceholder) imgPlaceholder.style.display = 'none';
        } else {
            if (imgPreview) imgPreview.style.display = 'none';
            if (imgPlaceholder) imgPlaceholder.style.display = 'inline';
        }
        if (imgCaption) imgCaption.value = art.image_caption_te || '';

        // 4. Compute Extraction Warnings & Confidence Badges
        evaluateExtractionWarnings(art);
    }

    // ----------------------------------------------------------------------
    // EXTRACTION WARNINGS & CONFIDENCE EVALUATOR
    // ----------------------------------------------------------------------
    function evaluateExtractionWarnings(art) {
        const warningsBox = document.getElementById('warnings-list-container');
        const badgesBox = document.getElementById('confidence-badges-container');
        if (!warningsBox || !badgesBox) return;

        const warnings = [];

        // Check Title
        if (!art.title_te || art.title_te.trim().length < 4) {
            warnings.push({ type: 'danger', message: '⚠️ శీర్షిక లేదు లేదా చాలా చిన్నగా ఉంది (Title is missing or empty)' });
        }

        // Check Body Length
        if (!art.content_te || art.content_te.trim().length < 30) {
            warnings.push({ type: 'danger', message: '⚠️ వార్తా పాఠం చాలా తక్కువగా ఉంది (Article content body is empty or too short)' });
        }

        // Check Encoding / Suspicious Unicode Characters
        if (art.content_te && (art.content_te.includes('\uFFFD') || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(art.content_te))) {
            warnings.push({ type: 'danger', message: '⚠️ ఎన్‌కోడింగ్ లోపం లేదా దెబ్బతిన్న అక్షరాలు ఉన్నాయి (Suspicious Unicode encoding artifacts detected)' });
        }

        // Check Image
        if (!art.image_url) {
            warnings.push({ type: 'warning', message: '⚠️ ఈ వార్తకు చిత్రం (Image) జతచేయబడలేదు (Article image not detected)' });
        }

        // Check District Assignment
        if (art.category === 'district' && !art.district) {
            warnings.push({ type: 'warning', message: '⚠️ జిల్లా వార్త విభాగానికి ఆంధ్రప్రదేశ్ జిల్లా ఎంపిక కాలేదు (AP District not assigned for district article)' });
        }

        if (warnings.length === 0) {
            warnings.push({ type: 'success', message: '✅ వార్తా పాఠం సమగ్రంగా ఉంది. ఎటువంటి హెచ్చరికలూ లేవు. (Article content ready)' });
        }

        warningsBox.innerHTML = warnings.map(w => `<div class="warning-item ${w.type}">${w.message}</div>`).join('');

        // Badges
        badgesBox.innerHTML = `
            <span class="status-badge badge-published">విభాగం: ${art.category || 'మమ్మేక్'}</span>
        `;
    }

    // ----------------------------------------------------------------------
    // SOURCE PAGE VIEWER ZOOM CONTROLS
    // ----------------------------------------------------------------------
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const zoomResetBtn = document.getElementById('zoom-reset-btn');

    if (zoomInBtn) zoomInBtn.onclick = () => { currentZoomScale = Math.min(3.0, currentZoomScale + 0.25); applyZoomTransform(); };
    if (zoomOutBtn) zoomOutBtn.onclick = () => { currentZoomScale = Math.max(0.5, currentZoomScale - 0.25); applyZoomTransform(); };
    if (zoomResetBtn) zoomResetBtn.onclick = () => { currentZoomScale = 1.0; applyZoomTransform(); };

    function applyZoomTransform() {
        const container = document.getElementById('source-img-container');
        if (container) {
            container.style.transform = `scale(${currentZoomScale})`;
        }
    }

    // ----------------------------------------------------------------------
    // TAB TOGGLE (EDITED AUTHORITATIVE VS RAW EXTRACTED TEXT)
    // ----------------------------------------------------------------------
    const tabEdited = document.getElementById('tab-btn-edited');
    const tabRaw = document.getElementById('tab-btn-raw');
    const containerEdited = document.getElementById('container-edited-content');
    const containerRaw = document.getElementById('container-raw-content');

    if (tabEdited && tabRaw) {
        tabEdited.onclick = () => {
            tabEdited.classList.add('active');
            tabRaw.classList.remove('active');
            if (containerEdited) containerEdited.style.display = 'block';
            if (containerRaw) containerRaw.style.display = 'none';
        };
        tabRaw.onclick = () => {
            tabRaw.classList.add('active');
            tabEdited.classList.remove('active');
            if (containerEdited) containerEdited.style.display = 'none';
            if (containerRaw) containerRaw.style.display = 'block';
        };
    }

    // ----------------------------------------------------------------------
    // IMAGE UPLOAD & IMAGE PICKER LOGIC
    // ----------------------------------------------------------------------
    const triggerImgBtn = document.getElementById('art-btn-trigger-img-upload');
    const imgFileInput = document.getElementById('art-edit-image-file');
    const removeImgBtn = document.getElementById('art-btn-remove-img');
    const pickMediaBtn = document.getElementById('art-btn-pick-edition-media');

    if (triggerImgBtn && imgFileInput) {
        triggerImgBtn.onclick = (e) => {
            e.preventDefault();
            imgFileInput.click();
        };
        imgFileInput.onchange = () => {
            if (imgFileInput.files && imgFileInput.files.length > 0) {
                if (typeof window.uploadImageFiles === 'function') {
                    window.uploadImageFiles(Array.from(imgFileInput.files), 'edit');
                }
                imgFileInput.value = '';
            }
        };
    }

    if (removeImgBtn) {
        removeImgBtn.onclick = () => {
            window.editImagesArray = [];
            if (typeof window.renderEditImagesGrid === 'function') window.renderEditImagesGrid();
            if (imgFileInput) imgFileInput.value = '';
        };
    }

    // Media Picker Modal
    const mediaModal = document.getElementById('media-picker-modal');
    const closeMediaBtn = document.getElementById('close-media-modal-btn');
    if (pickMediaBtn && mediaModal) {
        pickMediaBtn.onclick = async () => {
            const token = localStorage.getItem('admin_token');
            const artId = document.getElementById('art-edit-id').value;
            if (!token || !artId) return;

            const grid = document.getElementById('media-picker-grid');
            if (grid) grid.innerHTML = '<p>ఫొటోలు లోడ్ అవుతున్నాయి...</p>';
            mediaModal.style.display = 'block';

            try {
                const res = await apiFetch(`/api/admin/articles/${artId}`);
                if (res && res.ok) {
                    const data = await res.json();
                    const editionMedia = data.editionMedia || [];
                    if (editionMedia.length === 0) {
                        grid.innerHTML = '<p class="empty-row">ఈ పేజీలో ఇతర ఫొటోలేవీ లేవు.</p>';
                    } else {
                        grid.innerHTML = editionMedia.map(m => `
                            <div class="media-thumb-item" onclick="selectMediaImage('${m.file_path}')" style="cursor:pointer; border:1px solid #ccc; border-radius:4px; overflow:hidden;">
                                <img src="${m.file_path}" style="width:100%; height:80px; object-fit:cover; display:block;">
                            </div>
                        `).join('');
                    }
                }
            } catch (err) {
                if (grid) grid.innerHTML = '<p>ఫొటోల సేకరణ లోపం.</p>';
            }
        };
    }

    if (closeMediaBtn && mediaModal) {
        closeMediaBtn.onclick = () => mediaModal.style.display = 'none';
    }

    window.selectMediaImage = function(filePath) {
        const imgPreview = document.getElementById('art-edit-img-preview');
        const imgPlaceholder = document.getElementById('art-edit-img-placeholder');
        if (imgPreview) { imgPreview.src = filePath; imgPreview.style.display = 'block'; }
        if (imgPlaceholder) imgPlaceholder.style.display = 'none';
        if (currentArticleData) currentArticleData.image_url = filePath;
        if (mediaModal) mediaModal.style.display = 'none';
        evaluateExtractionWarnings(currentArticleData);
    };

    // ----------------------------------------------------------------------
    // SAVE DRAFT / PREVIEW / PUBLISH ACTIONS
    // ----------------------------------------------------------------------
    const saveDraftBtn = document.getElementById('art-btn-save-draft');
    const previewBtn = document.getElementById('art-btn-preview');
    const publishBtn = document.getElementById('art-btn-publish');

    if (saveDraftBtn) {
        saveDraftBtn.onclick = () => saveArticlePayload('draft');
    }

    if (publishBtn) {
        publishBtn.onclick = () => saveArticlePayload('published');
    }

    // ----------------------------------------------------------------------
    // PREVIEW MODAL LOGIC
    // ----------------------------------------------------------------------
    const previewModal = document.getElementById('article-preview-modal');
    const closePreviewBtn = document.getElementById('close-preview-modal-btn');
    const previewBackBtn = document.getElementById('preview-back-btn');
    const previewPublishBtn = document.getElementById('preview-publish-btn');

    if (previewBtn && previewModal) {
        previewBtn.onclick = () => {
            const payload = collectFormPayload();
            renderArticlePreview(payload);
            previewModal.style.display = 'block';
        };
    }

    if (closePreviewBtn && previewModal) closePreviewBtn.onclick = () => previewModal.style.display = 'none';
    if (previewBackBtn && previewModal) previewBackBtn.onclick = () => previewModal.style.display = 'none';
    if (previewPublishBtn) {
        previewPublishBtn.onclick = () => {
            if (previewModal) previewModal.style.display = 'none';
            saveArticlePayload('published');
        };
    }

    function renderArticlePreview(art) {
        const bodyBox = document.getElementById('preview-modal-body');
        if (!bodyBox) return;

        const dateStr = art.date || new Date().toISOString().split('T')[0];
        const categoryName = art.category ? art.category.toUpperCase() : 'NEWS';
        const paragraphs = (art.content_te || '').split(/\n\s*\n+/).map(p => `<p style="margin-bottom:14px;">${escapeHTML(p)}</p>`).join('');

        bodyBox.innerHTML = `
            <div style="display:flex; gap:8px; margin-bottom:12px;">
                <span class="status-badge badge-published">${categoryName}</span>
                ${art.district ? `<span class="status-badge badge-uploaded">${art.district.toUpperCase()}</span>` : ''}
            </div>

            <h1 style="font-size: 1.8rem; font-weight: 700; color: #111; line-height: 1.3; margin-bottom: 8px;">${escapeHTML(art.title_te)}</h1>

            <div style="font-size: 0.85rem; color: #64748b; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
                ✍️ <strong>${escapeHTML(art.author_name)}</strong> | 📅 ${dateStr}
            </div>

            ${art.image_url ? `
                <div style="margin-bottom: 20px; border-radius:6px; overflow:hidden;">
                    <img src="${art.image_url}" style="width:100%; max-height:400px; object-fit:cover; display:block;">
                    ${art.image_caption_te ? `<div style="font-size:0.8rem; color:#555; background:#f1f5f9; padding:6px 12px;">${escapeHTML(art.image_caption_te)}</div>` : ''}
                </div>
            ` : ''}

            <div style="font-size: 1.05rem; line-height: 1.7; color: #1e293b;">
                ${paragraphs}
            </div>
        `;
    }

    // ----------------------------------------------------------------------
    // VALIDATION & SAVE PAYLOAD ENGINE
    // ----------------------------------------------------------------------
    function collectFormPayload() {
        const imgPreview = document.getElementById('art-edit-img-preview');
        const fallbackUrl = (imgPreview && imgPreview.style.display !== 'none' && imgPreview.src) ? imgPreview.getAttribute('src') || imgPreview.src : null;
        const imagesArr = (Array.isArray(window.editImagesArray) && window.editImagesArray.length > 0) ? window.editImagesArray : (fallbackUrl ? [fallbackUrl] : []);
        const imageUrl = imagesArr[0] || fallbackUrl;
        const subElem = document.getElementById('art-edit-subheadline-te');
        const sumElem = document.getElementById('art-edit-summary-te');

        return {
            id: document.getElementById('art-edit-id').value,
            title_te: document.getElementById('art-edit-title-te').value.trim(),
            subheadline_te: subElem ? subElem.value.trim() : '',
            category: document.getElementById('art-edit-category').value,
            district: document.getElementById('art-edit-district').value,
            status: document.getElementById('art-edit-status').value,
            author_name: document.getElementById('art-edit-author').value.trim() || 'మమేక మహోదయం డెస్క్',
            date: document.getElementById('art-edit-date').value,
            image_url: imageUrl,
            images_json: JSON.stringify(imagesArr),
            image_urls: imagesArr,
            image_caption_te: document.getElementById('art-edit-img-caption').value.trim(),
            show_on_homepage: document.getElementById('art-edit-homepage').checked ? 1 : 0,
            featured: document.getElementById('art-edit-featured').checked ? 1 : 0,
            is_breaking: document.getElementById('art-edit-breaking').checked ? 1 : 0,
            summary_te: sumElem ? sumElem.value.trim() : '',
            content_te: document.getElementById('art-edit-content-te').value.trim()
        };
    }

    function validateArticleForPublish(payload) {
        if (!payload.title_te || payload.title_te.length < 3) {
            return 'శీర్షిక ఖాళీగా ఉంది. దయచేసి శీర్షికను నమోదు చేయండి. (Headline is required)';
        }
        if (!payload.content_te || payload.content_te.length < 20) {
            return 'పూర్తి వార్తా వివరాలు ఖాళీగా ఉన్నాయి. (Content body is required)';
        }
        if (!payload.category) {
            return 'దయచేసి వార్తా విభాగాన్ని (Category) ఎంచుకోండి.';
        }
        if (payload.content_te.includes('\uFFFD')) {
            return 'వార్తా పాఠంలో దెబ్బతిన్న అక్షరాలు (Corrupted Unicode \\uFFFD) ఉన్నాయి. దయచేసి సరిదిద్దండి.';
        }
        return null;
    }

    async function saveArticlePayload(targetStatus) {
        const token = localStorage.getItem('admin_token');
        if (!token) return;

        const alertBox = document.getElementById('art-edit-alert');
        const payload = collectFormPayload();
        payload.status = targetStatus;

        if (targetStatus === 'published') {
            const err = validateArticleForPublish(payload);
            if (err) {
                showAlert(alertBox, `❌ ప్రచురణ నిలిపివేయబడింది: ${err}`, 'error');
                return;
            }
        }

        try {
            const res = await apiFetch(`/api/admin/articles/${payload.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (res && res.ok) {
                const msg = targetStatus === 'published' ? '🚀 వార్త విజయవంతంగా వెబ్‌సైట్‌లో ప్రచురించబడింది!' : '💾 డ్రాఫ్ట్ విజయవంతంగా భద్రపరచబడింది!';
                showAlert(alertBox, `✓ ${msg}`, 'success');
                setTimeout(() => { window.location.hash = '#/articles'; }, 1000);
            } else {
                showAlert(alertBox, data.error || 'భద్రపరచడం విఫలమైంది', 'error');
            }
        } catch (err) {
            showAlert(alertBox, 'నెట్‌వర్క్ లోపం ఏర్పడింది', 'error');
        }
    }


    // ----------------------------------------------------------------------
    // DROPDOWN INITIALIZER & UTILS
    // ----------------------------------------------------------------------
    function initDropdowns() {
        const districts = (typeof MAMEKA_DISTRICTS !== 'undefined') ? MAMEKA_DISTRICTS.getAllDistricts() : [];
        const categories = (typeof MAMEKA_CATEGORIES !== 'undefined') ? MAMEKA_CATEGORIES.categories : [];

        const filterDist = document.getElementById('art-filter-district');
        if (filterDist && filterDist.children.length <= 1) {
            filterDist.innerHTML = `<option value="">అన్ని జిల్లాలు (All 26 Districts)</option>` +
                districts.map(d => `<option value="${d.code}">${d.name_te} (${d.name_en})</option>`).join('');
        }

        const editDist = document.getElementById('art-edit-district');
        if (editDist && editDist.children.length === 0) {
            editDist.innerHTML = `<option value="">జిల్లా లేదు (No District)</option>` +
                districts.map(d => `<option value="${d.code}">${d.name_te} (${d.name_en})</option>`).join('');
        }

        const editCat = document.getElementById('art-edit-category');
        if (editCat && editCat.children.length === 0) {
            editCat.innerHTML = categories.map(c => `<option value="${c.id || c.slug || c.code}">${c.name_te} (${c.name_en})</option>`).join('');
        }

        const createDist = document.getElementById('create-district');
        if (createDist && createDist.children.length === 0) {
            createDist.innerHTML = `<option value="">జిల్లాను ఎంచుకోండి (Select AP District)</option>` +
                districts.map(d => `<option value="${d.code}">${d.name_te} (${d.name_en})</option>`).join('');
        }

        const createCat = document.getElementById('create-category');
        if (createCat && createCat.children.length === 0) {
            createCat.innerHTML = categories.map(c => `<option value="${c.id || c.slug || c.code}">${c.name_te} (${c.name_en})</option>`).join('');
        }
    }

    // ----------------------------------------------------------------------
    // CREATE NEWS VIEW & DIRECT PUBLISHING WORKFLOW
    // ----------------------------------------------------------------------
    let createNewsInitialized = false;

    function initCreateNewsView() {
        initDropdowns();

        const form = document.getElementById('create-news-form');
        const fileInput = document.getElementById('create-image-file');
        const triggerUploadBtn = document.getElementById('create-btn-trigger-upload');
        const removeImgBtn = document.getElementById('create-btn-remove-img');
        const imgUrlInput = document.getElementById('create-image-url');
        const imgPreview = document.getElementById('create-img-preview');
        const imgPreviewBox = document.getElementById('create-img-preview-box');
        const dropArea = document.getElementById('create-image-drop-area');
        const alertBox = document.getElementById('create-news-alert');
        const saveDraftBtn = document.getElementById('create-btn-save-draft');

        window.createImagesArray = window.createImagesArray || [];
        window.editImagesArray = window.editImagesArray || [];

        window.renderCreateImagesGrid = function() {
            const grid = document.getElementById('create-multi-images-grid');
            const mainUrlInput = document.getElementById('create-image-url');
            const preview = document.getElementById('create-img-preview');
            const box = document.getElementById('create-img-preview-box');
            const rmBtn = document.getElementById('create-btn-remove-img');

            if (!grid) return;
            const arr = window.createImagesArray || [];
            if (arr.length === 0) {
                grid.style.display = 'none';
                grid.innerHTML = '';
                if (mainUrlInput) mainUrlInput.value = '';
                if (box) box.style.display = 'none';
                if (rmBtn) rmBtn.style.display = 'none';
                return;
            }

            grid.style.display = 'flex';
            grid.innerHTML = `
                <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <span style="font-weight: 700; font-size: 0.85rem; color: #1e293b;">📸 జతచేసిన ఫొటోలు (${arr.length}):</span>
                    <span style="font-size: 0.75rem; color: #64748b;">(ముఖ్య చిత్రం కోసం ⭐ Cover నొక్కండి)</span>
                </div>
                <div style="display: flex; gap: 8px; flex-wrap: wrap; width: 100%;">
                    ${arr.map((url, idx) => `
                        <div style="position: relative; width: 85px; height: 85px; border-radius: 6px; overflow: hidden; border: ${idx === 0 ? '3px solid #2563eb' : '1px solid #cbd5e1'}; background: #f8fafc;">
                            <img src="${url}" style="width: 100%; height: 100%; object-fit: cover;">
                            ${idx === 0 ? `<span style="position: absolute; top: 2px; left: 2px; background: #2563eb; color: #fff; font-size: 0.65rem; padding: 1px 4px; border-radius: 3px; font-weight: 700;">Cover</span>` : `
                                <button type="button" onclick="window.setCreateCoverImage(${idx})" style="position: absolute; top: 2px; left: 2px; background: rgba(0,0,0,0.65); color: #fff; border: none; font-size: 0.65rem; padding: 2px 4px; border-radius: 3px; cursor: pointer;">⭐ Cover</button>
                            `}
                            <button type="button" onclick="window.removeCreateImage(${idx})" style="position: absolute; top: 2px; right: 2px; background: #ef4444; color: #fff; border: none; width: 18px; height: 18px; border-radius: 50%; font-size: 0.7rem; cursor: pointer; display: flex; align-items: center; justify-content: center;">×</button>
                        </div>
                    `).join('')}
                </div>
            `;

            const coverUrl = arr[0] || '';
            if (mainUrlInput) mainUrlInput.value = coverUrl;
            if (preview) preview.src = coverUrl;
            if (box) box.style.display = coverUrl ? 'flex' : 'none';
            if (rmBtn) rmBtn.style.display = arr.length > 0 ? 'inline-block' : 'none';
        };

        window.setCreateCoverImage = function(idx) {
            if (idx > 0 && idx < window.createImagesArray.length) {
                const item = window.createImagesArray.splice(idx, 1)[0];
                window.createImagesArray.unshift(item);
                window.renderCreateImagesGrid();
            }
        };

        window.removeCreateImage = function(idx) {
            if (idx >= 0 && idx < window.createImagesArray.length) {
                window.createImagesArray.splice(idx, 1);
                window.renderCreateImagesGrid();
            }
        };

        window.renderEditImagesGrid = function() {
            const grid = document.getElementById('art-edit-multi-images-grid');
            const preview = document.getElementById('art-edit-img-preview');
            const placeholder = document.getElementById('art-edit-img-placeholder');

            if (!grid) return;
            const arr = window.editImagesArray || [];
            if (arr.length === 0) {
                grid.style.display = 'none';
                grid.innerHTML = '';
                if (preview) { preview.src = ''; preview.style.display = 'none'; }
                if (placeholder) placeholder.style.display = 'block';
                return;
            }

            grid.style.display = 'flex';
            grid.innerHTML = `
                <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <span style="font-weight: 700; font-size: 0.85rem; color: #1e293b;">📸 వార్తా ఫొటోల గ్యాలరీ (${arr.length}):</span>
                    <span style="font-size: 0.75rem; color: #64748b;">(ముఖ్య చిత్రం కోసం ⭐ Cover నొక్కండి)</span>
                </div>
                <div style="display: flex; gap: 8px; flex-wrap: wrap; width: 100%;">
                    ${arr.map((url, idx) => `
                        <div style="position: relative; width: 85px; height: 85px; border-radius: 6px; overflow: hidden; border: ${idx === 0 ? '3px solid #2563eb' : '1px solid #cbd5e1'}; background: #f8fafc;">
                            <img src="${url}" style="width: 100%; height: 100%; object-fit: cover;">
                            ${idx === 0 ? `<span style="position: absolute; top: 2px; left: 2px; background: #2563eb; color: #fff; font-size: 0.65rem; padding: 1px 4px; border-radius: 3px; font-weight: 700;">Cover</span>` : `
                                <button type="button" onclick="window.setEditCoverImage(${idx})" style="position: absolute; top: 2px; left: 2px; background: rgba(0,0,0,0.65); color: #fff; border: none; font-size: 0.65rem; padding: 2px 4px; border-radius: 3px; cursor: pointer;">⭐ Cover</button>
                            `}
                            <button type="button" onclick="window.removeEditImage(${idx})" style="position: absolute; top: 2px; right: 2px; background: #ef4444; color: #fff; border: none; width: 18px; height: 18px; border-radius: 50%; font-size: 0.7rem; cursor: pointer; display: flex; align-items: center; justify-content: center;">×</button>
                        </div>
                    `).join('')}
                </div>
            `;

            const coverUrl = arr[0] || '';
            if (preview) {
                preview.src = coverUrl;
                preview.style.display = coverUrl ? 'block' : 'none';
            }
            if (placeholder) placeholder.style.display = coverUrl ? 'none' : 'block';
        };

        window.setEditCoverImage = function(idx) {
            if (idx > 0 && idx < window.editImagesArray.length) {
                const item = window.editImagesArray.splice(idx, 1)[0];
                window.editImagesArray.unshift(item);
                window.renderEditImagesGrid();
            }
        };

        window.removeEditImage = function(idx) {
            if (idx >= 0 && idx < window.editImagesArray.length) {
                window.editImagesArray.splice(idx, 1);
                window.renderEditImagesGrid();
            }
        };

        if (createNewsInitialized) return;
        createNewsInitialized = true;

        // Universal Clipboard Paste Event Listener for Work-Reducing Direct Image Pasting (Ctrl+V)
        window.addEventListener('paste', (e) => {
            const createNewsSection = document.getElementById('view-create-news');
            const editViewSection = document.getElementById('view-article-edit');

            const isCreateViewActive = createNewsSection && (getComputedStyle(createNewsSection).display !== 'none');
            const isEditViewActive = editViewSection && (getComputedStyle(editViewSection).display !== 'none');

            if (!isCreateViewActive && !isEditViewActive) return;

            const clipboardData = e.clipboardData || (e.originalEvent && e.originalEvent.clipboardData);
            if (!clipboardData) return;

            let pastedFiles = [];

            if (clipboardData.files && clipboardData.files.length > 0) {
                for (let i = 0; i < clipboardData.files.length; i++) {
                    const file = clipboardData.files[i];
                    if (file && file.type && file.type.startsWith('image/')) {
                        pastedFiles.push(file);
                    }
                }
            }

            if (pastedFiles.length === 0 && clipboardData.items && clipboardData.items.length > 0) {
                for (let i = 0; i < clipboardData.items.length; i++) {
                    const item = clipboardData.items[i];
                    if (item && item.kind === 'file' && item.type && item.type.startsWith('image/')) {
                        const file = item.getAsFile();
                        if (file) pastedFiles.push(file);
                    }
                }
            }

            if (pastedFiles.length > 0) {
                e.preventDefault();
                e.stopPropagation();

                if (isCreateViewActive) {
                    uploadImageFiles(pastedFiles, 'create');
                } else if (isEditViewActive) {
                    uploadImageFiles(pastedFiles, 'edit');
                }
                return;
            }

            const pastedText = (clipboardData.getData('text/plain') || '').trim();
            const activeElem = document.activeElement;
            const isTextOrTitleFocused = activeElem && (
                activeElem.id === 'create-title-te' ||
                activeElem.id === 'create-content-te' ||
                activeElem.id === 'art-edit-title-te' ||
                activeElem.id === 'art-edit-content-te'
            );

            if (!isTextOrTitleFocused && pastedText && (pastedText.match(/\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i) || pastedText.startsWith('data:image/'))) {
                e.preventDefault();
                if (isCreateViewActive) {
                    window.createImagesArray = window.createImagesArray || [];
                    if (!window.createImagesArray.includes(pastedText)) window.createImagesArray.push(pastedText);
                    window.renderCreateImagesGrid();
                    showAlert(alertBox, '✓ ఫొటో URL విజయవంతంగా జత చేయబడింది!', 'success');
                } else if (isEditViewActive) {
                    window.editImagesArray = window.editImagesArray || [];
                    if (!window.editImagesArray.includes(pastedText)) window.editImagesArray.push(pastedText);
                    window.renderEditImagesGrid();
                }
            }
        });

        if (dropArea && fileInput) {
            dropArea.onclick = (e) => {
                if (e.target === fileInput) return;
                fileInput.click();
            };
        }

        if (dropArea) {
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropArea.addEventListener(eventName, (e) => { e.preventDefault(); e.stopPropagation(); }, false);
            });
            ['dragenter', 'dragover'].forEach(eventName => {
                dropArea.addEventListener(eventName, () => dropArea.classList.add('dragover'), false);
            });
            ['dragleave', 'drop'].forEach(eventName => {
                dropArea.addEventListener(eventName, () => dropArea.classList.remove('dragover'), false);
            });
            dropArea.addEventListener('drop', (e) => {
                const dt = e.dataTransfer;
                const files = dt ? dt.files : null;
                if (files && files.length > 0) {
                    const validFiles = Array.from(files).filter(f => f.type && f.type.startsWith('image/'));
                    if (validFiles.length > 0) window.uploadImageFiles(validFiles, 'create');
                }
            });
        }

        if (fileInput) {
            fileInput.onchange = () => {
                if (fileInput.files && fileInput.files.length > 0) {
                    window.uploadImageFiles(Array.from(fileInput.files), 'create');
                    fileInput.value = '';
                }
            };
        }

        window.uploadImageFiles = async function(files, targetMode = 'create') {
            if (!files || !files.length) return;
            const formData = new FormData();
            files.forEach(f => formData.append('images', f));

            const createAlert = document.getElementById('create-news-alert');
            const editAlert = document.getElementById('art-edit-alert');
            const activeAlert = targetMode === 'create' ? createAlert : editAlert;

            try {
                if (activeAlert) {
                    showAlert(activeAlert, 'చిత్రాలు అప్‌లోడ్ అవుతున్నాయి... (Uploading images...)', 'info');
                }
                const res = await apiFetch('/api/admin/upload-image', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    const newUrls = data.image_urls || (data.image_url ? [data.image_url] : []);
                    if (targetMode === 'create') {
                        window.createImagesArray = (window.createImagesArray || []).concat(newUrls);
                        if (typeof window.renderCreateImagesGrid === 'function') window.renderCreateImagesGrid();
                        if (activeAlert) showAlert(activeAlert, `✓ ${newUrls.length} ఫొటో(లు) విజయవంతంగా జత చేయబడ్డాయి!`, 'success');
                    } else {
                        window.editImagesArray = (window.editImagesArray || []).concat(newUrls);
                        if (typeof window.renderEditImagesGrid === 'function') window.renderEditImagesGrid();
                        if (activeAlert) showAlert(activeAlert, `✓ ${newUrls.length} ఫొటో(లు) విజయవంతంగా జత చేయబడ్డాయి!`, 'success');
                    }
                } else {
                    if (activeAlert) showAlert(activeAlert, data.error || 'చిత్రం అప్‌లోడ్ విఫలమైంది.', 'error');
                }
            } catch (err) {
                console.error('Image upload error:', err);
                if (activeAlert) showAlert(activeAlert, 'చిత్రం అప్‌లోడ్ సర్వర్ లోపం.', 'error');
            }
        };

        if (imgUrlInput) {
            imgUrlInput.addEventListener('input', () => {
                const url = imgUrlInput.value.trim();
                if (url) {
                    window.createImagesArray = window.createImagesArray || [];
                    if (!window.createImagesArray.includes(url)) window.createImagesArray.push(url);
                    window.renderCreateImagesGrid();
                }
            });
        }

        if (removeImgBtn) {
            removeImgBtn.addEventListener('click', () => {
                window.createImagesArray = [];
                window.renderCreateImagesGrid();
                if (fileInput) fileInput.value = '';
            });
        }

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                submitCreateNews('published');
            });
        }

        if (saveDraftBtn) {
            saveDraftBtn.addEventListener('click', () => submitCreateNews('draft'));
        }

        async function submitCreateNews(targetStatus) {
            const titleInput = document.getElementById('create-title-te');
            const contentInput = document.getElementById('create-content-te');
            const publishBtn = document.getElementById('create-btn-publish');

            const title_te = titleInput ? titleInput.value.trim() : '';
            const content_te = contentInput ? contentInput.value.trim() : '';
            const category = document.getElementById('create-category') ? document.getElementById('create-category').value : 'state';
            const district = document.getElementById('create-district') ? document.getElementById('create-district').value : '';
            const author_name = document.getElementById('create-author') ? document.getElementById('create-author').value.trim() : '';
            const image_url = document.getElementById('create-image-url') ? document.getElementById('create-image-url').value.trim() : '';
            const image_caption_te = document.getElementById('create-image-caption') ? document.getElementById('create-image-caption').value.trim() : '';
            const show_on_homepage = document.getElementById('create-homepage') ? document.getElementById('create-homepage').checked : true;
            const featured = document.getElementById('create-featured') ? document.getElementById('create-featured').checked : false;
            const is_breaking = document.getElementById('create-breaking') ? document.getElementById('create-breaking').checked : false;

            if (!title_te) {
                if (alertBox) {
                    alertBox.className = 'alert alert-error';
                    alertBox.style.display = 'block';
                    alertBox.innerHTML = '<strong>⚠️ దయచేసి వార్తా శీర్షికను (Headline) నమోదు చేయండి.</strong>';
                    alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                if (titleInput) titleInput.focus();
                return;
            }
            if (!content_te) {
                if (alertBox) {
                    alertBox.className = 'alert alert-error';
                    alertBox.style.display = 'block';
                    alertBox.innerHTML = '<strong>⚠️ దయచేసి పూర్తి వార్తా వివరాలను (Content Body) నమోదు చేయండి.</strong>';
                    alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                if (contentInput) contentInput.focus();
                return;
            }

            try {
                if (publishBtn) {
                    publishBtn.disabled = true;
                    publishBtn.innerHTML = '⏳ వార్త ప్రచురించబడుతోంది... (Publishing...)';
                }
                if (alertBox) {
                    alertBox.className = 'alert alert-info';
                    alertBox.style.display = 'block';
                    alertBox.innerHTML = '⏳ వార్త సర్వర్‌లో ప్రచురించబడుతోంది... (Publishing article to live site...)';
                }

                const createImages = window.createImagesArray || [];
                const mainCoverUrl = createImages.length > 0 ? createImages[0] : (image_url || null);

                const res = await apiFetch('/api/admin/articles', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title_te,
                        title_en: title_te,
                        subheadline_te: '',
                        category,
                        district: district || null,
                        author_name: author_name || 'మమేక మహోదయం డెస్క్',
                        status: targetStatus,
                        image_url: mainCoverUrl,
                        images_json: JSON.stringify(createImages),
                        image_urls: createImages,
                        image_caption_te,
                        show_on_homepage: show_on_homepage ? 1 : 0,
                        featured: featured ? 1 : 0,
                        is_breaking: is_breaking ? 1 : 0,
                        summary_te: '',
                        summary_en: '',
                        content_te,
                        content_en: content_te
                    })
                });

                const data = await res.json();
                if (publishBtn) {
                    publishBtn.disabled = false;
                    publishBtn.innerHTML = '🚀 ప్రచురించు (Publish Article Live)';
                }

                if (res.ok && data.success && data.article) {
                    const article = data.article;
                    const liveArticleUrl = article.slug ? `/news/${encodeURIComponent(article.slug)}` : `/article.html?id=${encodeURIComponent(article.id)}`;

                    if (alertBox) {
                        alertBox.className = 'alert alert-success';
                        alertBox.style.cssText = 'display:block; padding:18px; border-radius:8px; background-color:#f0fdf4; border:1px solid #16a34a; color:#15803d; margin-bottom:20px;';
                        alertBox.innerHTML = `
                            <div style="font-weight:700; font-size:1.15rem; margin-bottom:6px;">
                                🎉 వార్త విజయవంతంగా లైవ్‌లో ప్రచురించబడింది! (News Article Published Live!)
                            </div>
                            <div style="font-size:0.95rem; color:#166534; margin-bottom:14px;">
                                <strong>శీర్షిక:</strong> ${escapeHTML(article.title_te)}<br>
                                <strong>విభాగం:</strong> ${escapeHTML((article.category || 'state').toUpperCase())} ${article.district ? `| <strong>జిల్లా:</strong> ${escapeHTML(article.district.toUpperCase())}` : ''}
                            </div>
                            <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
                                <a href="${liveArticleUrl}" target="_blank" class="btn btn-primary" style="padding:8px 18px; text-decoration:none; font-weight:700; font-size:0.9rem;">
                                    🌐 పత్రిక వెబ్‌సైట్‌లో లైవ్ వార్త చూడండి (View Live Story) →
                                </a>
                                <button type="button" id="btn-reset-and-create-another" class="btn btn-secondary" style="padding:8px 16px; font-size:0.9rem;">
                                    + మరో కొత్త వార్త రాయండి (Create Another Article)
                                </button>
                                <a href="#/articles" class="btn btn-outline-sm" style="padding:8px 16px; text-decoration:none; font-size:0.9rem;">
                                    📋 వార్తల జాబితా (View Articles List)
                                </a>
                            </div>
                        `;
                        alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });

                        const resetBtn = document.getElementById('btn-reset-and-create-another');
                        if (resetBtn) {
                            resetBtn.addEventListener('click', () => {
                                form.reset();
                                window.createImagesArray = [];
                                window.renderCreateImagesGrid();
                                alertBox.style.display = 'none';
                                if (titleInput) titleInput.focus();
                            });
                        }
                    }
                } else {
                    const errorMsg = (data && data.error) ? data.error : 'సర్వర్ సరిగ్గా స్పందించలేదు. (Server Error)';
                    if (alertBox) {
                        alertBox.className = 'alert alert-error';
                        alertBox.style.cssText = 'display:block; padding:18px; border-radius:8px; background-color:#fef2f2; border:1px solid #dc2626; color:#b91c1c; margin-bottom:20px;';
                        alertBox.innerHTML = `
                            <div style="font-weight:700; font-size:1.1rem; margin-bottom:4px;">
                                ❌ వార్త ప్రచురణ విఫలమైంది (Failed to Publish Article)
                            </div>
                            <div style="font-size:0.95rem;">${escapeHTML(errorMsg)}</div>
                        `;
                        alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            } catch (err) {
                console.error('Create article error:', err);
                if (publishBtn) {
                    publishBtn.disabled = false;
                    publishBtn.innerHTML = '🚀 ప్రచురించు (Publish Article Live)';
                }
                if (alertBox) {
                    alertBox.className = 'alert alert-error';
                    alertBox.style.cssText = 'display:block; padding:18px; border-radius:8px; background-color:#fef2f2; border:1px solid #dc2626; color:#b91c1c; margin-bottom:20px;';
                    alertBox.innerHTML = `
                        <div style="font-weight:700; font-size:1.1rem; margin-bottom:4px;">
                            ❌ సిస్టమ్ లేదా నెట్‌వర్క్ లోపం (Network / Server Failure)
                        </div>
                        <div style="font-size:0.95rem;">${escapeHTML(err.message || 'నెట్‌వర్క్ కనెక్షన్ లోపం')}</div>
                    `;
                    alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }
    }

    // ----------------------------------------------------------------------
    // MEDIA LIBRARY VIEW LOGIC
    // ----------------------------------------------------------------------
    async function loadMediaLibraryView() {
        const grid = document.getElementById('media-library-grid');
        const alertBox = document.getElementById('media-library-alert');
        const uploadBtn = document.getElementById('btn-upload-standalone-media');
        const uploadInput = document.getElementById('media-standalone-upload-input');

        if (!grid) return;

        if (uploadBtn && uploadInput) {
            uploadBtn.onclick = () => uploadInput.click();
            uploadInput.onchange = async () => {
                const file = uploadInput.files[0];
                if (!file) return;

                const formData = new FormData();
                formData.append('image_file', file);

                try {
                    showAlert(alertBox, 'ఫొటో అప్‌లోడ్ అవుతోంది...', 'info');
                    const res = await apiFetch('/api/admin/upload-image', {
                        method: 'POST',
                        body: formData
                    });
                    const data = await res.json();
                    if (res.ok && data.success) {
                        showAlert(alertBox, '✓ ఫొటో లైబ్రరీలోకి విజయవంతంగా అప్‌లోడ్ చేయబడింది!', 'success');
                        uploadInput.value = '';
                        loadMediaLibraryView();
                    } else {
                        showAlert(alertBox, data.error || 'అప్‌లోడ్ విఫలమైంది.', 'error');
                    }
                } catch (e) {
                    showAlert(alertBox, 'అప్‌లోడ్ లోపం.', 'error');
                }
            };
        }

        try {
            grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:30px; color:#64748b;">మీడియా లోడ్ అవుతోంది...</div>';
            const res = await apiFetch('/api/admin/media');
            if (!res.ok) throw new Error('Failed to load media list');
            const data = await res.json();
            const mediaList = data.media || [];

            if (mediaList.length === 0) {
                grid.innerHTML = `
                    <div style="grid-column:1/-1; text-align:center; padding:40px; color:#64748b;">
                        🖼️ లైబ్రరీలో ఇంకా చిత్రాలేవీ లేవు.<br>
                        <span style="font-size:0.85rem;">వార్తల కోసం ఒరిజినల్ క్వాలిటీ ఫొటోలను పైన ఉన్న బటన్ ద్వారా అప్‌లోడ్ చేయవచ్చు.</span>
                    </div>
                `;
                return;
            }

            grid.innerHTML = mediaList.map(item => `
                <div class="card" style="padding:10px; display:flex; flex-direction:column; justify-content:space-between; background:#fff; border:1px solid #e2e8f0; border-radius:8px;">
                    <div style="width:100%; height:140px; background:#f1f5f9; border-radius:6px; overflow:hidden; display:flex; align-items:center; justify-content:center;">
                        <img src="${item.url}" alt="${escapeHTML(item.filename)}" loading="lazy" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100%\\' height=\\'100%\\' fill=\\'%23ccc\\'><rect width=\\'100%\\' height=\\'100%\\'/></svg>';">
                    </div>
                    <div style="margin-top:10px;">
                        <div style="font-weight:600; font-size:0.8rem; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; color:#1e293b;" title="${escapeHTML(item.filename)}">${escapeHTML(item.filename)}</div>
                        <div style="font-size:0.75rem; color:#64748b; margin-top:2px;">${Math.round(item.size_bytes / 1024)} KB</div>
                    </div>
                    <div style="margin-top:10px; display:flex; gap:6px;">
                        <button type="button" class="btn btn-outline-sm btn-block" onclick="navigator.clipboard.writeText('${item.url}'); alert('Image URL Copied!');" style="font-size:0.75rem; padding:4px 8px;">📋 Copy URL</button>
                        <button type="button" class="btn btn-danger-sm" onclick="deleteMediaFile('${item.filename}')" style="font-size:0.75rem; padding:4px 8px;">🗑️</button>
                    </div>
                </div>
            `).join('');

        } catch (err) {
            console.error('Media view error:', err);
            grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:30px; color:#ef4444;">మీడియా జాబితా లోడ్ కావడంలో విఫలమైంది.</div>';
        }
    }

    window.deleteMediaFile = async function(filename) {
        if (!confirm(`మీరు "${filename}" చిత్రానికి నిజంగా తొలగించాలనుకుంటున్నారా?`)) return;
        try {
            const res = await apiFetch(`/api/admin/media/${encodeURIComponent(filename)}`, { method: 'DELETE' });
            if (res.ok) {
                loadMediaLibraryView();
            }
        } catch (e) {
            alert('Delete failed');
        }
    };

    // ----------------------------------------------------------------------
    // PASSWORD CHANGE HANDLER
    // ----------------------------------------------------------------------
    const changePassForm = document.getElementById('change-password-form');
    if (changePassForm) {
        changePassForm.onsubmit = async (e) => {
            e.preventDefault();
            const alertBox = document.getElementById('change-pass-alert');
            const current_password = document.getElementById('current-password').value;
            const new_password = document.getElementById('new-password').value;
            const confirm_password = document.getElementById('confirm-password').value;

            if (new_password.length < 8) {
                showAlert(alertBox, 'పాస్‌వర్డ్ కనీసం 8 అక్షరాలు ఉండాలి. (Password must be at least 8 characters)', 'error');
                return;
            }
            if (new_password !== confirm_password) {
                showAlert(alertBox, 'నూతన పాస్‌వర్డ్‌లు సరిపోలలేదు. (Passwords do not match)', 'error');
                return;
            }

            try {
                showAlert(alertBox, 'పాస్‌వర్డ్ నవీకరించబడుతోంది...', 'info');
                const res = await apiFetch('/api/admin/change-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ current_password, new_password, confirm_password })
                });

                const data = await res.json();
                if (res.ok && data.success) {
                    if (data.token) {
                        localStorage.setItem('admin_token', data.token);
                    }
                    showAlert(alertBox, '✓ ' + (data.message || 'పాస్‌వర్డ్ విజయవంతంగా మార్చబడింది!'), 'success');
                    changePassForm.reset();
                } else {
                    showAlert(alertBox, (data && data.error) || 'పాస్‌వర్డ్ మార్పు విఫలమైంది.', 'error');
                }
            } catch (err) {
                showAlert(alertBox, 'సర్వర్ సంప్రదింపులో లోపం ఏర్పడింది.', 'error');
            }
        };
    }

    function getStatusBadgeHTML(status) {
        const labelMap = {
            'uploaded': 'అప్‌లోడ్ అయ్యింది',
            'processing': 'ప్రోసెస్ అవుతోంది',
            'processed': 'పూర్తయింది',
            'review_pending': 'పరిశీలనలో ఉంది',
            'published': 'ప్రచురించబడింది',
            'draft': 'ఖరారు కానిది',
            'failed': 'విఫలమైంది'
        };
        const label = labelMap[status] || status || 'అప్‌లోడ్ అయ్యింది';
        return `<span class="status-badge badge-${status || 'uploaded'}">${label}</span>`;
    }

    function showAlert(element, message, type) {
        if (!element) return;
        element.textContent = message;
        element.className = `alert alert-${type}`;
        element.style.display = 'block';
    }

    function escapeHTML(str) {
        return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // ----------------------------------------------------------------------
    // 10. REPORTERS & EDITORIAL TEAM MANAGEMENT SYSTEM
    // ----------------------------------------------------------------------
    let reportersInitialized = false;
    let allReportersCache = [];
    let currentReporterPhotoBase64 = null;
    let isReporterPhotoRemoved = false;

    async function loadReportersView() {
        const tableBody = document.getElementById('reporters-table-body');
        const alertBox = document.getElementById('reporters-alert');
        const statTotal = document.getElementById('stat-rep-total');
        const statBureau = document.getElementById('stat-rep-bureau');
        const statMandal = document.getElementById('stat-rep-mandal');
        const statActive = document.getElementById('stat-rep-active');

        // Populate district dropdowns if not already populated
        const districtSelect = document.getElementById('rep-district');
        const districtFilter = document.getElementById('rep-filter-district');
        if (districtSelect && districtSelect.options.length <= 1 && typeof MAMEKA_DISTRICTS !== 'undefined') {
            const list = MAMEKA_DISTRICTS.getAllDistricts ? MAMEKA_DISTRICTS.getAllDistricts() : (MAMEKA_DISTRICTS.getDistrictsList ? MAMEKA_DISTRICTS.getDistrictsList() : []);
            list.forEach(d => {
                if (d.code === 'all') return;
                const opt1 = document.createElement('option');
                opt1.value = d.code;
                opt1.textContent = `${d.name_te} (${d.name_en})`;
                districtSelect.appendChild(opt1);

                if (districtFilter) {
                    const opt2 = document.createElement('option');
                    opt2.value = d.code;
                    opt2.textContent = `${d.name_te} (${d.name_en})`;
                    districtFilter.appendChild(opt2);
                }
            });
        }

        // Initialize UI listeners once
        if (!reportersInitialized) {
            initReporterFormEvents();
            reportersInitialized = true;
        }

        try {
            if (tableBody) tableBody.innerHTML = '<tr class="empty-row"><td colspan="7">రిపోర్టర్ల వివరాలు లోడ్ అవుతున్నాయి...</td></tr>';
            const res = await apiFetch('/api/admin/reporters');
            if (!res.ok) throw new Error('Failed to load reporters');
            const data = await res.json();
            allReportersCache = data.reporters || [];

            // Update stats
            if (statTotal) statTotal.textContent = allReportersCache.length;
            if (statBureau) {
                statBureau.textContent = allReportersCache.filter(r => 
                    (r.designation || '').toLowerCase().includes('bureau') || 
                    (r.designation || '').includes('బ్యూరో')
                ).length;
            }
            if (statMandal) {
                statMandal.textContent = allReportersCache.filter(r => 
                    (r.designation || '').toLowerCase().includes('mandal') || 
                    (r.designation || '').includes('మండల')
                ).length;
            }
            if (statActive) {
                statActive.textContent = allReportersCache.filter(r => r.status === 'active').length;
            }

            // Load QR Domain Configuration
            try {
                const qrConfRes = await apiFetch('/api/admin/reporters-qr/config');
                if (qrConfRes && qrConfRes.ok) {
                    const qrConf = await qrConfRes.json();
                    const domainDisplay = document.getElementById('current-qr-domain-display');
                    const domainInput = document.getElementById('input-qr-base-domain');
                    const effectiveDomain = qrConf.base_url || window.location.origin;
                    if (domainDisplay) {
                        domainDisplay.textContent = effectiveDomain;
                    }
                    if (domainInput && !domainInput.value) {
                        domainInput.value = qrConf.env_base_url || effectiveDomain;
                    }
                }
            } catch (e) {}

            renderReportersTable(allReportersCache);
        } catch (err) {
            console.error('Error loading reporters:', err);
            if (tableBody) tableBody.innerHTML = '<tr class="empty-row"><td colspan="8" style="color:#cc0000; text-align:center;">రిపోర్టర్ల వివరాలు లోడ్ చేయడం విఫలమైంది. దయచేసి రీఫ్రెష్ చేయండి.</td></tr>';
        }
    }

    function updateMandalDropdown(selectedDistrict, preselectedMandal) {
        const mandalSelect = document.getElementById('rep-mandal');
        const customWrap = document.getElementById('rep-mandal-custom-wrap');
        const customInput = document.getElementById('rep-mandal-custom');
        if (!mandalSelect) return;

        mandalSelect.innerHTML = '';
        if (!selectedDistrict) {
            mandalSelect.innerHTML = '<option value="">ముందుగా జిల్లాను ఎంచుకోండి...</option>';
            if (customWrap) customWrap.style.display = 'none';
            return;
        }

        let mandals = [];
        if (typeof MAMEKA_DISTRICTS !== 'undefined' && MAMEKA_DISTRICTS.getMandalsForDistrict) {
            mandals = MAMEKA_DISTRICTS.getMandalsForDistrict(selectedDistrict);
        } else if (typeof window !== 'undefined' && window.AP_MANDALS && window.AP_MANDALS[selectedDistrict]) {
            mandals = window.AP_MANDALS[selectedDistrict];
        }

        // State or National Bureau special handling
        if (selectedDistrict.startsWith('all-') || selectedDistrict === 'all') {
            const defaultOpt = document.createElement('option');
            defaultOpt.value = 'రాష్ట్ర స్థాయి / హెడ్ ఆఫీస్';
            defaultOpt.textContent = 'రాష్ట్ర స్థాయి / హెడ్ ఆఫీస్ (State Bureau / Head Office)';
            defaultOpt.selected = true;
            mandalSelect.appendChild(defaultOpt);
            
            const customOpt = document.createElement('option');
            customOpt.value = '__custom__';
            customOpt.textContent = '➕ నిర్దిష్ట ప్రాంతం నమోదు చేయండి...';
            mandalSelect.appendChild(customOpt);
            return;
        }

        const defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.textContent = mandals.length > 0 
            ? `-- ${mandals.length} మండలాలు అందుబాటులో ఉన్నాయి (మండలం ఎంచుకోండి) --` 
            : 'మండలం ఎంచుకోండి...';
        mandalSelect.appendChild(defaultOpt);

        let matched = false;
        mandals.forEach(m => {
            const opt = document.createElement('option');
            const teName = m.name_te || m;
            const enName = m.name_en || '';
            opt.value = teName;
            opt.textContent = enName ? `${teName} (${enName})` : teName;
            if (preselectedMandal && (preselectedMandal === teName || preselectedMandal === enName || preselectedMandal.includes(teName))) {
                opt.selected = true;
                matched = true;
            }
            mandalSelect.appendChild(opt);
        });

        const customOpt = document.createElement('option');
        customOpt.value = '__custom__';
        customOpt.textContent = '➕ ఇతర ప్రాంతం / Custom Mandal నమోదు చేయండి...';
        mandalSelect.appendChild(customOpt);

        if (preselectedMandal && !matched) {
            customOpt.selected = true;
            if (customWrap) customWrap.style.display = 'block';
            if (customInput) customInput.value = preselectedMandal;
        } else {
            if (customWrap) customWrap.style.display = 'none';
            if (customInput) customInput.value = '';
        }
    }

    function renderReportersTable(reporters) {
        const tableBody = document.getElementById('reporters-table-body');
        if (!tableBody) return;

        if (!reporters || reporters.length === 0) {
            tableBody.innerHTML = '<tr class="empty-row"><td colspan="9" style="text-align: center; padding: 28px; color: #64748b;">రిపోర్టర్లేవీ అందుబాటులో లేవు. నూతన రిపోర్టర్‌ని నమోదు చేయడానికి పై ఫారమ్‌ని ఉపయోగించండి.</td></tr>';
            return;
        }

        tableBody.innerHTML = '';
        reporters.forEach(r => {
            const tr = document.createElement('tr');
            
            // Photo / Avatar
            let photoHtml = '';
            const initial = escapeHTML((r.name || 'R').charAt(0));
            if (r.photo_url && !r.photo_url.startsWith('C:') && !r.photo_url.startsWith('D:') && !r.photo_url.includes('fakepath')) {
                photoHtml = `
                    <div style="width: 44px; height: 44px; position: relative;">
                        <img src="${escapeHTML(r.photo_url)}" alt="${escapeHTML(r.name)}" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 2px solid #cbd5e1; display: block;" onerror="this.onerror=null; this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';">
                        <div style="width: 44px; height: 44px; border-radius: 50%; background: #fce7f3; color: #be185d; font-weight: 700; display: none; align-items: center; justify-content: center; font-size: 1.1rem; border: 2px solid #fbcfe8; position: absolute; top: 0; left: 0;">${initial}</div>
                    </div>
                `;
            } else {
                photoHtml = `<div style="width: 44px; height: 44px; border-radius: 50%; background: #fce7f3; color: #be185d; font-weight: 700; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; border: 2px solid #fbcfe8;">${initial}</div>`;
            }

            // Role / Leadership Tier badge
            const desigLower = (r.designation || '').toLowerCase();
            const isTopEditorial = r.display_order === 1 || r.display_order === 2 || 
                                   desigLower.includes('founder') || desigLower.includes('వ్యవస్థాపక') || 
                                   desigLower.includes('editor-in-chief') || desigLower.includes('ప్రధాన సంపాదకులు') || 
                                   desigLower.includes('chief') || desigLower.includes('చీఫ్') ||
                                   desigLower.includes('associate') || desigLower.includes('అసోసియేట్');

            // District display name & Jurisdiction
            let distName = r.district || '-';
            if (r.jurisdiction) {
                distName = r.jurisdiction;
            } else if (isTopEditorial || r.district === 'all-ap-ts') {
                distName = 'ఆంధ్రప్రదేశ్ & తెలంగాణ (AP & TS)';
            } else if (r.district && typeof MAMEKA_DISTRICTS !== 'undefined') {
                const dObj = MAMEKA_DISTRICTS.getDistrictByCodeOrSlug ? MAMEKA_DISTRICTS.getDistrictByCodeOrSlug(r.district) : null;
                if (dObj) distName = dObj.name_te;
            }

            let tierBadge = '';
            if (r.display_order === 1 || desigLower.includes('founder') || (r.designation || '').includes('వ్యవస్థాపక') || desigLower.includes('editor-in-chief') || (r.designation || '').includes('ప్రధాన సంపాదకులు')) {
                tierBadge = '<span style="display:inline-block; padding:3px 8px; border-radius:12px; font-size:0.75rem; font-weight:700; background:#fff1f2; color:#be185d; border:1px solid #fecdd3;">⭐ Top 1: Chief</span>';
            } else if (r.display_order === 2 || desigLower.includes('associate') || (r.designation || '').includes('అసోసియేట్')) {
                tierBadge = '<span style="display:inline-block; padding:3px 8px; border-radius:12px; font-size:0.75rem; font-weight:700; background:#f0f9ff; color:#0369a1; border:1px solid #bae6fd;">⭐ Top 2: Associate</span>';
            } else {
                tierBadge = '<span style="display:inline-block; padding:3px 8px; border-radius:12px; font-size:0.75rem; font-weight:600; background:#f8fafc; color:#475569; border:1px solid #cbd5e1;">Normal Block</span>';
            }

            // Contact
            const contactItems = [];
            if (r.phone) contactItems.push(`📞 ${escapeHTML(r.phone)}`);
            if (r.email) contactItems.push(`✉️ ${escapeHTML(r.email)}`);
            const contactHtml = contactItems.length > 0 ? contactItems.join('<br>') : '<span style="color:#94a3b8; font-size:0.8rem;">-</span>';

            // QR Code & ID Card Print Actions
            const qrUrl = r.qr_code_url || `/uploads/qr_codes/Reporter_${r.id}_QR.png`;
            const profilePageUrl = `/reporter-profile.html?id=${encodeURIComponent(r.id)}`;
            const token = localStorage.getItem('admin_token') || '';
            const downloadApiUrl = `/api/admin/reporters/${encodeURIComponent(r.id)}/download-qr?token=${encodeURIComponent(token)}`;
            const safeReporterName = escapeHTML(r.name || '').replace(/'/g, "\\'");
            const qrHtml = `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                    <a href="${escapeHTML(qrUrl)}" target="_blank" title="పెద్దగా చూడండి (View High-Res QR)">
                        <img src="${escapeHTML(qrUrl)}" alt="QR" style="width: 40px; height: 40px; border: 1px solid #cbd5e1; border-radius: 4px; padding: 2px; background: #fff;" onerror="this.style.display='none';">
                    </a>
                    <div style="display: flex; gap: 4px;">
                        <a href="${downloadApiUrl}" onclick="event.preventDefault(); downloadReporterQR('${escapeHTML(r.id)}', '${safeReporterName}');" download class="btn btn-outline-sm" style="padding: 2px 6px; font-size: 0.72rem; text-decoration: none;" title="PVC ID కార్డ్ ప్రింటింగ్ కోసం హై-రెస్ PNG డౌన్‌లోడ్ చేయండి">
                            📥 PNG
                        </a>
                        <a href="${profilePageUrl}" target="_blank" class="btn btn-outline-sm" style="padding: 2px 6px; font-size: 0.72rem; text-decoration: none;" title="లైవ్ ప్రొఫైల్ పేజీ చూడండి">
                            👁️
                        </a>
                    </div>
                </div>
            `;

            tr.innerHTML = `
                <td style="text-align:center; vertical-align:middle;">${photoHtml}</td>
                <td>
                    <strong style="color:var(--text-main); font-size:0.95rem;">${escapeHTML(r.name)}</strong>
                </td>
                <td>
                    <span style="display:inline-block; padding:3px 8px; border-radius:4px; font-size:0.8rem; font-weight:600; background:#fdf2f8; color:#be185d; border:1px solid #fbcfe8;">
                        ${escapeHTML(r.designation)}
                    </span>
                </td>
                <td style="font-family: monospace; font-size: 0.85rem; font-weight: 700; color: #be185d;">
                    ${escapeHTML(r.press_id || '-')}
                </td>
                <td>
                    <strong style="font-size:0.85rem; color:#334155;">${escapeHTML(distName)}</strong>
                    ${(r.mandal && !r.jurisdiction && !isTopEditorial && r.district !== 'all-ap-ts') ? `<span style="display:block; font-size:0.8rem; color:#64748b;">${escapeHTML(r.mandal)}</span>` : ''}
                </td>
                <td style="font-size:0.825rem;">${contactHtml}</td>
                <td>${tierBadge}</td>
                <td style="text-align:center; vertical-align:middle;">${qrHtml}</td>
                <td>
                    <div style="display:flex; gap:6px;">
                        <button type="button" class="btn btn-outline-sm btn-edit-reporter" data-id="${escapeHTML(r.id)}" title="సవరించు">✏️ సవరించు</button>
                        <button type="button" class="btn btn-danger-sm btn-delete-reporter" data-id="${escapeHTML(r.id)}" title="తొలగించు">🗑️</button>
                    </div>
                </td>
            `;

            tableBody.appendChild(tr);
        });

        // Attach action handlers
        tableBody.querySelectorAll('.btn-edit-reporter').forEach(btn => {
            btn.onclick = () => {
                const repId = btn.getAttribute('data-id');
                const reporter = allReportersCache.find(x => x.id === repId);
                if (reporter) startEditReporter(reporter);
            };
        });

        tableBody.querySelectorAll('.btn-delete-reporter').forEach(btn => {
            btn.onclick = async () => {
                const repId = btn.getAttribute('data-id');
                const reporter = allReportersCache.find(x => x.id === repId);
                const confirmMsg = reporter 
                    ? `మీరు ఖచ్చితంగా "${reporter.name}" రిపోర్టర్ ప్రొఫైల్‌ను శాశ్వతంగా తొలగించాలనుకుంటున్నారా?` 
                    : 'ఈ రిపోర్టర్ ప్రొఫైల్‌ను శాశ్వతంగా తొలగించాలనుకుంటున్నారా?';
                
                if (confirm(confirmMsg)) {
                    await deleteReporter(repId);
                }
            };
        });
    }

    function handleDesignationJurisdictionChange() {
        const desigInput = document.getElementById('rep-designation');
        const notice = document.getElementById('editorial-jurisdiction-notice');
        const distGroup = document.getElementById('rep-district-group');
        const mandalGroup = document.getElementById('rep-mandal-group');
        const distSelect = document.getElementById('rep-district');

        if (!desigInput) return;
        const d = (desigInput.value || '').toLowerCase();
        const isTopEditorial = d.includes('founder') || d.includes('వ్యవస్థాపక') || 
                               d.includes('editor-in-chief') || d.includes('ప్రధాన సంపాదకులు') || 
                               d.includes('chief') || d.includes('చీఫ్') ||
                               d.includes('associate') || d.includes('అసోసియేట్');

        if (isTopEditorial) {
            if (notice) notice.style.display = 'block';
            if (distGroup) distGroup.style.display = 'none';
            if (mandalGroup) mandalGroup.style.display = 'none';
            if (distSelect) distSelect.value = 'all-ap-ts';
        } else {
            if (notice) notice.style.display = 'none';
            if (distGroup) distGroup.style.display = 'block';
            if (mandalGroup) mandalGroup.style.display = 'block';
        }
    }

    function initReporterFormEvents() {
        const form = document.getElementById('form-manage-reporter');
        const alertBox = document.getElementById('reporters-alert');
        const photoFileInput = document.getElementById('rep-photo-file');
        const browsePhotoBtn = document.getElementById('btn-browse-rep-photo');
        const photoFileName = document.getElementById('rep-photo-file-name');
        const photoUrlInput = document.getElementById('rep-photo-url');
        const photoPreview = document.getElementById('rep-photo-preview');
        const photoPlaceholder = document.getElementById('rep-photo-preview-placeholder');
        const removePhotoBtn = document.getElementById('btn-remove-rep-photo');
        const cancelBtn = document.getElementById('btn-cancel-reporter-form');
        const refreshBtn = document.getElementById('btn-refresh-reporters');
        const toggleAddBtn = document.getElementById('btn-toggle-add-reporter');
        const resetBtn = document.getElementById('btn-reset-reporter-form');

        const repDesigInput = document.getElementById('rep-designation');
        if (repDesigInput) {
            repDesigInput.addEventListener('input', handleDesignationJurisdictionChange);
            repDesigInput.addEventListener('change', handleDesignationJurisdictionChange);
        }

        // Search and filter inputs
        const searchInput = document.getElementById('rep-filter-search');
        const districtFilter = document.getElementById('rep-filter-district');
        const statusFilter = document.getElementById('rep-filter-status');

        // District & Mandal dynamic selector events
        const repDistrictSelect = document.getElementById('rep-district');
        const repMandalSelect = document.getElementById('rep-mandal');
        const repMandalCustomWrap = document.getElementById('rep-mandal-custom-wrap');
        const repMandalCustomInput = document.getElementById('rep-mandal-custom');

        if (repDistrictSelect) {
            const handleDistrictChange = () => {
                const val = repDistrictSelect.value;
                updateMandalDropdown(val, '');
            };
            repDistrictSelect.addEventListener('change', handleDistrictChange);
            repDistrictSelect.addEventListener('input', handleDistrictChange);
            repDistrictSelect.onchange = handleDistrictChange;

            // Trigger immediately if already selected
            if (repDistrictSelect.value) {
                updateMandalDropdown(repDistrictSelect.value, '');
            }
        }

        if (repMandalSelect) {
            repMandalSelect.onchange = () => {
                if (repMandalSelect.value === '__custom__') {
                    if (repMandalCustomWrap) repMandalCustomWrap.style.display = 'block';
                    if (repMandalCustomInput) repMandalCustomInput.focus();
                } else {
                    if (repMandalCustomWrap) repMandalCustomWrap.style.display = 'none';
                    if (repMandalCustomInput) repMandalCustomInput.value = '';
                }
            };
        }

        if (browsePhotoBtn && photoFileInput) {
            browsePhotoBtn.onclick = () => photoFileInput.click();
        }

        if (photoFileInput) {
            photoFileInput.onchange = () => {
                const file = photoFileInput.files[0];
                if (file) {
                    if (photoFileName) photoFileName.textContent = file.name;
                    isReporterPhotoRemoved = false;
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const img = new Image();
                        img.onload = () => {
                            // Standardize & compress avatar via Canvas (max 600px width/height, 0.85 quality)
                            const maxDim = 600;
                            let width = img.width;
                            let height = img.height;
                            if (width > maxDim || height > maxDim) {
                                if (width > height) {
                                    height = Math.round((height * maxDim) / width);
                                    width = maxDim;
                                } else {
                                    width = Math.round((width * maxDim) / height);
                                    height = maxDim;
                                }
                            }
                            const canvas = document.createElement('canvas');
                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0, width, height);
                            currentReporterPhotoBase64 = canvas.toDataURL('image/jpeg', 0.85);

                            if (photoPreview) {
                                photoPreview.src = currentReporterPhotoBase64;
                                photoPreview.style.display = 'block';
                            }
                            if (photoPlaceholder) photoPlaceholder.style.display = 'none';
                            if (removePhotoBtn) removePhotoBtn.style.display = 'inline-block';
                        };
                        img.src = e.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            };
        }

        if (photoUrlInput) {
            photoUrlInput.oninput = () => {
                const url = photoUrlInput.value.trim();
                if (url.startsWith('C:') || url.startsWith('D:') || url.startsWith('file:') || url.includes('fakepath')) {
                    showAlert(alertBox, '⚠️ స్థానిక కంప్యూటర్ ఫైల్ పాత్ (C:\\...) బ్రౌజర్‌లో లోడ్ అవ్వదు. దయచేసి "ఫొటో ఎంచుకోండి" బటన్ ద్వారా నేరుగా ఫైల్‌ని అప్‌లోడ్ చేయండి.', 'warning');
                    return;
                }
                if (url) {
                    isReporterPhotoRemoved = false;
                    currentReporterPhotoBase64 = null;
                    if (photoPreview) {
                        photoPreview.src = url;
                        photoPreview.style.display = 'block';
                    }
                    if (photoPlaceholder) photoPlaceholder.style.display = 'none';
                    if (removePhotoBtn) removePhotoBtn.style.display = 'inline-block';
                }
            };
        }

        if (removePhotoBtn) {
            removePhotoBtn.onclick = () => {
                isReporterPhotoRemoved = true;
                currentReporterPhotoBase64 = null;
                if (photoFileInput) photoFileInput.value = '';
                if (photoFileName) photoFileName.textContent = 'ఫైల్ ఎంచుకోలేదు';
                if (photoUrlInput) photoUrlInput.value = '';
                if (photoPreview) {
                    photoPreview.src = '';
                    photoPreview.style.display = 'none';
                }
                if (photoPlaceholder) photoPlaceholder.style.display = 'block';
                removePhotoBtn.style.display = 'none';
            };
        }

        if (cancelBtn) {
            cancelBtn.onclick = () => resetReporterForm();
        }

        if (resetBtn) {
            resetBtn.onclick = () => resetReporterForm();
        }

        if (refreshBtn) {
            refreshBtn.onclick = () => loadReportersView();
        }

        if (toggleAddBtn) {
            toggleAddBtn.onclick = () => {
                resetReporterForm();
                const nameInput = document.getElementById('rep-name');
                if (nameInput) {
                    nameInput.focus();
                    nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            };
        }

        // Form Submit (Create or Update)
        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                await saveReporterForm();
            };
        }

        // Regenerate All QR Codes with Production Domain Button
        const regenQrBtn = document.getElementById('btn-regenerate-all-qr');
        const domainInput = document.getElementById('input-qr-base-domain');
        if (regenQrBtn) {
            regenQrBtn.onclick = async () => {
                const targetDomain = domainInput ? domainInput.value.trim() : '';
                const promptDomain = targetDomain || 'https://mamekamahodayam.com';
                if (!confirm(`అన్ని రిపోర్టర్ల ID కార్డ్ QR కోడ్‌లను "${promptDomain}" డొమైన్‌తో రీ-జెనరేట్ చేయాలా?`)) {
                    return;
                }
                try {
                    regenQrBtn.disabled = true;
                    regenQrBtn.textContent = '⏳ రీ-జెనరేట్ అవుతోంది...';
                    const res = await apiFetch('/api/admin/reporters-qr/regenerate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ base_url: targetDomain })
                    });
                    const data = await res.json();
                    if (res.ok && data.success) {
                        showAlert(alertBox, `✓ ${data.message} (డొమైన్: ${data.base_url})`, 'success');
                        await loadReportersView();
                    } else {
                        showAlert(alertBox, (data && data.error) || 'QR రీ-జెనరేషన్ విఫలమైంది', 'error');
                    }
                } catch (e) {
                    showAlert(alertBox, 'సర్వర్ లోపం ఏర్పడింది: ' + e.message, 'error');
                } finally {
                    regenQrBtn.disabled = false;
                    regenQrBtn.textContent = '🔄 అన్ని QR కోడ్‌లను రీ-జెనరేట్ చేయి';
                }
            };
        }

        // Filters
        function applyReporterFilters() {
            const q = (searchInput ? searchInput.value : '').toLowerCase().trim();
            const dist = (districtFilter ? districtFilter.value : '').toLowerCase().trim();
            const st = (statusFilter ? statusFilter.value : '').toLowerCase().trim();

            const filtered = allReportersCache.filter(r => {
                if (dist && (r.district || '').toLowerCase() !== dist) return false;
                if (st && (r.status || '').toLowerCase() !== st) return false;
                if (q) {
                    const matchName = (r.name || '').toLowerCase().includes(q);
                    const matchDesig = (r.designation || '').toLowerCase().includes(q);
                    const matchMandal = (r.mandal || '').toLowerCase().includes(q);
                    const matchDistrict = (r.district || '').toLowerCase().includes(q);
                    if (!matchName && !matchDesig && !matchMandal && !matchDistrict) return false;
                }
                return true;
            });

            renderReportersTable(filtered);
        }

        if (searchInput) searchInput.oninput = debounce(applyReporterFilters, 200);
        if (districtFilter) districtFilter.onchange = applyReporterFilters;
        if (statusFilter) statusFilter.onchange = applyReporterFilters;
    }

    function startEditReporter(r) {
        const formTitle = document.getElementById('reporter-form-title');
        const submitBtn = document.getElementById('btn-save-reporter');
        const cancelBtn = document.getElementById('btn-cancel-reporter-form');
        const editIdInput = document.getElementById('rep-edit-id');
        const nameInput = document.getElementById('rep-name');
        const desigInput = document.getElementById('rep-designation');
        const distSelect = document.getElementById('rep-district');
        const mandalInput = document.getElementById('rep-mandal');
        const phoneInput = document.getElementById('rep-phone');
        const emailInput = document.getElementById('rep-email');
        const bioTextarea = document.getElementById('rep-bio');
        const photoUrlInput = document.getElementById('rep-photo-url');
        const photoPreview = document.getElementById('rep-photo-preview');
        const photoPlaceholder = document.getElementById('rep-photo-preview-placeholder');
        const removePhotoBtn = document.getElementById('btn-remove-rep-photo');
        const cardForm = document.getElementById('card-reporter-form');

        // Social links
        let socials = {};
        try { socials = JSON.parse(r.social_links || '{}'); } catch(e){}
        const tw = document.getElementById('rep-twitter');
        const fb = document.getElementById('rep-facebook');
        const li = document.getElementById('rep-linkedin');
        if (tw) tw.value = socials.twitter || '';
        if (fb) fb.value = socials.facebook || '';
        if (li) li.value = socials.linkedin || '';

        if (editIdInput) editIdInput.value = r.id;
        if (nameInput) nameInput.value = r.name || '';
        if (desigInput) desigInput.value = r.designation || '';
        const pressIdInput = document.getElementById('rep-press-id');
        if (pressIdInput) pressIdInput.value = r.press_id || '';
        if (distSelect) {
            distSelect.value = r.district || '';
            updateMandalDropdown(r.district || '', r.mandal || '');
        }
        if (phoneInput) phoneInput.value = r.phone || '';
        if (emailInput) emailInput.value = r.email || '';
        if (bioTextarea) bioTextarea.value = r.bio || '';
        handleDesignationJurisdictionChange();

        currentReporterPhotoBase64 = null;
        isReporterPhotoRemoved = false;

        const photoFileInput = document.getElementById('rep-photo-file');
        const photoFileName = document.getElementById('rep-photo-file-name');
        if (photoFileInput) photoFileInput.value = '';
        if (photoFileName) {
            photoFileName.textContent = r.photo_url ? 'ప్రస్తుత ప్రొఫైల్ చిత్రం భద్రపరచబడింది ✓' : 'ఫైల్ ఎంచుకోలేదు';
        }

        if (photoUrlInput) photoUrlInput.value = (r.photo_url && !r.photo_url.startsWith('data:')) ? r.photo_url : '';
        if (r.photo_url) {
            if (photoPreview) {
                photoPreview.src = r.photo_url;
                photoPreview.style.display = 'block';
            }
            if (photoPlaceholder) photoPlaceholder.style.display = 'none';
            if (removePhotoBtn) removePhotoBtn.style.display = 'inline-block';
        } else {
            if (photoPreview) photoPreview.style.display = 'none';
            if (photoPlaceholder) photoPlaceholder.style.display = 'block';
            if (removePhotoBtn) removePhotoBtn.style.display = 'none';
        }

        if (formTitle) formTitle.textContent = `✏️ రిపోర్టర్ ప్రొఫైల్ సవరణ: ${r.name}`;
        if (submitBtn) submitBtn.innerHTML = '💾 మార్పులు భద్రపరచు (Update Profile)';
        if (cancelBtn) cancelBtn.style.display = 'inline-block';

        if (cardForm) cardForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function resetReporterForm() {
        currentReporterPhotoBase64 = null;
        isReporterPhotoRemoved = false;

        const form = document.getElementById('form-manage-reporter');
        if (form) form.reset();
        const editIdInput = document.getElementById('rep-edit-id');
        if (editIdInput) editIdInput.value = '';
        const pressIdInput = document.getElementById('rep-press-id');
        if (pressIdInput) pressIdInput.value = '';
        const distSelect = document.getElementById('rep-district');
        if (distSelect) distSelect.value = '';
        updateMandalDropdown('', '');
        handleDesignationJurisdictionChange();

        const formTitle = document.getElementById('reporter-form-title');
        if (formTitle) formTitle.textContent = '➕ కొత్త రిపోర్టర్‌ని నమోదు చేయండి (Add New Reporter)';
        const submitBtn = document.getElementById('btn-save-reporter');
        if (submitBtn) submitBtn.innerHTML = '💾 రిపోర్టర్‌ని భద్రపరచు (Save Reporter)';
        const cancelBtn = document.getElementById('btn-cancel-reporter-form');
        if (cancelBtn) cancelBtn.style.display = 'none';

        const photoFileInput = document.getElementById('rep-photo-file');
        if (photoFileInput) photoFileInput.value = '';
        const photoFileName = document.getElementById('rep-photo-file-name');
        if (photoFileName) photoFileName.textContent = 'ఫైల్ ఎంచుకోలేదు';
        const photoPreview = document.getElementById('rep-photo-preview');
        if (photoPreview) photoPreview.style.display = 'none';
        const photoPlaceholder = document.getElementById('rep-photo-preview-placeholder');
        if (photoPlaceholder) photoPlaceholder.style.display = 'block';
        const removePhotoBtn = document.getElementById('btn-remove-rep-photo');
        if (removePhotoBtn) removePhotoBtn.style.display = 'none';
    }

    async function saveReporterForm() {
        const alertBox = document.getElementById('reporters-alert');
        const submitBtn = document.getElementById('btn-save-reporter');
        const editId = (document.getElementById('rep-edit-id') ? document.getElementById('rep-edit-id').value : '').trim();
        const name = (document.getElementById('rep-name') ? document.getElementById('rep-name').value : '').trim();
        const desig = (document.getElementById('rep-designation') ? document.getElementById('rep-designation').value : '').trim();
        const pressId = (document.getElementById('rep-press-id') ? document.getElementById('rep-press-id').value : '').trim();
        const dist = document.getElementById('rep-district') ? document.getElementById('rep-district').value : '';
        
        let mandal = '';
        const mandalSelect = document.getElementById('rep-mandal');
        const customMandalInput = document.getElementById('rep-mandal-custom');
        if (mandalSelect) {
            if (mandalSelect.value === '__custom__') {
                mandal = (customMandalInput ? customMandalInput.value : '').trim();
            } else {
                mandal = (mandalSelect.value || '').trim();
            }
        }

        const phone = (document.getElementById('rep-phone') ? document.getElementById('rep-phone').value : '').trim();
        const email = (document.getElementById('rep-email') ? document.getElementById('rep-email').value : '').trim();
        const status = 'active';

        // Auto-calculate priority: Top 1 = Chief / Founder, Top 2 = Associate Editor, 3 = Normal Block
        const desigLower = String(desig || '').toLowerCase();
        const isTopEditorial = desigLower.includes('founder') || desigLower.includes('వ్యవస్థాపక') || 
                               desigLower.includes('editor-in-chief') || desigLower.includes('ప్రధాన సంపాదకులు') || 
                               desigLower.includes('chief') || desigLower.includes('చీఫ్') ||
                               desigLower.includes('associate') || desigLower.includes('అసోసియేట్');

        function calculateReporterPriority(desigText) {
            if (!desigText) return 3;
            const d = String(desigText).toLowerCase();
            if (d.includes('founder') || d.includes('వ్యవస్థాపక') || d.includes('editor-in-chief') || d.includes('ప్రధాన సంపాదకులు') || d.includes('chief') || d.includes('చీఫ్')) {
                return 1;
            }
            if (d.includes('associate') || d.includes('అసోసియేట్')) {
                return 2;
            }
            return 3;
        }
        const order = calculateReporterPriority(desig);
        const finalDist = isTopEditorial ? 'all-ap-ts' : dist;
        const finalMandal = isTopEditorial ? 'ఉభయ తెలుగు రాష్ట్రాలు' : mandal;
        const finalJurisdiction = isTopEditorial ? 'ఆంధ్రప్రదేశ్ & తెలంగాణ (ఉభయ తెలుగు రాష్ట్రాలు - AP & Telangana)' : '';

        const bio = (document.getElementById('rep-bio') ? document.getElementById('rep-bio').value : '').trim();
        const photoUrl = (document.getElementById('rep-photo-url') ? document.getElementById('rep-photo-url').value : '').trim();
        const photoFileInput = document.getElementById('rep-photo-file');

        if (!name) {
            showAlert(alertBox, 'దయచేసి రిపోర్టర్ పూర్తి పేరును నమోదు చేయండి.', 'error');
            return;
        }
        if (!desig) {
            showAlert(alertBox, 'దయచేసి రిపోర్టర్ హోదా / బాధ్యతను నమోదు చేయండి.', 'error');
            return;
        }

        const socialLinks = {
            twitter: (document.getElementById('rep-twitter') ? document.getElementById('rep-twitter').value : '').trim(),
            facebook: (document.getElementById('rep-facebook') ? document.getElementById('rep-facebook').value : '').trim(),
            linkedin: (document.getElementById('rep-linkedin') ? document.getElementById('rep-linkedin').value : '').trim()
        };

        const isEdit = Boolean(editId);
        const url = isEdit ? `/api/admin/reporters/${editId}` : '/api/admin/reporters';
        const method = isEdit ? 'PUT' : 'POST';

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'భద్రపరచబడుతోంది...';
        }

        try {
            const payload = {
                name,
                designation: desig,
                press_id: pressId,
                jurisdiction: finalJurisdiction,
                district: finalDist,
                mandal: finalMandal,
                phone,
                email,
                status,
                display_order: order,
                bio,
                social_links: JSON.stringify(socialLinks)
            };

            if (currentReporterPhotoBase64) {
                payload.photo_base64 = currentReporterPhotoBase64;
            } else if (isReporterPhotoRemoved) {
                payload.remove_photo = true;
                payload.photo_url = '';
            } else if (photoUrl && !photoUrl.startsWith('C:') && !photoUrl.startsWith('D:') && !photoUrl.includes('fakepath')) {
                payload.photo_url = photoUrl;
            }

            let res;
            if (photoFileInput && photoFileInput.files && photoFileInput.files[0] && !currentReporterPhotoBase64) {
                const formData = new FormData();
                Object.keys(payload).forEach(k => formData.append(k, payload[k]));
                formData.append('photo_file', photoFileInput.files[0]);
                res = await apiFetch(url, {
                    method: method,
                    body: formData
                });
            } else {
                res = await apiFetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            const data = await res.json();
            if (res.ok && data.success) {
                showAlert(alertBox, isEdit ? '✓ రిపోర్టర్ ప్రొఫైల్ విజయవంతంగా నవీకరించబడింది!' : '✓ నూతన రిపోర్టర్ ప్రొఫైల్ విజయవంతంగా సృష్టించబడింది!', 'success');
                resetReporterForm();
                await loadReportersView();
            } else {
                showAlert(alertBox, data.error || 'రిపోర్టర్ భద్రపరచడం విఫలమైంది.', 'error');
            }
        } catch (err) {
            console.error('Save reporter error:', err);
            showAlert(alertBox, 'సర్వర్ నెట్‌వర్క్ లోపం ఏర్పడింది.', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = isEdit ? '💾 మార్పులు భద్రపరచు (Update Profile)' : '💾 రిపోర్టర్‌ని భద్రపరచు (Save Reporter)';
            }
        }
    }

    async function deleteReporter(repId) {
        const alertBox = document.getElementById('reporters-alert');
        try {
            const res = await apiFetch(`/api/admin/reporters/${repId}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (res.ok && data.success) {
                showAlert(alertBox, '✓ రిపోర్టర్ ప్రొఫైల్ విజయవంతంగా తొలగించబడింది.', 'success');
                await loadReportersView();
            } else {
                showAlert(alertBox, data.error || 'రిపోర్టర్ తొలగింపు విఫలమైంది.', 'error');
            }
        } catch (err) {
            console.error('Delete reporter error:', err);
            showAlert(alertBox, 'సర్వర్ లోపం ఏర్పడింది.', 'error');
        }
    }
}

// Global tab switcher for Upload & Publish section
window.switchPublishMode = function(mode) {
    const pdfCard = document.getElementById('mode-pdf-publish');
    const directCard = document.getElementById('mode-direct-publish');
    const pdfTab = document.getElementById('tab-publish-pdf');
    const directTab = document.getElementById('tab-publish-direct');

    if (mode === 'pdf') {
        if (pdfCard) pdfCard.style.display = 'block';
        if (directCard) directCard.style.display = 'none';
        if (pdfTab) pdfTab.classList.add('active');
        if (directTab) directTab.classList.remove('active');
    } else {
        if (pdfCard) pdfCard.style.display = 'none';
        if (directCard) directCard.style.display = 'block';
        if (directTab) directTab.classList.add('active');
        if (pdfTab) pdfTab.classList.remove('active');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminApp);
} else {
    initAdminApp();
}

