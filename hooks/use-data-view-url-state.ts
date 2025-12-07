/**
 * useDataViewUrlState Hook
 * 
 * A reusable hook that encapsulates all URL state management for DataView components.
 * This eliminates code duplication across DataViewClient, DataViewInfinite, and
 * custom implementations like ProjectsInfiniteView.
 * 
 * Features:
 * - Parse URL parameters with namespace support
 * - Update URL parameters with automatic page reset
 * - Handle search, filters, sort, and pagination
 * - View mode management with cookie persistence
 * 
 * @example
 * ```tsx
 * const {
 *   currentSearch,
 *   currentFilters,
 *   currentSort,
 *   handleSearchChange,
 *   handleFiltersChange,
 *   handleSortChange,
 * } = useDataViewUrlState({ filters, urlNamespace: 'projects' });
 * ```
 */

'use client'

import { useCallback, useState, useEffect, useTransition, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  DATA_VIEW_MODE_COOKIE_MAX_AGE,
  DATA_VIEW_MODE_COOKIE_NAME,
} from '@/configs/global-config'
import type { FilterGroup, ViewMode } from '../types'

// ============================================================================
// Types
// ============================================================================

export interface UseDataViewUrlStateOptions {
  /** Filter configuration for parsing filter params */
  filters?: FilterGroup[]
  /** URL namespace prefix for multiple DataViews on same page */
  urlNamespace?: string
  /** Default view mode */
  defaultViewMode?: ViewMode
  /** Force a specific view mode (disables toggle) */
  forcedViewMode?: ViewMode
  /** Default sort value */
  defaultSort?: string
  /** Default page size */
  defaultLimit?: number
  /** Use startTransition for URL updates (smoother loading states) */
  useTransitions?: boolean
  /** Reset page on filter/search/sort changes (default: true) */
  resetPageOnChange?: boolean
}

export interface UseDataViewUrlStateReturn {
  // Current state (parsed from URL)
  currentSearch: string
  currentFilters: Record<string, string[]>
  currentSort: string | undefined
  currentPage: number
  currentLimit: number
  
  // View mode (from cookie or forced)
  viewMode: ViewMode
  
  // Loading state
  isPending: boolean
  
  // Event handlers
  handleSearchChange: (value: string) => void
  handleFiltersChange: (filters: Record<string, string[]>) => void
  handleSortChange: (value: string) => void
  handlePageChange: (page: number) => void
  handleLimitChange: (limit: number) => void
  handleViewModeChange: (mode: ViewMode) => void
  
  // URL utilities
  updateUrl: (updates: Record<string, string | number | null>) => void
  getParamKey: (key: string) => string
  
  // Query key for cache invalidation (useful for data fetching hooks)
  queryKey: string
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 20

// ============================================================================
// Hook Implementation
// ============================================================================

export function useDataViewUrlState(
  options: UseDataViewUrlStateOptions = {}
): UseDataViewUrlStateReturn {
  const {
    filters,
    urlNamespace = '',
    defaultViewMode = 'list',
    forcedViewMode,
    defaultSort,
    defaultLimit = DEFAULT_LIMIT,
    useTransitions = true,
    resetPageOnChange = true,
  } = options
  
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Use transition for smoother loading states during navigation
  const [isPending, startTransition] = useTransition()
  
  // =========================================================================
  // URL Parameter Helpers
  // =========================================================================
  
  /**
   * Get the full parameter key with namespace prefix
   */
  const getParamKey = useCallback(
    (key: string): string => {
      return urlNamespace ? `${urlNamespace}_${key}` : key
    },
    [urlNamespace]
  )
  
  /**
   * Get a parameter value from URL (with namespace support)
   */
  const getParam = useCallback(
    (key: string): string | null => {
      return searchParams.get(getParamKey(key))
    },
    [searchParams, getParamKey]
  )
  
  // =========================================================================
  // Parse Current State from URL
  // =========================================================================
  
  // Parse search
  const currentSearch = getParam('q') || getParam('search') || ''
  
  // Parse filters
  const currentFilters = useMemo(() => {
    const result: Record<string, string[]> = {}
    
    if (filters) {
      for (const filter of filters) {
        const paramValue = searchParams.get(getParamKey(filter.id))
        if (paramValue) {
          result[filter.id] = paramValue.split(',').filter(Boolean)
        } else if (filter.defaultValue) {
          result[filter.id] = filter.defaultValue
        }
      }
    }
    
    return result
  }, [filters, searchParams, getParamKey])
  
  // Parse sort
  const currentSort = getParam('sort') || defaultSort
  
  // Parse page
  const pageParam = getParam('page')
  const currentPage = pageParam 
    ? Math.max(1, parseInt(pageParam, 10) || DEFAULT_PAGE) 
    : DEFAULT_PAGE
  
  // Parse limit
  const limitParam = getParam('limit')
  const currentLimit = limitParam 
    ? parseInt(limitParam, 10) || defaultLimit 
    : defaultLimit
  
  // =========================================================================
  // View Mode (stored in cookie, not URL)
  // =========================================================================
  
  const [viewMode, setViewMode] = useState<ViewMode>(forcedViewMode || defaultViewMode)
  
  // Initialize view mode from cookie on mount
  useEffect(() => {
    if (forcedViewMode) return
    
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${DATA_VIEW_MODE_COOKIE_NAME}=`))
      ?.split('=')[1]
    
    if (cookieValue === 'list' || cookieValue === 'grid') {
      setViewMode(cookieValue)
    }
  }, [forcedViewMode])
  
  // =========================================================================
  // Query Key (for cache invalidation)
  // =========================================================================
  
  const queryKey = useMemo(() => {
    return JSON.stringify({
      search: currentSearch,
      filters: currentFilters,
      sort: currentSort,
      namespace: urlNamespace,
    })
  }, [currentSearch, currentFilters, currentSort, urlNamespace])
  
  // =========================================================================
  // URL Update Helper
  // =========================================================================
  
  const updateUrl = useCallback(
    (updates: Record<string, string | number | null>, options?: { resetPage?: boolean }) => {
      const params = new URLSearchParams(searchParams.toString())
      const shouldResetPage = options?.resetPage ?? resetPageOnChange
      
      Object.entries(updates).forEach(([key, value]) => {
        const paramKey = getParamKey(key)
        
        if (value === null || value === '' || value === undefined) {
          params.delete(paramKey)
        } else {
          params.set(paramKey, String(value))
        }
      })
      
      // Reset to page 1 when filters/search/sort change (unless it's a page change itself)
      if (shouldResetPage && !('page' in updates)) {
        const pageKey = getParamKey('page')
        if (params.has(pageKey)) {
          params.delete(pageKey)
        }
      }
      
      const newUrl = `${pathname}?${params.toString()}`
      
      if (useTransitions) {
        startTransition(() => {
          router.replace(newUrl, { scroll: false })
        })
      } else {
        router.replace(newUrl, { scroll: false })
      }
    },
    [pathname, router, searchParams, getParamKey, useTransitions, resetPageOnChange]
  )
  
  // =========================================================================
  // Event Handlers
  // =========================================================================
  
  const handleSearchChange = useCallback(
    (value: string) => {
      updateUrl({ q: value || null })
    },
    [updateUrl]
  )
  
  const handleFiltersChange = useCallback(
    (newFilters: Record<string, string[]>) => {
      const updates: Record<string, string | null> = {}
      
      // Set all filter values
      Object.entries(newFilters).forEach(([key, values]) => {
        updates[key] = values.length > 0 ? values.join(',') : null
      })
      
      // Clear filters that are no longer set
      if (filters) {
        filters.forEach((filter) => {
          if (!(filter.id in newFilters) || newFilters[filter.id]?.length === 0) {
            updates[filter.id] = null
          }
        })
      }
      
      updateUrl(updates)
    },
    [filters, updateUrl]
  )
  
  const handleSortChange = useCallback(
    (value: string) => {
      updateUrl({ sort: value || null })
    },
    [updateUrl]
  )
  
  const handlePageChange = useCallback(
    (page: number) => {
      updateUrl({ page: page > 1 ? page : null }, { resetPage: false })
    },
    [updateUrl]
  )
  
  const handleLimitChange = useCallback(
    (limit: number) => {
      updateUrl({ limit: limit !== defaultLimit ? limit : null })
    },
    [updateUrl, defaultLimit]
  )
  
  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {
      if (forcedViewMode) return
      
      setViewMode(mode)
      
      // Persist to cookie (not URL)
      document.cookie = `${DATA_VIEW_MODE_COOKIE_NAME}=${mode}; path=/; max-age=${DATA_VIEW_MODE_COOKIE_MAX_AGE}`
    },
    [forcedViewMode]
  )
  
  // =========================================================================
  // Return
  // =========================================================================
  
  return {
    // Current state
    currentSearch,
    currentFilters,
    currentSort,
    currentPage,
    currentLimit,
    
    // View mode
    viewMode,
    
    // Loading state
    isPending,
    
    // Event handlers
    handleSearchChange,
    handleFiltersChange,
    handleSortChange,
    handlePageChange,
    handleLimitChange,
    handleViewModeChange,
    
    // Utilities
    updateUrl,
    getParamKey,
    queryKey,
  }
}
