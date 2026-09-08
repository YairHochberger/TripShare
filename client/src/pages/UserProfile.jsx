import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getUser, getUserTrips, getUserReviews } from "../api/users";
import RatingBadge from "../components/RatingBadge";
import { ProfileSkeleton } from "../components/Skeleton";

const EXPERIENCE_LABELS = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const TYPE_LABELS = {
  relaxed: "Relaxed",
  trek: "Trek",
  climbing: "Climbing",
  other: "Other",
};

const STATUS_STYLES = {
  open: "bg-green-100 text-green-700",
  full: "bg-yellow-100 text-yellow-700",
  locked: "bg-gray-200 text-gray-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
};

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString() : null;
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

  if (error) return <p className="text-red-600">{error}</p>;
  if (!user) return <ProfileSkeleton />;

  const completed = trips.filter((t) => t.status === "completed");
  const organized = trips.filter((t) => t.role === "organizer").length;
  const joined = trips.filter((t) => t.role === "participant").length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow space-y-3">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold">
            {user.name?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-sm text-gray-500">
              {EXPERIENCE_LABELS[user.experienceLevel] || "Beginner"} traveller
            </p>
          </div>
        </div>

        {user.bio && <p className="text-gray-700">{user.bio}</p>}

        <div className="flex flex-wrap gap-4 pt-2 border-t">
          <div>
            <div className="text-xs text-gray-400">As organizer</div>
            <RatingBadge rating={user.organizerRating} label="organizer" />
          </div>
          <div>
            <div className="text-xs text-gray-400">As participant</div>
            <RatingBadge rating={user.participantRating} label="participant" />
          </div>
          <div>
            <div className="text-xs text-gray-400">Trips</div>
            <div className="text-sm text-gray-700">
              {organized} organized · {joined} joined · {completed.length} completed
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow space-y-3">
        <h3 className="font-semibold">Trip history</h3>

        {trips.length === 0 ? (
          <p className="text-sm text-gray-400">No trips yet.</p>
        ) : (
          <div className="space-y-2">
            {trips.map((t) => (
              <Link
                key={t._id}
                to={`/trip/${t._id}`}
                className="block border rounded-lg p-3 hover:border-gray-400 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-sm">{t.title}</div>
                    <div className="text-xs text-gray-500">
                      {TYPE_LABELS[t.type] || "Other"}
                      {t.meetingLocation && ` · ${t.meetingLocation}`}
                      {t.startDate && ` · ${formatDate(t.startDate)}`}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        STATUS_STYLES[t.status] || STATUS_STYLES.open
                      }`}
                    >
                      {t.status}
                    </span>
                    <span className="text-[11px] text-gray-400">{t.role}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow space-y-3">
        <h3 className="font-semibold">What others said</h3>

        {reviews.length === 0 ? (
          <p className="text-sm text-gray-400">
            No reviews yet — they haven't finished a trip with anyone.
          </p>
        ) : (
          <div className="space-y-2">
            {reviews.map((r) => (
              <div key={r._id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold">{r.reviewer?.name}</div>
                  <div className="text-sm">{"⭐".repeat(r.score)}</div>
                </div>

                <div className="text-xs text-gray-400">
                  {r.trip?.title}
                  {" · "}
                  {r.direction === "participant_to_organizer"
                    ? "as organizer"
                    : "as participant"}
                </div>

                {r.comment && (
                  <p className="text-sm text-gray-700 mt-1">{r.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
