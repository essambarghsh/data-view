'use client'

/**
 * DataViewSearch Component
 * 
 * Search input primitive for DataView with debouncing.
 * Connects to DataViewContext for state management.
 * 
 * Features:
 * - Two display modes: inline (default) and expand-on-click
 * - Debounced search to avoid excessive updates
 * - Auto-focus when expanded
 * - Click outside to collapse (expand-on-click mode)
 * - ESC key to clear search or collapse
 * 
 * @example
 * // Inline mode (default)
 * <DataViewSearch placeholder="Search projects..." debounce={400} />
 * 
 * @example
 * // Expand-on-click mode
 * <DataViewSearch displayMode="expand-on-click" placeholder="Search..." />
 */

import { useEffect, useRef, useState } from 'react'
import { SearchIcon, XIcon } from 'lucide-react'
import { useDebouncedCallback } from 'use-debounce'
import { cn } from '@/utils/cn'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Button } from '@/components/ui/button'
import { useDataView } from './data-view-context'

// ============================================================================
// Types
// ============================================================================

export type SearchDisplayMode = 'inline' | 'expand-on-click'

export interface DataViewSearchProps {
  /** Placeholder text for search input */
  placeholder?: string
  /** Debounce delay in milliseconds (default: 400) */
  debounce?: number
  /** Additional className for styling */
  className?: string
  /** Display mode for the search component (default: 'inline') */
  displayMode?: SearchDisplayMode
  /** Additional className for styling the expand button (for expand-on-click mode) */
  expandButtonClassName?: string
}

// ============================================================================
// Component
// ============================================================================

export function DataViewSearch({
  placeholder = 'Search...',
  debounce = 400,
  className,
  displayMode = 'inline',
  expandButtonClassName,
}: DataViewSearchProps) {
  const { currentSearch, handleSearchChange } = useDataView()

  // Internal search state for immediate UI feedback
  const [internalSearch, setInternalSearch] = useState(currentSearch)

  // Track if search is expanded (for expand-on-click mode)
  const [isExpanded, setIsExpanded] = useState(false)

  // Track the last value we sent to parent to avoid sync race conditions
  const lastSentValueRef = useRef(currentSearch)

  // Ref for the search container to handle click outside
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // Ref for the input to auto-focus when expanded
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync internal search when prop changes (e.g., back/forward navigation)
  // But skip if the change came from our own debounced update
  useEffect(() => {
    // Only sync if the change didn't come from us (external navigation)
    if (currentSearch !== lastSentValueRef.current) {
      setInternalSearch(currentSearch)
      lastSentValueRef.current = currentSearch
    }
  }, [currentSearch])

  // Debounce search to avoid too many URL updates
  const debouncedSearch = useDebouncedCallback((value: string) => {
    lastSentValueRef.current = value
    handleSearchChange(value)
  }, debounce)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInternalSearch(value)
    debouncedSearch(value)
  }

  const clearSearch = () => {
    setInternalSearch('')
    lastSentValueRef.current = ''
    handleSearchChange('')
  }

  // Handle Esc key to clear search or collapse (for expand-on-click mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (internalSearch) {
          clearSearch()
        } else if (displayMode === 'expand-on-click' && isExpanded) {
          setIsExpanded(false)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [internalSearch, displayMode, isExpanded])

  // Handle click outside to collapse (for expand-on-click mode)
  useEffect(() => {
    if (displayMode !== 'expand-on-click' || !isExpanded) return

    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        // Only collapse if there's no search value
        if (!internalSearch) {
          setIsExpanded(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [displayMode, isExpanded, internalSearch])

  // Auto-focus input when expanded (for expand-on-click mode)
  useEffect(() => {
    if (displayMode === 'expand-on-click' && isExpanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [displayMode, isExpanded])

  // Expand search when there's a value (for expand-on-click mode)
  useEffect(() => {
    if (displayMode === 'expand-on-click' && internalSearch && !isExpanded) {
      setIsExpanded(true)
    }
  }, [displayMode, internalSearch, isExpanded])

  const handleExpandClick = () => {
    setIsExpanded(true)
  }

  const handleCollapseClick = () => {
    if (!internalSearch) {
      setIsExpanded(false)
    }
  }

  // Render expand-on-click mode
  if (displayMode === 'expand-on-click') {
    return (
      <div ref={searchContainerRef} className={cn('relative', className)}>
        {!isExpanded ? (
          // Collapsed state: show only search icon button
          <Button
            variant="outline"
            size="icon"
            onClick={handleExpandClick}
            className={cn('size-9', expandButtonClassName)}
            aria-label="Open search"
          >
            <SearchIcon className="size-3.5 opacity-70" />
          </Button>
        ) : (
          // Expanded state: show full search input
          <InputGroup className={cn('w-full bg-card', className)}>
            <InputGroupInput
              ref={inputRef}
              placeholder={placeholder}
              value={internalSearch}
              onChange={handleChange}
              className='h-full'
            />
            <InputGroupAddon align="inline-start">
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupAddon align="inline-end">
              {internalSearch ? (
                <InputGroupButton
                  variant="outline"
                  size="xs"
                  onClick={clearSearch}
                  className="text-xs rounded-md border-border/50"
                >
                  Esc
                </InputGroupButton>
              ) : (
                <InputGroupButton
                  variant="outline"
                  size="xs"
                  onClick={handleCollapseClick}
                  className="text-xs rounded-md border-border/50"
                  aria-label="Close search"
                >
                  <XIcon className="size-3.5" />
                </InputGroupButton>
              )}
            </InputGroupAddon>
          </InputGroup>
        )}
      </div>
    )
  }

  // Render inline mode (default)
  return (
    <InputGroup className={cn('w-full bg-card', className)}>
      <InputGroupInput
        placeholder={placeholder}
        value={internalSearch}
        onChange={handleChange}
      />
      <InputGroupAddon align="inline-start">
        <SearchIcon />
      </InputGroupAddon>
      {internalSearch && (
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            variant="outline"
            size="xs"
            onClick={clearSearch}
            className="text-xs rounded-md border-border/50"
          >
            Esc
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  )
}

