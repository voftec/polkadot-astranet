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
