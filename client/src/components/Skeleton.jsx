// Placeholders shaped like the content that's coming, so the page
// doesn't jump around once it loads.
export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-line rounded ${className}`} />;
}

export function TripCardSkeleton() {
  return (
    <div className="bg-surface border border-line rounded-2xl overflow-hidden">
      <Skeleton className="h-[170px] rounded-none" />
      <div className="p-[22px] space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function TripDetailsSkeleton() {
  return (
    <main className="max-w-[1180px] mx-auto px-8 pt-10 pb-24">
      <Skeleton className="h-3 w-20 mb-8" />

      <div className="flex flex-wrap gap-8 justify-between items-start">
        <div className="max-w-[640px] w-full space-y-4">
          <Skeleton className="h-5 w-32 rounded-full" />
          <Skeleton className="h-11 w-3/4" />
          <Skeleton className="h-4 w-52" />
        </div>
        <div className="flex gap-2.5">
          <Skeleton className="h-11 w-28 rounded-full" />
          <Skeleton className="h-11 w-36 rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-[34px] py-[22px] border-y border-line">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>

      <div className="flex gap-[30px] mt-8 mb-10 border-b border-line">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-3 w-16 my-[18px]" />
        ))}
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-10 items-start">
        <div className="space-y-4">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-2/3" />
        </div>
        <Skeleton className="h-64 w-full rounded-[18px]" />
      </div>
    </main>
  );
}

export function ProfileSkeleton() {
  return (
    <main className="max-w-[1180px] mx-auto px-8 pt-14 pb-24">
      <div className="flex flex-wrap gap-7 items-center mb-8">
        <Skeleton className="w-[92px] h-[92px] rounded-full" />
        <div className="space-y-3">
          <Skeleton className="h-10 w-52" />
          <Skeleton className="h-3 w-64" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-7 border-y border-line mb-14">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-2.5 w-20" />
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        <div className="space-y-4">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      </div>
    </main>
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
