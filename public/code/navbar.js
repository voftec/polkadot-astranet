// code/navbar.js
import { getUser, getAuthUser, getProfile } from './user-cache.js';

(() => {
  
  // --- STATE ---
  let currentUserAuthData = null;
  let currentProfileData = null;
  let currentPageIndex = null;

  // --- CONFIGURATION ---
  const PAGE_URLS = Object.freeze([
    '/inicio/landing.html',            // 0: Home
    '/datasets/gallery.html',          // 1: Datasets
    '/astranet/chat.html',            // 2: Astranet Chat
    '/auth/login.html',               // 3: Login
    '/code/hackatonGuide.html'        // 4: Hackathon Guide
  ]);
  const HOME_PAGE_INDEX = 0;
  const LOGIN_PAGE_INDEX = 3;

  // --- HTML TEMPLATES ---
  const NAVBAR_HTML = `
    <nav class="navbar" id="navbar">
      <div class="navbar-left">
        <a href="${PAGE_URLS[HOME_PAGE_INDEX]}" class="navbar-brand">Polkadot Astranet</a>
      </div>
      <button class="hamburger-menu" id="hamburgerMenuButton" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="navbar-right-menu">
        <span class="bar"></span><span class="bar"></span><span class="bar"></span>
      </button>
      <div class="navbar-right" id="navbar-right-menu">
        <button id="nav-datasets" data-page-index="1">Datasets</button>
        <button id="nav-chat" data-page-index="2">Astranet Chat</button>
        <button id="nav-hackathon" data-page-index="4">Hackathon Guide</button>
        <div id="user-section"><!-- User-specific content --></div>
      </div>
    </nav>
  `;

  const FTUE_MODAL_HTML = `
    <div id="ftue-modal" class="modal-overlay hidden">
      <div class="modal-content">
        <h3>¡Bienvenido! Cuéntanos un poco sobre ti</h3>
        <form id="ftue-form">
          <div class="form-group"><label for="ftueName">Nombre:</label><input type="text" id="ftueName" required placeholder="Tu nombre"></div>
          <div class="form-group"><label for="ftueLastName">Apellido:</label><input type="text" id="ftueLastName" required placeholder="Tu apellido"></div>
          <div class="form-group profile-picture-upload">
            <label for="ftueProfilePic">Foto de Perfil (Opcional):</label>
            <input type="file" id="ftueProfilePic" accept="image/*">
            <div class="upload-area" id="ftueUploadArea">
              <p>Arrastra tu imagen aquí o haz clic para seleccionar</p>
              <img id="ftueProfilePicPreview" src="" alt="Profile Picture Preview" style="display:none;">
            </div>
          </div>
          <button type="submit" id="ftueSubmitButton">Guardar y Continuar</button>
          <p id="ftueLoadingText" style="display:none; color: #1e90ff; margin-top: 10px;">Guardando...</p>
        </form>
      </div>
    </div>
  `;

  // --- DOM ELEMENTS (cached) ---
  let navMenuElement, hamburgerButtonElement, userSectionElement, ftueModalElement, ftueFormElement, creatorsbayBtnElement;

  // --- CORE NAVBAR LOGIC ---
  function _navigateTo(pageIndex) {
    if (pageIndex >= 0 && pageIndex < PAGE_URLS.length) {
      window.location.href = PAGE_URLS[pageIndex];
    } else {
      console.error('Navbar: Invalid page index for navigation:', pageIndex);
    }
  }

  function _detectCurrentPage() {
    const currentPath = window.location.pathname;
    let normalizedPath = currentPath.endsWith('/') && currentPath.length > 1 ? currentPath.slice(0, -1) : currentPath;
    if (['', '/inicio', '/inicio/index.html'].includes(normalizedPath)) {
      normalizedPath = PAGE_URLS[HOME_PAGE_INDEX];
    }

    currentPageIndex = PAGE_URLS.findIndex(url => {
      const normalizedPageUrl = url.endsWith('/') && url.length > 1 ? url.slice(0, -1) : url;
      return normalizedPageUrl === normalizedPath;
    });

    if (currentPageIndex === -1) { // Fallback for direct section access
      if (normalizedPath.startsWith('/newsletter')) currentPageIndex = 1;
      else if (normalizedPath.startsWith('/herramientas')) currentPageIndex = 2;
      else if (normalizedPath.startsWith('/blog')) currentPageIndex = 3;
      else if (normalizedPath.startsWith('/prompts')) currentPageIndex = 4;
      else if (normalizedPath.startsWith('/auth/login')) currentPageIndex = LOGIN_PAGE_INDEX;
      else currentPageIndex = null;
    }
  }

  function _highlightActivePage() {
    if (!navMenuElement) return;
    navMenuElement.querySelectorAll('[data-page-index]').forEach(btn => btn.classList.remove('active'));
    if (currentPageIndex !== null) {
      const activeBtn = navMenuElement.querySelector(`[data-page-index="${currentPageIndex}"]`);
      activeBtn?.classList.add('active');
    }
  }

  function _renderUserSection() {
    if (!userSectionElement) return;
    const { auth: currentUserAuthData, profile: currentProfileData } = getUser();
    if (!currentUserAuthData || !currentProfileData) {
      userSectionElement.innerHTML = `<button id="nav-login" data-page-index="${LOGIN_PAGE_INDEX}">Iniciar sesión</button>`;
      userSectionElement.querySelector('#nav-login')?.addEventListener('click', (e) => _navigateTo(parseInt(e.target.dataset.pageIndex)));
    } else {
      const userName = (currentProfileData.name && currentProfileData.name !== "default") ? currentProfileData.name : (currentUserAuthData.email?.split('@')[0] || 'Usuario');
      const userAvatar = currentProfileData.profilePictureURL || '../assets/png/icons8-avatar-64.png';
      const isAdmin = currentProfileData.role === 'admin';
      let html = '';
      if (isAdmin) html += `<a href="/admin-panel.html" class="admin-panel admin-nav-item">Panel</a><a href="/admin-stats.html" class="admin-stats admin-nav-item">Estadísticas</a>`;
      html += `
        <a href="/profile.html" class="user-profile user-nav-item">
          <img src="${userAvatar}" class="avatar" alt="Avatar"><span class="username">${userName}</span>
          ${isAdmin ? '<span class="admin-label">Admin</span>' : ''}
        </a>
        <button id="nav-logout" class="logout-button user-nav-item">Cerrar sesión</button>`;
      userSectionElement.innerHTML = html;
      userSectionElement.querySelector('#nav-logout')?.addEventListener('click', () => document.dispatchEvent(new CustomEvent('app:requestLogout')));
    }
  }

  function _updateCreatorBayCtaVisibility() {
    if (!creatorsbayBtnElement) return;
    const { auth, profile } = getUser();
    creatorsbayBtnElement.style.display = auth && profile ? 'inline-block' : 'none';
  }

  // --- EVENT HANDLERS & ATTACHMENT ---
  function _attachMainNavigationEvents() {
    if (!navMenuElement) return;
    navMenuElement.querySelectorAll('button[data-page-index]').forEach(button => {
      if (button.id !== 'nav-login') { // Login is handled by _renderUserSection
        button.addEventListener('click', (e) => _navigateTo(parseInt(e.target.dataset.pageIndex)));
      }
    });
  }

  function _attachHamburgerMenuEvents() {
    if (!hamburgerButtonElement || !navMenuElement) return;
    hamburgerButtonElement.addEventListener('click', (e) => {
      e.stopPropagation();
      const isActive = navMenuElement.classList.toggle('active');
      hamburgerButtonElement.classList.toggle('active');
      hamburgerButtonElement.setAttribute('aria-expanded', isActive.toString());
    });
    navMenuElement.addEventListener('click', (e) => { // Close on item click
      const target = e.target.closest('button[data-page-index], a.admin-nav-item, a.user-profile');
      if (target && navMenuElement.classList.contains('active')) {
        if (target.hasAttribute('data-page-index') && target.id !== 'nav-login' || target.classList.contains('admin-nav-item') || target.classList.contains('user-profile') ) {
             navMenuElement.classList.remove('active');
             hamburgerButtonElement.classList.remove('active');
             hamburgerButtonElement.setAttribute('aria-expanded', 'false');
        }
      }
    });
    document.addEventListener('click', (e) => { // Close on click outside
      if (navMenuElement.classList.contains('active') && !navMenuElement.contains(e.target) && !hamburgerButtonElement.contains(e.target)) {
        navMenuElement.classList.remove('active');
        hamburgerButtonElement.classList.remove('active');
        hamburgerButtonElement.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // --- AUTHENTICATION EVENT LISTENERS ---
  function _handleUserLoggedIn({ user, profile, error, needsVerification }) {
    if (error) { console.error("Navbar: Auth error:", error); currentUserAuthData = null; currentProfileData = null; }
    else if (needsVerification) { console.log("Navbar: User needs verification."); currentUserAuthData = user; currentProfileData = null; }
    else if (user && profile) {
      currentUserAuthData = user; currentProfileData = profile;;
      if (currentProfileData.ftue === false) _showFtueModal();
      else { _hideFtueModal(); if (window.location.pathname.startsWith('/auth/login')) _navigateTo(HOME_PAGE_INDEX); }
    } else { currentUserAuthData = user || null; currentProfileData = null; console.warn("Navbar: Ambiguous login state."); }
    _renderUserSection(); _highlightActivePage(); _updateCreatorBayCtaVisibility();
  }

  function _handleUserLoggedOut() {
    console.log("Navbar: User logged out");
    currentUserAuthData = null; currentProfileData = null; _hideFtueModal(); _renderUserSection(); _highlightActivePage(); _updateCreatorBayCtaVisibility();
    if (window.location.pathname === '/profile.html' || window.location.pathname === '/profile') _navigateTo(LOGIN_PAGE_INDEX);
  }

  function _handleProfileUpdated({ profile }) {
    console.log("Navbar: Profile updated.", profile);
    if (profile && currentUserAuthData) {
      currentProfileData = profile; _renderUserSection();
      if (currentProfileData.ftue === true) { _hideFtueModal(); if (window.location.pathname.startsWith('/auth/login')) _navigateTo(HOME_PAGE_INDEX); }
    }
    _updateCreatorBayCtaVisibility();
  }

  function _setupAuthEventListeners() {
    document.addEventListener('app:userLoggedIn', (e) => _handleUserLoggedIn(e.detail));
    document.addEventListener('app:userLoggedOut', _handleUserLoggedOut);
    document.addEventListener('app:profileUpdated', (e) => _handleProfileUpdated(e.detail));
  }

  // --- FTUE MODAL LOGIC ---
  function _insertFtueModal() {
    if (!document.getElementById('ftue-modal')) {
      document.body.insertAdjacentHTML('beforeend', FTUE_MODAL_HTML);
      ftueModalElement = document.getElementById('ftue-modal');
      ftueFormElement = document.getElementById('ftue-form');
      _setupFtueModalListeners();
    }
  }

  function _showFtueModal() {
    if (!ftueModalElement || !currentProfileData) return;
    ftueModalElement.classList.remove('hidden');
    ftueFormElement.querySelector('#ftueName').value = currentProfileData.name !== "default" ? currentProfileData.name : '';
    ftueFormElement.querySelector('#ftueLastName').value = currentProfileData.lastName !== "default" ? currentProfileData.lastName : '';
    const preview = ftueFormElement.querySelector('#ftueProfilePicPreview');
    if (currentProfileData.profilePictureURL) { preview.src = currentProfileData.profilePictureURL; preview.style.display = 'block'; }
    else { preview.src = ''; preview.style.display = 'none'; }
  }

  function _hideFtueModal() {
    if (!ftueModalElement) return;
    ftueModalElement.classList.add('hidden'); ftueFormElement?.reset();
    const preview = ftueFormElement?.querySelector('#ftueProfilePicPreview');
    if (preview) { preview.src = ''; preview.style.display = 'none'; }
    ftueFormElement.querySelector('#ftueLoadingText').style.display = 'none';
    ftueFormElement.querySelector('#ftueSubmitButton').disabled = false;
  }
  
  function _preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }

  function _handleFtueFilePreview(file, previewEl) {
    if (file) { const r = new FileReader(); r.onload = (e) => { previewEl.src = e.target.result; previewEl.style.display = 'block'; }; r.readAsDataURL(file); }
    else { previewEl.src = ''; previewEl.style.display = 'none'; }
  }

  function _setupFtueModalListeners() {
    if (!ftueFormElement) return;
    const fileInput = ftueFormElement.querySelector('#ftueProfilePic');
    const uploadArea = ftueFormElement.querySelector('#ftueUploadArea');
    const previewImg = ftueFormElement.querySelector('#ftueProfilePicPreview');
    ftueFormElement.addEventListener('submit', _handleFtueSubmit);
    if (fileInput && uploadArea && previewImg) {
      fileInput.addEventListener('change', () => _handleFtueFilePreview(fileInput.files[0], previewImg));
      ['dragenter','dragover','dragleave','drop'].forEach(ev=>uploadArea.addEventListener(ev,_preventDefaults));
      ['dragenter','dragover'].forEach(ev=>uploadArea.addEventListener(ev,()=>uploadArea.classList.add('highlight')));
      ['dragleave','drop'].forEach(ev=>uploadArea.addEventListener(ev,()=>uploadArea.classList.remove('highlight')));
      uploadArea.addEventListener('drop', (e) => { fileInput.files = e.dataTransfer.files; _handleFtueFilePreview(e.dataTransfer.files[0], previewImg); });
      uploadArea.addEventListener('click', () => fileInput.click());
    }
  }

  function _handleFtueSubmit(event) {
    event.preventDefault();
    const authUser = getAuthUser();
    if (!authUser?.uid) {
      popupNotifier.error("Error: usuario no identificado.", 'Error de usuario');
      return;
    }
    
    ftueFormElement.querySelector('#ftueSubmitButton').disabled = true;
    ftueFormElement.querySelector('#ftueLoadingText').style.display = 'block';
    document.dispatchEvent(new CustomEvent('app:requestProfileUpdate', {
      detail: {
        uid: authUser.uid,
        data: { name: ftueFormElement.querySelector('#ftueName').value.trim(), lastName: ftueFormElement.querySelector('#ftueLastName').value.trim() },
        file: ftueFormElement.querySelector('#ftueProfilePic').files[0] || null
      }
    }));
  }

  // --- INITIALIZATION ---
  function initializeNavbar() {
    if (!document.body) { console.error("Navbar: document.body missing."); return; }
    document.body.insertAdjacentHTML('afterbegin', NAVBAR_HTML);
    navMenuElement = document.getElementById('navbar-right-menu');
    hamburgerButtonElement = document.getElementById('hamburgerMenuButton');
    userSectionElement = document.getElementById('user-section');
    creatorsbayBtnElement = document.querySelector('.creatorsbay-cta-btn');
    _attachMainNavigationEvents(); _attachHamburgerMenuEvents();
    _detectCurrentPage(); _highlightActivePage(); _renderUserSection();
    _insertFtueModal(); _setupAuthEventListeners();
    _updateCreatorBayCtaVisibility();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeNavbar);
  else initializeNavbar();
})();