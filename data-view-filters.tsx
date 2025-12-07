'use client'

/**
 * DataViewFilters Component
 * 
 * Filter dropdown primitive for DataView with drilldown menu.
 * Connects to DataViewContext for state management.
 * 
 * @example
 * ```tsx
 * <DataViewFilters label="Filters" />
 * ```
 */

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronLeft, FunnelX, ListFilter, Search } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { isRTL } from '@/utils/rtl-checker'
import { useLocaleInfo } from '@/hooks/use-locale-switcher'
import { useDataView } from './data-view-context'

// ============================================================================
// Constants
// ============================================================================

const ANIMATION_DURATION = 0.15
const ANIMATION_EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1]
const MENU_ITEM_CLASS = 'flex flex-row flex-1 w-full items-center justify-start cursor-pointer text-xs text-foreground font-medium px-2 h-auto min-h-10 py-2 rounded-lg'
const FILTER_OPTION_CLASS = MENU_ITEM_CLASS

// ============================================================================
// Helper Components
// ============================================================================

function OptionCount({ count }: { count?: number }) {
  if (count === undefined) return null
  return <span className="text-xs text-muted-foreground">{count}</span>
}

interface FilterOption {
  value: string
  label: string
  count?: number
}

interface FilterOptionsListProps {
  options: FilterOption[]
  mode: 'single' | 'multiple'
  groupId: string
  currentFilters: Record<string, string[]>
  onFilterChange: (groupId: string, value: string, mode: 'single' | 'multiple') => void
}

function FilterOptionsList({
  options,
  mode,
  groupId,
  currentFilters,
  onFilterChange,
}: FilterOptionsListProps) {
  if (mode === 'multiple') {
    return (
      <>
        {options.map((option) => {
          const isSelected = currentFilters[groupId]?.includes(option.value)
          return (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={isSelected}
              onCheckedChange={() => onFilterChange(groupId, option.value, mode)}
              onSelect={(e) => e.preventDefault()}
              className={FILTER_OPTION_CLASS}
            >
              <span className="flex-1">{option.label}</span>
              <OptionCount count={option.count} />
            </DropdownMenuCheckboxItem>
          )
        })}
      </>
    )
  }

  // Single selection mode - use radio items
  return (
    <DropdownMenuRadioGroup
      value={currentFilters[groupId]?.[0] || ''}
      onValueChange={(value) => onFilterChange(groupId, value, mode)}
    >
      {options.map((option) => (
        <DropdownMenuRadioItem
          key={option.value}
          value={option.value}
          className={FILTER_OPTION_CLASS}
        >
          <span className="flex-1 leading-relaxed flex">{option.label}</span>
          <OptionCount count={option.count} />
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  )
}

// ============================================================================
// Types
// ============================================================================

export interface DataViewFiltersProps {
  /** Additional className for styling */
  className?: string
}

// ============================================================================
// Component
// ============================================================================

export function DataViewFilters({ className }: DataViewFiltersProps) {
  const { filters, currentFilters, handleFiltersChange } = useDataView()
  const { currentLocale } = useLocaleInfo()
  const t = useTranslations('Common')

  // Drilldown menu state
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null)
  const [filterSearch, setFilterSearch] = useState('')
  const [direction, setDirection] = useState<1 | -1>(1) // 1 = forward, -1 = back
  const [contentHeight, setContentHeight] = useState<number>(0)
  const contentRef = useRef<HTMLDivElement>(null)
  const isRtl = isRTL(currentLocale)

  // Don't render if no filters
  if (!filters || filters.length === 0) {
    return null
  }

  // Update container height when content changes
  useEffect(() => {
    if (contentRef.current) {
      const height = contentRef.current.scrollHeight
      setContentHeight(height)
    }
  }, [activeFilterId, filters, currentFilters])

  // Slide animation variants with RTL support
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir * (isRtl ? -100 : 100) + '%',
    }),
    center: {
      x: 0,
    },
    exit: (dir: number) => ({
      x: dir * (isRtl ? 100 : -100) + '%',
    }),
  }

  // Reset menu level when dropdown closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setTimeout(() => {
        setActiveFilterId(null)
        setFilterSearch('')
      }, 150)
    }
  }

  // Navigate to submenu
  const navigateToSubmenu = (groupId: string) => {
    setDirection(1)
    setActiveFilterId(groupId)
    setFilterSearch('') // Reset search when entering submenu
  }

  // Navigate back to root
  const navigateBack = () => {
    setDirection(-1)
    setActiveFilterId(null)
    setFilterSearch('')
  }

  // Handle filter changes
  const handleFilterChange = (
    groupId: string,
    value: string,
    mode: 'single' | 'multiple'
  ) => {
    const existingValues = currentFilters[groupId] || []
    let newValues: string[]

    if (mode === 'single') {
      newValues = [value]
    } else {
      if (existingValues.includes(value)) {
        newValues = existingValues.filter((v: string) => v !== value)
      } else {
        newValues = [...existingValues, value]
      }
    }

    handleFiltersChange({
      ...currentFilters,
      [groupId]: newValues,
    })
  }

  // Clear all filters
  const clearFilters = () => {
    handleFiltersChange({})
  }

  // Get current filter group for submenu
  const currentFilterGroup = filters?.find((g) => g.id === activeFilterId)

  // Filter options based on search query
  const filteredOptions = currentFilterGroup?.options.filter((option) =>
    option.label.toLowerCase().includes(filterSearch.toLowerCase())
  ) || []

  // Calculate active filter count
  const activeFilterCount = Object.values(currentFilters).flat().length

  return (
    <DropdownMenu
      dir={isRTL(currentLocale) ? 'rtl' : 'ltr'}
      modal={false}
      onOpenChange={handleOpenChange}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn('bg-card text-muted-foreground relative', className)}
        >
          <ListFilter />
          {activeFilterCount > 0 && (
            <span className="text-xxs font-medium absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full size-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="bottom"
        sideOffset={5}
        className="w-56 overflow-hidden p-0"
      >
        {/* Animated container */}
        <motion.div
          className="relative overflow-hidden"
          animate={{ height: contentHeight || 'auto' }}
          transition={{
            type: 'tween',
            duration: activeFilterId ? ANIMATION_DURATION : 0,
            ease: ANIMATION_EASE,
          }}
        >
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={activeFilterId ?? 'root'}
              ref={contentRef}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                type: 'tween',
                duration: ANIMATION_DURATION,
                ease: ANIMATION_EASE,
              }}
              className="w-full"
              style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
              onAnimationComplete={() => {
                if (contentRef.current) {
                  setContentHeight(contentRef.current.scrollHeight)
                }
              }}
            >
              {!activeFilterId ? (
                /* Root Menu Panel */
                <>
                  {/* Filters Section */}
                  <DropdownMenuLabel className="px-4 pt-3.5 pb-1.5">
                    {t('filterBy')}
                  </DropdownMenuLabel>
                  <DropdownMenuGroup className="px-2 pb-2">
                    {filters.map((group) => (
                      <Button
                        key={group.id}
                        onClick={() => navigateToSubmenu(group.id)}
                        variant="ghost"
                        className={cn(MENU_ITEM_CLASS)}
                      >
                        <span className="flex w-full">{group.label}</span>
                        {currentFilters[group.id]?.length > 1 && (
                          <span className="text-xs text-primary bg-primary/8 px-1.5 py-0.5 rounded-full">
                            {currentFilters[group.id].length}
                          </span>
                        )}
                        {currentFilters[group.id]?.length < 2 && (
                          <Check className="h-4 w-4 opacity-50" />
                        )}
                      </Button>
                    ))}
                  </DropdownMenuGroup>

                  {/* Clear Filters */}
                  {activeFilterCount > 0 && (
                    <>
                      <div className="my-2 h-px bg-border/50" />
                      <DropdownMenuGroup className="px-2 pb-2">
                        <Button
                          onClick={clearFilters}
                          variant="ghost"
                          className={cn(MENU_ITEM_CLASS, 'text-destructive')}
                        >
                          <FunnelX className="h-4 w-4" />
                          <span>{t('clearFilters')}</span>
                        </Button>
                      </DropdownMenuGroup>
                    </>
                  )}
                </>
              ) : (
                /* Submenu Panel */
                currentFilterGroup && (
                  <>
                    {/* Submenu Header */}
                    <DropdownMenuLabel className="flex items-center flex-row px-1 pt-1 pb-1.5">
                      <Button
                        onClick={navigateBack}
                        variant="ghost"
                        size="icon"
                        className={cn("size-8 rounded-full")}
                      >
                        <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                      </Button>
                      <span className="flex flex-1 items-center mx-1">
                        {t("filterBy") + " " + currentFilterGroup.label}
                      </span>
                    </DropdownMenuLabel>

                    {/* Search Input */}
                    {currentFilterGroup.options.length > 5 && (
                      <div className="px-2 pb-2">
                        <Input
                          type="text"
                          placeholder={t('searchPlaceholder')}
                          value={filterSearch}
                          onChange={(e) => setFilterSearch(e.target.value)}
                          className="h-10 rounded-lg"
                        />
                      </div>
                    )}

                    {/* Submenu Options */}
                    <DropdownMenuGroup className="max-h-[200px] overflow-y-auto px-2 pb-2">
                      {filteredOptions.length > 0 ? (
                        <FilterOptionsList
                          options={filteredOptions}
                          mode={currentFilterGroup.mode}
                          groupId={currentFilterGroup.id}
                          currentFilters={currentFilters}
                          onFilterChange={handleFilterChange}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <Search className="h-8 w-8 text-muted-foreground/50 mb-2" />
                          <p className="text-xs text-muted-foreground">
                            {t('noResultsFound')}
                          </p>
                        </div>
                      )}
                    </DropdownMenuGroup>
                  </>
                )
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

