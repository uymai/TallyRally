import { db, doc, runTransaction, increment, serverTimestamp } from '../firebase'

export default function ItemList({ items, listId, playerName }) {
  async function handleCheck(itemId) {
    const itemRef = doc(db, 'lists', listId, 'items', itemId)

    try {
      await runTransaction(db, async (tx) => {
        const itemDoc = await tx.get(itemRef)
        if (!itemDoc.exists() || itemDoc.data().checkedOff) return

        tx.update(itemRef, {
          checkedOff: true,
          checkedBy: playerName,
          checkedAt: serverTimestamp(),
        })

        const scoreRef = doc(db, 'lists', listId, 'scores', playerName)
        tx.set(
          scoreRef,
          {
            name: playerName,
            points: increment(1),
            lastUpdated: serverTimestamp(),
          },
          { merge: true }
        )
      })
    } catch (err) {
      console.error('Failed to check off item:', err)
    }
  }

  return (
    <ul className="item-list">
      {items.map((item) => (
        <li
          key={item.id}
          className={`item-card ${item.checkedOff ? 'checked' : ''}`}
        >
          <button
            className="check-btn"
            onClick={() => !item.checkedOff && handleCheck(item.id)}
            disabled={item.checkedOff}
            aria-label={
              item.checkedOff
                ? `${item.text} - checked by ${item.checkedBy}`
                : `Check off ${item.text}`
            }
          >
            <span className="check-icon">
              {item.checkedOff ? '✅' : '⬜'}
            </span>
          </button>
          <div className="item-content">
            <span className="item-text">{item.text}</span>
            <span className="item-meta">
              {item.checkedOff
                ? `Claimed by ${item.checkedBy}`
                : `Added by ${item.addedBy}`}
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}
