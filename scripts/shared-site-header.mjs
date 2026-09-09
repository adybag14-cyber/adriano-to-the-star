// Homepage is the sole source of shared navigation markup. Full-screen studies
// retain their own controls; broadband is explicitly outside this release scope.
export const HEADER_EXEMPTIONS = new Map([
    ['education.html', 'planetary-viewer'],
    ['exoplanet-pioneer.html', 'full-screen-game'],
    ['star-maps.html', 'full-screen-map'],
    ['tracker.html', 'full-screen-map'],
    ['mechgen.html', 'full-screen-studio'],
    ['brotli2-memory-profiler.html', 'standalone-tool'],
    ['starsector.html', 'redirect'],
    ['starsector-login.html', 'game-launcher'],
    ['offline.html', 'offline-fallback'],
    ['broadband-checker.html', 'explicitly-out-of-scope'],
    ['service-page/galaxy-object-trading.html', 'standalone-study'],
]);

export function extractHomeHeader(html) {
    const header = html.match(
        /<header\b[^>]*class=["'][^"']*\bsite-header\b[^"']*["'][^>]*>[\s\S]*?<\/header>/i
    )?.[0];
    if (!header || !header.includes('ita-language-slot') || !header.includes('home-menu-trigger')) {
        throw new Error('The canonical homepage navigation is incomplete.');
    }
    return header;
}

export function applySharedHeader(html, page, homeHeader) {
    if (HEADER_EXEMPTIONS.has(page.path) || page.path.startsWith('experimental/')) return html;
    const prefix = page.path.includes('/') ? '../' : '';
    let header = homeHeader.replace('<header ', '<header data-shared-site-header="home-v1" ');
    if (page.path !== 'index.html') {
        header = header.replace(
            /href="(?!https?:|mailto:|\/)([^"]+)"/g,
            (_, href) => `href="/${href}"`
        );
    }
    html = html.replace(
        /<header\b[^>]*class=["'][^"']*\b(?:site-header|ita-db-header|privacy-header)\b[^"']*["'][^>]*>[\s\S]*?<\/header>/gi,
        ''
    );
    html = html.replace(
        /<body\b([^>]*)>/i,
        (_, attributes) => `<body${attributes} data-site-header="home">`
    );
    const skipLink = /<a\b[^>]*class=["'][^"']*\bita-skip-link\b[^"']*["'][^>]*>[\s\S]*?<\/a>/i;
    html = skipLink.test(html)
        ? html.replace(skipLink, (match) => `${match}\n${header}`)
        : html.replace(/<body\b[^>]*>/i, (match) => `${match}\n${header}`);
    if (!/src=["'][^"']*\bnavigation\.js(?:[?"'])/i.test(html)) {
        html = html.replace(
            /<\/head>/i,
            `<script src="${prefix}navigation.js" defer></script>\n</head>`
        );
    }
    html = html.replace(
        /<\/head>/i,
        `<link rel="stylesheet" href="${prefix}site-header.css">\n<script src="${prefix}site-header.js" defer></script>\n</head>`
    );
    return html;
}
