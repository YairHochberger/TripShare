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

const STATUS_TONE = {
  pending: "text-muted bg-surface-sunk",
  approved: "text-forest bg-forest-mist",
  rejected: "text-clay-deep bg-clay/10",
  tied: "text-clay bg-clay/10",
  cancelled: "text-faint bg-surface-sunk",
};

const STATUS_LABELS = {
  pending: "Voting open",
  approved: "Approved",
  rejected: "Rejected",
  tied: "Tied — organizer decides",
  cancelled: "Withdrawn",
};

const inputClass =
  "w-full bg-surface border border-line-strong rounded-[10px] px-4 py-3.5 text-base text-ink outline-none focus:border-ink transition-colors";

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
    <div className="flex flex-col gap-4">
      {error && <p className="text-sm text-clay-deep m-0">{error}</p>}

      {isOrganizer && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="self-start text-[15px] text-clay hover:text-clay-deep transition-colors"
        >
          Propose a change
        </button>
      )}

      {isOrganizer && showForm && (
        <form
          onSubmit={submitProposal}
          className="bg-surface border border-line rounded-2xl p-6 flex flex-col gap-3.5"
        >
          <select
            className={inputClass}
            value={form.field}
            onChange={(e) => setForm({ ...form, field: e.target.value, newValue: "" })}
          >
            {FIELD_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>

          {!["none", "destination"].includes(selectedField?.type) && (
            <input
              className={inputClass}
              type={selectedField.type}
              placeholder="New value"
              value={form.newValue}
              onChange={(e) => setForm({ ...form, newValue: e.target.value })}
            />
          )}

          {selectedField?.type === "destination" && (
            <div className="flex flex-col gap-3">
              <input
                className={inputClass}
                placeholder="Destination name"
                value={destination.location}
                onChange={(e) =>
                  setDestination({ ...destination, location: e.target.value })
                }
              />
              <input
                className={inputClass}
                placeholder="What happens there (optional)"
                value={destination.description}
                onChange={(e) =>
                  setDestination({ ...destination, description: e.target.value })
                }
              />
              <select
                className={inputClass}
                value={destination.mode}
                onChange={(e) => setDestination({ ...destination, mode: e.target.value })}
              >
                {TRAVEL_MODES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-3.5">
                <button
                  type="button"
                  className="text-sm text-clay hover:text-clay-deep transition-colors"
                  onClick={() => setPicking(!picking)}
                >
                  {picking ? "Cancel" : "Set on map"}
                </button>
                {typeof destination.lat === "number" ? (
                  <span className="text-xs text-muted">
                    {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}
                  </span>
                ) : (
                  <span className="text-xs text-faint">Not placed yet</span>
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

              <p className="text-xs text-faint m-0">
                If the group approves, this stop is added to the Route tab and the
                distance is recalculated.
              </p>
            </div>
          )}

          <textarea
            className={`${inputClass} resize-y leading-[1.55]`}
            rows={2}
            placeholder={
              form.field === "other"
                ? "Describe what you want to change, add or remove"
                : "Why this change? (optional)"
            }
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />

          <label className="block text-[13px] text-muted">
            Voting open for
            <select
              className={`${inputClass} mt-2`}
              value={form.votingDays}
              onChange={(e) => setForm({ ...form, votingDays: Number(e.target.value) })}
            >
              <option value={1}>1 day</option>
              <option value={3}>3 days</option>
              <option value={7}>7 days</option>
            </select>
          </label>

          <p className="text-xs text-faint m-0">
            Participants who don't vote count as agreeing. If it ties, you decide.
          </p>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={busy}
              className="bg-ink text-canvas rounded-full px-5 py-3 text-sm font-medium hover:bg-clay disabled:opacity-60 transition-colors"
            >
              Send to the group
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm text-faint hover:text-ink transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {proposals.length === 0 ? (
        <p className="text-[15px] text-faint m-0">
          No changes have been proposed for this trip.
        </p>
      ) : (
        proposals.map((p) => {
          const total = p.counts.eligible || 1;
          const forPct = Math.round((p.counts.agrees / total) * 100);

          return (
            <article
              key={p._id}
              className="bg-surface border border-line rounded-2xl p-6"
            >
              <div className="flex flex-wrap items-center gap-3 justify-between mb-4">
                <h3 className="text-[15px] font-semibold m-0 tracking-[0.01em]">
                  {p.fieldLabel}
                </h3>
                <span
                  className={`text-[11px] tracking-[0.12em] uppercase px-[11px] py-1.5 rounded-full ${
                    STATUS_TONE[p.status]
                  }`}
                >
                  {STATUS_LABELS[p.status]}
                </span>
              </div>

              {!["other", "addDestination"].includes(p.field) && (
                <div className="flex items-baseline gap-3.5 mb-3.5 flex-wrap">
                  <span className="font-display text-[28px] text-fainter line-through">
                    {p.oldValue || "—"}
                  </span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8E9A90" strokeWidth="1.6">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                  <span className="font-display text-[32px]">{p.newValue}</span>
                </div>
              )}

              {p.field === "addDestination" && p.payload && (
                <div className="border-l-2 border-clay pl-3 mb-3.5">
                  <div className="text-[17px] font-semibold">{p.payload.location}</div>
                  {p.payload.description && (
                    <div className="text-[15px] text-muted">{p.payload.description}</div>
                  )}
                  <div className="text-xs text-faint mt-1">
                    {p.status === "approved"
                      ? "Added to the route"
                      : "Will be added to the route if approved"}
                  </div>
                </div>
              )}

              {p.note && (
                <p className="m-0 mb-5 text-[15px] leading-[1.6] text-muted">{p.note}</p>
              )}

              <div className="flex items-center gap-3.5">
                <div className="flex-1 h-1.5 rounded-full bg-surface-sunk overflow-hidden">
                  <div
                    className="h-full bg-forest transition-all"
                    style={{ width: `${forPct}%` }}
                  />
                </div>
                <span className="text-[13px] text-muted whitespace-nowrap">
                  {p.counts.agrees} for · {p.counts.objections} against
                </span>
              </div>

              {p.status === "pending" && (
                <div className="text-xs text-faint mt-2">
                  {timeLeft(p.closesAt)}
                  {p.counts.silent > 0 &&
                    ` · ${p.counts.silent} haven't voted (counts as for)`}
                </div>
              )}

              {/* Participants vote */}
              {p.status === "pending" && trip.role === "participant" && (
                <div className="flex items-center gap-2.5 mt-4">
                  <button
                    disabled={busy}
                    onClick={() => run(() => voteOnProposal(p._id, true))}
                    className={`rounded-full px-5 py-2.5 text-sm transition-colors disabled:opacity-60 ${
                      p.myVote === true
                        ? "bg-forest text-canvas"
                        : "border border-line-bold hover:border-ink"
                    }`}
                  >
                    Agree
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => run(() => voteOnProposal(p._id, false))}
                    className={`rounded-full px-5 py-2.5 text-sm transition-colors disabled:opacity-60 ${
                      p.myVote === false
                        ? "bg-clay text-canvas"
                        : "border border-line-bold hover:border-ink"
                    }`}
                  >
                    Object
                  </button>
                  {p.myVote !== null && (
                    <span className="text-xs text-faint">
                      You {p.myVote ? "agreed" : "objected"} — you can change this
                    </span>
                  )}
                </div>
              )}

              {/* Organizer breaks a tie, or withdraws their proposal */}
              {isOrganizer && ["pending", "tied"].includes(p.status) && (
                <div className="flex items-center gap-2.5 mt-4">
                  {p.status === "tied" && (
                    <button
                      disabled={busy}
                      onClick={() => run(() => decideProposal(p._id, "approved"))}
                      className="bg-forest text-canvas rounded-full px-5 py-2.5 text-sm font-medium hover:bg-forest-deep disabled:opacity-60 transition-colors"
                    >
                      Approve it
                    </button>
                  )}
                  <button
                    disabled={busy}
                    onClick={() => run(() => decideProposal(p._id, "cancelled"))}
                    className="border border-line-bold rounded-full px-5 py-2.5 text-sm hover:border-ink disabled:opacity-60 transition-colors"
                  >
                    Withdraw
                  </button>
                </div>
              )}

              {p.status === "approved" && p.field === "other" && (
                <p className="text-xs text-forest mt-3 mb-0">
                  The group agreed — the organizer applies this one by hand.
                </p>
              )}
            </article>
          );
        })
      )}
    </div>
  );
}
