import { useState } from "react";
import { createTrip } from "../api/trips";
import { useNavigate } from "react-router-dom";

export default function CreateTrip() {
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await createTrip({
      title,
      destination
    });

    navigate(`/trip/${res.data._id}`);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create Trip</h2>

      <input
        placeholder="Title"
        onChange={(e) => setTitle(e.target.value)}
      />

      <input
        placeholder="Destination"
        onChange={(e) => setDestination(e.target.value)}
      />

      <button type="submit">Create</button>
    </form>
  );
}