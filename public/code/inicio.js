// Function to toggle the mobile menu
function toggleMenu() {
    const navbar = document.getElementById('navbar');
    const menuToggle = navbar.querySelector('.menu-toggle');
    const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';

    navbar.classList.toggle('show-menu');
    menuToggle.setAttribute('aria-expanded', String(!isExpanded));
  }

  // Function to simulate navigation and close menu if open
  function navigate(page) {
    let url = '/';
    switch (page) {
      case 'categorias':
        url = '/prompts/catalog.html';
        break;
      case 'blog':
        url = '/blog/entries.html';
        break;
      case 'herramientas':
        url = '/prompts/catalog.html'; // or your tools page
        break;
      case 'login':
        url = '/login.html';
        break;
      default:
        url = '/';
    }
    window.location.href = url;
  }

  // Function to copy text from prompt items
  function copyText(button) {
    const textToCopy = button.parentElement.querySelector('span').innerText;
    navigator.clipboard.writeText(textToCopy).then(() => {
      popupNotifier.success("Prompt copiado al portapapeles: \"" + textToCopy + "\"", 'Prompt Copiado');
    }).catch(err => {
      console.error('Error al copiar texto: ', err);
      popupNotifier.error("Error al copiar el prompt.", 'Error al copiar');
    });
  }

  // Accessibility: Close mobile menu if user clicks outside of it
  document.addEventListener('click', function(event) {
      const navbar = document.getElementById('navbar');
      const mobileMenu = document.getElementById('navbar-right-menu');
      const menuToggle = navbar.querySelector('.menu-toggle');

      if (navbar.classList.contains('show-menu') && 
          mobileMenu && !mobileMenu.contains(event.target) && 
          menuToggle && !menuToggle.contains(event.target)) {
          navbar.classList.remove('show-menu');
          menuToggle.setAttribute('aria-expanded', 'false');
      }
  });

  // Search functionality
  const searchInput = document.getElementById('search-input');
  const searchButton = document.getElementById('search-button');

  if (searchInput && searchButton) {
      // Event listener for the search input field
      searchInput.addEventListener('input', function() {
          // Enable button if there is text, disable otherwise
          if (searchInput.value.trim() !== '') {
              searchButton.disabled = false;
          } else {
              searchButton.disabled = true;
          }
      });

      // Event listener for the search button
      searchButton.addEventListener('click', function() {
          const searchTerm = searchInput.value.trim();
          if (searchTerm !== '') {
              console.log("Search initiated with: " + searchTerm);
              // Here you would typically implement the actual search logic,
              // like filtering content or making an API call.
          }
      });
  } else {
      console.error("Search input or button not found!");
  }

const PAGE_URLS = [
  '/auth/login.html',
  '/education/glosary/index.html',
  '/roadmap/roadmap.html',
];

const PAGE_LABELS = [
  'Login',
  'Education',
  'Roadmap',
];

function renderNavButtons() {
  let navContainer = document.getElementById('custom-nav-buttons');
  if (!navContainer) {
    navContainer = document.createElement('nav');
    navContainer.id = 'custom-nav-buttons';
    navContainer.setAttribute('aria-label', 'Main Navigation');
    navContainer.style.display = 'flex';
    navContainer.style.gap = '1rem';
    navContainer.style.justifyContent = 'center';
    navContainer.style.margin = '2rem 0';
    document.body.insertBefore(navContainer, document.body.firstChild.nextSibling);
  } else {
    navContainer.innerHTML = '';
  }

  // Login button
  const loginBtn = document.createElement('button');
  loginBtn.textContent = 'Login';
  loginBtn.className = 'nav-btn';
  loginBtn.setAttribute('tabindex', '0');
  loginBtn.setAttribute('aria-label', 'Login');
  loginBtn.onclick = () => window.location.href = PAGE_URLS[0];
  navContainer.appendChild(loginBtn);

  // Education dropdown
  const eduGroup = document.createElement('div');
  eduGroup.className = 'nav-group';
  eduGroup.style.position = 'relative';
  const eduBtn = document.createElement('button');
  eduBtn.textContent = 'Education';
  eduBtn.className = 'nav-btn';
  eduBtn.setAttribute('aria-haspopup', 'true');
  eduBtn.setAttribute('aria-expanded', 'false');
  eduBtn.onclick = (e) => {
    e.stopPropagation();
    const isOpen = eduGroup.classList.toggle('open');
    eduBtn.setAttribute('aria-expanded', isOpen.toString());
  };
  eduGroup.appendChild(eduBtn);
  const eduDropdown = document.createElement('div');
  eduDropdown.className = 'nav-dropdown';
  const glossaryBtn = document.createElement('button');
  glossaryBtn.textContent = 'Glossary';
  glossaryBtn.className = 'nav-btn';
  glossaryBtn.onclick = () => window.location.href = PAGE_URLS[1];
  eduDropdown.appendChild(glossaryBtn);
  // Add more education platform buttons here if needed
  eduGroup.appendChild(eduDropdown);
  navContainer.appendChild(eduGroup);

  // Roadmap button
  const roadmapBtn = document.createElement('button');
  roadmapBtn.textContent = 'Roadmap';
  roadmapBtn.className = 'nav-btn';
  roadmapBtn.setAttribute('tabindex', '0');
  roadmapBtn.setAttribute('aria-label', 'Roadmap');
  roadmapBtn.onclick = () => window.location.href = PAGE_URLS[2];
  navContainer.appendChild(roadmapBtn);

  // Close dropdown on click outside
  document.addEventListener('click', (e) => {
    if (!eduGroup.contains(e.target)) {
      eduGroup.classList.remove('open');
      eduBtn.setAttribute('aria-expanded', 'false');
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderNavButtons);
} else {
  renderNavButtons();
}
