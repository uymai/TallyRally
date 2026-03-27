import { renderHook, act } from '@testing-library/react'
import useRecentLists from './useRecentLists'

const STORAGE_KEY = 'tallyrally_recent_lists'

beforeEach(() => {
  localStorage.clear()
})

describe('useRecentLists', () => {
  it('returns empty array when localStorage is empty', () => {
    const { result } = renderHook(() => useRecentLists())
    expect(result.current.recentLists).toEqual([])
  })

  it('loads existing lists from localStorage on init', () => {
    const stored = [{ id: 'abc', name: 'My List', visitedAt: 1000 }]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    const { result } = renderHook(() => useRecentLists())
    expect(result.current.recentLists).toEqual(stored)
  })

  it('addRecentList prepends a new entry and persists to localStorage', () => {
    const { result } = renderHook(() => useRecentLists())

    act(() => {
      result.current.addRecentList('list1', 'Groceries')
    })

    expect(result.current.recentLists).toHaveLength(1)
    expect(result.current.recentLists[0]).toMatchObject({ id: 'list1', name: 'Groceries' })
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    expect(saved[0]).toMatchObject({ id: 'list1', name: 'Groceries' })
  })

  it('addRecentList deduplicates by id and moves the entry to the front', () => {
    const { result } = renderHook(() => useRecentLists())

    act(() => { result.current.addRecentList('list1', 'Groceries') })
    act(() => { result.current.addRecentList('list2', 'Hardware') })
    act(() => { result.current.addRecentList('list1', 'Groceries Updated') })

    expect(result.current.recentLists).toHaveLength(2)
    expect(result.current.recentLists[0]).toMatchObject({ id: 'list1', name: 'Groceries Updated' })
    expect(result.current.recentLists[1]).toMatchObject({ id: 'list2' })
  })

  it('removeRecentList removes the entry and persists the result', () => {
    const { result } = renderHook(() => useRecentLists())

    act(() => { result.current.addRecentList('list1', 'Groceries') })
    act(() => { result.current.addRecentList('list2', 'Hardware') })
    act(() => { result.current.removeRecentList('list1') })

    expect(result.current.recentLists).toHaveLength(1)
    expect(result.current.recentLists[0]).toMatchObject({ id: 'list2' })
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    expect(saved).toHaveLength(1)
  })

  it('caps stored lists at 25 entries', () => {
    const { result } = renderHook(() => useRecentLists())

    act(() => {
      for (let i = 0; i < 30; i++) {
        result.current.addRecentList(`list${i}`, `List ${i}`)
      }
    })

    expect(result.current.recentLists).toHaveLength(25)
  })
})
