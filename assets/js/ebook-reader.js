// foliate-js is a large third-party bundle served from a CDN. Load it
// dynamically so that a blocked CDN produces a visible error instead of a
// silently blank reader (a top-level static import would never run this file).
const FOLIATE_URL = 'https://cdn.jsdelivr.net/npm/@xincmm/foliate-js@0.1.3/dist/index.js';

const bookUrl = window.__BOOK_URL;
const bookSlug = window.__BOOK_SLUG;
const progressKey = `ebook-progress-${bookSlug}`;

let view;
let currentFontSize = 100;
let foliate = null;

function showReaderError(message, detail) {
    const viewer = document.getElementById('viewer');
    if (!viewer) return;
    viewer.textContent = '';
    const box = document.createElement('div');
    box.className = 'ebook-error';
    const p = document.createElement('p');
    p.textContent = message;
    box.appendChild(p);
    if (detail) {
        const pre = document.createElement('pre');
        pre.textContent = detail;
        box.appendChild(pre);
    }
    viewer.appendChild(box);
}

async function loadFoliate() {
    if (foliate) return foliate;
    foliate = await import(FOLIATE_URL);
    return foliate;
}

async function initReader() {
    const viewer = document.getElementById('viewer');
    if (!viewer) return;

    let lib;
    try {
        lib = await loadFoliate();
    } catch (err) {
        showReaderError(
            'Could not load the reader engine, so this book cannot be opened. Check your network connection and reload the page.',
            err && err.message ? err.message : String(err)
        );
        return;
    }

    try {
        const book = await lib.makeBook(bookUrl);
        document.querySelector('.book-title-label').textContent =
            book.metadata?.title || window.__BOOK_TITLE;

        view = new lib.View();
        view.setAttribute('autohide-cursor', '');
        viewer.appendChild(view);
        await view.open(book);

        view.addEventListener('relocate', onRelocate);
        view.addEventListener('load', onSectionLoad);
        buildTOC(book);

        const saved = loadProgress();
        await view.init({ lastLocation: saved, showTextStart: !saved });

        const savedFontSize = window.__storage.get('ebook-font-size');
        if (savedFontSize) {
            currentFontSize = parseInt(savedFontSize);
        }
        applyFontSizeToRenderer();

        updateProgress();
    } catch (err) {
        showReaderError('Failed to load book.', err && err.message ? err.message : String(err));
        console.error(err);
    }
}

function onRelocate(e) {
    const loc = e.detail;
    saveProgress(loc.cfi);
    updateProgress();
}

function onSectionLoad({ detail }) {
    if (detail?.doc) {
        detail.doc.documentElement.style.setProperty(
            '--font-size-multiplier', (currentFontSize / 100).toString());
        detail.doc.documentElement.style.fontSize =
            `${16 * currentFontSize / 100}px`;
    }
}

function buildTOC(book) {
    const tocList = document.getElementById('toc-list');
    if (!tocList || !book.toc?.length) return;

    function renderItems(items, container) {
        const ul = document.createElement('ul');
        for (const item of items) {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.textContent = item.label || item.title || '(untitled)';
            a.addEventListener('click', (e) => {
                e.preventDefault();
                if (item.href) {
                    view.goTo(item.href);
                } else if (typeof item.group === 'number') {
                    view.goTo(item.group);
                }
                closeTOC();
            });
            li.appendChild(a);
            if (item.subitems?.length) {
                renderItems(item.subitems, li);
            }
            ul.appendChild(li);
        }
        return ul;
    }

    const ul = renderItems(book.toc, tocList);
    tocList.appendChild(ul);
}

function saveProgress(cfi) {
    if (!cfi) return;
    window.__storage.set(progressKey, JSON.stringify({
        cfi,
        timestamp: Date.now()
    }));
}

function loadProgress() {
    try {
        const raw = window.__storage.get(progressKey);
        if (!raw) return null;
        const data = JSON.parse(raw);
        return data.cfi || null;
    } catch { return null; }
}

function applyFontSizeToRenderer() {
    // Apply to currently loaded sections
    if (view?.renderer?.getContents) {
        for (const { doc } of view.renderer.getContents()) {
            if (doc) {
                doc.documentElement.style.fontSize =
                    `${16 * currentFontSize / 100}px`;
            }
        }
    }
    window.__storage.set('ebook-font-size', currentFontSize);
}

function updateProgress() {
    if (!view?.lastLocation) return;
    const loc = view.lastLocation;
    const pct = loc.fraction != null
        ? Math.round(loc.fraction * 100)
        : (loc.tocItem?.fraction != null ? Math.round(loc.tocItem.fraction * 100) : 0);
    const fill = document.querySelector('.progress-fill');
    if (fill) fill.style.width = `${pct}%`;
}

function openTOC() {
    document.getElementById('toc-sidebar').classList.remove('hidden');
}

function closeTOC() {
    document.getElementById('toc-sidebar').classList.add('hidden');
}

function toggleTheme() {
    if (window.__cycleTheme) window.__cycleTheme();
    // The toolbar icons are rendered server-side and toggled by CSS.
}

// --- Event bindings ---
document.getElementById('btn-toc').addEventListener('click', openTOC);
document.getElementById('btn-toc-close').addEventListener('click', closeTOC);
document.getElementById('toc-sidebar').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeTOC();
});

document.getElementById('btn-prev').addEventListener('click', () => view?.goLeft());
document.getElementById('btn-next').addEventListener('click', () => view?.goRight());

document.getElementById('btn-font-minus').addEventListener('click', () => {
    currentFontSize = Math.max(60, currentFontSize - 10);
    applyFontSizeToRenderer();
});
document.getElementById('btn-font-plus').addEventListener('click', () => {
    currentFontSize = Math.min(200, currentFontSize + 10);
    applyFontSizeToRenderer();
});

document.getElementById('btn-theme').addEventListener('click', toggleTheme);

document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, [contenteditable]')) return;
    switch (e.key) {
        case 'ArrowLeft':  view?.goLeft();  e.preventDefault(); break;
        case 'ArrowRight': view?.goRight(); e.preventDefault(); break;
        case 'Escape': closeTOC(); break;
    }
});

// Click or tap on viewer edges for navigation (capture phase to fire before foliate)
document.getElementById('viewer').addEventListener('click', (e) => {
    if (e.target.closest('button, a, #toc-sidebar, .toc-sidebar')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width * 0.2) view?.goLeft();
    else if (x > rect.width * 0.8) view?.goRight();
}, true);

// Touch swipe for mobile
(() => {
    const viewer = document.getElementById('viewer');
    let touchStartX = 0;
    let touchStartY = 0;

    viewer.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    viewer.addEventListener('touchend', (e) => {
        if (e.target.closest('button, a, #toc-sidebar, .toc-sidebar')) return;
        const dx = (e.changedTouches[0]?.clientX || 0) - touchStartX;
        const dy = (e.changedTouches[0]?.clientY || 0) - touchStartY;
        // Only trigger if horizontal swipe dominates
        if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
        if (dx < 0) view?.goRight();
        else view?.goLeft();
    });
})();

initReader();
