const TYPE_OPTIONS = [
  { value: "", label: "Any type" },
  { value: "relaxed", label: "Relaxed" },
  { value: "trek", label: "Trek" },
  { value: "climbing", label: "Climbing" },
  { value: "other", label: "Other" },
];

export const EMPTY_FILTERS = {
  place: "",
  type: "",
  from: "",
  maxCost: "",
  matchesMyLevel: false,
};

// How demanding each kind of trip is, so it can be weighed against the
// experience level already stored on the profile. No new data needed.
const LEVEL_RANK = { beginner: 1, intermediate: 2, advanced: 3 };
const TYPE_DEMAND = {
  relaxed: 1,
  other: 1,
  trek: 2,
  climbing: 3,
};

export function isFiltering(filters) {
  return Object.values(filters).some((v) => v !== "" && v !== false);
}

// Matches on place, type, start date and price. Place looks at the
// meeting point, title and description, so "galilee" finds a trip whose
// location is written into any of them.
export function applyFilters(trips, filters, myLevel = "beginner") {
  const place = filters.place.trim().toLowerCase();
  const maxCost = filters.maxCost ? Number(filters.maxCost) : null;
  const from = filters.from ? new Date(filters.from).getTime() : null;

  return trips.filter((trip) => {
    if (place) {
      const haystack = [trip.meetingLocation, trip.title, trip.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(place)) return false;
    }

    if (filters.type && trip.type !== filters.type) return false;

    if (from) {
      if (!trip.startDate) return false;
      if (new Date(trip.startDate).getTime() < from) return false;
    }

    if (maxCost !== null) {
      // Judge on the confirmed price where there is one, the estimate
      // otherwise. A trip with no price set never gets filtered out.
      const price = trip.costPerPerson > 0 ? trip.costPerPerson : trip.estimatedCost;
      if (price > 0 && price > maxCost) return false;
    }

    if (filters.matchesMyLevel) {
      const demand = TYPE_DEMAND[trip.type] ?? 1;
      if (demand > (LEVEL_RANK[myLevel] ?? 1)) return false;
    }

    return true;
  });
}

const control =
  "w-full bg-surface border border-line-strong rounded-[10px] px-4 py-3 text-[15px] text-ink outline-none focus:border-ink transition-colors";

const LEVEL_LABELS = {
  beginner: "beginner",
  intermediate: "intermediate",
  advanced: "experienced",
};

export default function TripFilters({
  filters,
  onChange,
  resultCount,
  totalCount,
  myLevel,
}) {
  const set = (key, value) => onChange({ ...filters, [key]: value });
  const active = isFiltering(filters);

  return (
    <div className="mb-7">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <label className="block">
          <span className="block text-[11px] tracking-[0.1em] uppercase text-faint mb-2">
            Where
          </span>
          <input
            className={control}
            placeholder="Galilee, Eilat…"
            value={filters.place}
            onChange={(e) => set("place", e.target.value)}
          />
        </label>

        <label className="block">
          <span className="block text-[11px] tracking-[0.1em] uppercase text-faint mb-2">
            Type
          </span>
          <select
            className={control}
            value={filters.type}
            onChange={(e) => set("type", e.target.value)}
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="block text-[11px] tracking-[0.1em] uppercase text-faint mb-2">
            Leaving after
          </span>
          <input
            className={control}
            type="date"
            value={filters.from}
            onChange={(e) => set("from", e.target.value)}
          />
        </label>

        <label className="block">
          <span className="block text-[11px] tracking-[0.1em] uppercase text-faint mb-2">
            Up to (₪)
          </span>
          <input
            className={control}
            type="number"
            min="0"
            placeholder="Any price"
            value={filters.maxCost}
            onChange={(e) => set("maxCost", e.target.value)}
          />
        </label>
      </div>

      <label className="flex items-center gap-3 mt-4 cursor-pointer w-fit">
        <input
          type="checkbox"
          className="w-4 h-4 accent-[#2F5646]"
          checked={filters.matchesMyLevel}
          onChange={(e) => set("matchesMyLevel", e.target.checked)}
        />
        <span className="text-sm text-muted">
          Only trips that suit a {LEVEL_LABELS[myLevel] || "beginner"} traveller
        </span>
      </label>

      {active && (
        <div className="flex items-center gap-4 mt-4">
          <span className="text-[13px] text-muted">
            {resultCount} of {totalCount} trips match
          </span>
          <button
            onClick={() => onChange({ ...EMPTY_FILTERS })}
            className="text-[13px] text-clay hover:text-clay-deep transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
