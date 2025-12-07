'use client'

/**
 * DataViewInfiniteScroll Component
 * 
 * Infinite scroll sentinel primitive for DataView.
 * Automatically loads more data when user scrolls near the bottom.
 * Only displays when paginationType is 'infinite-scroll' and hasMore is true.
 * Connects to DataViewContext for state management.
 * 
 * @example
 * ```tsx
 * <DataViewInfiniteScroll />
 * ```
 */

import { useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useDataView } from './data-view-context'

// ============================================================================
// Types
// ============================================================================

export interface DataViewInfiniteScrollProps {
  /** Additional className for styling */
  className?: string
}

// ============================================================================
// Component
// ============================================================================

export function DataViewInfiniteScroll({ className }: DataViewInfiniteScrollProps) {
  const { paginationType, hasMore, isFetching, fetchNextPage } = useDataView()
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Only render for infinite-scroll pagination type
  if (paginationType !== 'infinite-scroll') {
    return null
  }

  // Don't render if no more data
  if (!hasMore) {
    return null
  }

  useEffect(() => {
    if (!hasMore || isFetching) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage()
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px 100px 0px' }
    )

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, isFetching, fetchNextPage])

  return (
    <div ref={sentinelRef} className={cn('h-4 w-full flex justify-center mt-4', className)}>
      {isFetching && (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      )}
    </div>
  )
}

