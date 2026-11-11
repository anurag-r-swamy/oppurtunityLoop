export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="h-5 w-24 animate-pulse rounded-full bg-slate-200" />
        <div className="h-5 w-16 animate-pulse rounded-full bg-slate-200" />
      </div>
      <div className="mt-4 h-6 w-3/4 animate-pulse rounded bg-slate-200" />
      <div className="mt-2 h-4 w-full animate-pulse rounded bg-slate-100" />
      <div className="mt-1 h-4 w-5/6 animate-pulse rounded bg-slate-100" />
      <div className="mt-5 flex gap-2">
        <div className="h-6 w-16 animate-pulse rounded-md bg-slate-100" />
        <div className="h-6 w-20 animate-pulse rounded-md bg-slate-100" />
      </div>
    </div>
  );
}

