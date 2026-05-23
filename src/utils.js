const BASE = import.meta.env.BASE_URL;

export function assetUrl(path) {
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  return `${BASE}${normalized}`;
}

export async function loadDrops() {
  const response = await fetch(assetUrl('data/drops.json'));
  if (!response.ok) {
    throw new Error(`Failed to load drops.json (${response.status})`);
  }
  const data = await response.json();
  data.drops.sort((a, b) => new Date(b.date) - new Date(a.date));
  return data;
}

export async function loadPath(drop) {
  const response = await fetch(assetUrl(`data/${drop.pathFile}`));
  if (!response.ok) {
    throw new Error(`Failed to load path for ${drop.id}`);
  }
  return response.json();
}

export function formatDate(value) {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00`));
}

export function formatCoords(lat, lng) {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(2)}°${latDir} · ${Math.abs(lng).toFixed(2)}°${lngDir}`;
}

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function getDropFromHash(drops) {
  const id = window.location.hash.replace(/^#drop=/, '');
  if (!id) return drops[0];
  return drops.find((drop) => drop.id === id) ?? drops[0];
}
