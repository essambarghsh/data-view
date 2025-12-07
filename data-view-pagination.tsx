'use client'

/**
 * DataViewPagination Component (Composition Version)
 * 
 * Classic pagination primitive for DataView.
 * Only displays when paginationType is 'classic'.
 * Connects to DataViewContext for state management.
 * 
 * Note: For load-more and infinite-scroll, use DataViewLoadMore and
 * DataViewInfiniteScroll components instead.
 * 
 * @example
 * ```tsx
 * <DataViewPagination />
 * ```
 */

import { useTranslations } from 'next-intl'
import { cn } from '@/utils/cn'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { useDataView } from './data-view-context'

// ============================================================================
// Types
// ============================================================================

export interface DataViewPaginationProps {
  /** Additional className for styling */
  className?: string
}

// ============================================================================
// Component
// ============================================================================

export function DataViewPagination({ className }: DataViewPaginationProps) {
  const { 
    paginationType, 
    currentPage, 
    totalCount, 
    pageSize, 
    handlePageChange 
  } = useDataView()
  const t = useTranslations('Common')

  // Only render for classic pagination
  if (paginationType !== 'classic') {
    return null
  }

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / pageSize)

  // Don't render if only 1 page
  if (totalPages <= 1) {
    return null
  }

  return (
    <Pagination className={cn('mt-6', className)}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault()
              if (currentPage > 1) handlePageChange(currentPage - 1)
            }}
            aria-disabled={currentPage <= 1}
            className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>

        <PaginationItem>
          <span className="px-4 text-sm text-muted-foreground">
            {t('page')} {currentPage} {t('of')} {totalPages}
          </span>
        </PaginationItem>

        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault()
              if (currentPage < totalPages) handlePageChange(currentPage + 1)
            }}
            aria-disabled={currentPage >= totalPages}
            className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
