(() => {
    const navBar = document.querySelector('.nav-bar');
    const navContainer = document.querySelector('.nav-container');
    const navMenu = document.querySelector('.nav-menu');
    if (!navBar || !navMenu) return;

    const links = () => Array.from(navMenu.querySelectorAll('a'));
    const isOpen = () => navMenu.classList.contains('is-open');

    function setOpen(open, focusTarget) {
        navMenu.classList.toggle('is-open', open);
        navContainer.classList.toggle('is-open', open);
        navBar.setAttribute('aria-expanded', String(open));
        // While closed the menu is visibility:hidden (and that property is
        // transitioned), so it only becomes focusable once the transition has
        // started. Focus on the next tick instead of synchronously.
        if (focusTarget) setTimeout(() => focusTarget.focus(), 20);
    }

    function openMenu() {
        setOpen(true, links()[0]);
    }

    function closeMenu(returnFocus) {
        setOpen(false, returnFocus ? navBar : null);
    }

    navBar.addEventListener('click', (e) => {
        e.stopPropagation();
        isOpen() ? closeMenu(false) : openMenu();
    });

    document.addEventListener('click', (e) => {
        if (!isOpen()) return;
        if (!navMenu.contains(e.target) && e.target !== navBar) {
            closeMenu(false);
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isOpen()) {
            e.preventDefault();
            closeMenu(true);
        }
    });
})();
