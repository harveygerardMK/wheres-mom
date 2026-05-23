import { formatDate } from './utils.js';

export function renderTodayBanner(drops, pathByDropId) {
  const items = drops
    .map((drop) => {
      const props = pathByDropId.get(drop.id)?.properties;
      if (!props) return '';
      return `
        <li>
          <button type="button" class="today-banner__chip" data-today-drop="${drop.id}">
            <span class="today-banner__chapter">${drop.label}</span>
            <span class="today-banner__region">${props.estimatedRegion}</span>
          </button>
        </li>
      `;
    })
    .join('');

  const asOf = drops.length ? pathByDropId.get(drops[0].id)?.properties?.endDate : null;
  const asOfLabel = asOf ? formatDate(asOf) : 'today';

  return `
    <div class="today-banner__inner">
      <div class="today-banner__heading">
        <h2 id="today-banner-title">Where's Mom today?</h2>
        <p class="today-banner__lede">
          Every release continues its own journey on the water. As of ${asOfLabel}, she may be in all of these places at once:
        </p>
      </div>
      <ul class="today-banner__list">${items}</ul>
      <button type="button" class="btn today-banner__all" data-show-all-today>
        Show all on map
      </button>
    </div>
  `;
}

export function setActiveTodayChip(dropId) {
  document.querySelectorAll('[data-today-drop]').forEach((el) => {
    el.classList.toggle('is-active', el.getAttribute('data-today-drop') === dropId);
  });
}

export function clearActiveTodayChips() {
  document.querySelectorAll('[data-today-drop]').forEach((el) => el.classList.remove('is-active'));
}

export function initTodayBanner(drops, pathByDropId, { onSelectDrop, onShowAll }) {
  const host = document.querySelector('[data-today-banner]');
  if (!host) return;

  host.innerHTML = renderTodayBanner(drops, pathByDropId);

  host.querySelectorAll('[data-today-drop]').forEach((button) => {
    button.addEventListener('click', () => {
      onSelectDrop(button.getAttribute('data-today-drop'));
    });
  });

  const showAll = host.querySelector('[data-show-all-today]');
  if (showAll) {
    showAll.addEventListener('click', onShowAll);
  }
}
