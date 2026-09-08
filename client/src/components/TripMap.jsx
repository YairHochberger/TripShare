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
        className="flex items-center justify-center bg-surface border border-line rounded-[18px] text-[15px] text-faint text-center p-6"
        style={{ height }}
      >
        No travel stops have been pinned on the map for this trip.
      </div>
    );
  }

  const straightLineKm = straightLineTotalKm(points);

  return (
    <div className="flex flex-col gap-4">
      <div
        className="rounded-[18px] overflow-hidden border border-line"
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
            <Polyline
              positions={route.line}
              color="#B44A26"
              weight={4}
              opacity={0.9}
              lineCap="round"
              lineJoin="round"
            />
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

      {/* Distance summary, in the design's own voice */}
      <div className="flex flex-wrap items-baseline gap-3.5 bg-surface border border-line rounded-2xl px-6 py-5">
        {points.length < 2 ? (
          <span className="text-[15px] text-faint">
            Pin at least two stops to get a distance.
          </span>
        ) : loading ? (
          <span className="text-[15px] text-faint">Calculating route…</span>
        ) : route ? (
          <>
            <span className="font-display text-[34px] leading-none">
              {route.distanceKm.toFixed(1)} km
            </span>
            <span className="text-sm text-muted">
              by road · about {formatDuration(route.durationMin)} driving
            </span>
          </>
        ) : (
          <>
            <span className="font-display text-[34px] leading-none">
              {straightLineKm.toFixed(1)} km
            </span>
            <span className="text-sm text-muted">in a straight line</span>
          </>
        )}
      </div>

      {routeError && <p className="text-xs text-clay m-0">{routeError}</p>}
    </div>
  );
}
