(() => {
    const input = document.getElementById('search-input');
    const results = document.getElementById('search-results');
    const status = document.getElementById('search-status');
    if (!input || !results) return;

    const indexUrl = window.__SEARCH_INDEX_URL || '/index.json';
    const i18n = window.__I18N || {};
    const msg = (key, fallback) => i18n[key] || fallback;
    let pages = null;
    let loadingPromise = null;

    // Fetch the index at most once, no matter how many keystrokes happen while
    // it is still loading. Reuse the cached array afterwards.
    function loadIndex() {
        if (pages) return Promise.resolve(pages);
        if (loadingPromise) return loadingPromise;
        loadingPromise = fetch(indexUrl, { cache: 'force-cache' })
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then(data => {
                pages = Array.isArray(data) ? data : [];
                return pages;
            })
            .catch(err => {
                pages = null;
                throw err;
            })
            .finally(() => {
                loadingPromise = null;
            });
        return loadingPromise;
    }

    function runSearch() {
        const query = input.value.trim();
        if (!query) {
            results.innerHTML = '';
            status.textContent = '';
            return;
        }
        if (!pages) {
            status.textContent = msg('loadingIndex', 'Loading index...');
            // Re-run against the *current* input value once the index arrives.
            loadIndex().then(runSearch).catch(() => {
                status.textContent = msg('loadIndexFailed', 'Failed to load search index.');
            });
            return;
        }
        doSearch(query);
    }

    input.addEventListener('input', runSearch);

    function doSearch(query) {
        const q = query.toLowerCase();
        const hits = [];
        for (const p of pages) {
            let score = 0;
            const titleLower = p.title.toLowerCase();
            const summaryLower = p.summary.toLowerCase();
            if (titleLower === q) score += 100;
            else if (titleLower.startsWith(q)) score += 50;
            else if (titleLower.includes(q)) score += 30;
            if (summaryLower.includes(q)) score += 10;
            if (score > 0) hits.push({ page: p, score });
        }
        hits.sort((a, b) => b.score - a.score);

        if (hits.length === 0) {
            results.innerHTML = '';
            status.textContent = msg('noResults', 'No results found.');
            return;
        }

        if (hits.length === 1) {
            status.textContent = i18n.resultOne || '1 result';
        } else {
            const template = i18n.resultOther || '0 results';
            status.textContent = template.replace(/\d+/, String(hits.length));
        }
        let html = '<ul class="search-result-list">';
        for (const h of hits) {
            html += `<li class="search-result-item">
                <a href="${h.page.url}" class="search-result-link">${escapeHTML(h.page.title)}</a>
                <span class="search-result-meta">${escapeHTML(h.page.date)} / ${escapeHTML(h.page.section)}</span>
                <p class="search-result-summary">${escapeHTML(h.page.summary)}</p>
            </li>`;
        }
        html += '</ul>';
        results.innerHTML = html;
    }

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }
})();
