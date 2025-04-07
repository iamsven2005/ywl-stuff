import { DriveSkeleton } from "./drive-skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">My Drive</h1>
      <DriveSkeleton />
    </div>
  )
}

