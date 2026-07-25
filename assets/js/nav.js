(() => {
    const navBar = document.querySelector('.nav-bar');
    const navContainer = document.querySelector('.nav-container');
    const navMenu = document.querySelector('.nav-menu');
    if (!navBar || !navMenu) return;

    function openMenu() {
        navMenu.classList.add('is-open');
        navContainer.classList.add('is-open');
    }

    function closeMenu() {
        navMenu.classList.remove('is-open');
        navContainer.classList.remove('is-open');
    }

    navBar.addEventListener('click', (e) => {
        e.stopPropagation();
        navMenu.classList.contains('is-open') ? closeMenu() : openMenu();
    });

    document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && e.target !== navBar) {
            closeMenu();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMenu();
    });
})();
