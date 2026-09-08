import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  ZoomControl,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  numberedIcon,
  hasPoint,
  fetchRoute,
  straightLineTotalKm,
  formatDuration,
  TILE_URL,
  TILE_ATTRIBUTION,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
} from "../lib/mapUtils";

// Keeps the viewport on the pinned stops, and zooms to one when selected.
function MapView({ points, activeIndex }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;

    const active = points.find((p) => p.index === activeIndex);
    if (active) {
      map.setView([active.lat, active.lng], 12, { animate: true });
      return;
    }

    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 11, { animate: true });
    } else {
      map.fitBounds(
        points.map((p) => [p.lat, p.lng]),
        { padding: [45, 45] }
      );
    }
  }, [points, activeIndex, map]);

  return null;
}

export default function TripMap({ steps, activeIndex, onMarkerClick, height = 460 }) {
  const [route, setRoute] = useState(null);
  const [routeError, setRouteError] = useState("");
  const [loading, setLoading] = useState(false);

  // Keep the original step numbers so markers match the list, even
  // when only some steps have been pinned.
  const points = steps
    .map((step, index) => ({ ...step, index }))
    .filter(hasPoint);

  const key = points.map((p) => `${p.lat},${p.lng}`).join("|");

  useEffect(() => {
    if (points.length < 2) {
      setRoute(null);
      setRouteError("");
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setRouteError("");

    fetchRoute(points, controller.signal)
      .then((r) => setRoute(r))
      .catch((err) => {
        if (err.name === "AbortError") return;
        // Routing is a public free service - degrade instead of breaking.
        setRoute(null);
        setRouteError("Couldn't reach the routing service - showing straight-line distance.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [key]);

  if (points.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-white border rounded-2xl text-sm text-gray-400 text-center p-6 shadow-sm"
        style={{ height }}
      >
        No travel stops have been pinned on the map for this trip.
      </div>
    );
  }

  const straightLineKm = straightLineTotalKm(points);

  return (
    <div className="space-y-3">
      <div
        className="rounded-2xl overflow-hidden shadow-sm ring-1 ring-black/10"
        style={{ height }}
      >
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={false}
          zoomControl={false}
        >
          <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} detectRetina />
          <ZoomControl position="bottomright" />

          {route && (
            <>
              {/* Casing under the route, the way navigation apps draw it */}
              <Polyline
                positions={route.line}
                color="#1e40af"
                weight={9}
                opacity={0.9}
                lineCap="round"
                lineJoin="round"
              />
              <Polyline
                positions={route.line}
                color="#4285f4"
                weight={5}
                lineCap="round"
                lineJoin="round"
              />
            </>
          )}

          {points.map((p, i) => (
            <Marker
              key={p.index}
              position={[p.lat, p.lng]}
              icon={numberedIcon(p.index + 1, {
                active: p.index === activeIndex,
                index: i,
                total: points.length,
              })}
              eventHandlers={
                onMarkerClick ? { click: () => onMarkerClick(p.index) } : undefined
              }
            />
          ))}

          <MapView points={points} activeIndex={activeIndex} />
        </MapContainer>
      </div>

      {/* Trip distance, styled like a directions summary card */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-4">
        {points.length < 2 ? (
          <p className="text-sm text-gray-400">Pin at least two stops to get a distance.</p>
        ) : loading ? (
          <p className="text-sm text-gray-400">Calculating route…</p>
        ) : route ? (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-blue-600">
                {route.distanceKm.toFixed(1)} km
              </span>
              <span className="text-sm text-gray-500">by road</span>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              🚗 about {formatDuration(route.durationMin)} driving
            </div>
          </>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-blue-600">
                {straightLineKm.toFixed(1)} km
              </span>
              <span className="text-sm text-gray-500">in a straight line</span>
            </div>
          </>
        )}

        {routeError && <p className="text-xs text-orange-600 mt-2">{routeError}</p>}
      </div>
    </div>
  );
}
