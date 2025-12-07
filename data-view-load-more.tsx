'use client'

/**
 * DataViewLoadMore Component
 * 
 * Load more button primitive for DataView.
 * Only displays when paginationType is 'load-more' and hasMore is true.
 * Connects to DataViewContext for state management.
 * 
 * @example
 * ```tsx
 * <DataViewLoadMore label="Load more items" />
 * ```
 */

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useDataView } from './data-view-context'
import { cn } from '@/utils/cn'

// ============================================================================
// Types
// ============================================================================

export interface DataViewLoadMoreProps {
  /** Button label text */
  label?: string
  /** Additional className for styling */
  className?: string
}

// ============================================================================
// Component
// ============================================================================

export function DataViewLoadMore({ label, className }: DataViewLoadMoreProps) {
  const { paginationType, hasMore, isFetching, fetchNextPage } = useDataView()
  const t = useTranslations('Common')

  // Only render for load-more pagination type
  if (paginationType !== 'load-more') {
    return null
  }

  // Don't render if no more data
  if (!hasMore) {
    return null
  }

  const buttonLabel = label || t('loadMore')

  return (
    <div className={cn('flex justify-center mt-6', className)}>
      <Button
        variant="outline"
        onClick={fetchNextPage}
        disabled={isFetching}
        className="bg-white text-muted-foreground border-border text-xs font-medium min-w-32 px-4 py-2 rounded-xl items-center justify-center"
      >
        {isFetching ? <Spinner className="size-6" /> : buttonLabel}
      </Button>
    </div>
  )
}

