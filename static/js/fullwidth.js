function initFullwidth() {
    const layout = document.querySelector('.layout');
    const article = document.querySelector('article');
    if (!layout || !article) return;

    function detectFullwidthElements() {
        const layoutWidth = layout.clientWidth;

        // 1. Code blocks: measure and save natural content width
        article.querySelectorAll('.highlight').forEach(el => {
            if (el.closest('.fullwidth')) return;
            const natWidth = el.scrollWidth;
            const needsSpace = natWidth > el.clientWidth + 2;
            if (needsSpace) {
                el.classList.add('fullwidth');
                el.dataset.natWidth = natWidth;
                if (natWidth > layoutWidth) {
                    el.classList.add('fullwidth-scroll');
                }
            }
        });

        // 2. Tables: measure unwrapped content width, save it
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
                table.dataset.natWidth = naturalWidth;
                if (naturalWidth > layoutWidth) {
                    table.classList.add('fullwidth-scroll');
                }
            }
        });

        // 3. Images: only expand if natural width fits within layout
        article.querySelectorAll('img').forEach(img => {
            if (img.closest('.fullwidth')) return;
            checkImage(img, layoutWidth);
        });

        // 4. HTML widgets and iframes
        article.querySelectorAll('iframe, .html-widget, .plotly, .leaflet, [id*="htmlwidget"]').forEach(el => {
            if (el.closest('.fullwidth')) return;
            const parentWidth = el.parentElement.clientWidth;
            // Use max: offsetWidth may be constrained by parent, but width attribute
            // declares the real intended size. The larger one is the natural width.
            const attrWidth = parseInt(el.getAttribute('width')) || 0;
            const elWidth = Math.max(el.offsetWidth || 0, attrWidth);
            const needsSpace = elWidth > parentWidth + 10;
            if (needsSpace) {
                el.classList.add('fullwidth');
                el.dataset.natWidth = elWidth;
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
                img.dataset.natWidth = img.naturalWidth;
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
        if (el.dataset.natWidth) return parseFloat(el.dataset.natWidth);
        if (el.tagName === 'IMG') return el.naturalWidth;
        return el.offsetWidth || parseInt(el.getAttribute('width')) || layout.clientWidth;
    }

    function applyAllOffsets() {
        const layoutRect = layout.getBoundingClientRect();
        const articleRect = article.getBoundingClientRect();
        const artStyle = getComputedStyle(article);
        const padLeft = parseFloat(artStyle.paddingLeft);
        const padRight = parseFloat(artStyle.paddingRight);
        const contentLeft = articleRect.left + padLeft;
        const contentRight = articleRect.right - padRight;
        const contentWidth = contentRight - contentLeft;
        const layoutCenterX = layoutRect.left + layoutRect.width / 2;
        const viewportWidth = document.documentElement.clientWidth;

        article.querySelectorAll('.fullwidth').forEach(el => {
            const natWidth = getNaturalWidth(el);

            // Determine whether this element needs internal scrolling
            // at the current viewport (not just at load time).
            const needsScroll = natWidth > layoutRect.width + 2;

            // Keep CSS class in sync so existing stylesheet rules apply cleanly.
            if (needsScroll) {
                el.classList.add('fullwidth-scroll');
            } else {
                el.classList.remove('fullwidth-scroll');
            }

            // Calculate width
            let useWidth;
            if (needsScroll) {
                // Fill layout width (capped at viewport), content scrolls inside
                useWidth = Math.min(layoutRect.width, viewportWidth);
            } else {
                // Expand to natural width (into sidebars on wide layouts)
                useWidth = natWidth;
                // Compensate for padding-right added by CSS on non-scroll highlights
                if (el.classList.contains('highlight')) {
                    useWidth += 10;
                }
            }

            // Hard cap: never wider than the viewport
            useWidth = Math.min(useWidth, viewportWidth);

            // Set width
            if (el.tagName === 'IMG') {
                el.style.setProperty('width', 'auto', 'important');
                el.style.removeProperty('max-width');
            } else {
                el.style.setProperty('width', Math.floor(useWidth) + 'px', 'important');
                el.style.setProperty('max-width', 'none', 'important');
                // Remove HTML width attribute so it doesn't fight inline style
                if (el.hasAttribute('width')) {
                    el.removeAttribute('width');
                }
            }

            // Center in layout, then clamp to viewport bounds
            let marginLeft = layoutCenterX - useWidth / 2 - contentLeft;

            // Don't push past left edge of viewport
            if (marginLeft < -contentLeft) {
                marginLeft = -contentLeft;
            }

            // Don't let right edge exceed viewport
            const rightEdge = contentLeft + marginLeft + useWidth;
            if (rightEdge > viewportWidth) {
                marginLeft -= (rightEdge - viewportWidth);
            }

            // Re-check left edge
            if (marginLeft < -contentLeft) {
                marginLeft = -contentLeft;
            }

            el.style.setProperty('margin-left', Math.floor(marginLeft) + 'px', 'important');
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
