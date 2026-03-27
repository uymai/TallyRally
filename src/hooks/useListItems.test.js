import { renderHook, act } from '@testing-library/react'
import { vi } from 'vitest'

// Capture the onSnapshot callbacks so tests can drive them
let snapshotCallback
let errorCallback
const unsubscribe = vi.fn()

vi.mock('../firebase', () => ({
  db: {},
  collection: vi.fn(() => 'collectionRef'),
  query: vi.fn((ref) => ref),
  orderBy: vi.fn(() => 'orderByClause'),
  onSnapshot: vi.fn((q, onNext, onError) => {
    snapshotCallback = onNext
    errorCallback = onError
    return unsubscribe
  }),
}))

// Import after vi.mock so the mock is in effect
import useListItems from './useListItems'
import { onSnapshot } from '../firebase'

beforeEach(() => {
  snapshotCallback = undefined
  errorCallback = undefined
  unsubscribe.mockClear()
  vi.mocked(onSnapshot).mockClear()
})

describe('useListItems', () => {
  it('starts with loading=true and empty items', () => {
    const { result } = renderHook(() => useListItems('list1'))
    expect(result.current.loading).toBe(true)
    expect(result.current.items).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('populates items and sets loading=false when snapshot fires', async () => {
    const { result } = renderHook(() => useListItems('list1'))

    const fakeDocs = [
      { id: 'item1', data: () => ({ text: 'Milk', checkedOff: false }) },
      { id: 'item2', data: () => ({ text: 'Eggs', checkedOff: true }) },
    ]

    await vi.waitFor(() => expect(snapshotCallback).toBeDefined())
    act(() => { snapshotCallback({ docs: fakeDocs }) })

    expect(result.current.loading).toBe(false)
    expect(result.current.items).toEqual([
      { id: 'item1', text: 'Milk', checkedOff: false },
      { id: 'item2', text: 'Eggs', checkedOff: true },
    ])
    expect(result.current.error).toBeNull()
  })

  it('sets error message and loading=false when snapshot errors', async () => {
    const { result } = renderHook(() => useListItems('list1'))

    await vi.waitFor(() => expect(errorCallback).toBeDefined())
    act(() => { errorCallback(new Error('Permission denied')) })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe('Failed to load items.')
  })

  it('calls the unsubscribe function on unmount', () => {
    const { unmount } = renderHook(() => useListItems('list1'))
    unmount()
    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })

  it('does not subscribe when listId is falsy', () => {
    const callsBefore = vi.mocked(onSnapshot).mock.calls.length
    renderHook(() => useListItems(null))
    expect(vi.mocked(onSnapshot).mock.calls.length).toBe(callsBefore)
  })
})
