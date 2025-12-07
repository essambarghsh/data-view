'use client'

/**
 * DataViewProvider Component
 * 
 * Root provider component that manages all DataView state and data fetching.
 * Integrates useDataViewUrlState and useDataViewInfiniteQuery hooks internally.
 * 
 * @example
 * ```tsx
 * <DataViewProvider tableName="tasks" filters={filters} paginationType="classic">
 *   <DataViewToolbar>
 *     <DataViewSearch />
 *     <DataViewFilters />
 *   </DataViewToolbar>
 *   <DataViewContent>
 *     <DataViewList>{(item) => <TaskCard item={item} />}</DataViewList>
 *   </DataViewContent>
 *   <DataViewPagination />
 * </DataViewProvider>
 * ```
 */

import { useCallback, type ReactNode } from 'react'
import { DataViewContext, type DataViewContextValue } from './data-view-context'
import { useDataViewUrlState } from './hooks/use-data-view-url-state'
import {
  useDataViewInfiniteQuery,
  type FilterColumnMapping,
  type CustomFetcher,
} from './hooks/use-data-view-infinite-query'
import type {
  FilterGroup,
  SortOption,
  ViewMode,
  PaginationType,
  InitialData,
  OnDataLoaded,
  DataFetchContext,
} from './types'

// ============================================================================
// Types
// ============================================================================

type SupabaseTableName = string

export interface DataViewProviderProps<T, TOutput = T, TTable extends SupabaseTableName = string> {
  // =========================================================================
  // Data Source (choose one: tableName OR customFetcher)
  // =========================================================================

  /** Supabase table name to query (required if not using customFetcher) */
  tableName?: TTable
  /** Columns to select (default: "*") */
  columns?: string
  /** Additional query modifications (applied after filters/search/sort) */
  baseQuery?: (query: any) => any

  /** 
   * Custom fetcher function for non-Supabase data sources.
   * When provided, tableName and Supabase-specific options are ignored.
   */
  customFetcher?: CustomFetcher<T>

  // =========================================================================
  // SSR Hydration
  // =========================================================================

  /** 
   * Initial data from server for SSR hydration.
   * Eliminates loading state on initial page load.
   */
  initialData?: InitialData<TOutput>

  // =========================================================================
  // Data Transformation
  // =========================================================================

  /**
   * Callback to transform/enrich data after fetching.
   * Useful for fetching relations or computing derived fields.
   */
  onDataLoaded?: OnDataLoaded<T, TOutput>

  /**
   * Callback when refetch function is ready (for real-time integration).
   */
  onRefetchReady?: (refetch: () => void) => void

  // =========================================================================
  // Pagination
  // =========================================================================

  /** The number of items to fetch per page */
  pageSize?: number
  /** Pagination type */
  paginationType?: PaginationType

  // =========================================================================
  // Filters
  // =========================================================================

  /** Filter groups configuration */
  filters?: FilterGroup[]
  /** Filter to column mappings for Supabase queries */
  filterMappings?: FilterColumnMapping[]

  // =========================================================================
  // Search
  // =========================================================================

  /** Single column to search (e.g., "name") */
  searchColumn?: string
  /** Multiple columns to search (OR condition) */
  searchColumns?: string[]

  // =========================================================================
  // Sort
  // =========================================================================

  /** Available sort options */
  sortOptions?: SortOption[]
  /** Default sort (applied when no URL param) */
  defaultSort?: { column: string; ascending: boolean }

  // =========================================================================
  // View Mode
  // =========================================================================

  /** Default view mode (list or grid) */
  defaultViewMode?: ViewMode
  /** Force a specific view mode (disables toggle) */
  forcedViewMode?: ViewMode

  // =========================================================================
  // URL State
  // =========================================================================

  /** URL namespace prefix for multiple DataViews on same page */
  urlNamespace?: string

  // =========================================================================
  // Children
  // =========================================================================

  /** Child components (primitives like DataViewSearch, DataViewList, etc.) */
  children: ReactNode
}

// ============================================================================
// Component
// ============================================================================

export function DataViewProvider<T, TOutput = T, TTable extends SupabaseTableName = string>({
  // Data source
  tableName,
  columns = '*',
  baseQuery,
  customFetcher,

  // SSR hydration
  initialData,

  // Data transformation
  onDataLoaded,
  onRefetchReady,

  // Pagination
  pageSize = 20,
  paginationType = 'load-more',

  // Filters
  filters,
  filterMappings = [],

  // Search
  searchColumn,
  searchColumns = [],

  // Sort
  sortOptions,
  defaultSort,

  // View mode
  defaultViewMode = 'list',
  forcedViewMode,

  // URL state
  urlNamespace = '',

  // Children
  children,
}: DataViewProviderProps<T, TOutput, TTable>) {
  // =========================================================================
  // URL State Management
  // =========================================================================

  const {
    currentSearch,
    currentFilters,
    currentSort,
    currentPage,
    currentLimit,
    viewMode,
    isPending,
    handleSearchChange,
    handleFiltersChange,
    handleSortChange,
    handlePageChange,
    handleLimitChange,
    handleViewModeChange,
  } = useDataViewUrlState({
    filters,
    urlNamespace,
    defaultViewMode,
    forcedViewMode,
    defaultSort: defaultSort ? `${defaultSort.column}:${defaultSort.ascending ? 'asc' : 'desc'}` : undefined,
    defaultLimit: pageSize,
    useTransitions: paginationType === 'classic', // Classic pagination benefits from transitions
    resetPageOnChange: paginationType === 'classic', // Classic pagination resets page on filter/search change
  })

  // =========================================================================
  // Data Fetching
  // =========================================================================

  const {
    data,
    count: totalCount,
    isLoading,
    isFetching,
    error,
    hasMore,
    fetchNextPage,
    refetch,
  } = useDataViewInfiniteQuery<any>({
    // Data source
    tableName,
    columns,
    baseQuery,
    customFetcher,

    // SSR hydration
    initialData,

    // Data transformation
    onDataLoaded,

    // Pagination
    pageSize,
    paginationMode: paginationType === 'classic' ? 'classic' : 'infinite',
    currentPage: paginationType === 'classic' ? currentPage : undefined,

    // Filters
    filters: currentFilters,
    filterMappings,

    // Search
    search: currentSearch,
    searchColumn,
    searchColumns,

    // Sort
    sort: currentSort,
  })

  // =========================================================================
  // Expose Refetch to Parent
  // =========================================================================

  // Call onRefetchReady when refetch is available
  if (onRefetchReady && refetch) {
    onRefetchReady(refetch)
  }

  // =========================================================================
  // Context Value
  // =========================================================================

  const contextValue: DataViewContextValue<TOutput> = {
    // Data state
    data: data as TOutput[],
    totalCount,
    isLoading,
    isFetching,
    error,

    // URL state
    currentSearch,
    currentFilters,
    currentSort,
    currentPage,
    currentLimit,

    // View mode
    viewMode,

    // Loading state
    isPending,

    // Configuration
    filters,
    sortOptions,
    paginationType,
    pageSize,
    hasMore,
    forcedViewMode,

    // Event handlers
    handleSearchChange,
    handleFiltersChange,
    handleSortChange,
    handlePageChange,
    handleLimitChange,
    handleViewModeChange,

    // Data actions
    fetchNextPage,
    refetch,
  }

  // =========================================================================
  // Render
  // =========================================================================

  return (
    <DataViewContext.Provider value={contextValue}>
      {children}
    </DataViewContext.Provider>
  )
}

