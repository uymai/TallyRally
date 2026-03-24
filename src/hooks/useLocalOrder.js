import { useState, useEffect, useMemo } from 'react'

const storageKey = (listId) => `tallyrally_order_${listId}`

function loadOrder(listId) {
  try {
    const raw = localStorage.getItem(storageKey(listId))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveOrder(listId, idArray) {
  try {
    localStorage.setItem(storageKey(listId), JSON.stringify(idArray))
  } catch {
    // Quota exceeded or private browsing — fail silently.
  }
}

export default function useLocalOrder(listId, items) {
  const [orderedIds, setOrderedIds] = useState(() => loadOrder(listId))

  useEffect(() => {
    setOrderedIds(loadOrder(listId))
  }, [listId])

  const sortedItems = useMemo(() => {
    if (!orderedIds) return items

    const liveMap = new Map(items.map((item) => [item.id, item]))

    const ordered = []
    const seen = new Set()
    for (const id of orderedIds) {
      if (liveMap.has(id)) {
        ordered.push(liveMap.get(id))
        seen.add(id)
      }
    }

    // Append new items from Firestore not yet in the stored order
    for (const item of items) {
      if (!seen.has(item.id)) {
        ordered.push(item)
      }
    }

    return ordered
  }, [orderedIds, items])

  useEffect(() => {
    if (orderedIds !== null) {
      saveOrder(listId, orderedIds)
    }
  }, [listId, orderedIds])

  function moveItem(index, direction) {
    const ids = sortedItems.map((i) => i.id)
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= ids.length) return

    const next = [...ids]
    ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
    setOrderedIds(next)
  }

  return { sortedItems, moveItem }
}
