'use client'

/**
 * DataView Context
 * 
 * Provides shared state and data management for all DataView primitive components.
 * Integrates useDataViewUrlState and useDataViewInfiniteQuery hooks internally.
 * 
 * Components access context via useDataView() hook.
 */

import { createContext, useContext } from 'react'
import type {
  ViewMode,
  PaginationType,
  FilterGroup,
  SortOption,
} from './types'

// ============================================================================
// Context Value Interface
// ============================================================================

export interface DataViewContextValue<T = any> {
  // =========================================================================
  // Data State
  // =========================================================================
  
  /** Fetched data items */
  data: T[]
  /** Total count of items (all pages) */
  totalCount: number
  /** Initial loading state (no data yet) */
  isLoading: boolean
  /** Refetching state (has data, fetching more) */
  isFetching: boolean
  /** Error from last fetch */
  error: Error | null
  
  // =========================================================================
  // URL State (search, filters, sort, pagination)
  // =========================================================================
  
  /** Current search query */
  currentSearch: string
  /** Current active filters (filter ID => values) */
  currentFilters: Record<string, string[]>
  /** Current sort value (e.g., "created_at:desc") */
  currentSort: string | undefined
  /** Current page number (1-indexed, for classic pagination) */
  currentPage: number
  /** Items per page */
  currentLimit: number
  
  // =========================================================================
  // View Mode State
  // =========================================================================
  
  /** Current view mode (list or grid) */
  viewMode: ViewMode
  
  // =========================================================================
  // Loading State
  // =========================================================================
  
  /** URL transition pending state */
  isPending: boolean
  
  // =========================================================================
  // Configuration (from Provider props)
  // =========================================================================
  
  /** Available filter groups */
  filters?: FilterGroup[]
  /** Available sort options */
  sortOptions?: SortOption[]
  /** Pagination type */
  paginationType: PaginationType
  /** Page size */
  pageSize: number
  /** Has more pages to load */
  hasMore: boolean
  /** Forced view mode (disables toggle) */
  forcedViewMode?: ViewMode
  
  // =========================================================================
  // Event Handlers
  // =========================================================================
  
  /** Update search query */
  handleSearchChange: (search: string) => void
  /** Update active filters */
  handleFiltersChange: (filters: Record<string, string[]>) => void
  /** Update sort option */
  handleSortChange: (sort: string) => void
  /** Change page (for classic pagination) */
  handlePageChange: (page: number) => void
  /** Change page size */
  handleLimitChange: (limit: number) => void
  /** Change view mode */
  handleViewModeChange: (mode: ViewMode) => void
  
  // =========================================================================
  // Data Actions
  // =========================================================================
  
  /** Fetch next page (for infinite scroll / load more) */
  fetchNextPage: () => void
  /** Refetch current data */
  refetch: () => void
}

// ============================================================================
// Create Context
// ============================================================================

export const DataViewContext = createContext<DataViewContextValue | null>(null)

// ============================================================================
// useDataView Hook
// ============================================================================

/**
 * Hook to access DataView context from any child component.
 * Must be used within a DataViewProvider.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { data, isLoading, handleSearchChange } = useDataView();
 *   // ...
 * }
 * ```
 */
export function useDataView<T = any>(): DataViewContextValue<T> {
  const context = useContext(DataViewContext)
  
  if (!context) {
    throw new Error('useDataView must be used within a DataViewProvider')
  }
  
  return context as DataViewContextValue<T>
}

