'use client'

/**
 * DataViewToolbar Component (Composition Version)
 * 
 * Simplified layout wrapper for DataView toolbar primitives.
 * No longer manages state - just provides layout for Search, Filters, Sort, ViewToggle components.
 * 
 * @example
 * ```tsx
 * <DataViewToolbar>
 *   <DataViewSearch placeholder="Search..." />
 *   <DataViewFilters />
 *   <DataViewSort />
 *   <DataViewViewToggle />
 * </DataViewToolbar>
 * ```
 */

import { type ReactNode } from 'react'
import { cn } from '@/utils/cn'

// ============================================================================
// Types
// ============================================================================

export interface DataViewToolbarProps {
  /** Child components (Search, Filters, Sort, ViewToggle) */
  children: ReactNode
  /** Additional className for styling */
  className?: string
}

// ============================================================================
// Component
// ============================================================================

export function DataViewToolbar({ children, className }: DataViewToolbarProps) {
  return (
    <div className={cn('flex flex-1 gap-2 mb-4', className)}>
      {children}
    </div>
  )
}

