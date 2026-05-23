import { renderDropCard } from './drift.js';

export function renderTimeline(drops, pathByDropId, activeDropId, onSelect) {
  const container = document.querySelector('[data-timeline]');
  if (!container) return;

  container.innerHTML = drops
    .map((drop) =>
      renderDropCard(drop, {
        active: drop.id === activeDropId,
        pathProps: pathByDropId.get(drop.id)?.properties,
      })
    )
    .join('');

  container.querySelectorAll('[data-drop-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.getAttribute('data-drop-id');
      onSelect(id);
    });
  });
}

export function setActiveTimelineCard(dropId) {
  document.querySelectorAll('[data-drop-id]').forEach((button) => {
    button.setAttribute('aria-current', button.getAttribute('data-drop-id') === dropId);
  });
}
