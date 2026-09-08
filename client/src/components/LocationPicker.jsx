import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  numberedIcon,
  hasPoint,
  TILE_URL,
  TILE_ATTRIBUTION,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
} from "../lib/mapUtils";

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      if (onPick) onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPicker({ steps, activeIndex, onPick, height = 300 }) {
  const points = steps
    .map((step, index) => ({ ...step, index }))
    .filter(hasPoint);

  const isPicking = activeIndex !== null && activeIndex !== undefined;

  return (
    <div className="flex flex-col gap-2.5">
      <div
        className={`rounded-[14px] overflow-hidden border transition-colors ${
          isPicking ? "border-ink" : "border-line"
        }`}
        style={{ height }}
      >
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={false}
        >
          <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} detectRetina />

          {points.map((p, i) => (
            <Marker
              key={p.index}
              position={[p.lat, p.lng]}
              icon={numberedIcon(p.index + 1, {
                active: p.index === activeIndex,
                index: i,
                total: points.length,
              })}
            />
          ))}

          {isPicking && <ClickHandler onPick={onPick} />}
        </MapContainer>
      </div>

      <p className={`text-xs m-0 ${isPicking ? "text-clay" : "text-faint"}`}>
        {isPicking
          ? `Click the map to place stop ${activeIndex + 1}.`
          : "Press “Set on map” on a travel step, then click the map to place it."}
      </p>
    </div>
  );
}
