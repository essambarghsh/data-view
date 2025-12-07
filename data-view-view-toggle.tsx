'use client'

/**
 * DataViewViewToggle Component
 * 
 * View mode toggle primitive for DataView (list/grid).
 * Connects to DataViewContext for state management.
 * 
 * @example
 * ```tsx
 * <DataViewViewToggle />
 * ```
 */

import { LayoutGrid, List } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/button'
import { useDataView } from './data-view-context'

// ============================================================================
// Types
// ============================================================================

export interface DataViewViewToggleProps {
  /** Additional className for styling */
  className?: string
}

// ============================================================================
// Helper Component
// ============================================================================

function ViewModeButton({
  mode,
  currentMode,
  icon: Icon,
  onClick,
}: {
  mode: 'list' | 'grid'
  currentMode: 'list' | 'grid'
  icon: React.ComponentType<{ className?: string }>
  onClick: () => void
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        'size-9 rounded-lg hover:bg-transparent text-muted-foreground hover:text-foreground',
        currentMode === mode &&
        'bg-muted hover:bg-muted hover:text-muted-foreground'
      )}
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
    </Button>
  )
}

// ============================================================================
// Component
// ============================================================================

export function DataViewViewToggle({ className }: DataViewViewToggleProps) {
  const { viewMode, handleViewModeChange, forcedViewMode } = useDataView()

  // Don't render if view mode is forced
  if (forcedViewMode) {
    return null
  }

  return (
    <div className={cn('flex items-center border border-border h-12 px-1.25 rounded-xl bg-card', className)}>
      <ViewModeButton
        mode="list"
        currentMode={viewMode}
        icon={List}
        onClick={() => handleViewModeChange('list')}
      />
      <ViewModeButton
        mode="grid"
        currentMode={viewMode}
        icon={LayoutGrid}
        onClick={() => handleViewModeChange('grid')}
      />
    </div>
  )
}

