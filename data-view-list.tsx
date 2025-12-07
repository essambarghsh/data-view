'use client'

/**
 * DataViewList Component
 * 
 * Renders items in list mode.
 * Only displays when viewMode is 'list'.
 * 
 * @example
 * ```tsx
 * <DataViewList>
 *   {(item, index) => <TaskCard key={item.id} task={item} />}
 * </DataViewList>
 * ```
 */

import { type ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { useDataView } from './data-view-context'

// ============================================================================
// Types
// ============================================================================

export interface DataViewListProps<T = any> {
  /** Render function for each item */
  children: (item: T, index: number) => ReactNode
  /** Additional className for styling */
  className?: string
}

// ============================================================================
// Component
// ============================================================================

export function DataViewList<T = any>({
  children,
  className,
}: DataViewListProps<T>) {
  const { data, viewMode } = useDataView<T>()

  // Only render in list mode
  if (viewMode !== 'list') {
    return null
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {data.map((item, index) => children(item, index))}
    </div>
  )
}

