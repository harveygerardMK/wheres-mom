import '../css/charted-waters.css';
import { renderDropDetail } from './drift.js';
import { initLayout } from './layout.js';
import { JourneyMap } from './map.js';
import { renderTimeline, setActiveTimelineCard } from './timeline.js';
import { initTodayBanner, setActiveTodayChip, clearActiveTodayChips } from './today-banner.js';
import { getDropFromHash, loadDrops, loadPath } from './utils.js';

async function main() {
  const detailEl = document.querySelector('[data-drop-detail]');

  try {
    const data = await loadDrops();
    initLayout({ currentPage: 'journey', site: data.site, person: data.person });

    const pathFeatures = await Promise.all(data.drops.map((drop) => loadPath(drop)));
    const pathByDropId = new Map(
      data.drops.map((drop, index) => [drop.id, pathFeatures[index]])
    );

    const map = new JourneyMap('map');
    map.init();
    map.renderDrops(data.drops, pathFeatures);

    let activeId = getDropFromHash(data.drops).id;

    const showDrop = (dropId) => {
      activeId = dropId;
      map.focusDrop(dropId);
      setActiveTimelineCard(dropId);
      setActiveTodayChip(dropId);
      const drop = data.drops.find((item) => item.id === dropId);
      const pathProps = pathByDropId.get(dropId)?.properties;
      if (detailEl && drop) {
        detailEl.innerHTML = renderDropDetail(drop, pathProps);
      }
      window.history.replaceState(null, '', `#drop=${dropId}`);
    };

    initTodayBanner(data.drops, pathByDropId, {
      onSelectDrop: showDrop,
      onShowAll: () => {
        clearActiveTodayChips();
        map.fitAllToday();
      },
    });

    renderTimeline(data.drops, pathByDropId, activeId, showDrop);
    showDrop(activeId);

    window.addEventListener('hashchange', () => {
      showDrop(getDropFromHash(data.drops).id);
    });
  } catch (error) {
    console.error(error);
    if (detailEl) {
      detailEl.innerHTML = '<p>We could not load the journey. Please refresh.</p>';
    }
  }
}

main();
