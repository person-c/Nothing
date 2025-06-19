document.addEventListener("DOMContentLoaded", function () {
    // --- 模块化初始化 ---
    initResponsiveFootnotes();
    initTableOfContents(); // Now generates a nested structure
    initTocInteractivity(); // New: handles collapse/expand
    initTOCScrollSpy();
});

// ... (initResponsiveFootnotes 和其辅助函数保持不变) ...
function initResponsiveFootnotes() {
    const footnoteRefs = document.querySelectorAll("a.footnote-ref");
    const originalFootnotesDiv = document.querySelector("div.footnotes");
    if (footnoteRefs.length === 0) return;
    let resizeTimer;
    function handleFootnotesLayout() {
        if (originalFootnotesDiv) originalFootnotesDiv.style.display = "none";
        cleanupDynamicFootnotes();
        if (window.innerWidth > 800) {
            renderSidenotes(footnoteRefs);
        } else {
            renderInlineFootnotes(footnoteRefs);
        }
    }
    handleFootnotesLayout();
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(handleFootnotesLayout, 250);
    });
}
function cleanupDynamicFootnotes() {
    const leftSidenotesContainer = document.querySelector("aside.footnotes");
    if (leftSidenotesContainer) leftSidenotesContainer.innerHTML = '';
    document.querySelectorAll('.inserted-footnotes-container').forEach(c => c.remove());
    document.querySelectorAll("a.footnote-ref").forEach(ref => ref.style.pointerEvents = 'auto');
}
function renderSidenotes(footnoteRefs) {
    const container = document.querySelector("aside.footnotes");
    if (!container) return;
    const dynamicList = document.createElement("ul");
    dynamicList.id = "dynamic-footnotes";
    container.appendChild(dynamicList);
    footnoteRefs.forEach(ref => {
        const footnoteId = ref.getAttribute("href").substring(1);
        const footnoteElement = document.getElementById(footnoteId);
        if (footnoteElement) {
            const listItem = document.createElement("li");
            const contentClone = footnoteElement.cloneNode(true);
            const backLink = contentClone.querySelector('.footnote-return');
            if (backLink) backLink.remove();
            listItem.innerHTML = contentClone.innerHTML.trim();
            const refRect = ref.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const offsetTop = refRect.top - containerRect.top + container.scrollTop;
            listItem.style.position = "absolute";
            listItem.style.top = `${offsetTop}px`;
            dynamicList.appendChild(listItem);
        }
    });
}
function renderInlineFootnotes(footnoteRefs) {
    footnoteRefs.forEach(ref => {
        const paragraph = ref.closest('p');
        if (!paragraph) return;
        let container = paragraph.nextElementSibling;
        if (!container || !container.matches('.inserted-footnotes-container')) {
            container = document.createElement('div');
            container.className = 'inserted-footnotes-container';
            container.innerHTML = '<ol></ol>';
            paragraph.after(container);
        }
        const list = container.querySelector('ol');
        const footnoteId = ref.getAttribute("href").substring(1);
        const footnoteElement = document.getElementById(footnoteId);
        if (footnoteElement && list) {
            const contentClone = footnoteElement.cloneNode(true);
            const backLink = contentClone.querySelector('.footnote-return');
            if (backLink) backLink.remove();
            const newLi = document.createElement('li');
            newLi.innerHTML = contentClone.innerHTML.trim();
            list.appendChild(newLi);
            ref.style.pointerEvents = 'none';
        }
    });
}


/**
 * 模块二：生成目录 (TOC) - 已重构
 * - 支持 H2, H3, H4 嵌套
 * - 为可折叠项添加必要的元素和类
 */
function initTableOfContents() {
    const tocContainer = document.getElementById("toc");
    const contentArticle = document.querySelector("article");
    if (!tocContainer || !contentArticle) return;

    // 支持h2, h3, h4，你可以按需增减
    const headings = contentArticle.querySelectorAll("h2, h3, h4");
    if (headings.length === 0) {
        tocContainer.innerHTML = "<em>暂无目录</em>";
        return;
    }

    const tocList = document.createElement("ul");
    // 使用指针来跟踪每一级的最后一个列表项，以便正确嵌套
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
            pointers[2] = listItem; // 记录最后一个H2项
            pointers[3] = null; // 重置下一级指针
        } else if (level === 3 && pointers[2]) {
            // 如果这是一个H3，并且我们知道它的父H2是哪个
            let sublist = pointers[2].querySelector("ul");
            if (!sublist) {
                sublist = document.createElement("ul");
                sublist.className = "toc-sublist";
                pointers[2].appendChild(sublist);
                // 给父级添加可折叠的标记
                pointers[2].classList.add('collapsible');
                pointers[2].insertBefore(createToggleButton(), pointers[2].firstChild);
            }
            sublist.appendChild(listItem);
            pointers[3] = listItem; // 记录最后一个H3项
        } else if (level === 4 && pointers[3]) {
            // 如果这是一个H4，并且我们知道它的父H3是哪个
            let sublist = pointers[3].querySelector("ul");
            if (!sublist) {
                sublist = document.createElement("ul");
                sublist.className = "toc-sublist";
                pointers[3].appendChild(sublist);
                // H3 级别通常不设为可折叠，但可以按需添加
            }
            sublist.appendChild(listItem);
        }
    });

    tocContainer.appendChild(tocList);
}

/**
 * 辅助函数：创建一个可折叠按钮
 */
function createToggleButton() {
    const button = document.createElement('button');
    button.className = 'toc-toggle';
    button.setAttribute('aria-expanded', 'false');
    button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-right"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
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