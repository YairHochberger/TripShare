import L from "leaflet";

// Clean, modern basemap - closer to the look of Google Maps than the
// default OpenStreetMap tiles. Free and keyless.
export const TILE_URL =
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

// Forest start, terracotta finish - the redesign's own palette rather
// than the usual green/red pins.
function pinColor(index, total, active) {
  if (active) return "#16211C";
  if (index === 0) return "#2F5646";
  if (index === total - 1) return "#B44A26";
  return "#4A574F";
}

// Inline styles rather than Tailwind classes: this HTML is injected by
// Leaflet, outside the components Tailwind scans.
export function numberedIcon(n, { active = false, index = 0, total = 1 } = {}) {
  const color = pinColor(index, total, active);
  const size = active ? 30 : 22;

  // Small dots with a paper-coloured ring, matching the design.
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:999px;
      background:${color};border:3px solid #FDFBF7;
      box-shadow:0 1px 4px rgba(0,0,0,.3);
      color:#FDFBF7;font-size:${active ? 13 : 11}px;font-weight:600;
      display:flex;align-items:center;justify-content:center;line-height:1;
    ">${n}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function formatDuration(totalMinutes) {
  const mins = Math.round(totalMinutes);
  if (mins < 60) return `${mins} min`;

  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
}

export function hasPoint(step) {
  return typeof step?.lat === "number" && typeof step?.lng === "number";
}

// Great-circle distance in km, used as the fallback when routing is unavailable.
export function haversineKm(a, b) {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * R * Math.asin(Math.sqrt(h));
}

export function straightLineTotalKm(points) {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineKm(points[i - 1], points[i]);
  }
  return total;
}

// Free, keyless routing. Returns road distance + the shape of the real route.
export async function fetchRoute(points, signal) {
  const coords = points.map((p) => `${p.lng},${p.lat}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Routing service returned ${res.status}`);

  const data = await res.json();
  if (data.code !== "Ok" || !data.routes?.length) {
    throw new Error("No route found");
  }

  const route = data.routes[0];
  return {
    distanceKm: route.distance / 1000,
    durationMin: route.duration / 60,
    // GeoJSON is [lng, lat]; Leaflet wants [lat, lng].
    line: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
  };
}

export const DEFAULT_CENTER = [31.5, 34.9];
export const DEFAULT_ZOOM = 7;
