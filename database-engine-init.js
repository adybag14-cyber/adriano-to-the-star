/* Keep shared scene URLs on the original database route. No graphics load until requested. */
(function () {
  const openSaved = async () => {
    const id = new URLSearchParams(location.search).get('engine');
    if (!id || !/^K\d{5}\.\d{2}$|^nea-[a-z0-9-]{1,100}$/.test(id)) return;
    try {
      const Viewer = await window.ensureDatabase3D();
      window.planet3DViewer = new Viewer();
      await window.planet3DViewer.showPlanet({ record_id: id });
    } catch (error) {
      const notice = document.createElement('p');
      notice.setAttribute('role', 'alert');
      notice.textContent = `The saved view could not open: ${error.message}`;
      document.getElementById('main-content')?.prepend(notice);
    }
  };
  // A pinned shared view can show evidence without waiting for the full search catalogue.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', openSaved, { once: true });
  else openSaved();
})();
