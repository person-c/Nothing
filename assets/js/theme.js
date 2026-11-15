(() => {
    const toggle = document.querySelector('.theme-toggle');
    if (!toggle) return;

    // The sun/moon icons are rendered server-side and switched by CSS
    // (:root.dark), so JS only has to keep the accessible name in sync.
    const updateLabel = () => {
        const isDark = document.documentElement.classList.contains('dark');
        toggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    };
    updateLabel();

    toggle.addEventListener('click', () => {
        if (window.__cycleTheme) window.__cycleTheme();
        updateLabel();
    });
})();
