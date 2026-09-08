import { useState } from "react";
import { createTrip } from "../api/trips";
import { useNavigate } from "react-router-dom";
import LocationPicker from "../components/LocationPicker";
import PhotoPlaceholder from "../components/PhotoPlaceholder";

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

const field =
  "w-full bg-surface border border-line-strong rounded-[10px] px-4 py-3.5 text-base text-ink outline-none focus:border-ink transition-colors";

function Label({ children, hint }) {
  return (
    <span className="block text-[13px] text-muted mb-2">
      {children}
      {hint && <span className="text-faint"> · {hint}</span>}
    </span>
  );
}

function FormSection({ title, children }) {
  return (
    <section>
      <h2 className="text-xs tracking-[0.14em] uppercase text-faint m-0 mb-5 pb-3 border-b border-line">
        {title}
      </h2>
      {children}
    </section>
  );
}

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

  const updateField = (name, value) => setForm({ ...form, [name]: value });

  const updateNight = (index, name, value) => {
    const next = [...lodgingPlan];
    next[index] = { ...next[index], [name]: value };
    setLodgingPlan(next);
  };

  const updateStep = (index, name, value) => {
    const next = [...travelPlan];
    next[index] = { ...next[index], [name]: value };
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
    <main className="max-w-[1180px] mx-auto px-8 pt-14 pb-24">
      <div className="max-w-[620px] mb-11">
        <div className="text-[11px] tracking-[0.16em] uppercase text-faint mb-3.5">
          New trip
        </div>
        <h1 className="font-display text-[46px] leading-[1.05] tracking-[-0.02em] m-0 mb-3">
          Start with the shape of it.
        </h1>
        <p className="m-0 text-base leading-[1.55] text-muted">
          Rough numbers are fine — you confirm the exact price later, before the payment
          date.
        </p>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-12 items-start">
        <form
          id="create-trip"
          onSubmit={handleSubmit}
          className="flex flex-col gap-10 min-w-0"
        >
          <FormSection title="The basics">
            <label className="block mb-5">
              <Label>Title</Label>
              <input
                className={field}
                placeholder="Golan Heights Weekend Trek"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                required
              />
            </label>

            <label className="block mb-5">
              <Label>Description</Label>
              <textarea
                className={`${field} leading-[1.55] resize-y`}
                rows={4}
                placeholder="What the days look like, the pace, what to bring."
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
              />
            </label>

            <div className="grid sm:grid-cols-2 gap-5">
              <label className="block">
                <Label>Type</Label>
                <select
                  className={field}
                  value={form.type}
                  onChange={(e) => updateField("type", e.target.value)}
                >
                  {TRIP_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <Label>Max participants</Label>
                <input
                  className={field}
                  type="number"
                  min="0"
                  placeholder="6"
                  value={form.maxCapacity}
                  onChange={(e) => updateField("maxCapacity", e.target.value)}
                />
              </label>
            </div>
          </FormSection>

          <FormSection title="When & where">
            <div className="grid sm:grid-cols-2 gap-5 mb-5">
              <label className="block">
                <Label>Start date</Label>
                <input
                  className={field}
                  type="date"
                  value={form.startDate}
                  onChange={(e) => updateField("startDate", e.target.value)}
                />
              </label>
              <label className="block">
                <Label>End date</Label>
                <input
                  className={field}
                  type="date"
                  value={form.endDate}
                  onChange={(e) => updateField("endDate", e.target.value)}
                />
              </label>
            </div>

            <label className="block">
              <Label>Meeting location</Label>
              <input
                className={field}
                placeholder="Katzrin bus station"
                value={form.meetingLocation}
                onChange={(e) => updateField("meetingLocation", e.target.value)}
              />
            </label>
          </FormSection>

          <FormSection title="Money">
            <div className="grid sm:grid-cols-2 gap-5 mb-3.5">
              <label className="block">
                <Label>Estimated cost per person (₪)</Label>
                <input
                  className={field}
                  type="number"
                  min="0"
                  placeholder="300"
                  value={form.estimatedCost}
                  onChange={(e) => updateField("estimatedCost", e.target.value)}
                />
              </label>
              <label className="block">
                <Label>Final price confirmed by</Label>
                <input
                  className={field}
                  type="date"
                  value={form.finalCostDueDate}
                  onChange={(e) => updateField("finalCostDueDate", e.target.value)}
                />
              </label>
            </div>

            <label className="block max-w-[340px]">
              <Label>Payment due by</Label>
              <input
                className={field}
                type="date"
                value={form.paymentDueDate}
                onChange={(e) => updateField("paymentDueDate", e.target.value)}
              />
            </label>

            <p className="mt-3.5 mb-0 text-sm leading-[1.6] text-faint max-w-[56ch]">
              Participants who cancel before the payment date owe nothing. After it, the
              fee is still owed.
            </p>
          </FormSection>

          <FormSection title="Lodging & travel">
            {/* Lodging */}
            <div className="flex flex-col gap-3 mb-4">
              {lodgingPlan.map((night, i) => (
                <div
                  key={i}
                  className="bg-surface border border-line rounded-[14px] p-5 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[20px]">Night {i + 1}</span>
                    <button
                      type="button"
                      className="text-sm text-faint hover:text-clay transition-colors"
                      onClick={() =>
                        setLodgingPlan(lodgingPlan.filter((_, idx) => idx !== i))
                      }
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <input
                      className={field}
                      type="date"
                      value={night.date}
                      onChange={(e) => updateNight(i, "date", e.target.value)}
                    />
                    <select
                      className={field}
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
                    className={field}
                    placeholder="Where you're staying"
                    value={night.location}
                    onChange={(e) => updateNight(i, "location", e.target.value)}
                  />
                  <input
                    className={field}
                    placeholder="Anything people should know"
                    value={night.description}
                    onChange={(e) => updateNight(i, "description", e.target.value)}
                  />
                  <input
                    className={field}
                    type="url"
                    placeholder="Booking link (where you booked it)"
                    value={night.bookingUrl}
                    onChange={(e) => updateNight(i, "bookingUrl", e.target.value)}
                  />
                </div>
              ))}
            </div>

            {/* Travel */}
            <div className="flex flex-col gap-3 mb-4">
              {travelPlan.map((step, i) => (
                <div
                  key={i}
                  className={`bg-surface border rounded-[14px] p-5 flex flex-col gap-3 ${
                    pickingIndex === i ? "border-ink" : "border-line"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[20px]">Stop {i + 1}</span>
                    <button
                      type="button"
                      className="text-sm text-faint hover:text-clay transition-colors"
                      onClick={() => removeStep(i)}
                    >
                      Remove
                    </button>
                  </div>

                  <select
                    className={field}
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
                    className={field}
                    placeholder="Where"
                    value={step.location}
                    onChange={(e) => updateStep(i, "location", e.target.value)}
                  />
                  <input
                    className={field}
                    placeholder="What happens here"
                    value={step.description}
                    onChange={(e) => updateStep(i, "description", e.target.value)}
                  />

                  <div className="flex items-center gap-3.5">
                    <button
                      type="button"
                      className="text-sm text-clay hover:text-clay-deep transition-colors"
                      onClick={() => setPickingIndex(pickingIndex === i ? null : i)}
                    >
                      {pickingIndex === i ? "Cancel" : "Set on map"}
                    </button>
                    {typeof step.lat === "number" ? (
                      <span className="text-xs text-muted">
                        {step.lat.toFixed(4)}, {step.lng.toFixed(4)}
                      </span>
                    ) : (
                      <span className="text-xs text-faint">Not placed on map</span>
                    )}
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

            <div className="grid sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setLodgingPlan([...lodgingPlan, { ...emptyNight }])}
                className="text-left border border-dashed border-line-bold rounded-[14px] p-[22px] hover:border-ink transition-colors"
              >
                <span className="block text-base font-medium mb-1">+ Add a night</span>
                <span className="block text-sm text-faint">Tent, hostel, guesthouse</span>
              </button>

              <button
                type="button"
                onClick={() => setTravelPlan([...travelPlan, { ...emptyStep }])}
                className="text-left border border-dashed border-line-bold rounded-[14px] p-[22px] hover:border-ink transition-colors"
              >
                <span className="block text-base font-medium mb-1">
                  + Add a travel step
                </span>
                <span className="block text-sm text-faint">Own way, carpool, bus</span>
              </button>
            </div>
          </FormSection>

          {error && (
            <p className="text-sm text-clay-deep bg-clay/5 border border-clay/20 rounded-xl px-4 py-3 m-0">
              {error}
            </p>
          )}
        </form>

        <aside className="lg:sticky lg:top-24 bg-surface border border-line rounded-[18px] p-7 min-w-0">
          <div className="text-[11px] tracking-[0.16em] uppercase text-faint mb-4">
            How it will look
          </div>

          <PhotoPlaceholder className="h-[150px] rounded-xl mb-[18px]" />

          <h3
            className={`font-display text-2xl leading-[1.15] m-0 mb-2 ${
              form.title ? "text-ink" : "text-fainter"
            }`}
          >
            {form.title || "Untitled trip"}
          </h3>

          <p className="m-0 mb-5 text-sm leading-[1.55] text-faint">
            {form.description ||
              "Fill in the basics and participants will see it here before they ask to join."}
          </p>

          {(form.meetingLocation || form.estimatedCost) && (
            <dl className="grid grid-cols-2 gap-3 m-0 mb-5 pt-4 border-t border-line">
              {form.meetingLocation && (
                <div>
                  <dt className="text-[11px] tracking-[0.1em] uppercase text-faint mb-1">
                    Meet at
                  </dt>
                  <dd className="m-0 text-sm">{form.meetingLocation}</dd>
                </div>
              )}
              {form.estimatedCost && (
                <div>
                  <dt className="text-[11px] tracking-[0.1em] uppercase text-faint mb-1">
                    Estimated
                  </dt>
                  <dd className="m-0 text-sm">₪{form.estimatedCost}</dd>
                </div>
              )}
            </dl>
          )}

          <button
            type="submit"
            form="create-trip"
            disabled={loading}
            className="w-full bg-ink text-canvas rounded-full px-5 py-3.5 text-[15px] font-medium hover:bg-clay disabled:opacity-60 transition-colors"
          >
            {loading ? "Creating…" : "Create trip"}
          </button>
        </aside>
      </div>
    </main>
  );
}
