import { Card, CardContent, CardFooter, CardHeader } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { cn } from '~/lib/utils';

/**
 * Skeleton loader component matching RoomCard layout
 */
export function RoomSkeleton() {
  return (
    <Card
      className={cn(
        // Box model
        'overflow-hidden',
        // Visuals
        'bg-white/10 dark:bg-gray-900/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl'
      )}
    >
      <Skeleton className="h-48 w-full rounded-t-2xl" />
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2 mt-2" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-10 w-24" />
      </CardFooter>
    </Card>
  );
}

