// Grey placeholders shaped like the content that's coming, so the page
// doesn't jump around once it loads.
export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

export function SkeletonCard({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl p-6 shadow space-y-3 ${className}`}>
      {children}
    </div>
  );
}

export function TripCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow space-y-3">
      <div className="flex items-start justify-between">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <Skeleton className="w-16 h-5 rounded-full" />
      </div>
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-3 w-1/4" />
      <Skeleton className="h-4 w-24 mt-4" />
    </div>
  );
}

export function TripDetailsSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <SkeletonCard>
        <div className="flex items-start justify-between">
          <div className="space-y-2 w-2/3">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>

        <div className="flex gap-4 pt-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-24" />
        </div>

        <Skeleton className="h-3 w-40" />

        <div className="flex gap-2 pt-2">
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
      </SkeletonCard>

      {/* tab bar */}
      <div className="bg-white rounded-2xl shadow ring-1 ring-black/5 p-1.5 flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 py-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>

      <SkeletonCard>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </SkeletonCard>

      <SkeletonCard>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </SkeletonCard>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <SkeletonCard>
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
        <Skeleton className="h-3 w-2/3" />
        <div className="flex gap-6 pt-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-32" />
        </div>
      </SkeletonCard>

      <SkeletonCard>
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-14 w-full rounded-lg" />
      </SkeletonCard>
    </div>
  );
}

// Small inline spinner for buttons and short waits.
export function Spinner({ className = "" }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
