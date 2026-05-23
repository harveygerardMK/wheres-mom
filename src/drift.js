import { formatDate, formatCoords, assetUrl } from './utils.js';

export function renderPositionSummary(pathProps, drop) {
  if (!pathProps || !drop) {
    return '<p>Loading journey details…</p>';
  }

  const asOf = formatDate(pathProps.endDate);
  return `
    <h2>Estimated position</h2>
    <p>
      As of <time datetime="${pathProps.endDate}">${asOf}</time>,
      ${pathProps.currentName} may have carried her toward
      <strong>${pathProps.estimatedRegion}</strong>.
    </p>
    <p class="mono">
      Last release: ${drop.label}, ${drop.region} · ${formatCoords(drop.lat, drop.lng)}
    </p>
  `;
}

export function renderDropCard(drop, { active = false, pathProps = null } = {}) {
  const driftHint = pathProps ? ` · est. ${pathProps.estimatedRegion}` : '';

  return `
    <button type="button" class="drop-card" data-drop-id="${drop.id}" aria-current="${active}">
      <h3>${drop.label}</h3>
      <p class="drop-meta">
        <time datetime="${drop.date}">${formatDate(drop.date)}</time> · ${drop.region}${driftHint}
      </p>
    </button>
  `;
}

export function renderDropDetail(drop, pathProps) {
  const photoBlock = drop.photo
    ? `<div class="drop-detail-photo"><img src="${assetUrl(drop.photo)}" alt="Memory from ${drop.label}" loading="lazy" /></div>`
    : '';

  return `
    <article class="drop-detail">
      <h2>${drop.label}</h2>
      <p class="drop-date"><time datetime="${drop.date}">${formatDate(drop.date)}</time> · ${drop.region}</p>
      ${photoBlock}
      ${
        pathProps
          ? `<p><strong>Since this release:</strong> Estimated toward ${pathProps.estimatedRegion}, following the ${pathProps.currentName} (~${pathProps.speedKmDay} km/day ${pathProps.direction}).</p>`
          : ''
      }
      <p class="mono">${formatCoords(drop.lat, drop.lng)}</p>
    </article>
  `;
}
