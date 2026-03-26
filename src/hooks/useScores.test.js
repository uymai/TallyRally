import { renderHook, act } from '@testing-library/react'
import { vi } from 'vitest'

let snapshotCallback
const unsubscribe = vi.fn()

vi.mock('../firebase', () => ({
  db: {},
  collection: vi.fn(() => 'collectionRef'),
  query: vi.fn((ref) => ref),
  orderBy: vi.fn(() => 'orderByClause'),
  onSnapshot: vi.fn((q, onNext) => {
    snapshotCallback = onNext
    return unsubscribe
  }),
}))

import useScores from './useScores'
import { onSnapshot } from '../firebase'

beforeEach(() => {
  snapshotCallback = undefined
  unsubscribe.mockClear()
  vi.mocked(onSnapshot).mockClear()
})

describe('useScores', () => {
  it('starts with an empty scores array', () => {
    const { result } = renderHook(() => useScores('list1'))
    expect(result.current).toEqual([])
  })

  it('populates scores when the snapshot fires', async () => {
    const { result } = renderHook(() => useScores('list1'))

    const fakeDocs = [
      { id: 'Alice', data: () => ({ name: 'Alice', points: 5 }) },
      { id: 'Bob', data: () => ({ name: 'Bob', points: 3 }) },
    ]

    await vi.waitFor(() => expect(snapshotCallback).toBeDefined())
    act(() => { snapshotCallback({ docs: fakeDocs }) })

    expect(result.current).toEqual([
      { id: 'Alice', name: 'Alice', points: 5 },
      { id: 'Bob', name: 'Bob', points: 3 },
    ])
  })

  it('calls the unsubscribe function on unmount', () => {
    const { unmount } = renderHook(() => useScores('list1'))
    unmount()
    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })

  it('does not subscribe when listId is falsy', () => {
    const callsBefore = vi.mocked(onSnapshot).mock.calls.length
    renderHook(() => useScores(null))
    expect(vi.mocked(onSnapshot).mock.calls.length).toBe(callsBefore)
  })
})
