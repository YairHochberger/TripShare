import { useState } from "react";

export default function ReviewForm({ personName, onSubmit, disabled }) {
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ score: Number(score), comment });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface border border-line rounded-2xl p-6 flex flex-col gap-3.5"
    >
      <div className="text-[15px] font-semibold">Rate {personName}</div>

      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setScore(n)}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            className={`text-2xl leading-none transition-colors ${
              n <= score ? "text-clay" : "text-line-bold hover:text-fainter"
            }`}
          >
            ★
          </button>
        ))}
      </div>

      <input
        className="w-full bg-canvas border border-line-strong rounded-[10px] px-4 py-3 text-[15px] outline-none focus:border-ink transition-colors"
        placeholder="Add a comment (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      <button
        type="submit"
        disabled={disabled}
        className="self-start bg-ink text-canvas rounded-full px-5 py-2.5 text-sm font-medium hover:bg-clay disabled:opacity-60 transition-colors"
      >
        Submit rating
      </button>
    </form>
  );
}
