import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function LeaderboardCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
        <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-full mt-1.5" />
          <div className="flex items-center gap-3 mt-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-6 w-20 flex-shrink-0" />
      </div>
    </Card>
  )
}