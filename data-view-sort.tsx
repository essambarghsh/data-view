'use client'

/**
 * DataViewSort Component
 * 
 * Sort dropdown primitive for DataView.
 * Connects to DataViewContext for state management.
 * 
 * Note: In the composition pattern, this is often combined with DataViewFilters
 * in a unified dropdown, but can be used independently if needed.
 * 
 * @example
 * ```tsx
 * <DataViewSort />
 * ```
 */

import { ArrowUpDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { isRTL } from '@/utils/rtl-checker'
import { useLocaleInfo } from '@/hooks/use-locale-switcher'
import { useDataView } from './data-view-context'

// ============================================================================
// Constants
// ============================================================================

const MENU_ITEM_CLASS = 'flex flex-row flex-1 w-full items-center justify-start cursor-pointer text-xs text-foreground font-medium px-2 h-auto min-h-10 py-2 rounded-lg'

// ============================================================================
// Types
// ============================================================================

export interface DataViewSortProps {
  /** Additional className for styling */
  className?: string
}

// ============================================================================
// Component
// ============================================================================

export function DataViewSort({ className }: DataViewSortProps) {
  const { sortOptions, currentSort, handleSortChange } = useDataView()
  const { currentLocale } = useLocaleInfo()
  const t = useTranslations('Common')

  // Don't render if no sort options
  if (!sortOptions || sortOptions.length === 0) {
    return null
  }

  return (
    <DropdownMenu dir={isRTL(currentLocale) ? 'rtl' : 'ltr'} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn('bg-card text-muted-foreground', className)}
        >
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="bottom"
        sideOffset={5}
        className="w-56 overflow-hidden p-0"
      >
        <DropdownMenuLabel className="px-4 pt-3.5 pb-1.5">
          {t('sortBy')}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={currentSort}
          onValueChange={handleSortChange}
          className="px-2 pb-2"
        >
          {sortOptions.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
              className={MENU_ITEM_CLASS}
            >
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

