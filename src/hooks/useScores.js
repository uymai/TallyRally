import { useState, useEffect } from 'react'
import { db, collection, query, orderBy, onSnapshot } from '../firebase'

export default function useScores(listId) {
  const [scores, setScores] = useState([])

  useEffect(() => {
    if (!listId) return

    const q = query(
      collection(db, 'lists', listId, 'scores'),
      orderBy('points', 'desc')
    )

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setScores(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
      },
      (err) => {
        console.error('Failed to load scores:', err)
      }
    )

    return unsub
  }, [listId])

  return scores
}
