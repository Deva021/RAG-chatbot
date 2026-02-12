export default function AdminDocumentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Documents</h1>
        <button className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800">
          Upload New
        </button>
      </div>
      
      <div className="rounded-md border bg-white p-12 text-center text-gray-500">
        No documents uploaded yet.
      </div>
    </div>
  )
}
