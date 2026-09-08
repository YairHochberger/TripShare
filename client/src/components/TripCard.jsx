import { Link } from "react-router-dom";
import PhotoPlaceholder from "./PhotoPlaceholder";

const TYPE_LABELS = {
  relaxed: "Relaxed",
  trek: "Trek",
  climbing: "Climbing",
  other: "Other",
};

function formatDate(d) {
  return d
    ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short" })
    : null;
}

// `wide` lays the card out as a full-width row - photo on the left,
// details filling the rest - for browsing other people's trips.
export default function TripCard({ trip, wide = false }) {
  const seats =
    trip.maxCapacity > 0 ? `${trip.members.length} of ${trip.maxCapacity} seats` : null;
  const when = formatDate(trip.startDate);
  const price =
    trip.costPerPerson > 0
      ? `₪${trip.costPerPerson}`
      : trip.estimatedCost > 0
        ? `~₪${trip.estimatedCost}`
        : null;

  const roleLabel =
    trip.role === "organizer"
      ? "You organize"
      : trip.role === "participant"
        ? "You're going"
        : trip.hasPendingRequest
          ? "Request pending"
          : null;

  const eyebrow = (
    <div className="text-[11px] tracking-[0.14em] uppercase text-clay mb-2.5">
      {TYPE_LABELS[trip.type] || "Other"}
      {roleLabel && ` · ${roleLabel}`}
    </div>
  );

  if (wide) {
    return (
      <Link
        to={`/trip/${trip._id}`}
        className="bg-surface border border-line rounded-[20px] overflow-hidden grid grid-cols-1 sm:grid-cols-[240px_minmax(0,1fr)] lg:grid-cols-[300px_minmax(0,1fr)] hover:border-line-bold transition-colors"
      >
        <PhotoPlaceholder className="h-[180px] sm:h-full sm:min-h-[190px]" />

        <div className="p-7 flex flex-col">
          {eyebrow}

          <h3 className="font-display text-[26px] leading-[1.15] m-0 mb-2">
            {trip.title}
          </h3>

          <p className="m-0 mb-5 text-[15px] leading-[1.6] text-muted max-w-[70ch]">
            {trip.description || trip.meetingLocation || "No description yet."}
          </p>

          <div className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-2 pt-4 border-t border-line-soft">
            {trip.meetingLocation && (
              <span className="text-[13px] text-muted">{trip.meetingLocation}</span>
            )}
            {seats && <span className="text-[13px] text-faint">{seats}</span>}
            {when && <span className="text-[13px] text-faint">{when}</span>}
            {price && (
              <span className="ml-auto text-[15px] font-medium text-ink">
                {price}
                <span className="text-[13px] text-faint font-normal"> per person</span>
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/trip/${trip._id}`}
      className="bg-surface border border-line rounded-2xl overflow-hidden flex flex-col hover:border-line-bold transition-colors"
    >
      <PhotoPlaceholder className="h-[170px]" />

      <div className="p-[22px] pb-5 flex flex-col flex-1">
        {eyebrow}

        <h3 className="font-display text-[23px] leading-[1.15] mb-2">{trip.title}</h3>

        <p className="m-0 mb-[18px] text-sm leading-[1.55] text-muted line-clamp-2">
          {trip.description || trip.meetingLocation || "No description yet."}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-4 border-t border-line-soft">
          <span className="text-[13px] text-muted">
            {[seats, when].filter(Boolean).join(" · ") || trip.status}
          </span>
          {price && <span className="text-[13px] font-medium text-ink">{price}</span>}
        </div>
      </div>
    </Link>
  );
}
