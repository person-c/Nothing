(function() {
    var input = document.getElementById('search-input');
    var results = document.getElementById('search-results');
    var status = document.getElementById('search-status');
    if (!input || !results) return;

    var pages = [];
    var loaded = false;

    input.addEventListener('input', function() {
        var query = this.value.trim();
        if (!loaded) {
            status.textContent = 'Loading index...';
            fetch('/index.json')
                .then(function(r) { return r.json(); })
                .then(function(data) {
                    pages = data;
                    loaded = true;
                    doSearch(query);
                })
                .catch(function() {
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
        var q = query.toLowerCase();
        var hits = [];
        for (var i = 0; i < pages.length; i++) {
            var p = pages[i];
            var score = 0;
            var titleLower = p.title.toLowerCase();
            var summaryLower = p.summary.toLowerCase();
            if (titleLower === q) score += 100;
            else if (titleLower.indexOf(q) === 0) score += 50;
            else if (titleLower.indexOf(q) !== -1) score += 30;
            if (summaryLower.indexOf(q) !== -1) score += 10;
            if (score > 0) hits.push({ page: p, score: score });
        }
        hits.sort(function(a, b) { return b.score - a.score; });

        if (hits.length === 0) {
            results.innerHTML = '';
            status.textContent = 'No results found.';
            return;
        }

        status.textContent = hits.length + ' result' + (hits.length !== 1 ? 's' : '');
        var html = '<ul class="search-result-list">';
        for (var j = 0; j < hits.length; j++) {
            var h = hits[j];
            html += '<li class="search-result-item">';
            html += '<a href="' + h.page.url + '" class="search-result-link">' + escapeHTML(h.page.title) + '</a>';
            html += '<span class="search-result-meta">' + escapeHTML(h.page.date) + ' / ' + escapeHTML(h.page.section) + '</span>';
            html += '<p class="search-result-summary">' + escapeHTML(h.page.summary) + '</p>';
            html += '</li>';
        }
        html += '</ul>';
        results.innerHTML = html;
    }

    function escapeHTML(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }
})();
