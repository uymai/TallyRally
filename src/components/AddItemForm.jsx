import { useState } from 'react'
import { db, collection, addDoc, serverTimestamp } from '../firebase'

export default function AddItemForm({ listId, playerName }) {
  const [text, setText] = useState('')
  const [adding, setAdding] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return

    setAdding(true)
    try {
      await addDoc(collection(db, 'lists', listId, 'items'), {
        text: text.trim(),
        addedBy: playerName,
        checkedOff: false,
        checkedBy: null,
        checkedAt: null,
        createdAt: serverTimestamp(),
      })
      setText('')
    } catch (err) {
      console.error('Failed to add item:', err)
    }
    setAdding(false)
  }

  return (
    <form onSubmit={handleSubmit} className="add-item-form">
      <input
        type="text"
        placeholder="Add an item..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={adding}
        required
      />
      <button type="submit" className="btn-add" disabled={adding}>
        +
      </button>
    </form>
  )
}
