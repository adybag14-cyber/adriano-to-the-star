describe('shared runtime preserves modal control and native visibility semantics', () => {
    beforeEach(() => {
        jest.resetModules();
        delete window.__itaSiteRuntimeLoaded;
        document.body.innerHTML = `
            <main id="main-content"></main>
            <button id="close-game-modal">Close game</button>
            <a id="help-modal" href="#help">Help</a>
            <input id="search-modal" aria-label="Search">
            <div id="closed-modal" class="modal" style="display:none">Closed</div>
            <section id="shown-modal" style="display:flex" aria-hidden="false">Already open</section>
            <dialog id="native-modal">Native dialog</dialog>`;
        require('../site-runtime.js');
        document.dispatchEvent(new Event('DOMContentLoaded'));
    });

    test('never hides controls whose identifiers end in modal', () => {
        for (const id of ['close-game-modal', 'help-modal', 'search-modal']) {
            const control = document.getElementById(id);
            expect(control.hidden).toBe(false);
            expect(control.getAttribute('aria-hidden')).not.toBe('true');
        }
    });

    test('preserves already-open and native dialogs while initializing closed legacy containers', () => {
        expect(document.getElementById('shown-modal').hidden).toBe(false);
        expect(document.getElementById('native-modal').hidden).toBe(false);
        expect(document.getElementById('closed-modal').hidden).toBe(true);
        expect(document.getElementById('closed-modal').getAttribute('aria-hidden')).toBe('true');
    });
});
