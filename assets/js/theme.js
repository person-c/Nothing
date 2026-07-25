(function() {
    var toggle = document.querySelector('.theme-toggle');
    if (!toggle) return;

    function updateIcon() {
        toggle.innerHTML = window.__getThemeIcon ? window.__getThemeIcon() : window.__SUN_ICON || '☀';
        var isDark = document.documentElement.classList.contains('dark');
        toggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    }
    updateIcon();

    toggle.addEventListener('click', function () {
        if (window.__cycleTheme) window.__cycleTheme();
        updateIcon();
    });
})();
