import '../css/charted-waters.css';
import { renderPositionSummary } from './drift.js';
import { initBottomSheet, initLayout } from './layout.js';
import { JourneyMap } from './map.js';
import { renderTimeline, setActiveTimelineCard } from './timeline.js';
import { initTodayBanner, setActiveTodayChip, clearActiveTodayChips } from './today-banner.js';
import { loadDrops, loadPath } from './utils.js';

async function main() {
  const positionEl = document.querySelector('[data-position-summary]');

  try {
    const data = await loadDrops();
    initLayout({ currentPage: 'home', site: data.site, person: data.person });

    const pathFeatures = await Promise.all(data.drops.map((drop) => loadPath(drop)));
    const pathByDropId = new Map(
      data.drops.map((drop, index) => [drop.id, pathFeatures[index]])
    );

    const latest = data.drops[0];
    const latestPath = pathByDropId.get(latest.id)?.properties;

    if (positionEl) {
      positionEl.innerHTML = renderPositionSummary(latestPath, latest);
    }

    const map = new JourneyMap('map');
    map.init();
    map.renderDrops(data.drops, pathFeatures);

    const selectDrop = (dropId) => {
      map.focusDrop(dropId);
      setActiveTimelineCard(dropId);
      const drop = data.drops.find((item) => item.id === dropId);
      const pathProps = pathByDropId.get(dropId)?.properties;
      if (positionEl && drop) {
        positionEl.innerHTML = renderPositionSummary(pathProps, drop);
      }
      setActiveTodayChip(dropId);
    };

    initTodayBanner(data.drops, pathByDropId, {
      onSelectDrop: selectDrop,
      onShowAll: () => {
        clearActiveTodayChips();
        map.fitAllToday();
      },
    });

    selectDrop(latest.id);

    renderTimeline(data.drops, pathByDropId, latest.id, selectDrop);

    initBottomSheet();

    if (window.location.hash.startsWith('#drop=')) {
      const id = window.location.hash.replace('#drop=', '');
      if (pathByDropId.has(id)) {
        selectDrop(id);
      }
    }
  } catch (error) {
    console.error(error);
    if (positionEl) {
      positionEl.innerHTML =
        '<p>We could not load the journey map. Please refresh, or check back soon.</p>';
    }
  }
}

main();
