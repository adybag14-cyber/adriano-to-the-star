
(function () {
    console.log('🔍 Education Page Debugger Started');

    window.addEventListener('load', () => {
        console.log('✅ Window Loaded');
        const widget = document.getElementById('educational-games-widget');
        console.log('Widget element:', widget ? 'FOUND' : 'MISSING');

        if (window.educationalGames) {
            console.log('✅ EducationalGames instance active');
            console.log('Games loaded:', window.educationalGames.games.length);
        } else {
            console.error('❌ EducationalGames instance NOT FOUND');
        }

        const main = document.querySelector('main');
        console.log('Main content visibility:', getComputedStyle(main).display, getComputedStyle(main).opacity);
    });

    window.onerror = function (msg, url, line) {
        const errorMsg = `❌ Error: ${msg} at ${line}`;
        console.error(errorMsg);

        const debugBox = document.createElement('div');
        debugBox.style.cssText = 'position:fixed;bottom:0;left:0;width:100%;background:red;color:white;padding:10px;z-index:99999;font-family:monospace;';
        debugBox.textContent = errorMsg;
        document.body.appendChild(debugBox);
    };
})();
