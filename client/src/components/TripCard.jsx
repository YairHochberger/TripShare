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

export default function TripCard({ trip }) {
  const seats = trip.maxCapacity > 0 ? `${trip.members.length} of ${trip.maxCapacity} seats` : null;
  const when = formatDate(trip.startDate);
  const price = trip.costPerPerson > 0
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

  return (
    <Link
      to={`/trip/${trip._id}`}
      className="bg-surface border border-line rounded-2xl overflow-hidden flex flex-col hover:border-line-bold transition-colors"
    >
      <PhotoPlaceholder className="h-[170px]" />

      <div className="p-[22px] pb-5 flex flex-col flex-1">
        <div className="text-[11px] tracking-[0.14em] uppercase text-clay mb-2.5">
          {TYPE_LABELS[trip.type] || "Other"}
          {roleLabel && ` · ${roleLabel}`}
        </div>

        <h3 className="font-display text-[23px] leading-[1.15] mb-2">{trip.title}</h3>

        <p className="m-0 mb-[18px] text-sm leading-[1.55] text-muted line-clamp-2">
          {trip.description || trip.meetingLocation || "No description yet."}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-4 border-t border-line-soft">
          <span className="text-[13px] text-muted">
            {[seats, when].filter(Boolean).join(" · ") || trip.status}
          </span>
          {price && (
            <span className="text-[13px] font-medium text-ink">{price}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
