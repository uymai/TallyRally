import { renderHook, act } from '@testing-library/react'
import useLocalOrder from './useLocalOrder'

const STORAGE_KEY = (id) => `tallyrally_order_${id}`

beforeEach(() => {
  localStorage.clear()
})

describe('useLocalOrder', () => {
  it('returns items unchanged when no stored order exists', () => {
    const items = [
      { id: 'a', text: 'Apples' },
      { id: 'b', text: 'Bread' },
    ]
    const { result } = renderHook(() => useLocalOrder('list1', items))
    expect(result.current.sortedItems).toEqual(items)
  })

  it('preserves stored order when all item IDs match', () => {
    localStorage.setItem(STORAGE_KEY('list1'), JSON.stringify(['b', 'a']))
    const items = [
      { id: 'a', text: 'Apples' },
      { id: 'b', text: 'Bread' },
    ]
    const { result } = renderHook(() => useLocalOrder('list1', items))
    expect(result.current.sortedItems.map((i) => i.id)).toEqual(['b', 'a'])
  })

  it('appends new Firestore items not present in the stored order', () => {
    localStorage.setItem(STORAGE_KEY('list1'), JSON.stringify(['a']))
    const items = [
      { id: 'a', text: 'Apples' },
      { id: 'b', text: 'Bread' },
    ]
    const { result } = renderHook(() => useLocalOrder('list1', items))
    expect(result.current.sortedItems.map((i) => i.id)).toEqual(['a', 'b'])
  })

  it('drops stale IDs that no longer exist in Firestore', () => {
    localStorage.setItem(STORAGE_KEY('list1'), JSON.stringify(['a', 'stale', 'b']))
    const items = [
      { id: 'a', text: 'Apples' },
      { id: 'b', text: 'Bread' },
    ]
    const { result } = renderHook(() => useLocalOrder('list1', items))
    expect(result.current.sortedItems.map((i) => i.id)).toEqual(['a', 'b'])
  })

  it('moveItem reorders items and persists the new order to localStorage', () => {
    const items = [
      { id: 'a', text: 'Apples' },
      { id: 'b', text: 'Bread' },
      { id: 'c', text: 'Carrots' },
    ]
    const { result } = renderHook(() => useLocalOrder('list1', items))

    act(() => {
      result.current.moveItem('c', 'a')
    })

    const ids = result.current.sortedItems.map((i) => i.id)
    expect(ids).toEqual(['c', 'a', 'b'])
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY('list1')))).toEqual(['c', 'a', 'b'])
  })

  it('reloads order from localStorage when listId changes', () => {
    localStorage.setItem(STORAGE_KEY('list2'), JSON.stringify(['z', 'y']))
    const items = [
      { id: 'y', text: 'Yogurt' },
      { id: 'z', text: 'Zucchini' },
    ]
    const { result, rerender } = renderHook(
      ({ listId }) => useLocalOrder(listId, items),
      { initialProps: { listId: 'list1' } }
    )
    expect(result.current.sortedItems.map((i) => i.id)).toEqual(['y', 'z'])

    rerender({ listId: 'list2' })
    expect(result.current.sortedItems.map((i) => i.id)).toEqual(['z', 'y'])
  })
})
