document.addEventListener('DOMContentLoaded', () => {
    initSidenotes();
    initTocInteractivity();
    initTocControls(document.getElementById('toc'));
    initTOCScrollSpy();
    initMobileToc();
    initCodeCopyButtons();
});

// Keep these queries in sync with the media queries in
// assets/css/modules/responsive.css. Using matchMedia (instead of
// window.innerWidth) makes JS switch at exactly the same width as CSS.
const BP_SIDENOTES = window.matchMedia('(max-width: 1200px)');

// SVG icon constants
const SVG_COPY = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
const SVG_CHECK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

function initSidenotes() {
    const refs = document.querySelectorAll("a.footnote-ref");
    const footnotesDiv = document.querySelector("div.footnotes");
    const container = document.querySelector("aside.footnotes");
    if (refs.length === 0 || !footnotesDiv || !container) return;

    const noteMap = new Map();
    const refMap = new Map();
    const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function render() {
        if (BP_SIDENOTES.matches) {
            footnotesDiv.classList.remove('is-hidden');
            container.innerHTML = '';
            noteMap.clear();
            refMap.clear();
            return;
        }
        footnotesDiv.classList.add('is-hidden');
        container.innerHTML = '';

        const list = document.createElement("ul");
        list.id = "dynamic-footnotes";
        container.appendChild(list);

        const items = [];
        const containerTop = container.getBoundingClientRect().top + container.scrollTop;

        refs.forEach((ref, i) => {
            if (!ref.id) ref.id = `fnref-${i + 1}`;
            const footnoteId = ref.getAttribute("href").substring(1);
            const fn = document.getElementById(footnoteId);
            if (!fn) return;

            const li = document.createElement("li");
            const clone = fn.cloneNode(true);
            const backLink = clone.querySelector('.footnote-backref');
            if (backLink) backLink.remove();
            // Visible sequence number, matching the in-text superscript.
            const number = document.createElement('span');
            number.className = 'sidenote-number';
            number.textContent = String(i + 1);
            li.appendChild(number);
            // Move the cloned content, not the cloned <li> itself: an li inside
            // an li is invalid HTML and screen readers flag the whole list.
            while (clone.firstChild) li.appendChild(clone.firstChild);
            li.style.position = "absolute";
            list.appendChild(li);
            noteMap.set(footnoteId, li);
            refMap.set(footnoteId, ref);
            li.addEventListener('mouseenter', () => setPairHighlight(footnoteId, true));
            li.addEventListener('mouseleave', () => setPairHighlight(footnoteId, false));

            const back = document.createElement('a');
            back.href = `#${ref.id}`;
            back.className = 'sidenote-backlink';
            back.textContent = '↩';
            back.title = 'Back to reference';
            li.appendChild(back);

            const refTop = ref.getBoundingClientRect().top;
            items.push({ li, top: refTop - containerTop });
        });

        // Prevent overlap
        const minGap = 10;
        let prevBottom = -Infinity;
        items.forEach((item) => {
            const h = item.li.getBoundingClientRect().height;
            let t = item.top;
            if (t < prevBottom + minGap) t = prevBottom + minGap;
            item.li.style.top = `${t}px`;
            prevBottom = t + h;
        });
    }

    // On wide screens the footnote targets are hidden, so the default anchor
    // jump goes nowhere: scroll to the matching sidenote and flash it instead.
    refs.forEach((ref) => {
        ref.addEventListener('click', (event) => {
            const li = noteMap.get(ref.getAttribute('href').substring(1));
            if (!li) return; // narrow layout: keep the native anchor behavior
            event.preventDefault();
            li.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'center' });
            li.classList.add('is-highlighted');
            li.tabIndex = -1;
            li.focus({ preventScroll: true });
            clearTimeout(li._highlightTimer);
            li._highlightTimer = setTimeout(() => li.classList.remove('is-highlighted'), 1600);
        });
    });

    // Hovering a reference highlights its sidenote and vice versa, so the
    // numbered margin note is easy to pair with the superscript in the text.
    function setPairHighlight(footnoteId, on) {
        const li = noteMap.get(footnoteId);
        const ref = refMap.get(footnoteId);
        if (li) li.classList.toggle('is-hovered', on);
        if (ref) ref.classList.toggle('is-hovered', on);
    }

    refs.forEach((ref) => {
        const footnoteId = ref.getAttribute('href').substring(1);
        ref.addEventListener('mouseenter', () => setPairHighlight(footnoteId, true));
        ref.addEventListener('mouseleave', () => setPairHighlight(footnoteId, false));
        ref.addEventListener('focus', () => setPairHighlight(footnoteId, true));
        ref.addEventListener('blur', () => setPairHighlight(footnoteId, false));
    });

    // Positions become stale when anything above a sidenote changes height:
    // lazy images loading, webfonts swapping, TOC toggles, or a resize. Re-run
    // the measurement (coalesced into one animation frame) on all of them.
    const articleEl = document.querySelector('article');
    let rafId = null;
    function scheduleRender() {
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
            rafId = null;
            render();
        });
    }

    window.addEventListener('resize', scheduleRender);

    if (articleEl) {
        if ('ResizeObserver' in window) {
            new ResizeObserver(scheduleRender).observe(articleEl);
        }
        articleEl.querySelectorAll('img').forEach((img) => {
            if (!img.complete) img.addEventListener('load', scheduleRender, { once: true });
        });
    }
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(scheduleRender);
    }

    render();
}


function initTocControls(tocContainer) {
    const tocAside = document.querySelector('aside.toc');
    const layout = document.querySelector('.layout');
    if (!tocContainer || !tocAside || !layout) return;

    const collapseBtn = document.createElement('button');
    collapseBtn.className = 'toc-collapse-toggle';
    collapseBtn.title = 'Hide table of contents';
    collapseBtn.innerHTML = '×';
    collapseBtn.setAttribute('aria-label', 'Hide table of contents');
    tocAside.insertBefore(collapseBtn, tocContainer);

    const floatBtn = document.createElement('button');
    floatBtn.className = 'toc-float-toggle';
    floatBtn.title = 'Show table of contents';
    // The visible affordance is the 2px bar drawn by CSS (::after). No text:
    // a glyph would overflow the 8px-wide button and sit on top of the bar.
    floatBtn.setAttribute('aria-label', 'Show table of contents');
    document.body.appendChild(floatBtn);

    function recalcFullwidth() {
        if (layout._fullwidthRecalc) layout._fullwidthRecalc();
    }

    function hideToc() {
        layout.classList.add('toc-hidden');
        floatBtn.classList.add('visible');
        window.__storage.set('toc-hidden', 'true');
        recalcFullwidth();
    }

    function showToc() {
        layout.classList.remove('toc-hidden');
        floatBtn.classList.remove('visible');
        window.__storage.set('toc-hidden', 'false');
        recalcFullwidth();
    }

    collapseBtn.addEventListener('click', hideToc);
    floatBtn.addEventListener('click', showToc);

    if (window.__storage.get('toc-hidden') === 'true') {
        hideToc();
    }
}


function initTocInteractivity() {
    const tocContainer = document.getElementById("toc");
    if (!tocContainer) return;

    tocContainer.addEventListener('click', (event) => {
        const toggleButton = event.target.closest('.toc-toggle');
        if (toggleButton) {
            const parentLi = toggleButton.parentElement;
            if (parentLi.classList.contains('collapsible')) {
                const isExpanded = parentLi.classList.toggle('is-open');
                toggleButton.setAttribute('aria-expanded', isExpanded);
            }
        }
    });
}

function initTOCScrollSpy() {
    const headings = document.querySelectorAll("article h2, article h3, article h4");
    const tocLinks = document.querySelectorAll("#toc a");
    if (headings.length === 0 || tocLinks.length === 0) return;

    function setActive(id) {
        tocLinks.forEach(link => {
            link.classList.toggle('active', id !== null && link.getAttribute('href') === `#${id}`);
        });
    }

    // IntersectionObserver only fires while scrolling, so the TOC had no
    // active entry until the reader moved the page. Mark the current section
    // (or the first one) as soon as the page is ready.
    function syncActive() {
        const threshold = window.innerHeight * 0.25;
        let current = null;
        headings.forEach(heading => {
            if (heading.getBoundingClientRect().top <= threshold) current = heading;
        });
        if (!current) current = headings[0];
        setActive(current ? current.getAttribute('id') : null);
    }

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                setActive(entry.target.getAttribute('id'));
            }
        });
    }, { rootMargin: "0px 0px -75% 0px", threshold: 0.1 });
    headings.forEach(heading => observer.observe(heading));
    syncActive();
}

function initMobileToc() {
    const toggle = document.querySelector('.toc-mobile-toggle');
    const toc = document.querySelector('aside.toc');
    if (!toggle || !toc) return;

    toggle.addEventListener('click', () => {
        const isOpen = toc.classList.toggle('mobile-visible');
        toggle.classList.toggle('is-open', isOpen);
        toggle.setAttribute('aria-expanded', isOpen);
        if (isOpen) {
            toc.classList.remove('hidden');
            const layout = document.querySelector('.layout');
            if (layout) {
                layout.classList.remove('toc-hidden');
                if (layout._fullwidthRecalc) layout._fullwidthRecalc();
            }
            const floatBtn = document.querySelector('.toc-float-toggle');
            if (floatBtn) floatBtn.classList.remove('visible');
        }
    });
}

function copyLabel(key) {
    // The copy button belongs to the article, so prefer the language of the
    // post title (set by head.html as window.__POST_LANG) over the site UI
    // language, falling back to the site catalog.
    const perLang = window.__UI_LANG && window.__POST_LANG
        ? window.__UI_LANG[window.__POST_LANG] : null;
    const siteStrings = window.__I18N || {};
    return (perLang && perLang[key]) || siteStrings[key]
        || { copy: 'Copy', copied: 'Copied!', copyFailed: 'Failed' }[key] || key;
}

function copyToClipboard(text) {
    // navigator.clipboard only exists in secure contexts; fall back to
    // execCommand so copy still works on plain-http deployments.
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.top = '-1000px';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy') ? resolve() : reject(new Error('copy failed'));
        } catch (err) {
            reject(err);
        } finally {
            textarea.remove();
        }
    });
}

function initCodeCopyButtons() {
    document.querySelectorAll('.highlight').forEach((block) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';
        block.parentNode.insertBefore(wrapper, block);
        wrapper.appendChild(block);

        const button = document.createElement('button');
        button.className = 'copy-button';
        button.innerHTML = SVG_COPY + copyLabel('copy');
        wrapper.appendChild(button);

        button.addEventListener('click', () => {
            const code = block.querySelector('code') || block.querySelector('pre');
            const text = code ? code.textContent : block.textContent;
            copyToClipboard(text).then(() => {
                button.innerHTML = SVG_CHECK + copyLabel('copied');
                setTimeout(() => {
                    button.innerHTML = SVG_COPY + copyLabel('copy');
                }, 2000);
            }).catch(() => {
                button.textContent = copyLabel('copyFailed');
                setTimeout(() => { button.innerHTML = SVG_COPY + copyLabel('copy'); }, 2000);
            });
        });
    });
}
