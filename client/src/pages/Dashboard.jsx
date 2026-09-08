import { useEffect, useState } from "react";
import { getTrips } from "../api/trips";
import { Link } from "react-router-dom";
import TripCard from "../components/TripCard";
import { TripCardSkeleton } from "../components/Skeleton";

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
        // Always clear it, or a failed request leaves the page loading forever.
        setLoading(false);
      }
    }

    fetchTrips();
  }, []);

  const myTrips = trips.filter((trip) => trip.role);
  const discoverTrips = trips.filter((trip) => !trip.role && trip.status === "open");

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-lg">
        <h1 className="text-4xl font-bold mb-3">Plan trips together ✈️</h1>

        <p className="text-blue-100 mb-6">
          Organize destinations, itineraries, budgets and group members in one place.
        </p>

        <Link
          to="/create"
          className="inline-block bg-white text-blue-600 font-semibold px-6 py-3 rounded-xl"
        >
          + Create New Trip
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 ring-1 ring-red-200 rounded-2xl p-4 text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Your Trips</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <TripCardSkeleton />
            <TripCardSkeleton />
            <TripCardSkeleton />
          </div>
        </div>
      )}

      {!loading && (
        <>
          {/* My Trips */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Your Trips</h2>

            {myTrips.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 shadow text-center">
                <div className="text-6xl mb-4">🌍</div>
                <h3 className="text-xl font-semibold mb-2">No trips yet</h3>
                <p className="text-gray-500">
                  Create your first adventure, or join one below.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myTrips.map((trip) => (
                  <TripCard key={trip._id} trip={trip} />
                ))}
              </div>
            )}
          </div>

          {/* Discover Trips */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Discover Trips</h2>

            {discoverTrips.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 shadow text-center">
                <p className="text-gray-500">No open trips to join right now.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {discoverTrips.map((trip) => (
                  <TripCard key={trip._id} trip={trip} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
