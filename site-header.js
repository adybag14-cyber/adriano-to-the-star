(() => {
    const header = document.querySelector('[data-shared-site-header]');
    if (!header) return;
    const current = location.pathname === '/' ? '/index.html' : location.pathname;
    header.querySelectorAll('.desktop-nav a').forEach((link) => {
        const target = new URL(link.href, location.href);
        if (!target.hash && target.pathname === current) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
    });
    let frame = 0;
    const update = () => {
        header.classList.toggle('is-scrolled', scrollY > 24);
        frame = 0;
    };
    addEventListener(
        'scroll',
        () => {
            if (!frame) frame = requestAnimationFrame(update);
        },
        { passive: true }
    );
    update();
    header.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') header.querySelector('.mobile-menu')?.removeAttribute('open');
    });
})();
