export default function AdminLoading() {
  return (
    <div className="p-10 space-y-4">
      <div className="h-8 w-48 animate-pulse rounded bg-gray-200"></div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-32 animate-pulse rounded bg-gray-200"></div>
        <div className="h-32 animate-pulse rounded bg-gray-200"></div>
        <div className="h-32 animate-pulse rounded bg-gray-200"></div>
      </div>
    </div>
  )
}
