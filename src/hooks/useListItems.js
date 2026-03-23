import { useState, useEffect } from 'react'
import { db, collection, query, orderBy, onSnapshot } from '../firebase'

export default function useListItems(listId) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!listId) return

    const q = query(
      collection(db, 'lists', listId, 'items'),
      orderBy('createdAt', 'asc')
    )

    const unsub = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })

    return unsub
  }, [listId])

  return { items, loading }
}
