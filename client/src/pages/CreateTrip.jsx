import { useState } from "react";
import { createTrip } from "../api/trips";
import { useNavigate } from "react-router-dom";
import LocationPicker from "../components/LocationPicker";

const TRIP_TYPES = [
  { value: "relaxed", label: "Relaxed" },
  { value: "trek", label: "Trek" },
  { value: "climbing", label: "Climbing" },
  { value: "other", label: "Other" },
];

const LODGING_TYPES = [
  { value: "tent", label: "Tent" },
  { value: "cabin", label: "Cabin" },
  { value: "hostel", label: "Hostel" },
  { value: "host_home", label: "Host's home" },
  { value: "other", label: "Other" },
];

const TRAVEL_MODES = [
  { value: "independent", label: "Independent travel" },
  { value: "shared", label: "Shared travel" },
  { value: "other", label: "Other" },
];

const emptyNight = {
  date: "",
  type: "tent",
  location: "",
  description: "",
  bookingUrl: "",
};
const emptyStep = { description: "", mode: "independent", location: "" };

export default function CreateTrip() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "relaxed",
    startDate: "",
    endDate: "",
    meetingLocation: "",
    maxCapacity: "",
    estimatedCost: "",
    finalCostDueDate: "",
    paymentDueDate: "",
  });
  const [lodgingPlan, setLodgingPlan] = useState([]);
  const [travelPlan, setTravelPlan] = useState([]);
  const [pickingIndex, setPickingIndex] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const updateField = (field, value) => setForm({ ...form, [field]: value });

  const updateNight = (index, field, value) => {
    const next = [...lodgingPlan];
    next[index] = { ...next[index], [field]: value };
    setLodgingPlan(next);
  };

  const updateStep = (index, field, value) => {
    const next = [...travelPlan];
    next[index] = { ...next[index], [field]: value };
    setTravelPlan(next);
  };

  const setStepPoint = (lat, lng) => {
    if (pickingIndex === null) return;
    const next = [...travelPlan];
    next[pickingIndex] = { ...next[pickingIndex], lat, lng };
    setTravelPlan(next);
    setPickingIndex(null);
  };

  const removeStep = (index) => {
    setTravelPlan(travelPlan.filter((_, idx) => idx !== index));
    setPickingIndex(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await createTrip({
        ...form,
        maxCapacity: form.maxCapacity ? Number(form.maxCapacity) : 0,
        estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : 0,
        finalCostDueDate: form.finalCostDueDate || undefined,
        paymentDueDate: form.paymentDueDate || undefined,
        lodgingPlan,
        travelPlan,
      });
      navigate(`/trip/${res.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Could not create trip. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center">
      <div className="bg-white p-6 rounded-xl shadow w-full max-w-2xl space-y-6">
        <h2 className="text-xl font-bold text-center">Create Trip</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <input
              className="w-full border p-2 rounded"
              placeholder="Title"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              required
            />

            <textarea
              className="w-full border p-2 rounded"
              placeholder="Description"
              rows={3}
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <select
                className="w-full border p-2 rounded"
                value={form.type}
                onChange={(e) => updateField("type", e.target.value)}
              >
                {TRIP_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>

              <input
                className="w-full border p-2 rounded"
                placeholder="Max participants"
                type="number"
                min="0"
                value={form.maxCapacity}
                onChange={(e) => updateField("maxCapacity", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm text-gray-500">
                Start date
                <input
                  className="w-full border p-2 rounded mt-1"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => updateField("startDate", e.target.value)}
                />
              </label>

              <label className="text-sm text-gray-500">
                End date
                <input
                  className="w-full border p-2 rounded mt-1"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => updateField("endDate", e.target.value)}
                />
              </label>
            </div>

            <input
              className="w-full border p-2 rounded"
              placeholder="Meeting location"
              value={form.meetingLocation}
              onChange={(e) => updateField("meetingLocation", e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm text-gray-500">
                Estimated cost per person (₪)
                <input
                  className="w-full border p-2 rounded mt-1"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.estimatedCost}
                  onChange={(e) => updateField("estimatedCost", e.target.value)}
                />
              </label>

              <label className="text-sm text-gray-500">
                Final price confirmed by
                <input
                  className="w-full border p-2 rounded mt-1"
                  type="date"
                  value={form.finalCostDueDate}
                  onChange={(e) => updateField("finalCostDueDate", e.target.value)}
                />
              </label>
            </div>

            <label className="block text-sm text-gray-500">
              Payment due by
              <input
                className="w-full border p-2 rounded mt-1"
                type="date"
                value={form.paymentDueDate}
                onChange={(e) => updateField("paymentDueDate", e.target.value)}
              />
            </label>

            <p className="text-xs text-gray-400">
              Give a rough figure now — you confirm the exact price later, by the date
              above. Participants who cancel before the payment due date owe nothing;
              after it, the fee is still owed.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Lodging plan</h3>
              <button
                type="button"
                className="text-sm text-blue-600 font-semibold"
                onClick={() => setLodgingPlan([...lodgingPlan, { ...emptyNight }])}
              >
                + Add night
              </button>
            </div>

            {lodgingPlan.length === 0 && (
              <p className="text-sm text-gray-400">No lodging nights added yet.</p>
            )}

            {lodgingPlan.map((night, i) => (
              <div key={i} className="border rounded p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="w-full border p-2 rounded"
                    type="date"
                    value={night.date}
                    onChange={(e) => updateNight(i, "date", e.target.value)}
                  />
                  <select
                    className="w-full border p-2 rounded"
                    value={night.type}
                    onChange={(e) => updateNight(i, "type", e.target.value)}
                  >
                    {LODGING_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Location"
                  value={night.location}
                  onChange={(e) => updateNight(i, "location", e.target.value)}
                />
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Description"
                  value={night.description}
                  onChange={(e) => updateNight(i, "description", e.target.value)}
                />
                <input
                  className="w-full border p-2 rounded"
                  type="url"
                  placeholder="Booking link (where you booked it)"
                  value={night.bookingUrl}
                  onChange={(e) => updateNight(i, "bookingUrl", e.target.value)}
                />
                <button
                  type="button"
                  className="text-sm text-red-600"
                  onClick={() => setLodgingPlan(lodgingPlan.filter((_, idx) => idx !== i))}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Travel plan</h3>
              <button
                type="button"
                className="text-sm text-blue-600 font-semibold"
                onClick={() => setTravelPlan([...travelPlan, { ...emptyStep }])}
              >
                + Add step
              </button>
            </div>

            {travelPlan.length === 0 && (
              <p className="text-sm text-gray-400">No travel steps added yet.</p>
            )}

            {travelPlan.map((step, i) => (
              <div
                key={i}
                className={`border rounded p-3 space-y-2 ${
                  pickingIndex === i ? "ring-2 ring-blue-500" : ""
                }`}
              >
                <div className="text-sm font-semibold text-gray-500">Stop {i + 1}</div>

                <select
                  className="w-full border p-2 rounded"
                  value={step.mode}
                  onChange={(e) => updateStep(i, "mode", e.target.value)}
                >
                  {TRAVEL_MODES.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Location"
                  value={step.location}
                  onChange={(e) => updateStep(i, "location", e.target.value)}
                />
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Description"
                  value={step.description}
                  onChange={(e) => updateStep(i, "description", e.target.value)}
                />

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="text-sm text-blue-600 font-semibold"
                    onClick={() => setPickingIndex(pickingIndex === i ? null : i)}
                  >
                    {pickingIndex === i ? "Cancel" : "Set on map"}
                  </button>

                  {typeof step.lat === "number" ? (
                    <span className="text-xs text-gray-500">
                      📍 {step.lat.toFixed(4)}, {step.lng.toFixed(4)}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">Not placed on map</span>
                  )}

                  <button
                    type="button"
                    className="text-sm text-red-600 ml-auto"
                    onClick={() => removeStep(i)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            {travelPlan.length > 0 && (
              <LocationPicker
                steps={travelPlan}
                activeIndex={pickingIndex}
                onPick={setStepPoint}
              />
            )}
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create Trip"}
          </button>
        </form>
      </div>
    </div>
  );
}
