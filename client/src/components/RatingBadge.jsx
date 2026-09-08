export default function RatingBadge({ rating, label }) {
  if (!rating || !rating.count) {
    return <span className="text-xs text-gray-400">No {label} ratings yet</span>;
  }

  return (
    <span className="text-xs text-gray-600">
      ⭐ {rating.average} as {label} ({rating.count})
    </span>
  );
}
