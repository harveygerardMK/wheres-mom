import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatCoords, prefersReducedMotion } from './utils.js';

const DROP_SVG = `
<svg width="28" height="36" viewBox="0 0 28 36" aria-hidden="true">
  <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0z" fill="#C4705A"/>
  <circle cx="14" cy="14" r="5" fill="#F4F0E8"/>
</svg>`;

export class JourneyMap {
  constructor(containerId) {
    this.containerId = containerId;
    this.map = null;
    this.layers = {
      paths: L.layerGroup(),
      markers: L.layerGroup(),
      today: L.layerGroup(),
    };
    this.pathRecords = new Map();
    this.activeDropId = null;
  }

  init() {
    this.map = L.map(this.containerId, {
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(this.map);

    Object.values(this.layers).forEach((layer) => layer.addTo(this.map));
    this.map.setView([43.2, 16.5], 7);
    return this;
  }

  createDropIcon(active = false) {
    return L.divIcon({
      className: `drop-pin${active ? ' drop-pin--active' : ''}`,
      html: DROP_SVG,
      iconSize: [28, 36],
      iconAnchor: [14, 36],
      popupAnchor: [0, -32],
    });
  }

  createTodayIcon() {
    return L.divIcon({
      className: 'today-marker',
      html: '<div class="today-marker__dot" aria-hidden="true"></div>',
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
  }

  addDrop(drop, pathFeature, { highlight = false } = {}) {
    const marker = L.marker([drop.lat, drop.lng], {
      icon: this.createDropIcon(highlight),
      title: `${drop.label}, ${drop.region}`,
    });

    marker.bindPopup(
      `<strong>${drop.label}</strong><br>${drop.region}<br><span style="font-family:monospace;font-size:0.8rem">${formatCoords(drop.lat, drop.lng)}</span>`
    );
    marker.addTo(this.layers.markers);

    const coords = pathFeature.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    const polyline = L.polyline(coords, {
      color: '#6EC4C4',
      weight: 3,
      opacity: 0.85,
      dashArray: prefersReducedMotion() ? null : '8 10',
      lineCap: 'round',
    });
    polyline.addTo(this.layers.paths);

    const end = coords[coords.length - 1];
    const todayMarker = L.marker(end, {
      icon: this.createTodayIcon(),
      title: 'Estimated position today',
    });
    todayMarker.bindPopup(
      `<strong>Approx. today</strong><br>${pathFeature.properties.estimatedRegion}`
    );
    todayMarker.addTo(this.layers.today);

    this.pathRecords.set(drop.id, { drop, pathFeature, marker, polyline, todayMarker, coords });

    if (highlight) {
      this.activeDropId = drop.id;
    }
  }

  renderDrops(drops, pathFeatures) {
    this.layers.paths.clearLayers();
    this.layers.markers.clearLayers();
    this.layers.today.clearLayers();
    this.pathRecords.clear();

    const latestId = drops[0]?.id;
    drops.forEach((drop, index) => {
      this.addDrop(drop, pathFeatures[index], { highlight: drop.id === latestId });
    });

    this.fitAll();
  }

  focusDrop(dropId) {
    const record = this.pathRecords.get(dropId);
    if (!record) return;

    this.activeDropId = dropId;
    this.pathRecords.forEach(({ marker, polyline, todayMarker }, id) => {
      const active = id === dropId;
      marker.setIcon(this.createDropIcon(active));
      polyline.setStyle({
        color: active ? '#6EC4C4' : '#9BB8C4',
        weight: active ? 4 : 2,
        opacity: active ? 0.95 : 0.45,
      });
      if (active) {
        todayMarker.addTo(this.layers.today);
      } else {
        this.layers.today.removeLayer(todayMarker);
      }
    });

    const bounds = L.latLngBounds(record.coords);
    this.map.flyToBounds(bounds, { padding: [48, 48], duration: prefersReducedMotion() ? 0 : 1.2 });
  }

  fitAll() {
    if (this.pathRecords.size === 0) return;
    const allCoords = [];
    this.pathRecords.forEach(({ coords }) => {
      allCoords.push(...coords);
    });
    this.map.fitBounds(L.latLngBounds(allCoords), { padding: [48, 48] });
  }

  getLatestPathSummary() {
    const firstKey = this.pathRecords.keys().next().value;
    if (!firstKey) return null;
    return this.pathRecords.get(firstKey).pathFeature.properties;
  }
}
