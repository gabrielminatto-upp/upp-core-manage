import { Skeleton } from "@/components/ui/skeleton";

export function PageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <div className="flex w-full">
        {/* Sidebar skeleton */}
        <div className="w-64 border-r border-border bg-card p-4 space-y-4">
          <Skeleton className="h-8 w-32" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        
        {/* Main content skeleton */}
        <div className="flex-1 flex flex-col">
          {/* Header skeleton */}
          <div className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          
          {/* Content skeleton */}
          <div className="flex-1 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Page title */}
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
              </div>
              
              {/* Content grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
              
              {/* Additional content */}
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <div className="flex space-x-4">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}