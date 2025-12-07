'use client'

/**
 * DataViewGrid Component
 * 
 * Renders items in grid mode with responsive column configuration.
 * Only displays when viewMode is 'grid'.
 * 
 * @example
 * ```tsx
 * <DataViewGrid cols={{ sm: 1, md: 2, lg: 3 }}>
 *   {(item, index) => <TaskCard key={item.id} task={item} />}
 * </DataViewGrid>
 * ```
 */

import { type ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { useDataView } from './data-view-context'
import type { GridCols } from './types'

// ============================================================================
// Types
// ============================================================================

export interface DataViewGridProps<T = any> {
  /** Render function for each item */
  children: (item: T, index: number) => ReactNode
  /** Responsive column configuration */
  cols?: GridCols
  /** Additional className for styling */
  className?: string
}

// ============================================================================
// Helper
// ============================================================================

function getGridClassName(cols: GridCols): string {
  const classes: string[] = []
  
  if (cols.sm) classes.push(`grid-cols-${cols.sm}`)
  if (cols.md) classes.push(`md:grid-cols-${cols.md}`)
  if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`)
  if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`)
  if (cols['2xl']) classes.push(`2xl:grid-cols-${cols['2xl']}`)
  
  return classes.join(' ')
}

// ============================================================================
// Component
// ============================================================================

export function DataViewGrid<T = any>({
  children,
  cols = { sm: 1, md: 2, lg: 3 },
  className,
}: DataViewGridProps<T>) {
  const { data, viewMode } = useDataView<T>()

  // Only render in grid mode
  if (viewMode !== 'grid') {
    return null
  }

  return (
    <div className={cn('grid gap-4', getGridClassName(cols), className)}>
      {data.map((item, index) => children(item, index))}
    </div>
  )
}

