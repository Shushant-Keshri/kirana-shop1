export function ProductSkeleton() {
  return (
    <div className="card">
      <div className="skeleton h-40 rounded-t-2xl rounded-b-none w-full" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-3 w-16" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-3 w-20" />
        <div className="skeleton h-4 w-24" />
        <div className="skeleton h-9 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function OrderSkeleton() {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex justify-between">
        <div className="skeleton h-4 w-32" />
        <div className="skeleton h-4 w-20" />
      </div>
      <div className="skeleton h-3 w-48" />
      <div className="skeleton h-3 w-24" />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="skeleton w-20 h-20 rounded-full" />
        <div className="space-y-2">
          <div className="skeleton h-5 w-32" />
          <div className="skeleton h-4 w-48" />
        </div>
      </div>
    </div>
  );
}
