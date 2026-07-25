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

        // 2. Tables: measure unwrapped content width using off-screen clone
        article.querySelectorAll('table').forEach(table => {
            if (table.closest('.fullwidth')) return;
            const clone = table.cloneNode(true);
            clone.style.position = 'absolute';
            clone.style.left = '-9999px';
            clone.style.top = '0';
            clone.style.visibility = 'hidden';
            clone.style.width = 'auto';
            clone.style.maxWidth = 'none';
            clone.querySelectorAll('th, td').forEach(cell => {
                cell.style.whiteSpace = 'nowrap';
            });
            table.parentNode.appendChild(clone);
            const naturalWidth = clone.scrollWidth;
            clone.remove();

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
        const minGap = 12;
        const layoutRect = layout.getBoundingClientRect();
        const articleRect = article.getBoundingClientRect();
        const padLeft = parseFloat(getComputedStyle(article).paddingLeft);
        const padRight = parseFloat(getComputedStyle(article).paddingRight);
        const contentLeft = articleRect.left + padLeft;
        const layoutCenterX = layoutRect.left + layoutRect.width / 2;
        const viewportWidth = document.documentElement.clientWidth;
        const vpMinusGap = viewportWidth - 2 * minGap;

        article.querySelectorAll('.fullwidth').forEach(el => {
            const natWidth = getNaturalWidth(el);
            const needsScroll = natWidth > layoutRect.width + 2;

            // Only toggle class when state actually changes
            var hasScroll = el.classList.contains('fullwidth-scroll');
            if (needsScroll && !hasScroll) {
                el.classList.add('fullwidth-scroll');
            } else if (!needsScroll && hasScroll) {
                el.classList.remove('fullwidth-scroll');
            }

            var useWidth;
            if (needsScroll) {
                useWidth = Math.min(layoutRect.width, viewportWidth);
            } else {
                useWidth = natWidth;
                if (el.classList.contains('highlight')) {
                    useWidth += 10;
                }
            }

            useWidth = Math.min(useWidth, vpMinusGap);

            if (el.tagName === 'IMG') {
                el.style.setProperty('width', 'auto', 'important');
                el.style.setProperty('max-width', vpMinusGap + 'px', 'important');
            } else {
                el.style.setProperty('width', Math.floor(useWidth) + 'px', 'important');
                el.style.setProperty('max-width', 'none', 'important');
                if (el.hasAttribute('width')) {
                    el.removeAttribute('width');
                }
            }

            var marginLeft = layoutCenterX - useWidth / 2 - contentLeft;

            if (marginLeft < -contentLeft + minGap) {
                marginLeft = -contentLeft + minGap;
            }

            var rightEdge = contentLeft + marginLeft + useWidth;
            if (rightEdge > viewportWidth - minGap) {
                marginLeft -= (rightEdge - (viewportWidth - minGap));
            }

            if (marginLeft < -contentLeft + minGap) {
                marginLeft = -contentLeft + minGap;
            }

            el.style.setProperty('margin-left', Math.floor(marginLeft) + 'px', 'important');
        });
    }

    detectFullwidthElements();
    applyAllOffsets();

    // Expose for TOC toggle to trigger recalculation
    layout._fullwidthRecalc = function () {
        requestAnimationFrame(function () {
            requestAnimationFrame(applyAllOffsets);
        });
    };

    var rafId = null;
    function scheduleApply() {
        if (rafId) return;
        rafId = requestAnimationFrame(function () {
            rafId = null;
            applyAllOffsets();
        });
    }
    window.addEventListener('resize', scheduleApply, { passive: true });

    const resizeObserver = new ResizeObserver(() => {
        scheduleApply();
    });
    resizeObserver.observe(article);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFullwidth);
} else {
    initFullwidth();
}
