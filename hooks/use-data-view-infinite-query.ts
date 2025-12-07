'use client'

/**
 * useDataViewInfiniteQuery Hook
 * 
 * A powerful hook for infinite scroll/load-more data fetching that integrates
 * with DataView's filter/search/sort system.
 * 
 * Features:
 * 1. SSR hydration support via `initialData` prop
 * 2. Custom data fetcher support for non-Supabase data sources
 * 3. Post-fetch data transformation via `onDataLoaded` callback
 * 4. Automatic reset when filters/search/sort change
 * 5. URL-based state management integration
 * 
 * @example
 * ```tsx
 * // Basic usage with Supabase
 * const { data, fetchNextPage, hasMore } = useDataViewInfiniteQuery({
 *   tableName: 'projects',
 *   filters: currentFilters,
 *   search: currentSearch,
 * });
 * 
 * // With SSR hydration
 * const { data } = useDataViewInfiniteQuery({
 *   tableName: 'projects',
 *   initialData: { data: serverData, count: totalCount },
 * });
 * 
 * // With custom fetcher
 * const { data } = useDataViewInfiniteQuery({
 *   customFetcher: async (ctx) => {
 *     const res = await fetch(`/api/items?page=${ctx.page}`);
 *     return res.json();
 *   },
 * });
 * ```
 */

import { createClient } from '@/utils/supabase/client'
import { type SupabaseClient } from '@supabase/supabase-js'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { DataFetchContext, DataFetchResult, InitialData, OnDataLoaded, FilterColumnMapping } from '../types'

const supabase = createClient()

// Extract database types from the supabase client
type SupabaseClientType = typeof supabase
type IfAny<T, Y, N> = 0 extends 1 & T ? Y : N
type Database =
  SupabaseClientType extends SupabaseClient<infer U>
    ? IfAny<
        U,
        {
          public: {
            Tables: Record<string, any>
            Views: Record<string, any>
            Functions: Record<string, any>
          }
        },
        U
      >
    : {
        public: {
          Tables: Record<string, any>
          Views: Record<string, any>
          Functions: Record<string, any>
        }
      }

type DatabaseSchema = Database['public']
type SupabaseTableName = keyof DatabaseSchema['Tables']
type SupabaseTableData<T extends SupabaseTableName> = DatabaseSchema['Tables'][T]['Row']

// Re-export FilterColumnMapping from types for convenience
export type { FilterColumnMapping }

/**
 * Custom fetcher function type for non-Supabase data sources.
 */
export type CustomFetcher<TData> = (context: DataFetchContext) => Promise<DataFetchResult<TData>>

export interface UseDataViewInfiniteQueryProps<T extends SupabaseTableName> {
  // =========================================================================
  // Supabase Configuration (used when customFetcher is not provided)
  // =========================================================================
  
  /** The table name to query (required for Supabase mode) */
  tableName?: T
  /** The columns to select, defaults to `*` */
  columns?: string
  /** Additional query modifications (applied after filters/search/sort) */
  baseQuery?: (query: any) => any
  
  // =========================================================================
  // Custom Fetcher (alternative to Supabase)
  // =========================================================================
  
  /** 
   * Custom fetcher function for non-Supabase data sources.
   * When provided, tableName and Supabase-specific options are ignored.
   */
  customFetcher?: CustomFetcher<any>
  
  // =========================================================================
  // SSR Hydration
  // =========================================================================
  
  /** 
   * Initial data from server for SSR hydration.
   * Eliminates loading state on initial page load.
   */
  initialData?: InitialData<any>
  
  // =========================================================================
  // Data Transformation
  // =========================================================================
  
  /**
   * Callback to transform/enrich data after fetching.
   * Useful for fetching relations or computing derived fields.
   */
  onDataLoaded?: OnDataLoaded<any, any>
  
  // =========================================================================
  // Pagination
  // =========================================================================
  
  /** The number of items to fetch per page, defaults to `20` */
  pageSize?: number
  /** 
   * Pagination mode: 'infinite' (accumulates data) or 'classic' (replaces data per page).
   * Defaults to 'infinite' for backward compatibility.
   */
  paginationMode?: 'infinite' | 'classic'
  /** Current page number (1-indexed, required for classic mode) */
  currentPage?: number
  
  // =========================================================================
  // Filters
  // =========================================================================
  
  /** Current filter values from URL state */
  filters?: Record<string, string[]>
  /** Mapping from filter IDs to database columns */
  filterMappings?: FilterColumnMapping[]
  
  // =========================================================================
  // Search
  // =========================================================================
  
  /** Current search query */
  search?: string
  /** Column to search in (for single column search) */
  searchColumn?: string
  /** Multiple columns to search in (OR'd together) */
  searchColumns?: string[]
  
  // =========================================================================
  // Sort
  // =========================================================================
  
  /** Current sort value (format: "column:direction") */
  sort?: string
  /** Default sort if none specified */
  defaultSort?: { column: string; ascending: boolean }
  
  // =========================================================================
  // Options
  // =========================================================================
  
  /** Enable/disable the query (useful for conditional fetching) */
  enabled?: boolean
}

interface StoreState<TData> {
  data: TData[]
  count: number
  isSuccess: boolean
  isLoading: boolean
  isFetching: boolean
  error: Error | null
  hasInitialFetch: boolean
}

/**
 * Apply filters to a Supabase query
 */
function applyFilters(
  query: any,
  filters: Record<string, string[]>,
  filterMappings: FilterColumnMapping[]
): any {
  let modifiedQuery = query
  
  for (const mapping of filterMappings) {
    const values = filters[mapping.filterId]
    if (!values || values.length === 0) continue
    
    const transformedValues = mapping.transform ? mapping.transform(values) : values
    
    switch (mapping.operator) {
      case 'eq':
        modifiedQuery = modifiedQuery.eq(mapping.column, values[0])
        break
      case 'neq':
        modifiedQuery = modifiedQuery.neq(mapping.column, values[0])
        break
      case 'in':
        modifiedQuery = modifiedQuery.in(mapping.column, transformedValues)
        break
      case 'ilike':
        modifiedQuery = modifiedQuery.ilike(mapping.column, `%${values[0]}%`)
        break
      case 'like':
        modifiedQuery = modifiedQuery.like(mapping.column, `%${values[0]}%`)
        break
      case 'gt':
        modifiedQuery = modifiedQuery.gt(mapping.column, values[0])
        break
      case 'gte':
        modifiedQuery = modifiedQuery.gte(mapping.column, values[0])
        break
      case 'lt':
        modifiedQuery = modifiedQuery.lt(mapping.column, values[0])
        break
      case 'lte':
        modifiedQuery = modifiedQuery.lte(mapping.column, values[0])
        break
      case 'contains':
        modifiedQuery = modifiedQuery.contains(mapping.column, transformedValues)
        break
      case 'is':
        modifiedQuery = modifiedQuery.is(mapping.column, transformedValues)
        break
    }
  }
  
  return modifiedQuery
}

/**
 * Apply search to a Supabase query
 */
function applySearch(
  query: any,
  search: string,
  searchColumn?: string,
  searchColumns?: string[]
): any {
  const trimmedSearch = search.trim()
  if (!trimmedSearch) return query
  
  // Build OR conditions for all search columns
  const columns = searchColumns?.length ? searchColumns : searchColumn ? [searchColumn] : []
  
  if (columns.length === 0) return query
  
  if (columns.length === 1) {
    return query.ilike(columns[0], `%${trimmedSearch}%`)
  }
  
  // Multiple columns: use OR filter
  const orConditions = columns.map(col => `${col}.ilike.%${trimmedSearch}%`).join(',')
  return query.or(orConditions)
}

/**
 * Apply sort to a Supabase query
 */
function applySort(
  query: any,
  sort?: string,
  defaultSort?: { column: string; ascending: boolean }
): any {
  if (sort) {
    const [column, direction] = sort.split(':')
    return query.order(column, { ascending: direction !== 'desc' })
  }
  
  if (defaultSort) {
    return query.order(defaultSort.column, { ascending: defaultSort.ascending })
  }
  
  return query
}

/**
 * Create a stable key from the query parameters for cache invalidation
 */
function createQueryKey(props: UseDataViewInfiniteQueryProps<any>): string {
  return JSON.stringify({
    tableName: props.tableName,
    columns: props.columns,
    filters: props.filters,
    search: props.search,
    sort: props.sort,
    // Include custom fetcher identity if available
    hasCustomFetcher: !!props.customFetcher,
  })
}

/**
 * Create a DataFetchContext from the current state
 */
function createFetchContext(
  page: number,
  pageSize: number,
  skip: number,
  filters: Record<string, string[]>,
  search: string,
  sort: string | undefined
): DataFetchContext {
  return {
    page,
    pageSize,
    skip,
    filters,
    search,
    sort,
  }
}

export function useDataViewInfiniteQuery<
  TData = any,
  TOutput = TData,
  T extends SupabaseTableName = SupabaseTableName,
>(props: UseDataViewInfiniteQueryProps<T>) {
  const {
    // Supabase config
    tableName,
    columns = '*',
    baseQuery,
    
    // Custom fetcher
    customFetcher,
    
    // SSR hydration
    initialData,
    
    // Data transformation
    onDataLoaded,
    
    // Pagination
    pageSize = 20,
    paginationMode = 'infinite',
    currentPage = 1,
    
    // Filters
    filters = {},
    filterMappings = [],
    
    // Search
    search = '',
    searchColumn,
    searchColumns = [],
    
    // Sort
    sort,
    defaultSort,
    
    // Options
    enabled = true,
  } = props

  // Initialize state with initialData if provided (SSR hydration)
  const [state, setState] = useState<StoreState<TOutput>>(() => {
    if (initialData && initialData.data.length > 0) {
      return {
        data: initialData.data as TOutput[],
        count: initialData.count,
        isSuccess: true,
        isLoading: false,
        isFetching: false,
        error: null,
        hasInitialFetch: true,
      }
    }
    // Start with isLoading: true so skeleton shows immediately
    return {
      data: [],
      count: 0,
      isSuccess: false,
      isLoading: true,
      isFetching: false,
      error: null,
      hasInitialFetch: false,
    }
  })

  // Track the current query key to detect changes
  const queryKeyRef = useRef<string>('')
  const currentQueryKey = createQueryKey(props)
  
  // Track if we've initialized with initialData
  const initialDataUsedRef = useRef(!!initialData?.data.length)
  
  // Use refs to track state values that shouldn't trigger callback recreation
  const stateRef = useRef(state)
  stateRef.current = state
  
  // Track if we're currently fetching (synchronous check to prevent race conditions)
  const isFetchingRef = useRef(false)
  
  // Track filter/search/sort/page via refs to avoid recreating fetchPage on every render
  const filtersRef = useRef(filters)
  filtersRef.current = filters
  const searchRef = useRef(search)
  searchRef.current = search
  const sortRef = useRef(sort)
  sortRef.current = sort
  const currentPageRef = useRef(currentPage)
  currentPageRef.current = currentPage
  const paginationModeRef = useRef(paginationMode)
  paginationModeRef.current = paginationMode

  // =========================================================================
  // Supabase Fetcher (default)
  // =========================================================================
  
  const supabaseFetcher = useCallback(async (ctx: DataFetchContext): Promise<DataFetchResult<TData>> => {
    if (!tableName) {
      throw new Error('[useDataViewInfiniteQuery] tableName is required when not using customFetcher')
    }
    
    // Build the query
    let query = supabase
      .from(tableName)
      .select(columns, { count: 'exact' })

    // Apply base query modifications
    if (baseQuery) {
      query = baseQuery(query)
    }

    // Apply filters
    query = applyFilters(query, ctx.filters, filterMappings)

    // Apply search
    if (ctx.search && (searchColumn || searchColumns.length > 0)) {
      query = applySearch(query, ctx.search, searchColumn, searchColumns)
    }

    // Apply sort
    query = applySort(query, ctx.sort, defaultSort)

    // Apply pagination
    query = query.range(ctx.skip, ctx.skip + ctx.pageSize - 1)

    const { data, count, error } = await query

    if (error) {
      return { data: [], count: 0, error: error.message }
    }

    return {
      data: (data as TData[]) || [],
      count: count || 0,
    }
  }, [tableName, columns, baseQuery, filterMappings, searchColumn, searchColumns, defaultSort])

  // =========================================================================
  // Fetch Page
  // =========================================================================

  const fetchPage = useCallback(async (skip: number, isReset: boolean = false) => {
    // Don't fetch if disabled
    if (!enabled) return
    
    // Prevent re-entry - use ref for synchronous check
    if (isFetchingRef.current) return

    const currentState = stateRef.current
    const isClassicMode = paginationModeRef.current === 'classic'
    
    // For classic mode, always fetch the current page
    // For infinite mode, don't fetch if we already have all data (unless resetting)
    if (!isClassicMode && !isReset && currentState.hasInitialFetch && currentState.count <= currentState.data.length) {
      return
    }

    // Mark as fetching synchronously BEFORE any async operations
    isFetchingRef.current = true
    setState(prev => ({ ...prev, isFetching: true, isLoading: !prev.hasInitialFetch || isReset }))

    try {
      // Create fetch context using refs for current values
      // For classic mode, use currentPage; for infinite mode, calculate from skip
      const page = isClassicMode ? currentPageRef.current : Math.floor(skip / pageSize) + 1
      const actualSkip = isClassicMode ? (currentPageRef.current - 1) * pageSize : skip
      
      const ctx = createFetchContext(
        page, 
        pageSize, 
        actualSkip, 
        filtersRef.current, 
        searchRef.current, 
        sortRef.current
      )
      
      // Use custom fetcher or default Supabase fetcher
      const fetcher = customFetcher || supabaseFetcher
      const result = await fetcher(ctx)

      if (result.error) {
        console.error('[useDataViewInfiniteQuery] Error:', result.error)
        isFetchingRef.current = false
        setState(prev => ({
          ...prev,
          error: new Error(result.error!),
          isFetching: false,
          isLoading: false,
        }))
        return
      }

      // Apply data transformation if provided
      let processedData = result.data as TOutput[]
      if (onDataLoaded) {
        processedData = await onDataLoaded(result.data, ctx) as TOutput[]
      }

      isFetchingRef.current = false
      setState(prev => ({
        // Classic mode always replaces data; infinite mode accumulates unless resetting
        data: (isClassicMode || isReset) ? processedData : [...prev.data, ...processedData],
        count: result.count,
        isSuccess: true,
        isLoading: false,
        isFetching: false,
        error: null,
        hasInitialFetch: true,
      }))
    } catch (err) {
      console.error('[useDataViewInfiniteQuery] Unexpected error:', err)
      isFetchingRef.current = false
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err : new Error('Unknown error'),
        isFetching: false,
        isLoading: false,
      }))
    }
  }, [
    enabled,
    customFetcher,
    supabaseFetcher,
    onDataLoaded,
    pageSize,
    // Using refs for filters/search/sort/page/mode - no dependencies needed
  ])

  // Fetch next page (only for infinite mode)
  const fetchNextPage = useCallback(() => {
    if (isFetchingRef.current || !enabled) return
    if (paginationModeRef.current === 'classic') {
      // Classic mode uses page change handler instead
      return
    }
    fetchPage(stateRef.current.data.length, false)
  }, [fetchPage, enabled])
  
  // Fetch specific page (for classic mode)
  const fetchPageNumber = useCallback((page: number) => {
    if (isFetchingRef.current || !enabled) return
    if (paginationModeRef.current !== 'classic') {
      // Only works in classic mode
      return
    }
    const skip = (page - 1) * pageSize
    fetchPage(skip, true)
  }, [fetchPage, enabled, pageSize])

  // Single effect for initial fetch and query key/page changes
  useEffect(() => {
    // Skip if disabled
    if (!enabled) return
    
    const isFirstMount = queryKeyRef.current === ''
    const queryKeyChanged = queryKeyRef.current !== currentQueryKey
    const isClassicMode = paginationModeRef.current === 'classic'
    
    // For classic mode, also check if page changed
    const pageChanged = isClassicMode && currentPageRef.current !== currentPage
    
    // Update query key ref
    if (queryKeyChanged) {
      queryKeyRef.current = currentQueryKey
    }
    
    // If we have initialData and this is the first mount, don't fetch
    if (isFirstMount && initialDataUsedRef.current && !pageChanged) {
      return
    }
    
    // Fetch if: first mount without initial data, OR query key changed, OR page changed (classic mode)
    if (isFirstMount || queryKeyChanged || pageChanged) {
      // Reset fetching ref to allow new fetch
      isFetchingRef.current = false
      
      // Reset state for query key changes (not first mount with no data, not page changes in classic mode)
      if (queryKeyChanged && !isFirstMount && !pageChanged) {
        setState({
          data: [],
          count: 0,
          isSuccess: false,
          isLoading: true,
          isFetching: false,
          error: null,
          hasInitialFetch: false,
        })
      }
      
      // For classic mode, fetch the current page; for infinite mode, fetch first page
      const skip = isClassicMode ? (currentPageRef.current - 1) * pageSize : 0
      fetchPage(skip, true)
    }
  }, [currentQueryKey, enabled, fetchPage, currentPage, pageSize])

  // Manual refetch function
  const refetch = useCallback(() => {
    // Keep existing data visible while refetching (prevents flicker)
    setState(prev => ({
      ...prev,
      isFetching: true, // Show subtle loading indicator
      error: null,
    }))
    fetchPage(0, true)
  }, [fetchPage])

  return {
    data: state.data,
    count: state.count,
    isSuccess: state.isSuccess,
    isLoading: state.isLoading,
    isFetching: state.isFetching,
    error: state.error,
    hasMore: paginationModeRef.current === 'classic' 
      ? currentPageRef.current < Math.ceil(state.count / pageSize)
      : state.count > state.data.length,
    fetchNextPage,
    fetchPageNumber,
    refetch,
  }
}
