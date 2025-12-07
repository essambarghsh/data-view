'use client'

/**
 * DataViewSearch Component
 * 
 * Search input primitive for DataView with debouncing.
 * Connects to DataViewContext for state management.
 * 
 * @example
 * ```tsx
 * <DataViewSearch placeholder="Search projects..." debounce={400} />
 * ```
 */

import { useEffect, useRef, useState } from 'react'
import { SearchIcon } from 'lucide-react'
import { useDebouncedCallback } from 'use-debounce'
import { cn } from '@/utils/cn'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { useDataView } from './data-view-context'

// ============================================================================
// Types
// ============================================================================

export interface DataViewSearchProps {
  /** Placeholder text for search input */
  placeholder?: string
  /** Debounce delay in milliseconds (default: 400) */
  debounce?: number
  /** Additional className for styling */
  className?: string
}

// ============================================================================
// Component
// ============================================================================

export function DataViewSearch({
  placeholder = 'Search...',
  debounce = 400,
  className,
}: DataViewSearchProps) {
  const { currentSearch, handleSearchChange } = useDataView()

  // Internal search state for immediate UI feedback
  const [internalSearch, setInternalSearch] = useState(currentSearch)

  // Track the last value we sent to parent to avoid sync race conditions
  const lastSentValueRef = useRef(currentSearch)

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

  // Handle Esc key to clear search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && internalSearch) {
        clearSearch()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [internalSearch])

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

