export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="text-gray-500">Welcome to the admin area.</p>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="font-semibold">Documents</h3>
          <p className="text-2xl font-bold">0</p>
          <p className="text-xs text-gray-500">Indexed files</p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="font-semibold">Users</h3>
          <p className="text-2xl font-bold">-</p>
          <p className="text-xs text-gray-500">Total registered</p>
        </div>
      </div>
    </div>
  )
}
