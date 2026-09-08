import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { searchUsers } from "../api/users";
import RatingBadge from "../components/RatingBadge";
import { Skeleton } from "../components/Skeleton";

const EXPERIENCE_LABELS = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Experienced",
};

export default function People() {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  // Wait for a pause in typing rather than firing a request per keystroke.
  useEffect(() => {
    const q = term.trim();

    if (q.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      setError("");
      try {
        const res = await searchUsers(q);
        setResults(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Couldn't search right now.");
      } finally {
        setSearching(false);
        setSearched(true);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [term]);

  return (
    <main className="max-w-[1180px] mx-auto px-8 pt-14 pb-24">
      <div className="max-w-[620px] mb-10">
        <div className="text-[11px] tracking-[0.16em] uppercase text-faint mb-3.5">
          People
        </div>
        <h1 className="font-display text-[46px] leading-[1.05] tracking-[-0.02em] m-0 mb-3">
          Find someone to travel with.
        </h1>
        <p className="m-0 text-base leading-[1.55] text-muted max-w-[46ch]">
          Search by name to see what people have organized, joined, and what their
          trip-mates said afterwards.
        </p>
      </div>

      <label className="block max-w-[520px] mb-10">
        <span className="block text-[11px] tracking-[0.1em] uppercase text-faint mb-2">
          Search by name
        </span>
        <input
          className="w-full bg-surface border border-line-strong rounded-[10px] px-4 py-3.5 text-base text-ink outline-none focus:border-ink transition-colors"
          placeholder="Start typing a name…"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          autoFocus
        />
      </label>

      {error && <p className="text-sm text-clay-deep">{error}</p>}

      {searching && (
        <div className="flex flex-col gap-3 max-w-[720px]">
          <Skeleton className="h-[86px] w-full rounded-2xl" />
          <Skeleton className="h-[86px] w-full rounded-2xl" />
        </div>
      )}

      {!searching && searched && results.length === 0 && (
        <div className="border border-dashed border-line-strong rounded-2xl px-[26px] py-[34px] text-center max-w-[720px]">
          <p className="m-0 mb-1.5 text-base text-muted">Nobody by that name.</p>
          <p className="m-0 text-sm text-faint">
            People with a private profile only appear to those they share a trip with.
          </p>
        </div>
      )}

      {!searching && results.length > 0 && (
        <div className="flex flex-col gap-3 max-w-[720px]">
          {results.map((u) => (
            <Link
              key={u._id}
              to={`/users/${u._id}`}
              className="flex items-center gap-4 bg-surface border border-line rounded-2xl p-5 hover:border-ink transition-colors"
            >
              <span className="w-12 h-12 shrink-0 rounded-full bg-forest text-canvas grid place-items-center text-lg">
                {u.name?.[0]?.toUpperCase() || "?"}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-[17px] font-medium">{u.name}</span>
                  {u.isYou && (
                    <span className="text-[11px] tracking-[0.12em] uppercase text-muted bg-surface-sunk px-2.5 py-1 rounded-full">
                      You
                    </span>
                  )}
                  {u.isPrivate && (
                    <span className="text-[11px] tracking-[0.12em] uppercase text-forest bg-forest-mist px-2.5 py-1 rounded-full">
                      Private
                    </span>
                  )}
                </div>

                <div className="text-[13px] text-faint mt-1">
                  {EXPERIENCE_LABELS[u.experienceLevel] || "Beginner"} ·{" "}
                  <RatingBadge rating={u.organizerRating} label="organizer" />
                </div>
              </div>

              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A9A296" strokeWidth="1.8">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </Link>
          ))}
        </div>
      )}

      {!searching && !searched && term.trim().length < 2 && (
        <p className="text-[15px] text-faint">Type at least two letters to search.</p>
      )}
    </main>
  );
}
