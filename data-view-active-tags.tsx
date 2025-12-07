'use client'

/**
 * DataView Active Tags Component (Composition Version)
 *
 * Displays active filters and search query as removable tags below the toolbar.
 * Each tag includes a close button to remove that specific filter or search term.
 * Includes a "Clear All" action when any filters/search are active.
 * Connects to DataViewContext for state management.
 * 
 * @example
 * ```tsx
 * <DataViewActiveTags searchLabel="Search" clearAllLabel="Clear all" />
 * ```
 */

import { FunnelX, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/utils/cn'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useDataView } from './data-view-context'
import type { ActiveTag } from './types'

// ============================================================================
// Types
// ============================================================================

export interface DataViewActiveTagsProps {
  /** Label for search tags */
  searchLabel?: string
  /** Label for clear all button */
  clearAllLabel?: string
  /** Additional className for styling */
  className?: string
}

// ============================================================================
// Component
// ============================================================================

export function DataViewActiveTags({
  searchLabel = '',
  clearAllLabel = '',
  className,
}: DataViewActiveTagsProps) {
  const {
    currentSearch,
    currentFilters,
    filters,
    handleSearchChange,
    handleFiltersChange,
  } = useDataView()

  const t = useTranslations('Common')

  // Build list of active tags
  const activeTags: ActiveTag[] = []

  // Add search tag if present
  if (currentSearch) {
    activeTags.push({
      id: '__search__',
      type: 'search',
      label: searchLabel ? searchLabel : t('search'),
      value: currentSearch,
      displayValue: currentSearch,
    })
  }

  // Add filter tags
  if (filters && currentFilters) {
    filters.forEach((filterGroup) => {
      const activeValues = currentFilters[filterGroup.id] || []
      activeValues.forEach((value) => {
        const option = filterGroup.options.find((opt) => opt.value === value)
        activeTags.push({
          id: `${filterGroup.id}:${value}`,
          type: 'filter',
          filterId: filterGroup.id,
          filterLabel: filterGroup.label,
          label: filterGroup.label,
          value: value,
          displayValue: option?.label || value,
        })
      })
    })
  }

  // If no active tags, don't render anything
  if (activeTags.length === 0) {
    return null
  }

    const handleRemoveTag = (tag: ActiveTag) => {
        if (tag.type === 'search') {
            handleSearchChange('')
        } else if (tag.type === 'filter' && tag.filterId) {
            const currentValues = currentFilters[tag.filterId] || []
            const newValues = currentValues.filter((v) => v !== tag.value)

            handleFiltersChange({
                ...currentFilters,
                [tag.filterId]: newValues,
            })
        }
    }

    const handleClearAll = () => {
        // Clear search
        if (currentSearch) {
            handleSearchChange('')
        }

        // Clear all filters
        handleFiltersChange({})
    }

  return (
    <div
      className={cn(
        'flex items-center gap-2 overflow-x-auto mb-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent',
        className
      )}
      role="region"
      aria-label="Active filters"
    >
      {/* Active tags */}
      <div className="flex flex-1 flex-wrap justify-center md:justify-start items-center gap-2">
        {activeTags.map((tag) => (
          <Badge
            key={tag.id}
            variant="outline"
            className="bg-card shrink-0 py-2 px-4 leading-relaxed min-h-10 rounded-full"
          >
            <span className="sr-only">{tag.label}</span>
            <span className="font-medium truncate max-w-[150px] rtl:ml-1 ltr:mr-1" title={tag.label}>
              {tag.displayValue}
            </span>
            <Button
              onClick={() => handleRemoveTag(tag)}
              variant="ghost"
              size="icon"
              className="size-8 rtl:-ml-3 ltr:-mr-3 -my-1 hover:bg-destructive/8 hover:text-destructive hover:border-destructive active:scale-90"
              aria-label={`Remove ${tag.label}: ${tag.displayValue}`}
            >
              <X className="size-3 opacity-50" strokeWidth={3} />
            </Button>
          </Badge>
        ))}

        {/* Clear all button */}
        {activeTags.length > 1 && (
          <Button
            variant="ghost"
            size="default"
            onClick={handleClearAll}
            className="text-[0.625rem] font-medium text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 py-2 px-4 leading-relaxed h-10 rounded-full active:scale-95"
          >
            <FunnelX className="size-4 rtl:ml-2 ltr:mr-1 rtl:-mr-1 ltr:-ml-1" />
            {clearAllLabel ? clearAllLabel : t('clearAll')}
          </Button>
        )}
      </div>
    </div>
  )
}
