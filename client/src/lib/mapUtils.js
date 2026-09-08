import L from "leaflet";

// Clean, modern basemap - closer to the look of Google Maps than the
// default OpenStreetMap tiles. Free and keyless.
export const TILE_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

// Green start, red finish, blue in between - the convention people
// already recognise from mapping apps.
function pinColor(index, total, active) {
  if (active) return "#f59e0b";
  if (index === 0) return "#16a34a";
  if (index === total - 1) return "#dc2626";
  return "#2563eb";
}

// Inline styles rather than Tailwind classes: this HTML is injected by
// Leaflet, outside the components Tailwind scans.
export function numberedIcon(n, { active = false, index = 0, total = 1 } = {}) {
  const color = pinColor(index, total, active);
  const w = active ? 38 : 30;
  const h = active ? 50 : 40;

  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:${w}px;height:${h}px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35));">
      <svg viewBox="0 0 24 32" width="${w}" height="${h}">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20c0-6.6-5.4-12-12-12z"
              fill="${color}" stroke="#ffffff" stroke-width="2"/>
      </svg>
      <span style="position:absolute;top:${active ? 7 : 5}px;left:0;width:100%;text-align:center;
                   color:#fff;font-weight:700;font-size:${active ? 15 : 12}px;line-height:1;">${n}</span>
    </div>`,
    iconSize: [w, h],
    iconAnchor: [w / 2, h],
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
