(function() {
    var navBar = document.querySelector('.nav-bar');
    var navContainer = document.querySelector('.nav-container');
    var navMenu = document.querySelector('.nav-menu');
    if (!navBar || !navMenu) return;

    function openMenu() {
        navMenu.classList.add('is-open');
        navContainer.classList.add('is-open');
    }

    function closeMenu() {
        navMenu.classList.remove('is-open');
        navContainer.classList.remove('is-open');
    }

    navBar.addEventListener('click', function(e) {
        e.stopPropagation();
        if (navMenu.classList.contains('is-open')) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    document.addEventListener('click', function(e) {
        if (!navMenu.contains(e.target) && e.target !== navBar) {
            closeMenu();
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeMenu();
    });
})();
