import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getTrip } from "../api/trips";

export default function TripDetails() {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);

  useEffect(() => {
    async function fetchTrip() {
      const res = await getTrip(id);
      setTrip(res.data);
    }

    fetchTrip();
  }, [id]);

  if (!trip) return <p>Loading...</p>;

  return (
    <div>
      <h2>{trip.title}</h2>
      <p>{trip.destination}</p>
    </div>
  );
}