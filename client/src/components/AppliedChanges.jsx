import { useEffect, useState } from "react";
import { getProposals } from "../api/trips";

function when(date) {
  return new Date(date).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

// What the group has already agreed to change. Anything still being
// voted on lives in the Proposals tab, not here.
export default function AppliedChanges({ trip }) {
  const [changes, setChanges] = useState(null);

  useEffect(() => {
    getProposals(trip._id)
      .then((res) => setChanges(res.data.filter((p) => p.status === "approved")))
      .catch(() => setChanges([]));
  }, [trip._id]);

  if (changes === null) {
    return <div className="animate-pulse bg-line h-16 w-full rounded-[14px]" />;
  }

  if (changes.length === 0) {
    return (
      <p className="m-0 text-[15px] text-faint">
        Nothing has changed since this trip was posted.
      </p>
    );
  }

  return (
    <ol className="list-none m-0 p-0">
      {changes.map((c) => (
        <li
          key={c._id}
          className="grid grid-cols-[70px_minmax(0,1fr)] gap-4 py-4 border-t border-line"
        >
          <div className="text-xs text-faint tracking-[0.08em] uppercase pt-1">
            {when(c.updatedAt)}
          </div>

          <div>
            <div className="text-[15px] font-semibold mb-1">{c.fieldLabel}</div>

            {c.field === "addDestination" && c.payload ? (
              <div className="text-[15px] text-muted">
                Added {c.payload.location} to the route
              </div>
            ) : c.field === "other" ? (
              <div className="text-[15px] text-muted">{c.note}</div>
            ) : (
              <div className="flex items-baseline gap-2.5 flex-wrap text-[15px]">
                <span className="text-fainter line-through">{c.oldValue || "—"}</span>
                <span className="text-faint">→</span>
                <span className="font-medium">{c.newValue}</span>
              </div>
            )}

            {c.note && c.field !== "other" && (
              <p className="m-0 mt-1 text-sm text-faint">{c.note}</p>
            )}

            <div className="text-xs text-faint mt-1.5">
              Agreed {c.counts.agrees} to {c.counts.objections}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
