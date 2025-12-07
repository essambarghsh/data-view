'use client'

/**
 * DataViewContent Component
 * 
 * Content wrapper for DataView that handles loading and empty states.
 * Renders children (DataViewList/DataViewGrid) when data is available.
 * 
 * @example
 * ```tsx
 * <DataViewContent
 *   loadingSkeleton={<Skeleton />}
 *   emptyState={<EmptyState />}
 * >
 *   <DataViewList>{(item) => <Card item={item} />}</DataViewList>
 *   <DataViewGrid>{(item) => <Card item={item} />}</DataViewGrid>
 * </DataViewContent>
 * ```
 */

import { type ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { useDataView } from './data-view-context'

// ============================================================================
// Types
// ============================================================================

export interface DataViewContentProps {
  /** Custom loading skeleton component */
  loadingSkeleton?: ReactNode
  /** Custom empty state component */
  emptyState?: ReactNode
  /** Additional className for styling */
  className?: string
  /** Child components (DataViewList, DataViewGrid) */
  children: ReactNode
}

// ============================================================================
// Component
// ============================================================================

export function DataViewContent({
  loadingSkeleton,
  emptyState,
  className,
  children,
}: DataViewContentProps) {
  const { data, isLoading, isFetching } = useDataView()

  const hasData = data && data.length > 0

  return (
    <div className={cn('w-full', className)}>
      {/* Loading State (initial load, no data yet) */}
      {isLoading && !hasData && loadingSkeleton && (
        <div>{loadingSkeleton}</div>
      )}

      {/* Empty State */}
      {!isLoading && !isFetching && !hasData && emptyState && (
        <div>{emptyState}</div>
      )}

      {/* Content (has data) */}
      {hasData && children}
    </div>
  )
}

