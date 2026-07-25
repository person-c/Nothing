(() => {
    const input = document.getElementById('search-input');
    const results = document.getElementById('search-results');
    const status = document.getElementById('search-status');
    if (!input || !results) return;

    let pages = [];
    let loaded = false;

    input.addEventListener('input', function () {
        const query = this.value.trim();
        if (!loaded) {
            status.textContent = 'Loading index...';
            fetch('/index.json')
                .then(r => r.json())
                .then(data => {
                    pages = data;
                    loaded = true;
                    doSearch(query);
                })
                .catch(() => {
                    status.textContent = 'Failed to load search index.';
                });
            return;
        }
        doSearch(query);
    });

    function doSearch(query) {
        if (!query) {
            results.innerHTML = '';
            status.textContent = '';
            return;
        }
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
            status.textContent = 'No results found.';
            return;
        }

        status.textContent = `${hits.length} result${hits.length !== 1 ? 's' : ''}`;
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
