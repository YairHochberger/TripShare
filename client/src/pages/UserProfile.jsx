import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getUser,
  getUserTrips,
  getUserReviews,
  getFollowState,
  followUser,
  unfollowUser,
} from "../api/users";
import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";
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
  const { user: me } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState("");
  const [follow, setFollow] = useState({ following: false, followerCount: 0 });
  const [followBusy, setFollowBusy] = useState(false);

  const isMe = String(me?.id || "") === String(id);

  const toggleFollow = async () => {
    setFollowBusy(true);
    try {
      const res = follow.following ? await unfollowUser(id) : await followUser(id);
      setFollow({
        following: res.data.following,
        followerCount: follow.followerCount + (res.data.following ? 1 : -1),
      });
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't update follow.");
    } finally {
      setFollowBusy(false);
    }
  };

  useEffect(() => {
    async function load() {
      try {
        const u = await getUser(id);
        setUser(u.data);

        // A private profile returns just a name; the history and review
        // endpoints refuse it too, so don't bother asking.
        if (u.data.restricted) {
          setTrips([]);
          setReviews([]);
          return;
        }

        const [t, r, f] = await Promise.all([
          getUserTrips(id),
          getUserReviews(id),
          getFollowState(id),
        ]);
        setTrips(t.data);
        setReviews(r.data);
        setFollow(f.data);
      } catch (err) {
        setError(err.response?.data?.message || "Couldn't load this profile.");
      }
    }
    load();
  }, [id]);

  if (error) return <p className="max-w-[1180px] mx-auto px-8 py-14 text-clay-deep">{error}</p>;
  if (!user) return <ProfileSkeleton />;

  if (user.restricted) {
    return (
      <main className="max-w-[1180px] mx-auto px-8 pt-14 pb-24">
        <div className="flex flex-wrap gap-7 items-center mb-8">
          <span className="w-[92px] h-[92px] rounded-full bg-line text-muted grid place-items-center font-display text-[38px]">
            {user.name?.[0]?.toUpperCase() || "?"}
          </span>
          <div>
            <h1 className="font-display text-[44px] leading-none m-0 mb-2">{user.name}</h1>
            <p className="m-0 text-[15px] text-muted">This profile is private</p>
          </div>
        </div>

        <div className="border border-dashed border-line-strong rounded-2xl px-[26px] py-[34px] text-center max-w-[620px]">
          <p className="m-0 mb-1.5 text-base text-muted">
            {user.name} keeps their profile private.
          </p>
          <p className="m-0 text-sm text-faint">
            Their trips and reviews open up to people on the same trip. Join a trip
            together and you'll see them here.
          </p>
        </div>
      </main>
    );
  }

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
            {follow.followerCount > 0 &&
              ` · ${follow.followerCount} follower${follow.followerCount === 1 ? "" : "s"}`}
          </p>
        </div>

        {!isMe && (
          <button
            onClick={toggleFollow}
            disabled={followBusy}
            className={`ml-auto rounded-full px-6 py-3 text-sm font-medium transition-colors disabled:opacity-60 ${
              follow.following
                ? "border border-line-bold hover:border-ink"
                : "bg-ink text-canvas hover:bg-clay"
            }`}
          >
            {follow.following ? "Following" : "Follow"}
          </button>
        )}
      </div>

      {!isMe && !follow.following && (
        <p className="text-sm text-faint -mt-6 mb-8">
          Follow to hear about it when {user.name} posts a new public trip.
        </p>
      )}

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
