import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function AppCardSkeleton() {
  return (
    <Card className="flex flex-col overflow-hidden">
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        {/* Top row: icon + status badge */}
        <div className="flex items-start justify-between">
          <Skeleton className="size-10 rounded-lg" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>

        {/* Name + category badge */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="h-4 w-1/3 rounded-full" />
        </div>

        {/* Description lines */}
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-full rounded" />
          <Skeleton className="h-3.5 w-4/5 rounded" />
        </div>

        {/* Action row */}
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="h-8 flex-1 rounded-lg" />
          <Skeleton className="size-8 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}
