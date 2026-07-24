(function() {
    var toggle = document.querySelector('.theme-toggle');
    if (!toggle) return;

    function updateIcon() {
        var isDark = document.documentElement.classList.contains('dark');
        toggle.textContent = isDark ? '☾' : '☀';
        toggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    }
    updateIcon();

    toggle.addEventListener('click', function () {
        var root = document.documentElement;
        if (root.classList.contains('dark')) {
            root.classList.remove('dark');
            root.classList.add('light');
            localStorage.setItem('theme', 'light');
        } else if (root.classList.contains('light')) {
            root.classList.remove('light');
            localStorage.setItem('theme', 'auto');
        } else {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        }
        updateIcon();
    });
})();
