# Changelog

All notable changes to the DataView component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- **Automatic refetch on callback changes**: DataViewProvider now automatically detects when `baseQuery`, `customFetcher`, or `onDataLoaded` callback references change and triggers a refetch. This eliminates the need for manual `refetch()` calls when callback dependencies change.

### Changed
- Query key generation now includes callback reference tracking via internal counters
- `useDataViewInfiniteQuery` hook now monitors callback reference changes

### Improved
- TasksDataView component simplified by removing manual refetch logic when `showClosedTasks` toggle changes
- Better developer experience with declarative data refetching

### Technical Details
- Added reference counter tracking for `baseQuery`, `customFetcher`, and `onDataLoaded` props
- Counters increment when callback references change (detected via `useRef` comparisons)
- Query key includes counter values to invalidate cache when callbacks change
- Works seamlessly with React's `useCallback` hook and its dependency array