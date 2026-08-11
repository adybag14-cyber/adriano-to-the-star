document.addEventListener('DOMContentLoaded', () => {
     const filtersForm = document.getElementById('catalog-filters');
     if (!filtersForm) return;

     const searchInput = document.getElementById('project-search');
     const phaseSelect = document.getElementById('phase-filter');
     const techSelect = document.getElementById('tech-filter');
     const sortSelect = document.getElementById('sort-filter');
     const favoritesOnly = document.getElementById('favorites-only');
     const resetBtn = document.getElementById('reset-filters');
     const resultsCount = document.getElementById('results-count');
     const noResults = document.getElementById('no-results');

     if (!searchInput || !phaseSelect || !techSelect || !sortSelect || !favoritesOnly || !resetBtn || !resultsCount || !noResults) {
         return;
     }

     const STORAGE_KEY = 'projectsCatalog:favorites';

     const safeReadJson = (key, fallback) => {
         try {
             const raw = localStorage.getItem(key);
             if (!raw) return fallback;
             return JSON.parse(raw);
         } catch {
             return fallback;
         }
     };

     const safeWriteJson = (key, value) => {
         try {
             localStorage.setItem(key, JSON.stringify(value));
         } catch {
             return;
         }
     };

     const slugify = (value) => {
         return String(value)
             .toLowerCase()
             .trim()
             .replace(/["']/g, '')
             .replace(/[^a-z0-9]+/g, '-')
             .replace(/^-+|-+$/g, '')
             .slice(0, 80);
     };

     const normalize = (value) => String(value ?? '').toLowerCase().trim();

     const favorites = new Set(safeReadJson(STORAGE_KEY, []));

     const navLinks = Array.from(document.querySelectorAll('.phase-nav a[data-section]'));
     navLinks.forEach((link) => {
         link.addEventListener('click', (event) => {
             if (link.getAttribute('aria-disabled') === 'true') {
                 event.preventDefault();
             }
         });
     });

     const phaseSections = Array.from(document.querySelectorAll('.phase-section'));
     const cards = Array.from(document.querySelectorAll('.phase-section .project-card'));
     const totalCards = cards.length;

     const setFavoriteButtonState = (btn, isFavorite) => {
         btn.classList.toggle('is-favorite', isFavorite);
         btn.setAttribute('aria-pressed', isFavorite ? 'true' : 'false');
         btn.setAttribute('aria-label', isFavorite ? 'Remove from favorites' : 'Add to favorites');
         btn.title = isFavorite ? 'Remove from favorites' : 'Add to favorites';
     };

     const applySort = () => {
         const sortMode = String(sortSelect.value ?? 'default');

         phaseSections.forEach((section) => {
             const grid = section.querySelector('.projects-grid');
             if (!grid) return;

             const gridCards = Array.from(grid.querySelectorAll('.project-card'));
             const sorted = gridCards.slice();

             if (sortMode === 'title-asc') {
                 sorted.sort((a, b) => String(a.dataset.titleLower ?? '').localeCompare(String(b.dataset.titleLower ?? '')));
             } else if (sortMode === 'title-desc') {
                 sorted.sort((a, b) => String(b.dataset.titleLower ?? '').localeCompare(String(a.dataset.titleLower ?? '')));
             } else {
                 sorted.sort((a, b) => Number(a.dataset.originalIndex) - Number(b.dataset.originalIndex));
             }

             sorted.forEach((card) => grid.appendChild(card));
         });
     };

     const updateCounts = (visibleCount) => {
         resultsCount.textContent = `Showing ${visibleCount} of ${totalCards} projects`;
         noResults.hidden = visibleCount !== 0;
     };

     const updateUrl = () => {
         const url = new URL(window.location.href);

         const q = String(searchInput.value ?? '').trim();
         const phase = String(phaseSelect.value ?? '').trim();
         const tech = String(techSelect.value ?? '').trim();
         const sort = String(sortSelect.value ?? '').trim();
         const fav = favoritesOnly.checked;

         if (q) url.searchParams.set('q', q);
         else url.searchParams.delete('q');

         if (phase) url.searchParams.set('phase', phase);
         else url.searchParams.delete('phase');

         if (tech) url.searchParams.set('tech', tech);
         else url.searchParams.delete('tech');

         if (sort && sort !== 'default') url.searchParams.set('sort', sort);
         else url.searchParams.delete('sort');

         if (fav) url.searchParams.set('fav', '1');
         else url.searchParams.delete('fav');

         history.replaceState({}, '', url.toString());
     };

     const setNavLinkEnabled = (sectionId, enabled) => {
         const link = navLinks.find((candidate) => candidate.dataset.section === sectionId);
         if (!link) return;

         link.classList.toggle('is-disabled', !enabled);
         link.setAttribute('aria-disabled', enabled ? 'false' : 'true');

         if (enabled) {
             link.removeAttribute('tabindex');
         } else {
             link.setAttribute('tabindex', '-1');
         }
     };

     const applyFilters = () => {
         const q = normalize(searchInput.value);
         const phase = String(phaseSelect.value ?? '').trim();
         const tech = String(techSelect.value ?? '').trim();
         const favOnly = favoritesOnly.checked;

         let visibleCount = 0;

         cards.forEach((card) => {
             const matchesQuery = !q || String(card.dataset.searchText ?? '').includes(q);
             const matchesPhase = !phase || card.dataset.phaseId === phase;
             const matchesTech = !tech || card.dataset.techTag === tech;
             const matchesFav = !favOnly || favorites.has(String(card.dataset.projectId ?? ''));

             const visible = matchesQuery && matchesPhase && matchesTech && matchesFav;
             card.hidden = !visible;

             if (visible) visibleCount += 1;
         });

         phaseSections.forEach((section) => {
             const anyVisible = section.querySelector('.project-card:not([hidden])') != null;
             section.hidden = !anyVisible;
             setNavLinkEnabled(section.id, anyVisible);
         });

         applySort();
         updateCounts(visibleCount);
         updateUrl();
     };

     cards.forEach((card, index) => {
         const title = card.querySelector('.card-title')?.textContent?.trim() ?? '';
         const techTag = card.querySelector('.card-tech-tag')?.textContent?.trim() ?? '';
         const description = card.querySelector('.card-description')?.textContent?.trim() ?? '';
         const phaseId = card.closest('.phase-section')?.id ?? '';

         const projectId = slugify(`${phaseId}-${title}-${index}`);
         card.dataset.projectId = projectId;
         card.dataset.phaseId = phaseId;
         card.dataset.techTag = techTag;
         card.dataset.titleLower = normalize(title);
         card.dataset.searchText = normalize(`${title} ${techTag} ${description}`);
         card.dataset.originalIndex = String(index);

         const favBtn = document.createElement('button');
         favBtn.type = 'button';
         favBtn.className = 'favorite-btn';
         favBtn.dataset.projectId = projectId;
         favBtn.innerHTML = '<span aria-hidden="true">★</span>';

         setFavoriteButtonState(favBtn, favorites.has(projectId));

         favBtn.addEventListener('click', (event) => {
             event.preventDefault();
             event.stopPropagation();

             const id = favBtn.dataset.projectId;
             if (!id) return;

             if (favorites.has(id)) {
                 favorites.delete(id);
             } else {
                 favorites.add(id);
             }

             safeWriteJson(STORAGE_KEY, Array.from(favorites));
             setFavoriteButtonState(favBtn, favorites.has(id));

             if (favoritesOnly.checked) {
                 applyFilters();
             }
         });

         const launchLink = card.querySelector('.launch-btn');
         if (launchLink) {
             card.insertBefore(favBtn, launchLink);
         } else {
             card.appendChild(favBtn);
         }
     });

     const populateTechOptions = () => {
         const techValues = Array.from(
             new Set(
                 cards
                     .map((card) => String(card.dataset.techTag ?? '').trim())
                     .filter(Boolean)
             )
         ).sort((a, b) => a.localeCompare(b));

         techValues.forEach((value) => {
             const opt = document.createElement('option');
             opt.value = value;
             opt.textContent = value;
             techSelect.appendChild(opt);
         });
     };

     populateTechOptions();

     const setControlsFromUrl = () => {
         const params = new URLSearchParams(window.location.search);

         const q = params.get('q');
         if (q != null) searchInput.value = q;

         const phase = params.get('phase');
         if (phase && Array.from(phaseSelect.options).some((opt) => opt.value === phase)) {
             phaseSelect.value = phase;
         }

         const tech = params.get('tech');
         if (tech && Array.from(techSelect.options).some((opt) => opt.value === tech)) {
             techSelect.value = tech;
         }

         const sort = params.get('sort');
         if (sort && Array.from(sortSelect.options).some((opt) => opt.value === sort)) {
             sortSelect.value = sort;
         }

         const fav = params.get('fav');
         favoritesOnly.checked = fav === '1' || fav === 'true' || fav === 'yes';
     };

     const debounce = (fn, waitMs) => {
         let timeoutId = null;
         return () => {
             if (timeoutId != null) {
                 window.clearTimeout(timeoutId);
             }
             timeoutId = window.setTimeout(() => {
                 timeoutId = null;
                 fn();
             }, waitMs);
         };
     };

     filtersForm.addEventListener('submit', (event) => {
         event.preventDefault();
     });

     searchInput.addEventListener('input', debounce(applyFilters, 150));
     phaseSelect.addEventListener('change', applyFilters);
     techSelect.addEventListener('change', applyFilters);
     favoritesOnly.addEventListener('change', applyFilters);
     sortSelect.addEventListener('change', applyFilters);

     resetBtn.addEventListener('click', () => {
         searchInput.value = '';
         phaseSelect.value = '';
         techSelect.value = '';
         sortSelect.value = 'default';
         favoritesOnly.checked = false;
         applyFilters();
     });

     setControlsFromUrl();
     applyFilters();
 });
