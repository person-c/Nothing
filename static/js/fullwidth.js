function initFullwidth() {
    const layout = document.querySelector('.layout');
    const article = document.querySelector('article');
    if (!layout || !article) return;

    function detectFullwidthElements() {
        const layoutWidth = layout.clientWidth;

        // 1. Code blocks
        article.querySelectorAll('.highlight').forEach(el => {
            if (el.closest('.fullwidth')) return;
            const needsSpace = el.scrollWidth > el.clientWidth + 2;
            if (needsSpace) {
                el.classList.add('fullwidth');
                if (el.scrollWidth > layoutWidth) {
                    el.classList.add('fullwidth-scroll');
                }
            }
        });

        // 2. Tables: measure unwrapped content width
        article.querySelectorAll('table').forEach(table => {
            if (table.closest('.fullwidth')) return;
            const cells = table.querySelectorAll('th, td');
            const savedWhiteSpaces = [];
            cells.forEach(cell => {
                savedWhiteSpaces.push(cell.style.whiteSpace);
                cell.style.whiteSpace = 'nowrap';
            });
            const savedMaxW = table.style.maxWidth;
            table.style.maxWidth = 'none';
            table.style.width = 'auto';
            table.offsetHeight;
            const naturalWidth = table.scrollWidth;
            cells.forEach((cell, i) => {
                cell.style.whiteSpace = savedWhiteSpaces[i];
            });
            table.style.maxWidth = savedMaxW;
            table.style.width = '';
            const parentWidth = table.parentElement.clientWidth;
            const needsSpace = naturalWidth > parentWidth + 2;
            if (needsSpace) {
                table.classList.add('fullwidth');
                if (naturalWidth > layoutWidth) {
                    table.classList.add('fullwidth-scroll');
                }
            }
        });

        // 3. Images: only expand if natural width fits within layout (can't scroll images)
        article.querySelectorAll('img').forEach(img => {
            if (img.closest('.fullwidth')) return;
            checkImage(img, layoutWidth);
        });

        // 4. HTML widgets and iframes
        article.querySelectorAll('iframe, .html-widget, .plotly, .leaflet, [id*="htmlwidget"]').forEach(el => {
            if (el.closest('.fullwidth')) return;
            const parentWidth = el.parentElement.clientWidth;
            const elWidth = el.offsetWidth || parseInt(el.getAttribute('width')) || 0;
            const needsSpace = elWidth > parentWidth + 10;
            if (needsSpace) {
                el.classList.add('fullwidth');
                if (elWidth > layoutWidth) {
                    el.classList.add('fullwidth-scroll');
                }
            }
        });
    }

    function checkImage(img, layoutWidth) {
        function tryExpand() {
            if (img.naturalWidth === 0 || img.offsetWidth === 0) return;
            const needsSpace = img.naturalWidth > img.offsetWidth * 1.3;
            const fitsLayout = img.naturalWidth <= layout.clientWidth;
            if (needsSpace && fitsLayout) {
                img.classList.add('fullwidth');
                applyAllOffsets();
            }
        }

        if (img.complete) {
            tryExpand();
        } else {
            img.addEventListener('load', tryExpand, { once: true });
        }
    }

    function getNaturalWidth(el) {
        if (el.tagName === 'IMG') return el.naturalWidth;
        if (el.tagName === 'TABLE') return el.scrollWidth;
        if (el.classList.contains('highlight')) return el.scrollWidth;
        return el.offsetWidth || parseInt(el.getAttribute('width')) || layout.clientWidth;
    }

    function applyAllOffsets() {
        const layoutRect = layout.getBoundingClientRect();
        const articleRect = article.getBoundingClientRect();
        const artStyle = getComputedStyle(article);
        const padLeft = parseFloat(artStyle.paddingLeft);
        const contentLeft = articleRect.left + padLeft;
        const layoutCenterX = layoutRect.left + layoutRect.width / 2;

        article.querySelectorAll('.fullwidth').forEach(el => {
            el.style.setProperty('max-width', 'none', 'important');

            const isScroll = el.classList.contains('fullwidth-scroll');
            const natWidth = getNaturalWidth(el);
            let useWidth = isScroll ? layoutRect.width : natWidth;

            // Code blocks get extra right padding; compensate width
            if (el.classList.contains('highlight') && !isScroll) {
                useWidth += 10;
            }

            if (el.tagName === 'IMG') {
                el.style.setProperty('width', 'auto', 'important');
            } else {
                el.style.setProperty('width', useWidth + 'px', 'important');
            }

            const targetLeft = layoutCenterX - useWidth / 2;
            el.style.setProperty('margin-left', (targetLeft - contentLeft) + 'px', 'important');
        });
    }

    detectFullwidthElements();
    applyAllOffsets();

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(applyAllOffsets, 150);
    });

    const resizeObserver = new ResizeObserver(() => {
        applyAllOffsets();
    });
    resizeObserver.observe(article);
}

document.addEventListener("DOMContentLoaded", initFullwidth);
