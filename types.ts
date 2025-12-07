/**
 * DataView Component Types
 * 
 * Type definitions for the composition-based DataView component system.
 */

import { ReactNode } from 'react'

// ============================================================================
// Core Types
// ============================================================================

export type ViewMode = 'list' | 'grid'
export type PaginationType = 'load-more' | 'infinite-scroll' | 'classic' | 'none'

// ============================================================================
// Filter Types
// ============================================================================

export interface FilterOption {
  /** Display label for the option */
  label: string
  /** Value stored in URL and used for filtering */
  value: string
  /** Optional count to show next to option */
  count?: number
  /** Optional icon component */
  icon?: ReactNode
}

export interface FilterGroup {
  /** Unique identifier, used as URL param key */
  id: string
  /** Display label for the filter group */
  label: string
  /** single = radio buttons, multiple = checkboxes */
  mode: 'single' | 'multiple'
  /** Available filter options */
  options: FilterOption[]
  /** Enable search within options */
  searchable?: boolean
  /** Default values when no URL param present */
  defaultValue?: string[]
}

export interface SortOption {
  /** Display label */
  label: string
  /** Value stored in URL (e.g., "created_at:desc") */
  value: string
}

// ============================================================================
// Filter & Query Types
// ============================================================================

export type FilterOperator =
  | 'eq'       // equals
  | 'neq'      // not equals
  | 'gt'       // greater than
  | 'gte'      // greater than or equal
  | 'lt'       // less than
  | 'lte'      // less than or equal
  | 'like'     // LIKE pattern match
  | 'ilike'    // case-insensitive LIKE
  | 'in'       // in array
  | 'contains' // JSON/Array contains
  | 'cs'       // contains (alias)
  | 'is'       // IS NULL / IS NOT NULL

/**
 * Defines how a filter ID maps to a Supabase column and operator.
 * Used by the query builder to construct WHERE clauses.
 */
export interface FilterColumnMapping {
  /** The filter group ID (matches FilterGroup.id) */
  filterId: string
  /** The Supabase column name to filter on */
  column: string
  /** The filter operator to use */
  operator: FilterOperator
  /** Transform function for values before applying filter */
  transform?: (values: string[]) => unknown
}

// ============================================================================
// Data Fetching Interface
// ============================================================================

/**
 * Generic fetch context passed to custom fetchers.
 * This allows DataView to work with any data source, not just Supabase.
 */
export interface DataFetchContext {
  /** Current page number (1-indexed) */
  page: number
  /** Number of items per page */
  pageSize: number
  /** Number of items to skip (calculated from page and pageSize) */
  skip: number
  /** Current filter values */
  filters: Record<string, string[]>
  /** Current search query */
  search: string
  /** Current sort value (e.g., "created_at:desc") */
  sort: string | undefined
}

/**
 * Result type from a custom data fetcher.
 */
export interface DataFetchResult<T> {
  /** Fetched data items */
  data: T[]
  /** Total count of items (for pagination) */
  count: number
  /** Optional error message */
  error?: string
}

/**
 * Callback function called after data is successfully fetched.
 * Useful for post-processing data (e.g., fetching relations).
 * 
 * @example
 * ```tsx
 * // Enrich projects with member data after fetching
 * const onDataLoaded: OnDataLoaded<Project, ProjectWithMembers> = async (data, ctx) => {
 *   const memberData = await fetchMembers(data.map(p => p.id));
 *   return data.map(project => ({
 *     ...project,
 *     members: memberData[project.id] || []
 *   }));
 * };
 * ```
 */
export type OnDataLoaded<TInput, TOutput = TInput> = (
  data: TInput[],
  context: DataFetchContext
) => Promise<TOutput[]> | TOutput[]

/**
 * Initial data for SSR hydration.
 * This allows the server to pass the first page of data to the client,
 * eliminating the loading state on initial page load.
 */
export interface InitialData<T> {
  /** Pre-fetched data items */
  data: T[]
  /** Total count of items */
  count: number
}

// ============================================================================
// Supporting Types
// ============================================================================

export interface GridCols {
  sm?: number
  md?: number
  lg?: number
  xl?: number
  '2xl'?: number
}

// ============================================================================
// Active Tags Types
// ============================================================================

/**
 * Represents a single active tag (filter or search).
 */
export interface ActiveTag {
  /** Unique identifier for this tag */
  id: string
  /** Type of tag: "search" or "filter" */
  type: 'search' | 'filter'
  /** Filter group ID (for filter tags only) */
  filterId?: string
  /** Filter group label (for filter tags only) */
  filterLabel?: string
  /** Display label for the tag category */
  label: string
  /** The actual filter value */
  value: string
  /** Human-readable display value */
  displayValue: string
}
