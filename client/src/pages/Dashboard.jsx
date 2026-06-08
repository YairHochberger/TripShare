import { useEffect, useState } from "react";
import { getTrips } from "../api/trips";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    async function fetchTrips() {
      const res = await getTrips();
      setTrips(res.data);
    }

    fetchTrips();
  }, []);

  return (
    <div>
      <h2>Your Trips</h2>

      {trips.map((trip) => (
        <div key={trip._id}>
          <Link to={`/trip/${trip._id}`}>
            {trip.title}
          </Link>
        </div>
      ))}
    </div>
  );
}