# DataView

[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-15+-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Powered-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](https://opensource.org/licenses/MIT)

A **Supabase-first** composition-based data view component system for React/Next.js applications. Display filterable, sortable, and paginated data with full customization through primitive components.

## Features

- **🗄️ Supabase-First** - Built specifically for Supabase with automatic query generation
- **🎨 Composition Pattern** - Build your own data views using primitive components
- **🔗 URL State Management** - Search, filters, sort, and pagination synced to URL
- **📄 Multiple Pagination Modes** - Classic, load-more, and infinite scroll
- **🔄 View Mode Toggle** - Switch between list and grid layouts
- **⚡ SSR Hydration** - Server-side rendering support with initial data
- **🔧 Extensible** - Also supports custom data fetchers for non-Supabase sources
- **🔄 Smart Refetch** - Automatically refetches when callback props change (baseQuery, customFetcher, onDataLoaded)
- **📘 TypeScript First** - Full type safety with Supabase database types
- **🌐 RTL Support** - Built-in right-to-left language support
- **♿ Accessible** - Built on Radix UI primitives

## Why Supabase-First?

This component was designed with Supabase in mind because:
- **Automatic Query Building** - No need to write manual queries for filters, search, and sort
- **Type Safety** - Leverages Supabase's generated TypeScript types
- **Optimal Performance** - Built-in pagination and efficient data fetching
- **Industry Standard** - Supabase is the most popular open-source Firebase alternative

## Installation

This is a standalone component system—not an npm package. Clone the `data-view` folder into your Next.js project's `components` directory:

```bash
# Copy the data-view folder to your project
cp -r data-view /path/to/your-project/components/
```

### Prerequisites

Make sure you have Supabase set up in your project:

```bash
# Install Supabase client
npm install @supabase/supabase-js

# Install required UI dependencies
npm install framer-motion lucide-react use-debounce
```

### Supabase Setup

Create a Supabase client utility:

```typescript
// utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

## Quick Start

### Basic Supabase Table Query

```tsx
import {
  DataViewProvider,
  DataViewToolbar,
  DataViewSearch,
  DataViewFilters,
  DataViewSort,
  DataViewViewToggle,
  DataViewActiveTags,
  DataViewContent,
  DataViewList,
  DataViewGrid,
  DataViewPagination,
} from '@/components/data-view'

const filters = [
  {
    id: 'status',
    label: 'Status',
    mode: 'multiple',
    options: [
      { label: 'Active', value: 'active' },
      { label: 'Completed', value: 'completed' },
    ],
  },
]

const sortOptions = [
  { label: 'Newest First', value: 'created_at:desc' },
  { label: 'Oldest First', value: 'created_at:asc' },
  { label: 'Name A-Z', value: 'name:asc' },
]

export default function ProjectsPage() {
  return (
    <DataViewProvider
      tableName="projects"
      filters={filters}
      filterMappings={[
        { filterId: 'status', column: 'status', operator: 'in' },
      ]}
      searchColumn="name"
      sortOptions={sortOptions}
      paginationType="classic"
      pageSize={20}
    >
      <DataViewToolbar>
        <DataViewSearch placeholder="Search projects..." />
        <DataViewFilters />
        <DataViewSort />
        <DataViewViewToggle />
      </DataViewToolbar>

      <DataViewActiveTags />

      <DataViewContent
        loadingSkeleton={<ProjectsSkeleton />}
        emptyState={<EmptyState message="No projects found" />}
      >
        <DataViewList>
          {(project) => <ProjectCard project={project} />}
        </DataViewList>
        <DataViewGrid cols={{ sm: 1, md: 2, lg: 3 }}>
          {(project) => <ProjectGridCard project={project} />}
        </DataViewGrid>
      </DataViewContent>

      <DataViewPagination />
    </DataViewProvider>
  )
}
```

## Core Concepts

### 1. Supabase Table Mode (Recommended)

The primary way to use DataView is with a Supabase table:

```tsx
<DataViewProvider
  tableName="projects"           // Your Supabase table name
  columns="id, name, created_at" // Columns to select (default: "*")
  baseQuery={(query) =>          // Additional filters
    query.eq('deleted', false)
  }
>
  {/* Components */}
</DataViewProvider>
```

**Features:**
- Automatic query generation for filters, search, and sort
- Built-in pagination (range queries)
- Type-safe with Supabase generated types
- Efficient data fetching

### 2. Filter Mappings

Map your filter UI to Supabase columns:

```tsx
const filterMappings = [
  { 
    filterId: 'status',    // Matches filter.id
    column: 'status',      // Supabase column name
    operator: 'in'         // Supabase operator
  },
  { 
    filterId: 'type',
    column: 'project_type',
    operator: 'eq'
  },
  {
    filterId: 'created',
    column: 'created_at',
    operator: 'gte',
    transform: (values) => new Date(values[0]) // Transform values
  }
]
```

**Supported Operators:**
- `eq`, `neq` - Equals, not equals
- `gt`, `gte`, `lt`, `lte` - Greater/less than
- `like`, `ilike` - Pattern matching (case-sensitive/insensitive)
- `in` - Array contains
- `contains`, `cs` - JSON/Array contains
- `is` - IS NULL / IS NOT NULL

### 3. Search Configuration

**Single Column Search:**
```tsx
<DataViewProvider
  tableName="projects"
  searchColumn="name"
>
```

**Multiple Column Search (OR):**
```tsx
<DataViewProvider
  tableName="projects"
  searchColumns={['name', 'description']}
>
```

**JSONB Column Search:**
```tsx
<DataViewProvider
  tableName="projects"
  searchColumn="name->>en"  // Search in JSONB field
>
```

### 4. Data Transformation with Relations

Fetch related data after the initial query:

```tsx
async function enrichWithRelations(projects, context) {
  const projectIds = projects.map(p => p.id)
  
  const { data: members } = await supabase
    .from('project_members')
    .select('*, profiles(*)')
    .in('project_id', projectIds)
  
  return projects.map(project => ({
    ...project,
    members: members.filter(m => m.project_id === project.id)
  }))
}

<DataViewProvider
  tableName="projects"
  onDataLoaded={enrichWithRelations}
>
```

### 5. Custom Fetcher (Non-Supabase)

For non-Supabase data sources, use a custom fetcher:

```tsx
<DataViewProvider
  customFetcher={async (ctx) => {
    const params = new URLSearchParams({
      page: ctx.page.toString(),
      pageSize: ctx.pageSize.toString(),
      search: ctx.search,
      sort: ctx.sort || '',
      ...ctx.filters,
    })
    
    const res = await fetch(`/api/projects?${params}`)
    const json = await res.json()
    
    return {
      data: json.items,
      count: json.total,
    }
  }}
>
```

### 6. Automatic Refetch on Callback Changes

**NEW**: DataView automatically detects when callback props change and refetches data. No manual refetch needed!

```tsx
function TasksView({ projectId }) {
  // Toggle state
  const [showClosedTasks, setShowClosedTasks] = useState(false)
  
  // baseQuery with dependencies - when showClosedTasks changes, baseQuery reference changes
  const baseQuery = useCallback(
    (query) => {
      const statuses = showClosedTasks 
        ? [...ACTIVE_STATUSES, ...CLOSED_STATUSES]
        : ACTIVE_STATUSES
      
      return query
        .eq('project_id', projectId)
        .in('status', statuses)
    },
    [projectId, showClosedTasks] // <-- Dependencies
  )
  
  return (
    <DataViewProvider
      tableName="tasks"
      baseQuery={baseQuery} // <-- Automatically refetches when this changes!
    >
      <Toggle checked={showClosedTasks} onChange={setShowClosedTasks} />
      {/* Other components */}
    </DataViewProvider>
  )
}
```

**How it works:**
- When `showClosedTasks` changes, `useCallback` returns a new `baseQuery` reference
- DataView detects the reference change and automatically triggers a refetch
- Works for `baseQuery`, `customFetcher`, and `onDataLoaded` callbacks

**Benefits:**
- ✅ No manual `refetch()` calls needed
- ✅ Cleaner code - declarative behavior
- ✅ Prevents stale data when callback dependencies change
- ✅ Works seamlessly with React's `useCallback` hook

## API Reference

### DataViewProvider

The root provider component that manages state and data fetching.

#### Props

**Supabase Mode:**
```typescript
interface DataViewProviderProps {
  // Required for Supabase mode
  tableName: string              // Supabase table name
  
  // Optional Supabase config
  columns?: string               // Columns to select (default: "*")
  baseQuery?: (query) => query   // Additional query modifications
  
  // Filter configuration
  filters?: FilterGroup[]
  filterMappings?: FilterColumnMapping[]
  
  // Search configuration
  searchColumn?: string          // Single column search
  searchColumns?: string[]       // Multiple column search (OR)
  
  // Sort configuration
  sortOptions?: SortOption[]
  defaultSort?: { column: string; ascending: boolean }
  
  // Data transformation
  onDataLoaded?: (data, context) => Promise<TransformedData>
  onRefetchReady?: (refetch: () => void) => void
  
  // Pagination
  pageSize?: number              // Items per page (default: 20)
  paginationType?: 'classic' | 'load-more' | 'infinite-scroll'
  
  // View mode
  defaultViewMode?: 'list' | 'grid'
  forcedViewMode?: 'list' | 'grid'
  
  // SSR hydration
  initialData?: { data: T[]; count: number }
  
  // URL state
  urlNamespace?: string          // Prefix for URL params
  
  children: ReactNode
}
```

**Custom Fetcher Mode:**
```typescript
interface DataViewProviderProps {
  // Required for custom mode
  customFetcher: (context: DataFetchContext) => Promise<DataFetchResult>
  
  // All other props same as above (except Supabase-specific ones)
}
```

### Filter Types

```typescript
interface FilterGroup {
  id: string                     // Unique identifier (used in URL)
  label: string                  // Display label
  mode: 'single' | 'multiple'    // Radio or checkbox
  options: FilterOption[]
  searchable?: boolean           // Enable search within options
  defaultValue?: string[]
}

interface FilterOption {
  label: string                  // Display label
  value: string                  // Filter value
  count?: number                 // Optional item count
  icon?: ReactNode               // Optional icon
}

interface FilterColumnMapping {
  filterId: string               // Matches FilterGroup.id
  column: string                 // Supabase column name
  operator: FilterOperator
  transform?: (values: string[]) => unknown
}
```

### Sort Types

```typescript
interface SortOption {
  label: string                  // Display label
  value: string                  // Format: "column:direction"
}

// Example:
const sortOptions = [
  { label: 'Newest First', value: 'created_at:desc' },
  { label: 'Name A-Z', value: 'name:asc' },
]
```

## Components

### Toolbar Components

```tsx
<DataViewToolbar>
  <DataViewSearch placeholder="Search..." />
  <DataViewFilters />
  <DataViewSort />
  <DataViewViewToggle />
</DataViewToolbar>
```

### Active Tags

Display active filters with remove buttons:

```tsx
<DataViewActiveTags />
```

### Content Components

```tsx
<DataViewContent
  loadingSkeleton={<Skeleton />}
  emptyState={<EmptyState />}
>
  {/* View components */}
</DataViewContent>
```

### View Components

```tsx
// List view
<DataViewList>
  {(item) => <ItemCard item={item} />}
</DataViewList>

// Grid view
<DataViewGrid cols={{ sm: 1, md: 2, lg: 3, xl: 4 }}>
  {(item) => <ItemCard item={item} />}
</DataViewGrid>
```

### Pagination Components

```tsx
// Classic pagination
<DataViewPagination />

// Load more button
<DataViewLoadMore label="Load More" />

// Infinite scroll
<DataViewInfiniteScroll threshold={200} />
```

## Advanced Examples

### Example 1: Supabase with Relations

```tsx
'use client'

import { createClient } from '@/utils/supabase/client'
import { DataViewProvider, ... } from '@/components/data-view'

const supabase = createClient()

async function fetchProjectMembers(projects) {
  const projectIds = projects.map(p => p.id)
  
  const { data: members } = await supabase
    .from('project_members')
    .select('*, profiles(*)')
    .in('project_id', projectIds)
  
  const membersByProject = new Map()
  members?.forEach(m => {
    if (!membersByProject.has(m.project_id)) {
      membersByProject.set(m.project_id, [])
    }
    membersByProject.get(m.project_id).push(m)
  })
  
  return projects.map(project => ({
    ...project,
    members: membersByProject.get(project.id) || []
  }))
}

export function ProjectsView() {
  return (
    <DataViewProvider
      tableName="projects"
      columns="id, name, status, created_at"
      baseQuery={(query) => query.eq('deleted', false)}
      onDataLoaded={fetchProjectMembers}
      filterMappings={[
        { filterId: 'status', column: 'status', operator: 'in' },
      ]}
      searchColumn="name"
      pageSize={20}
    >
      {/* Components */}
    </DataViewProvider>
  )
}
```

### Example 2: Real-time Updates

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { DataViewProvider, ... } from '@/components/data-view'

export function TasksView() {
  const refetchRef = useRef<(() => void) | null>(null)
  const supabase = createClient()
  
  useEffect(() => {
    const channel = supabase
      .channel('tasks')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tasks' },
        () => refetchRef.current?.()
      )
      .subscribe()
    
    return () => { channel.unsubscribe() }
  }, [])
  
  return (
    <DataViewProvider
      tableName="tasks"
      onRefetchReady={(refetch) => {
        refetchRef.current = refetch
      }}
    >
      {/* Components */}
    </DataViewProvider>
  )
}
```

### Example 3: SSR with Initial Data

```tsx
// app/projects/page.tsx
import { createClient } from '@/utils/supabase/server'
import { ProjectsView } from './projects-view'

export default async function ProjectsPage() {
  const supabase = createClient()
  
  const { data, count } = await supabase
    .from('projects')
    .select('*', { count: 'exact' })
    .range(0, 19)
  
  return (
    <ProjectsView 
      initialData={{ data: data || [], count: count || 0 }} 
    />
  )
}
```

### Example 4: JSONB Filtering

```tsx
const filterMappings = [
  {
    filterId: 'language',
    column: 'name->>ar',  // JSONB field
    operator: 'ilike' as const,
  },
]

<DataViewProvider
  tableName="projects"
  searchColumn="name->>ar"
  filterMappings={filterMappings}
>
```

## TypeScript Support

The component leverages Supabase's generated types for full type safety:

```typescript
import { Database } from '@/types/database.types'

type Project = Database['public']['Tables']['projects']['Row']

// DataViewProvider automatically infers types
<DataViewProvider<Project>
  tableName="projects"
  onDataLoaded={async (projects: Project[]) => {
    // Fully typed
    return projects.map(p => ({ ...p, custom: true }))
  }}
>
  <DataViewList>
    {(project: Project) => (
      // Fully typed project
      <div>{project.name}</div>
    )}
  </DataViewList>
</DataViewProvider>
```

## Hooks

### useDataView

Access DataView context from any child component:

```tsx
import { useDataView } from '@/components/data-view'

function CustomComponent() {
  const {
    data,
    totalCount,
    isLoading,
    isFetching,
    currentSearch,
    currentFilters,
    handleSearchChange,
    refetch,
  } = useDataView()
  
  return <div>{totalCount} items</div>
}
```

### useDataViewUrlState (Standalone)

For custom implementations:

```tsx
import { useDataViewUrlState } from '@/components/data-view'

const {
  currentSearch,
  currentFilters,
  currentSort,
  handleSearchChange,
  handleFiltersChange,
} = useDataViewUrlState({
  filters,
  urlNamespace: 'tasks',
})
```

### useDataViewInfiniteQuery (Standalone)

For custom Supabase queries:

```tsx
import { useDataViewInfiniteQuery } from '@/components/data-view'

const { data, count, isLoading, fetchNextPage } = useDataViewInfiniteQuery({
  tableName: 'projects',
  filters: currentFilters,
  search: currentSearch,
  pageSize: 20,
})
```

## Configuration

### Cookie Settings

View mode preference is persisted in cookies. Configure in your `global-config.ts`:

```typescript
export const DATA_VIEW_MODE_COOKIE_NAME = "DATA_VIEW_MODE"
export const DATA_VIEW_MODE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year
```

### Custom Supabase Client

By default, the component uses `@/utils/supabase/client`. To customize:

```typescript
// Modify components/data-view/hooks/use-data-view-infinite-query.ts
import { createClient } from '@/your-custom-path/supabase/client'
```

## Best Practices

### 1. Use RLS Policies

Always enable Row Level Security on your Supabase tables:

```sql
alter table projects enable row level security;

create policy "Users can view their projects"
  on projects for select
  using (auth.uid() = user_id);
```

### 2. Optimize Columns Selection

Only select columns you need:

```tsx
<DataViewProvider
  tableName="projects"
  columns="id, name, status, created_at"  // Not "*"
>
```

### 3. Use Indexes

Add database indexes for filtered/sorted columns:

```sql
create index idx_projects_status on projects(status);
create index idx_projects_created_at on projects(created_at);
```

### 4. Batch Related Data

Fetch relations in a single query when possible:

```tsx
onDataLoaded={async (projects) => {
  const [members, customers] = await Promise.all([
    fetchMembers(projectIds),
    fetchCustomers(projectIds),
  ])
  return enrichProjects(projects, members, customers)
}}
```

### 5. Use URL Namespaces

When using multiple DataViews on one page:

```tsx
<DataViewProvider urlNamespace="active" {...}>
<DataViewProvider urlNamespace="archived" {...}>
```

## Migration from Other Data Tables

### From TanStack Table

```tsx
// Before
<Table data={data} columns={columns} />

// After
<DataViewProvider tableName="your_table">
  <DataViewList>
    {(item) => <YourRow item={item} />}
  </DataViewList>
</DataViewProvider>
```

### From Custom Implementation

Replace manual state management:

```tsx
// Before: Manual state
const [search, setSearch] = useState('')
const [filters, setFilters] = useState({})
const [page, setPage] = useState(1)

// After: Automatic
<DataViewProvider tableName="your_table">
```

## Troubleshooting

### Type Errors

Regenerate Supabase types:

```bash
npx supabase gen types typescript --linked > types/database.types.ts
```

### RLS Errors

Check your Row Level Security policies:

```sql
select * from projects; -- Should work with RLS
```

### Performance Issues

1. Add database indexes
2. Reduce `pageSize`
3. Optimize `onDataLoaded` callbacks
4. Use column selection instead of `*`

## Contributing

Contributions are welcome! This is a standalone component designed for copy-paste into your project.

## License

MIT License - feel free to use in your projects!

## Credits

Built with:
- [Supabase](https://supabase.com/) - The open source Firebase alternative
- [React](https://react.dev/) - UI library
- [Next.js](https://nextjs.org/) - React framework
- [Radix UI](https://www.radix-ui.com/) - Accessible components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Framer Motion](https://www.framer.com/motion/) - Animation library

---

**Made with ❤️ for the Supabase community**
