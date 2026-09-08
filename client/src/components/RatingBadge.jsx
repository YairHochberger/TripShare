export default function RatingBadge({ rating, label }) {
  if (!rating || !rating.count) {
    return <span className="text-xs text-faint">No {label} ratings yet</span>;
  }

  return (
    <span className="text-xs text-muted">
      ★ {rating.average.toFixed(1)} as {label} · {rating.count} review
      {rating.count === 1 ? "" : "s"}
    </span>
  );
}
