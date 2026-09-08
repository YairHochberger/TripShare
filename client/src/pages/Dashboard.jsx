import { useEffect, useState } from "react";
import { getTrips } from "../api/trips";
import { Link } from "react-router-dom";
import TripCard from "../components/TripCard";
import PhotoPlaceholder from "../components/PhotoPlaceholder";
import { TripCardSkeleton } from "../components/Skeleton";

const TYPE_LABELS = {
  relaxed: "Relaxed",
  trek: "Trek",
  climbing: "Climbing",
  other: "Other",
};

const STATUS_LABELS = {
  open: "Open",
  full: "Full",
  locked: "Locked",
  completed: "Completed",
  cancelled: "Cancelled",
};

function dateRange(start, end) {
  const opts = { day: "numeric", month: "short" };
  if (!start && !end) return null;
  if (start && end) {
    return `${new Date(start).toLocaleDateString(undefined, opts)} – ${new Date(
      end
    ).toLocaleDateString(undefined, opts)}`;
  }
  return new Date(start || end).toLocaleDateString(undefined, opts);
}

function Stat({ value, label }) {
  return (
    <div>
      <div className="font-display text-[34px] leading-none">{value}</div>
      <div className="text-xs text-faint tracking-[0.06em] uppercase mt-1">{label}</div>
    </div>
  );
}

// The one trip that gets the wide treatment at the top of the page.
function FeaturedTrip({ trip }) {
  const range = dateRange(trip.startDate, trip.endDate);
  const initials = [trip.organizer, ...trip.members].slice(0, 3);
  const extra = trip.members.length + 1 - initials.length;

  return (
    <article className="bg-surface border border-line rounded-[20px] overflow-hidden grid grid-cols-1 md:grid-cols-2">
      <div className="relative min-h-[340px]">
        <PhotoPlaceholder className="absolute inset-0" />
        <span className="absolute top-[18px] left-[18px] bg-ink/80 text-canvas text-[11px] tracking-[0.14em] uppercase px-3 py-[7px] rounded-full">
          {STATUS_LABELS[trip.status] || trip.status}
          {range && ` · ${range}`}
        </span>
      </div>

      <div className="px-9 pt-9 pb-[30px] flex flex-col">
        <div className="text-[11px] tracking-[0.16em] uppercase text-clay mb-3">
          {TYPE_LABELS[trip.type] || "Other"}
          {trip.role === "organizer" ? " · You organize" : " · You're going"}
        </div>

        <h2 className="font-display text-[32px] leading-[1.1] m-0 mb-2.5">{trip.title}</h2>

        <p className="m-0 mb-[22px] text-[15px] leading-[1.6] text-muted">
          {trip.description || "No description yet."}
        </p>

        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-[18px] m-0 mb-[26px] py-5 border-y border-line">
          <div>
            <dt className="text-[11px] tracking-[0.1em] uppercase text-faint mb-1.5">Meet at</dt>
            <dd className="m-0 text-sm">{trip.meetingLocation || "Not set"}</dd>
          </div>
          <div>
            <dt className="text-[11px] tracking-[0.1em] uppercase text-faint mb-1.5">Type</dt>
            <dd className="m-0 text-sm">{TYPE_LABELS[trip.type] || "Other"}</dd>
          </div>
          <div>
            <dt className="text-[11px] tracking-[0.1em] uppercase text-faint mb-1.5">Cost</dt>
            <dd className="m-0 text-sm">
              {trip.costPerPerson > 0
                ? `₪${trip.costPerPerson} confirmed`
                : trip.estimatedCost > 0
                  ? `₪${trip.estimatedCost} estimated`
                  : "Not set"}
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap items-center gap-4 mt-auto">
          <div className="flex items-center">
            {initials.map((p, i) => (
              <span
                key={p?._id || i}
                className={`w-8 h-8 rounded-full grid place-items-center text-[13px] border-2 border-surface ${
                  i === 0 ? "bg-forest text-canvas" : "bg-clay text-canvas"
                } ${i > 0 ? "-ml-2.5" : ""}`}
              >
                {p?.name?.[0]?.toUpperCase() || "?"}
              </span>
            ))}
            {extra > 0 && (
              <span className="w-8 h-8 rounded-full grid place-items-center text-[13px] border-2 border-surface bg-line text-muted -ml-2.5">
                +{extra}
              </span>
            )}
          </div>

          {trip.maxCapacity > 0 && (
            <span className="text-[13px] text-faint">
              {trip.members.length} of {trip.maxCapacity} seats filled
            </span>
          )}

          <Link
            to={`/trip/${trip._id}`}
            className="ml-auto flex items-center gap-2 bg-ink text-canvas rounded-full px-[22px] py-3 text-sm font-medium hover:bg-clay transition-colors"
          >
            Open trip
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function Dashboard() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchTrips() {
      try {
        const res = await getTrips();
        setTrips(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Couldn't load trips.");
      } finally {
        setLoading(false);
      }
    }

    fetchTrips();
  }, []);

  const myTrips = trips.filter((t) => t.role);
  const discoverTrips = trips.filter((t) => !t.role && t.status === "open");

  const featured = myTrips[0];
  const otherMine = myTrips.slice(1);

  const organizing = myTrips.filter((t) => t.role === "organizer").length;
  const seats = featured?.maxCapacity
    ? `${featured.members.length}/${featured.maxCapacity}`
    : "—";
  const perPerson = featured
    ? featured.costPerPerson > 0
      ? `₪${featured.costPerPerson}`
      : featured.estimatedCost > 0
        ? `₪${featured.estimatedCost}`
        : "—"
    : "—";

  return (
    <main className="max-w-[1180px] mx-auto px-8 pt-14 pb-24">
      <div className="flex flex-wrap gap-6 items-end justify-between mb-10">
        <div className="max-w-[620px]">
          <div className="text-[11px] tracking-[0.16em] uppercase text-faint mb-3.5">
            Your trips
          </div>
          <h1 className="font-display text-[52px] leading-[1.02] tracking-[-0.02em] m-0 mb-3.5 text-pretty">
            One weekend, six people,
            <br />
            <em>one plan</em> everyone agreed on.
          </h1>
          <p className="m-0 text-base leading-[1.55] text-muted max-w-[46ch]">
            Destinations, lodging, costs and who's actually coming — settled in one place
            before anyone packs a bag.
          </p>
        </div>

        <div className="flex gap-9 pb-1.5">
          <Stat value={organizing} label="Organizing" />
          <Stat value={seats} label="Seats filled" />
          <Stat value={perPerson} label="Per person" />
        </div>
      </div>

      {error && (
        <div className="border border-clay/30 bg-clay/5 text-clay-deep rounded-2xl p-4 text-sm mb-8">
          {error}
        </div>
      )}

      {loading && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-[22px]">
          <TripCardSkeleton />
          <TripCardSkeleton />
          <TripCardSkeleton />
        </div>
      )}

      {!loading && (
        <>
          {featured ? (
            <FeaturedTrip trip={featured} />
          ) : (
            <div className="bg-surface border border-dashed border-line-strong rounded-[20px] p-16 text-center">
              <h2 className="font-display text-[28px] m-0 mb-2">No trips yet</h2>
              <p className="m-0 mb-6 text-muted">
                Start one of your own, or join a trip that's looking for people.
              </p>
              <Link
                to="/create"
                className="inline-flex items-center gap-2 bg-ink text-canvas rounded-full px-[22px] py-3 text-sm font-medium hover:bg-clay transition-colors"
              >
                Create a trip
              </Link>
            </div>
          )}

          {otherMine.length > 0 && (
            <section className="mt-[72px]">
              <div className="flex items-baseline justify-between gap-5 border-b border-line pb-4 mb-7">
                <h2 className="font-display text-[30px] m-0">Your other trips</h2>
                <span className="text-[13px] text-faint">
                  {otherMine.length} more
                </span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-[22px]">
                {otherMine.map((trip) => (
                  <TripCard key={trip._id} trip={trip} />
                ))}
              </div>
            </section>
          )}

          <section className="mt-[72px]">
            <div className="flex items-baseline justify-between gap-5 border-b border-line pb-4 mb-7">
              <h2 className="font-display text-[30px] m-0">Trips looking for people</h2>
              <span className="text-[13px] text-faint">
                Organised by travellers with reviews
              </span>
            </div>

            {discoverTrips.length === 0 ? (
              <p className="text-muted text-[15px]">
                No open trips to join right now.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-[22px]">
                {discoverTrips.map((trip) => (
                  <TripCard key={trip._id} trip={trip} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
