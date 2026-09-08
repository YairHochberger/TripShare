import { useState } from "react";

export default function ReviewForm({ personName, onSubmit, disabled }) {
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ score: Number(score), comment });
  };

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg p-3 space-y-2">
      <div className="text-sm font-semibold">Rate {personName}</div>

      <div className="flex gap-2">
        <select
          className="border p-2 rounded"
          value={score}
          onChange={(e) => setScore(e.target.value)}
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {"⭐".repeat(n)} ({n})
            </option>
          ))}
        </select>

        <input
          className="flex-1 border p-2 rounded"
          placeholder="Comment (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={disabled}
        className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60"
      >
        Submit rating
      </button>
    </form>
  );
}
