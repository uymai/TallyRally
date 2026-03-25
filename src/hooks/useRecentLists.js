import { useState, useCallback } from 'react'

const STORAGE_KEY = 'tallyrally_recent_lists'
const MAX_LISTS = 25

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
}

function save(lists) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lists))
}

export default function useRecentLists() {
  const [recentLists, setRecentLists] = useState(load)

  const addRecentList = useCallback((id, name) => {
    setRecentLists((prev) => {
      const filtered = prev.filter((l) => l.id !== id)
      const updated = [{ id, name, visitedAt: Date.now() }, ...filtered].slice(0, MAX_LISTS)
      save(updated)
      return updated
    })
  }, [])

  const removeRecentList = useCallback((id) => {
    setRecentLists((prev) => {
      const updated = prev.filter((l) => l.id !== id)
      save(updated)
      return updated
    })
  }, [])

  return { recentLists, addRecentList, removeRecentList }
}
