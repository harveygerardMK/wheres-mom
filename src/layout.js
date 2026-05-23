import { assetUrl } from './utils.js';

export function initLayout({ currentPage = 'home', site, person }) {
  const title = site?.title ?? "Where's Mom";
  const subtitle = site?.subtitle ?? 'Her journey on the water';

  document.title =
    currentPage === 'home' ? `${title} — ${subtitle}` : `${pageTitle(currentPage)} — ${title}`;

  const header = document.querySelector('[data-site-header]');
  if (header) {
    header.innerHTML = `
      <a class="site-brand" href="${assetUrl('index.html')}">
        <span class="site-title">${title}</span>
        <span class="site-subtitle">${subtitle}</span>
      </a>
      <nav class="site-nav" aria-label="Main">
        <a href="${assetUrl('index.html')}" ${currentPage === 'home' ? 'aria-current="page"' : ''}>Home</a>
        <a href="${assetUrl('journey.html')}" ${currentPage === 'journey' ? 'aria-current="page"' : ''}>Journey</a>
        <a href="${assetUrl('how-it-works.html')}" ${currentPage === 'how' ? 'aria-current="page"' : ''}>How it works</a>
      </nav>
    `;
  }

  const footer = document.querySelector('[data-site-footer]');
  if (footer) {
    footer.innerHTML = `
      <p>Private family memorial · Paths are estimates for remembrance, not exact locations.</p>
      <p>Last updated <time datetime="${site?.lastUpdated ?? ''}">${site?.lastUpdated ?? ''}</time></p>
      <p><a href="${assetUrl('how-it-works.html')}">How drift is estimated</a></p>
    `;
  }
}

function pageTitle(page) {
  const titles = {
    journey: 'Journey',
    how: 'How it works',
  };
  return titles[page] ?? 'Home';
}

export function initBottomSheet() {
  const sheet = document.querySelector('[data-bottom-sheet]');
  const handle = document.querySelector('[data-sheet-handle]');
  if (!sheet || !handle || window.matchMedia('(min-width: 1024px)').matches) return;

  let startY = 0;
  let startHeight = 0;

  const setPeek = () => {
    sheet.style.maxHeight = 'var(--sheet-peek)';
  };

  const setExpanded = () => {
    sheet.style.maxHeight = '45dvh';
  };

  handle.addEventListener('pointerdown', (event) => {
    startY = event.clientY;
    startHeight = sheet.getBoundingClientRect().height;
    handle.setPointerCapture(event.pointerId);
  });

  handle.addEventListener('pointermove', (event) => {
    if (!handle.hasPointerCapture(event.pointerId)) return;
    const delta = startY - event.clientY;
    const next = Math.min(window.innerHeight * 0.55, Math.max(120, startHeight + delta));
    sheet.style.maxHeight = `${next}px`;
  });

  handle.addEventListener('pointerup', (event) => {
    if (!handle.hasPointerCapture(event.pointerId)) return;
    handle.releasePointerCapture(event.pointerId);
    const height = sheet.getBoundingClientRect().height;
    if (height > window.innerHeight * 0.28) {
      setExpanded();
    } else {
      setPeek();
    }
  });

  setPeek();
}
