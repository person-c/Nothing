document.addEventListener("DOMContentLoaded", function () {
    initSidenotes();
    initTableOfContents();
    initTocInteractivity();
    initTOCScrollSpy();
    initMobileToc();
    initCodeCopyButtons();
});

function initSidenotes() {
    var refs = document.querySelectorAll("a.footnote-ref");
    var footnotesDiv = document.querySelector("div.footnotes");
    var container = document.querySelector("aside.footnotes");
    if (refs.length === 0 || !footnotesDiv || !container) return;

    function render() {
        if (window.innerWidth <= 1024) {
            footnotesDiv.style.display = "";
            container.innerHTML = '';
            return;
        }
        footnotesDiv.style.display = "none";
        container.innerHTML = '';

        var list = document.createElement("ul");
        list.id = "dynamic-footnotes";
        container.appendChild(list);

        var items = [];
        var containerTop = container.getBoundingClientRect().top + container.scrollTop;

        refs.forEach(function (ref, i) {
            if (!ref.id) ref.id = 'fnref-' + (i + 1);
            var footnoteId = ref.getAttribute("href").substring(1);
            var fn = document.getElementById(footnoteId);
            if (!fn) return;

            var li = document.createElement("li");
            var clone = fn.cloneNode(true);
            var backLink = clone.querySelector('.footnote-backref');
            if (backLink) backLink.remove();
            li.innerHTML = clone.innerHTML.trim();
            li.style.position = "absolute";
            list.appendChild(li);

            var back = document.createElement('a');
            back.href = '#' + ref.id;
            back.className = 'sidenote-backlink';
            back.textContent = '↩';
            back.title = 'Back to reference';
            li.appendChild(back);

            var refTop = ref.getBoundingClientRect().top;
            items.push({ li: li, top: refTop - containerTop });
        });

        // Prevent overlap
        var minGap = 10;
        var prevBottom = -Infinity;
        items.forEach(function (item) {
            var h = item.li.getBoundingClientRect().height;
            var t = item.top;
            if (t < prevBottom + minGap) t = prevBottom + minGap;
            item.li.style.top = t + 'px';
            prevBottom = t + h;
        });
    }

    var timer;
    window.addEventListener('resize', function () {
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

    tocContainer.querySelectorAll('.collapsible').forEach(function (li) {
        li.classList.add('is-open');
        var btn = li.querySelector('.toc-toggle');
        if (btn) btn.setAttribute('aria-expanded', 'true');
    });

    updateMobileToggle(headings.length);
    initTocControls(tocContainer);
}

function hideTocElements() {
    var tocAside = document.querySelector('aside.toc');
    var layout = document.querySelector('.layout');
    var mobileBtn = document.querySelector('.toc-mobile-toggle');
    var floatBtn = document.querySelector('.toc-float-toggle');
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
    var mobileToggle = document.querySelector('.toc-mobile-toggle');
    if (!mobileToggle) return;
    var svg = mobileToggle.querySelector('svg');
    var svgHTML = svg ? svg.outerHTML : '';
    var countStr = headingCount + ' section' + (headingCount !== 1 ? 's' : '');
    mobileToggle.innerHTML = svgHTML + ' ' + countStr;
}

function initTocControls(tocContainer) {
    var tocAside = document.querySelector('aside.toc');
    var layout = document.querySelector('.layout');
    if (!tocAside || !layout) return;

    var collapseBtn = document.createElement('button');
    collapseBtn.className = 'toc-collapse-toggle';
    collapseBtn.title = 'Hide table of contents';
    collapseBtn.innerHTML = '×';
    collapseBtn.setAttribute('aria-label', 'Hide table of contents');
    tocAside.insertBefore(collapseBtn, tocContainer);

    var floatBtn = document.createElement('button');
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

/**
 * 辅助函数：创建一个可折叠按钮
 */
function createToggleButton() {
    const button = document.createElement('button');
    button.className = 'toc-toggle';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Toggle section');
    button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>';
    return button;
}

/**
 * 新模块：初始化目录的折叠/展开交互
 */
function initTocInteractivity() {
    const tocContainer = document.getElementById("toc");
    if (!tocContainer) return;

    tocContainer.addEventListener('click', function (event) {
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


/**
 * 模块三：目录滚动高亮 (Scroll-Spy) - 无需改动
 */
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

/* ---------------------------- Mobile TOC Toggle ----------------------------- */
function initMobileToc() {
    var toggle = document.querySelector('.toc-mobile-toggle');
    var toc = document.querySelector('aside.toc');
    if (!toggle || !toc) return;

    toggle.addEventListener('click', function () {
        var isOpen = toc.classList.toggle('mobile-visible');
        toggle.classList.toggle('is-open', isOpen);
        toggle.setAttribute('aria-expanded', isOpen);
        // Override desktop hidden state when opening on mobile
        if (isOpen) {
            toc.classList.remove('hidden');
            var layout = document.querySelector('.layout');
            if (layout) {
                layout.classList.remove('toc-hidden');
                if (layout._fullwidthRecalc) layout._fullwidthRecalc();
            }
            var floatBtn = document.querySelector('.toc-float-toggle');
            if (floatBtn) floatBtn.classList.remove('visible');
        }
    });
}

/* ----------------------------- Code Copy Buttons ---------------------------- */
function initCodeCopyButtons() {
    document.querySelectorAll('.highlight').forEach(function (block) {
        var wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';
        block.parentNode.insertBefore(wrapper, block);
        wrapper.appendChild(block);

        var button = document.createElement('button');
        button.className = 'copy-button';
        button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>Copy';
        wrapper.appendChild(button);

        button.addEventListener('click', function () {
            var code = block.querySelector('code') || block.querySelector('pre');
            var text = code ? code.textContent : block.textContent;
            navigator.clipboard.writeText(text).then(function () {
                button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>Copied!';
                setTimeout(function () {
                    button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>Copy';
                }, 2000);
            }).catch(function () {
                button.textContent = 'Failed';
                setTimeout(function () { button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>Copy'; }, 2000);
            });
        });
    });
}
