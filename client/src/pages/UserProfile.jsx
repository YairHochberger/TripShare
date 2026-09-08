import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getUser, getUserTrips, getUserReviews } from "../api/users";
import { ProfileSkeleton } from "../components/Skeleton";

const EXPERIENCE_LABELS = {
  beginner: "Beginner traveller",
  intermediate: "Intermediate traveller",
  advanced: "Experienced traveller",
};

const TYPE_LABELS = {
  relaxed: "Relaxed",
  trek: "Trek",
  climbing: "Climbing",
  other: "Other",
};

const STATUS_TONE = {
  open: "text-forest bg-forest-mist",
  full: "text-clay bg-clay/10",
  locked: "text-muted bg-surface-sunk",
  completed: "text-forest bg-forest-mist",
  cancelled: "text-clay-deep bg-clay/10",
};

function formatDate(d) {
  return d
    ? new Date(d).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;
}

function Stat({ value, label, muted }) {
  return (
    <div>
      <div className={`font-display text-[30px] leading-none ${muted ? "text-fainter" : ""}`}>
        {value}
      </div>
      <div className="text-xs tracking-[0.1em] uppercase text-faint mt-1.5">{label}</div>
    </div>
  );
}

export default function UserProfile() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [u, t, r] = await Promise.all([
          getUser(id),
          getUserTrips(id),
          getUserReviews(id),
        ]);
        setUser(u.data);
        setTrips(t.data);
        setReviews(r.data);
      } catch (err) {
        setError(err.response?.data?.message || "Couldn't load this profile.");
      }
    }
    load();
  }, [id]);

  if (error) return <p className="max-w-[1180px] mx-auto px-8 py-14 text-clay-deep">{error}</p>;
  if (!user) return <ProfileSkeleton />;

  const completed = trips.filter((t) => t.status === "completed").length;
  const organized = trips.filter((t) => t.role === "organizer").length;
  const joined = trips.filter((t) => t.role === "participant").length;

  const bestRating =
    user.organizerRating?.count > 0
      ? `★ ${user.organizerRating.average.toFixed(1)}`
      : user.participantRating?.count > 0
        ? `★ ${user.participantRating.average.toFixed(1)}`
        : "—";
  const ratingLabel =
    user.organizerRating?.count > 0
      ? "As organizer"
      : user.participantRating?.count > 0
        ? "As participant"
        : "No ratings yet";

  return (
    <main className="max-w-[1180px] mx-auto px-8 pt-14 pb-24">
      <div className="flex flex-wrap gap-7 items-center mb-[34px]">
        <span className="w-[92px] h-[92px] rounded-full bg-forest text-canvas grid place-items-center font-display text-[38px]">
          {user.name?.[0]?.toUpperCase() || "?"}
        </span>
        <div>
          <h1 className="font-display text-[44px] leading-none m-0 mb-2">{user.name}</h1>
          <p className="m-0 text-[15px] text-muted">
            {EXPERIENCE_LABELS[user.experienceLevel] || "Beginner traveller"}
          </p>
        </div>
      </div>

      {user.bio && (
        <p className="text-[17px] leading-[1.65] text-ink-soft max-w-[62ch] mb-8">
          {user.bio}
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-[26px] border-y border-line mb-14">
        <Stat value={organized} label="Organized" />
        <Stat value={joined} label="Joined" />
        <Stat value={completed} label="Completed" />
        <Stat value={bestRating} label={ratingLabel} muted={bestRating === "—"} />
      </div>

      <div className="grid md:grid-cols-2 gap-12 items-start">
        <section className="min-w-0">
          <h2 className="font-display text-[26px] m-0 mb-5">Trip history</h2>

          {trips.length === 0 ? (
            <div className="border border-dashed border-line-strong rounded-2xl px-[26px] py-[34px] text-center">
              <p className="m-0 text-base text-muted">No trips yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {trips.map((t) => (
                <Link
                  key={t._id}
                  to={`/trip/${t._id}`}
                  className="flex flex-wrap items-center gap-4 bg-surface border border-line rounded-2xl p-[22px] hover:border-ink transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[17px] font-semibold mb-1.5">{t.title}</div>
                    <div className="text-sm text-faint">
                      {[
                        TYPE_LABELS[t.type] || "Other",
                        t.meetingLocation,
                        formatDate(t.startDate),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block text-[11px] tracking-[0.12em] uppercase px-[11px] py-1.5 rounded-full ${
                        STATUS_TONE[t.status] || STATUS_TONE.open
                      }`}
                    >
                      {t.status}
                    </span>
                    <div className="text-xs text-faint mt-1.5">{t.role}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="min-w-0">
          <h2 className="font-display text-[26px] m-0 mb-5">What others said</h2>

          {reviews.length === 0 ? (
            <div className="border border-dashed border-line-strong rounded-2xl px-[26px] py-[34px] text-center">
              <p className="m-0 mb-1.5 text-base text-muted">No reviews yet.</p>
              <p className="m-0 text-sm text-faint">
                Reviews appear once a trip you shared is marked completed.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {reviews.map((r) => (
                <article
                  key={r._id}
                  className="bg-surface border border-line rounded-2xl p-[22px]"
                >
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="text-[15px] font-medium">{r.reviewer?.name}</span>
                    <span className="text-clay text-sm">{"★".repeat(r.score)}</span>
                  </div>
                  <div className="text-xs text-faint mb-2">
                    {r.trip?.title} ·{" "}
                    {r.direction === "participant_to_organizer"
                      ? "as organizer"
                      : "as participant"}
                  </div>
                  {r.comment && (
                    <p className="m-0 text-[15px] leading-[1.6] text-muted">{r.comment}</p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
