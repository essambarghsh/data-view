# DataView Improvement: Automatic Refetch on Callback Changes

## Problem

Previously, when callback props like `baseQuery`, `customFetcher`, or `onDataLoaded` changed due to their dependencies changing, the DataViewProvider would **not** automatically refetch data. This required manual refetch logic:

```tsx
// ❌ Before: Manual refetch required
const [showClosedTasks, setShowClosedTasks] = useState(false)

const baseQuery = useCallback(
  (query) => query.in('status', showClosedTasks ? allStatuses : activeStatuses),
  [showClosedTasks]
)

// Manual refetch when toggle changes
useEffect(() => {
  if (refetchRef.current) {
    refetchRef.current()  // Manual refetch!
  }
}, [showClosedTasks])
```

## Solution

DataViewProvider now **automatically detects** when callback references change and triggers a refetch. No manual intervention needed!

```tsx
// ✅ After: Automatic refetch
const [showClosedTasks, setShowClosedTasks] = useState(false)

const baseQuery = useCallback(
  (query) => query.in('status', showClosedTasks ? allStatuses : activeStatuses),
  [showClosedTasks]
)

// That's it! No manual refetch needed.
// When showClosedTasks changes, baseQuery reference changes, and data automatically refetches.
```

## How It Works

### 1. Reference Tracking
The hook tracks callback references using ref comparisons:

```tsx
const baseQueryRefCounter = useRef(0)
const baseQueryPrevRef = useRef(baseQuery)
if (baseQueryPrevRef.current !== baseQuery) {
  baseQueryRefCounter.current++  // Increment counter when reference changes
  baseQueryPrevRef.current = baseQuery
}
```

### 2. Query Key Invalidation
When a callback reference changes, the counter increments, invalidating the query key:

```tsx
function createQueryKey(props, callbackRefs) {
  return JSON.stringify({
    tableName: props.tableName,
    filters: props.filters,
    search: props.search,
    // ... other query params
    
    // Include callback counters to detect changes
    baseQueryRef: callbackRefs.baseQueryRef,
    customFetcherRef: callbackRefs.customFetcherRef,
    onDataLoadedRef: callbackRefs.onDataLoadedRef,
  })
}
```

### 3. Automatic Refetch
When the query key changes, the `useEffect` in `useDataViewInfiniteQuery` detects it and automatically triggers a refetch:

```tsx
useEffect(() => {
  const queryKeyChanged = queryKeyRef.current !== currentQueryKey
  
  if (queryKeyChanged) {
    queryKeyRef.current = currentQueryKey
    fetchPage(0, true)  // Automatic refetch
  }
}, [currentQueryKey, /* ... */])
```

## Benefits

### ✅ Cleaner Code
No more manual refetch logic cluttering your components.

### ✅ Declarative Behavior
Dependencies are expressed through `useCallback` deps, not imperative `useEffect` calls.

### ✅ Prevents Stale Data
Data always reflects the current callback logic.

### ✅ Works with React Patterns
Seamlessly integrates with `useCallback` and React's dependency system.

## Use Cases

### 1. Toggle-based Filtering
```tsx
const [includeArchived, setIncludeArchived] = useState(false)

const baseQuery = useCallback(
  (query) => includeArchived ? query : query.eq('archived', false),
  [includeArchived]
)

<DataViewProvider baseQuery={baseQuery}>
  <Toggle checked={includeArchived} onChange={setIncludeArchived} />
</DataViewProvider>
```

### 2. Dynamic Project Filtering
```tsx
const baseQuery = useCallback(
  (query) => query.eq('project_id', selectedProjectId),
  [selectedProjectId]
)

<DataViewProvider baseQuery={baseQuery}>
  <ProjectSelector value={selectedProjectId} onChange={setSelectedProjectId} />
</DataViewProvider>
```

### 3. User-specific Data Transformations
```tsx
const onDataLoaded = useCallback(
  async (data) => {
    // Transform data based on user preferences
    return transformData(data, userSettings)
  },
  [userSettings]
)

<DataViewProvider onDataLoaded={onDataLoaded} />
```

## Implementation Details

### Files Changed
1. **`hooks/use-data-view-infinite-query.ts`**
   - Added reference tracking for callbacks
   - Updated `createQueryKey` to include callback counters
   - Added detailed documentation

2. **`data-view-provider.tsx`**
   - Updated component documentation
   - Added examples of automatic refetch behavior

3. **`tasks-data-view.tsx`** (example usage)
   - Removed manual refetch logic
   - Simplified component by ~10 lines

### Performance Impact
- **Minimal overhead**: Only 3 ref comparisons per render
- **No extra re-renders**: Uses refs to avoid unnecessary updates
- **Same fetch behavior**: Only refetches when callbacks actually change

## Migration Guide

If you have existing code with manual refetch logic:

### Before
```tsx
const refetchRef = useRef<(() => void) | null>(null)

useEffect(() => {
  if (refetchRef.current) {
    refetchRef.current()
  }
}, [someState])

<DataViewProvider onRefetchReady={(refetch) => refetchRef.current = refetch}>
```

### After
```tsx
// Just remove the manual refetch logic - it happens automatically!
<DataViewProvider>
```

**Note**: You can still keep `onRefetchReady` if you need manual refetch for other purposes (e.g., real-time updates).

## Testing

To verify the improvement works:

1. Toggle a state that's a dependency of `baseQuery`, `customFetcher`, or `onDataLoaded`
2. Observe that data automatically refetches
3. No manual `refetch()` call needed

Example in TasksDataView:
1. Click "Include closed tasks" toggle
2. Data automatically refetches with new status filter
3. ✅ Cleaner implementation without manual refetch

## Conclusion

This improvement makes DataView more declarative and easier to use. Callback dependencies are now automatically tracked, eliminating boilerplate and preventing stale data issues.
