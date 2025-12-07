/**
 * DataView Component System (Composition Pattern)
 * 
 * A composition-based data view system for displaying filterable, sortable,
 * paginated data with full customization through primitive components.
 * 
 * Main exports:
 * - DataViewProvider: Root provider with state management
 * - useDataView: Hook to access context
 * - Primitive components: Search, Filters, Sort, ViewToggle, Content, List, Grid, etc.
 * 
 * @example
 * ```tsx
 * // Basic usage with composition
 * <DataViewProvider tableName="tasks" filters={filters} paginationType="classic">
 *   <DataViewToolbar>
 *     <DataViewSearch placeholder="Search..." />
 *     <DataViewFilters />
 *     <DataViewSort />
 *     <DataViewViewToggle />
 *   </DataViewToolbar>
 *   
 *   <DataViewActiveTags />
 *   
 *   <DataViewContent
 *     loadingSkeleton={<Skeleton />}
 *     emptyState={<EmptyState />}
 *   >
 *     <DataViewList>{(item) => <TaskCard item={item} />}</DataViewList>
 *     <DataViewGrid cols={{ md: 2, lg: 3 }}>{(item) => <TaskCard item={item} />}</DataViewGrid>
 *   </DataViewContent>
 *   
 *   <DataViewPagination />
 *   <DataViewLoadMore />
 *   <DataViewInfiniteScroll />
 * </DataViewProvider>
 * ```
 */

// ============================================================================
// Core Provider & Context
// ============================================================================

export { DataViewProvider } from './data-view-provider'
export type { DataViewProviderProps } from './data-view-provider'

export { useDataView } from './data-view-context'
export type { DataViewContextValue } from './data-view-context'

// ============================================================================
// Primitive Components
// ============================================================================

// Toolbar Components
export { DataViewToolbar } from './data-view-toolbar'
export { DataViewSearch } from './data-view-search'
export { DataViewFilters } from './data-view-filters'
export { DataViewSort } from './data-view-sort'
export { DataViewViewToggle } from './data-view-view-toggle'

// Active Tags
export { DataViewActiveTags } from './data-view-active-tags'

// Content Components
export { DataViewContent } from './data-view-content'
export { DataViewList } from './data-view-list'
export { DataViewGrid } from './data-view-grid'

// Pagination Components
export { DataViewPagination } from './data-view-pagination'
export { DataViewLoadMore } from './data-view-load-more'
export { DataViewInfiniteScroll } from './data-view-infinite-scroll'

// ============================================================================
// Client-side Hooks
// ============================================================================

export {
  useDataViewInfiniteQuery,
  type FilterColumnMapping as InfiniteQueryFilterMapping,
  type CustomFetcher,
  type UseDataViewInfiniteQueryProps,
} from './hooks/use-data-view-infinite-query'

export {
  useDataViewUrlState,
  type UseDataViewUrlStateOptions,
  type UseDataViewUrlStateReturn,
} from './hooks/use-data-view-url-state'

// ============================================================================
// Types
// ============================================================================

export type {
  // Core types
  ViewMode,
  PaginationType,
  GridCols,
  
  // Filter types
  FilterOption,
  FilterGroup,
  SortOption,
  FilterOperator,
  FilterColumnMapping,
  
  // Data fetching interface
  DataFetchContext,
  DataFetchResult,
  OnDataLoaded,
  InitialData,
  
  // Active tags
  ActiveTag,
} from './types'
