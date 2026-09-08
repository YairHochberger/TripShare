import { Link } from "react-router-dom";

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

export default function TripCard({ trip }) {
  return (
    <Link
      to={`/trip/${trip._id}`}
      className="bg-white rounded-2xl p-6 shadow hover:shadow-xl transition-all hover:-translate-y-1 block"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="text-4xl">✈️</div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_STYLES[trip.status] || STATUS_STYLES.open}`}>
            {trip.status}
          </span>
          {trip.role === "organizer" && (
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">
              Organizing
            </span>
          )}
          {trip.role === "participant" && (
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-purple-100 text-purple-700">
              Joined
            </span>
          )}
          {trip.hasPendingRequest && (
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-orange-100 text-orange-700">
              Request pending
            </span>
          )}
        </div>
      </div>

      <h3 className="text-xl font-bold">{trip.title}</h3>

      <p className="text-gray-500 mt-2">
        {trip.meetingLocation || "Meeting location not set"}
      </p>

      <p className="text-sm text-gray-400 mt-1">{TYPE_LABELS[trip.type] || "Other"}</p>

      <div className="mt-6 text-blue-600 font-semibold">View Trip →</div>
    </Link>
  );
}
