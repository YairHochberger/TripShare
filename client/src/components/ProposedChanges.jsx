import { useEffect, useState } from "react";
import {
  getProposals,
  createProposal,
  voteOnProposal,
  decideProposal,
} from "../api/trips";
import LocationPicker from "./LocationPicker";

const FIELD_OPTIONS = [
  { value: "addDestination", label: "Add a destination to the route", type: "destination" },
  { value: "title", label: "Trip title", type: "text" },
  { value: "description", label: "Description", type: "text" },
  { value: "meetingLocation", label: "Meeting location", type: "text" },
  { value: "startDate", label: "Start date", type: "date" },
  { value: "endDate", label: "End date", type: "date" },
  { value: "maxCapacity", label: "Max participants", type: "number" },
  { value: "estimatedCost", label: "Estimated cost", type: "number" },
  { value: "costPerPerson", label: "Final cost per person", type: "number" },
  { value: "finalCostDueDate", label: "Final price confirmed by", type: "date" },
  { value: "paymentDueDate", label: "Payment due date", type: "date" },
  { value: "other", label: "Something else (describe it)", type: "none" },
];

const TRAVEL_MODES = [
  { value: "independent", label: "Independent travel" },
  { value: "shared", label: "Shared travel" },
  { value: "other", label: "Other" },
];

const STATUS_STYLES = {
  pending: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  tied: "bg-amber-100 text-amber-700",
  cancelled: "bg-gray-200 text-gray-600",
};

const STATUS_LABELS = {
  pending: "Voting open",
  approved: "Approved",
  rejected: "Rejected",
  tied: "Tied — organizer decides",
  cancelled: "Withdrawn",
};

function timeLeft(closesAt) {
  const ms = new Date(closesAt).getTime() - Date.now();
  if (ms <= 0) return "closing now";

  const hours = Math.floor(ms / 3600000);
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} left to vote`;
  }
  if (hours >= 1) return `${hours} hour${hours === 1 ? "" : "s"} left to vote`;
  return `${Math.max(1, Math.floor(ms / 60000))} min left to vote`;
}

export default function ProposedChanges({ trip, onApplied }) {
  const [proposals, setProposals] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    field: "addDestination",
    newValue: "",
    note: "",
    votingDays: 3,
  });
  const [destination, setDestination] = useState({
    location: "",
    description: "",
    mode: "independent",
  });
  const [picking, setPicking] = useState(false);

  const isOrganizer = trip.role === "organizer";
  const selectedField = FIELD_OPTIONS.find((f) => f.value === form.field);

  const load = async () => {
    try {
      const res = await getProposals(trip._id);
      setProposals(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't load proposed changes.");
    }
  };

  useEffect(() => {
    load();
  }, [trip._id]);

  const run = async (fn) => {
    setError("");
    setBusy(true);
    try {
      await fn();
      await load();
      // An approved change edits the trip itself, so refresh the page data.
      if (onApplied) onApplied();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const submitProposal = (e) => {
    e.preventDefault();
    run(async () => {
      const body =
        form.field === "addDestination" ? { ...form, payload: destination } : form;

      await createProposal(trip._id, body);
      setForm({ field: "addDestination", newValue: "", note: "", votingDays: 3 });
      setDestination({ location: "", description: "", mode: "independent" });
      setPicking(false);
      setShowForm(false);
    });
  };

  return (
    <div className="space-y-3">
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {isOrganizer && (
        <div>
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="text-sm text-blue-600 font-semibold"
            >
              + Propose a change
            </button>
          ) : (
            <form onSubmit={submitProposal} className="border rounded-xl p-3 space-y-2">
              <select
                className="w-full border p-2 rounded"
                value={form.field}
                onChange={(e) =>
                  setForm({ ...form, field: e.target.value, newValue: "" })
                }
              >
                {FIELD_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>

              {!["none", "destination"].includes(selectedField?.type) && (
                <input
                  className="w-full border p-2 rounded"
                  type={selectedField.type}
                  placeholder="New value"
                  value={form.newValue}
                  onChange={(e) => setForm({ ...form, newValue: e.target.value })}
                />
              )}

              {selectedField?.type === "destination" && (
                <div className="space-y-2">
                  <input
                    className="w-full border p-2 rounded"
                    placeholder="Destination name"
                    value={destination.location}
                    onChange={(e) =>
                      setDestination({ ...destination, location: e.target.value })
                    }
                  />
                  <input
                    className="w-full border p-2 rounded"
                    placeholder="What happens there (optional)"
                    value={destination.description}
                    onChange={(e) =>
                      setDestination({ ...destination, description: e.target.value })
                    }
                  />
                  <select
                    className="w-full border p-2 rounded"
                    value={destination.mode}
                    onChange={(e) =>
                      setDestination({ ...destination, mode: e.target.value })
                    }
                  >
                    {TRAVEL_MODES.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="text-sm text-blue-600 font-semibold"
                      onClick={() => setPicking(!picking)}
                    >
                      {picking ? "Cancel" : "Set on map"}
                    </button>
                    {typeof destination.lat === "number" ? (
                      <span className="text-xs text-gray-500">
                        📍 {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Not placed yet</span>
                    )}
                  </div>

                  <LocationPicker
                    steps={[
                      ...(trip.travelPlan || []),
                      ...(typeof destination.lat === "number" ? [destination] : []),
                    ]}
                    activeIndex={picking ? (trip.travelPlan?.length ?? 0) : null}
                    onPick={(lat, lng) => {
                      setDestination({ ...destination, lat, lng });
                      setPicking(false);
                    }}
                    height={240}
                  />

                  <p className="text-xs text-gray-500">
                    If the group approves, this stop is added to the Route tab and the
                    distance is recalculated.
                  </p>
                </div>
              )}

              <textarea
                className="w-full border p-2 rounded"
                rows={2}
                placeholder={
                  form.field === "other"
                    ? "Describe what you want to change, add or remove"
                    : "Why this change? (optional)"
                }
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />

              <label className="block text-sm text-gray-500">
                Voting open for
                <select
                  className="w-full border p-2 rounded mt-1"
                  value={form.votingDays}
                  onChange={(e) =>
                    setForm({ ...form, votingDays: Number(e.target.value) })
                  }
                >
                  <option value={1}>1 day</option>
                  <option value={3}>3 days</option>
                  <option value={7}>7 days</option>
                </select>
              </label>

              <p className="text-xs text-gray-500">
                Participants who don't vote count as agreeing. If it ties, you decide.
              </p>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60"
                >
                  Send to the group
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-sm text-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {proposals.length === 0 ? (
        <p className="text-sm text-gray-400">
          No changes have been proposed for this trip.
        </p>
      ) : (
        proposals.map((p) => (
          <div key={p._id} className="border rounded-xl p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="font-semibold text-sm">{p.fieldLabel}</div>
              <span
                className={`text-[11px] font-semibold px-2 py-1 rounded-full whitespace-nowrap ${
                  STATUS_STYLES[p.status]
                }`}
              >
                {STATUS_LABELS[p.status]}
              </span>
            </div>

            {!["other", "addDestination"].includes(p.field) && (
              <div className="text-sm flex flex-wrap items-center gap-2">
                <span className="line-through text-gray-400">{p.oldValue || "—"}</span>
                <span className="text-gray-400">→</span>
                <span className="font-semibold text-gray-800">{p.newValue}</span>
              </div>
            )}

            {p.field === "addDestination" && p.payload && (
              <div className="text-sm border-l-2 border-blue-400 pl-2">
                <div className="font-semibold">📍 {p.payload.location}</div>
                {p.payload.description && (
                  <div className="text-gray-500">{p.payload.description}</div>
                )}
                <div className="text-xs text-gray-400">
                  {p.status === "approved"
                    ? "Added to the route"
                    : "Will be added to the route if approved"}
                </div>
              </div>
            )}

            {p.note && <p className="text-sm text-gray-600">{p.note}</p>}

            <div className="text-xs text-gray-500">
              {p.counts.agrees} for · {p.counts.objections} against
              {p.counts.silent > 0 && ` · ${p.counts.silent} haven't voted (counts as for)`}
              {p.status === "pending" && ` · ${timeLeft(p.closesAt)}`}
            </div>

            {/* Participants vote */}
            {p.status === "pending" && trip.role === "participant" && (
              <div className="flex items-center gap-2">
                <button
                  disabled={busy}
                  onClick={() => run(() => voteOnProposal(p._id, true))}
                  className={`px-3 py-1 rounded-lg text-sm disabled:opacity-60 ${
                    p.myVote === true
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Agree
                </button>
                <button
                  disabled={busy}
                  onClick={() => run(() => voteOnProposal(p._id, false))}
                  className={`px-3 py-1 rounded-lg text-sm disabled:opacity-60 ${
                    p.myVote === false
                      ? "bg-red-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Object
                </button>
                {p.myVote !== null && (
                  <span className="text-xs text-gray-400">
                    You {p.myVote ? "agreed" : "objected"} — you can change this
                  </span>
                )}
              </div>
            )}

            {/* Organizer breaks a tie, or withdraws their proposal */}
            {isOrganizer && ["pending", "tied"].includes(p.status) && (
              <div className="flex items-center gap-2">
                {p.status === "tied" && (
                  <button
                    disabled={busy}
                    onClick={() => run(() => decideProposal(p._id, "approved"))}
                    className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700 disabled:opacity-60"
                  >
                    Approve it
                  </button>
                )}
                <button
                  disabled={busy}
                  onClick={() => run(() => decideProposal(p._id, "cancelled"))}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-60"
                >
                  Withdraw
                </button>
              </div>
            )}

            {p.status === "approved" && p.field === "other" && (
              <p className="text-xs text-green-700">
                The group agreed — the organizer applies this one by hand.
              </p>
            )}
          </div>
        ))
      )}
    </div>
  );
}
