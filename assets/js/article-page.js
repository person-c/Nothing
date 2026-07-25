document.addEventListener("DOMContentLoaded", () => {
    initSidenotes();
    initTableOfContents();
    initTocInteractivity();
    initTOCScrollSpy();
    initMobileToc();
    initCodeCopyButtons();
});

// SVG icon constants
const SVG_COPY = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
const SVG_CHECK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
const SVG_CHEVRON = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>';

function initSidenotes() {
    const refs = document.querySelectorAll("a.footnote-ref");
    const footnotesDiv = document.querySelector("div.footnotes");
    const container = document.querySelector("aside.footnotes");
    if (refs.length === 0 || !footnotesDiv || !container) return;

    function render() {
        if (window.innerWidth <= 1024) {
            footnotesDiv.style.display = "";
            container.innerHTML = '';
            return;
        }
        footnotesDiv.style.display = "none";
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
            li.innerHTML = clone.innerHTML.trim();
            li.style.position = "absolute";
            list.appendChild(li);

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

    let timer;
    window.addEventListener('resize', () => {
        clearTimeout(timer);
        timer = setTimeout(render, 200);
    });
    render();
}

function initTableOfContents() {
    const tocContainer = document.getElementById("toc");
    const article = document.querySelector("article");
    if (!tocContainer || !article) return;

    const headings = article.querySelectorAll("h2, h3, h4");
    if (headings.length === 0) {
        hideTocElements();
        return;
    }

    const tocList = buildTocTree(headings);
    tocContainer.appendChild(tocList);

    tocContainer.querySelectorAll('.collapsible').forEach((li) => {
        li.classList.add('is-open');
        const btn = li.querySelector('.toc-toggle');
        if (btn) btn.setAttribute('aria-expanded', 'true');
    });

    updateMobileToggle(headings.length);
    initTocControls(tocContainer);
}

function hideTocElements() {
    const tocAside = document.querySelector('aside.toc');
    const layout = document.querySelector('.layout');
    const mobileBtn = document.querySelector('.toc-mobile-toggle');
    const floatBtn = document.querySelector('.toc-float-toggle');
    if (tocAside) tocAside.style.display = 'none';
    if (layout) layout.classList.add('toc-hidden');
    if (mobileBtn) mobileBtn.style.display = 'none';
    if (floatBtn) floatBtn.style.display = 'none';
}

function buildTocTree(headings) {
    const tocList = document.createElement("ul");
    const pointers = { 2: null, 3: null };

    headings.forEach(heading => {
        const level = parseInt(heading.tagName.substring(1));
        const listItem = document.createElement("li");
        listItem.className = `toc-level-${level}`;

        const id = heading.id || heading.textContent.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, '');
        heading.id = id;

        const link = document.createElement("a");
        link.href = `#${id}`;
        link.textContent = heading.textContent;
        listItem.appendChild(link);

        if (level === 2) {
            tocList.appendChild(listItem);
            pointers[2] = listItem;
            pointers[3] = null;
        } else if (level === 3 && pointers[2]) {
            let sublist = pointers[2].querySelector("ul");
            if (!sublist) {
                sublist = document.createElement("ul");
                sublist.className = "toc-sublist";
                pointers[2].appendChild(sublist);
                pointers[2].classList.add('collapsible');
                pointers[2].insertBefore(createToggleButton(), pointers[2].firstChild);
            }
            sublist.appendChild(listItem);
            pointers[3] = listItem;
        } else if (level === 4 && pointers[3]) {
            let sublist = pointers[3].querySelector("ul");
            if (!sublist) {
                sublist = document.createElement("ul");
                sublist.className = "toc-sublist";
                pointers[3].appendChild(sublist);
            }
            sublist.appendChild(listItem);
        }
    });

    return tocList;
}

function updateMobileToggle(headingCount) {
    const mobileToggle = document.querySelector('.toc-mobile-toggle');
    if (!mobileToggle) return;
    const svg = mobileToggle.querySelector('svg');
    const svgHTML = svg ? svg.outerHTML : '';
    mobileToggle.innerHTML = `${svgHTML} ${headingCount} section${headingCount !== 1 ? 's' : ''}`;
}

function initTocControls(tocContainer) {
    const tocAside = document.querySelector('aside.toc');
    const layout = document.querySelector('.layout');
    if (!tocAside || !layout) return;

    const collapseBtn = document.createElement('button');
    collapseBtn.className = 'toc-collapse-toggle';
    collapseBtn.title = 'Hide table of contents';
    collapseBtn.innerHTML = '×';
    collapseBtn.setAttribute('aria-label', 'Hide table of contents');
    tocAside.insertBefore(collapseBtn, tocContainer);

    const floatBtn = document.createElement('button');
    floatBtn.className = 'toc-float-toggle';
    floatBtn.title = 'Show table of contents';
    floatBtn.innerHTML = '☰';
    floatBtn.setAttribute('aria-label', 'Show table of contents');
    document.body.appendChild(floatBtn);

    function recalcFullwidth() {
        if (layout._fullwidthRecalc) layout._fullwidthRecalc();
    }

    function hideToc() {
        layout.classList.add('toc-hidden');
        floatBtn.classList.add('visible');
        localStorage.setItem('toc-hidden', 'true');
        recalcFullwidth();
    }

    function showToc() {
        layout.classList.remove('toc-hidden');
        floatBtn.classList.remove('visible');
        localStorage.setItem('toc-hidden', 'false');
        recalcFullwidth();
    }

    collapseBtn.addEventListener('click', hideToc);
    floatBtn.addEventListener('click', showToc);

    if (localStorage.getItem('toc-hidden') === 'true') {
        hideToc();
    }
}

function createToggleButton() {
    const button = document.createElement('button');
    button.className = 'toc-toggle';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Toggle section');
    button.innerHTML = SVG_CHEVRON;
    return button;
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
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                const correspondingLink = document.querySelector(`#toc a[href="#${id}"]`);
                tocLinks.forEach(link => link.classList.remove('active'));
                if (correspondingLink) {
                    correspondingLink.classList.add('active');
                }
            }
        });
    }, { rootMargin: "0px 0px -75% 0px", threshold: 0.1 });
    headings.forEach(heading => observer.observe(heading));
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

function initCodeCopyButtons() {
    document.querySelectorAll('.highlight').forEach((block) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';
        block.parentNode.insertBefore(wrapper, block);
        wrapper.appendChild(block);

        const button = document.createElement('button');
        button.className = 'copy-button';
        button.innerHTML = SVG_COPY + 'Copy';
        wrapper.appendChild(button);

        button.addEventListener('click', () => {
            const code = block.querySelector('code') || block.querySelector('pre');
            const text = code ? code.textContent : block.textContent;
            navigator.clipboard.writeText(text).then(() => {
                button.innerHTML = SVG_CHECK + 'Copied!';
                setTimeout(() => {
                    button.innerHTML = SVG_COPY + 'Copy';
                }, 2000);
            }).catch(() => {
                button.textContent = 'Failed';
                setTimeout(() => { button.innerHTML = SVG_COPY + 'Copy'; }, 2000);
            });
        });
    });
}
