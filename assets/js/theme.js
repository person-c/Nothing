(() => {
    const toggle = document.querySelector('.theme-toggle');
    if (!toggle) return;
    const status = document.getElementById('theme-status');

    const MODE_LABELS = {
        dark: 'Dark mode',
        light: 'Light mode',
        auto: 'Auto theme, follows the system'
    };

    // The sun/moon icons are rendered server-side and switched by CSS
    // (:root.dark), so JS only has to keep the accessible name in sync.
    function currentMode() {
        let stored = null;
        try { stored = localStorage.getItem('theme'); } catch (e) {}
        return (stored === 'dark' || stored === 'light') ? stored : 'auto';
    }

    function updateLabel() {
        const mode = currentMode();
        const isDark = document.documentElement.classList.contains('dark');
        toggle.setAttribute('aria-label', `Switch color theme (current: ${mode === 'auto' ? 'auto' : isDark ? 'dark' : 'light'})`);
        return mode;
    }

    function announce(mode) {
        if (!status) return;
        // Clear first so consecutive clicks on the same text are re-announced.
        status.textContent = '';
        requestAnimationFrame(() => { status.textContent = MODE_LABELS[mode] || ''; });
    }

    updateLabel();

    toggle.addEventListener('click', () => {
        if (window.__cycleTheme) window.__cycleTheme();
        announce(updateLabel());
    });
})();
