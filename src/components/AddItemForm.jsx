import { useState, useRef } from 'react'
import { db, collection, doc, addDoc, updateDoc, serverTimestamp } from '../firebase'

export default function AddItemForm({ listId, playerName, uid, authReady }) {
  const [text, setText] = useState('')
  const [adding, setAdding] = useState(false)
  const lastSubmitRef = useRef(0)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim() || !authReady || !uid) return

    const now = Date.now()
    if (now - lastSubmitRef.current < 500) return
    lastSubmitRef.current = now

    setAdding(true)
    try {
      await Promise.all([
        addDoc(collection(db, 'lists', listId, 'items'), {
          text: text.trim(),
          addedBy: playerName,
          checkedOff: false,
          checkedBy: null,
          checkedByUid: null,
          checkedAt: null,
          createdAt: serverTimestamp(),
        }),
        updateDoc(doc(db, 'lists', listId), { lastActivityAt: serverTimestamp() }),
      ])
      setText('')
    } catch (err) {
      console.error('Failed to add item:', err)
    } finally {
      setAdding(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="add-item-form">
      <input
        type="text"
        placeholder="Add an item..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={adding || !authReady}
        maxLength={100}
        required
      />
      <button type="submit" className="btn-add" disabled={adding || !authReady}>
        +
      </button>
    </form>
  )
}
