import { useRef } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { db, doc, updateDoc, runTransaction, increment, serverTimestamp } from '../firebase'

function SortableItem({ item, uid, authReady, playerName, onCheck, onUncheck }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`item-card ${item.checkedOff ? 'checked' : ''} ${isDragging ? 'dragging' : ''}`}
    >
      <button
        className="check-btn"
        onClick={() => !item.checkedOff && onCheck(item.id)}
        disabled={item.checkedOff || !authReady}
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
      {item.checkedOff && item.checkedByUid === uid && (
        <button
          className="uncheck-btn"
          onClick={() => onUncheck(item.id)}
          aria-label={`Undo check for ${item.text}`}
          title="Undo my check"
        >
          ✕
        </button>
      )}
      <div
        className="drag-handle"
        {...listeners}
        {...attributes}
        aria-label="Drag to reorder"
      >
        ⠿
      </div>
    </li>
  )
}

export default function ItemList({ items, listId, playerName, uid, authReady, onMove }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )
  const inFlightRef = useRef(new Set())

  async function handleCheck(itemId) {
    if (!authReady || !uid) return
    if (inFlightRef.current.has(itemId)) return
    inFlightRef.current.add(itemId)

    const itemRef = doc(db, 'lists', listId, 'items', itemId)
    const listRef = doc(db, 'lists', listId)
    const scoreRef = doc(db, 'lists', listId, 'scores', uid)

    try {
      await runTransaction(db, async (tx) => {
        const itemDoc = await tx.get(itemRef)
        if (!itemDoc.exists() || itemDoc.data().checkedOff) return

        tx.update(itemRef, {
          checkedOff: true,
          checkedBy: playerName,
          checkedByUid: uid,
          checkedAt: serverTimestamp(),
        })

        tx.set(
          scoreRef,
          {
            uid,
            name: playerName,
            points: increment(1),
            lastUpdated: serverTimestamp(),
          },
          { merge: true }
        )
      })
      // Update lastActivityAt outside the transaction so rapid check-offs
      // don't stall the Firestore watch stream via per-document write throttling.
      updateDoc(listRef, { lastActivityAt: serverTimestamp() }).catch(console.error)
    } catch (err) {
      console.error('Failed to check off item:', err)
    } finally {
      inFlightRef.current.delete(itemId)
    }
  }

  async function handleUncheck(itemId) {
    if (!authReady || !uid) return
    if (inFlightRef.current.has(itemId)) return
    inFlightRef.current.add(itemId)

    const itemRef = doc(db, 'lists', listId, 'items', itemId)
    const scoreRef = doc(db, 'lists', listId, 'scores', uid)

    try {
      await runTransaction(db, async (tx) => {
        // All reads must happen before any writes in a Firestore transaction
        const [itemDoc, scoreDoc] = await Promise.all([tx.get(itemRef), tx.get(scoreRef)])

        if (!itemDoc.exists()) return
        const data = itemDoc.data()
        if (!data.checkedOff || data.checkedByUid !== uid) return

        tx.update(itemRef, {
          checkedOff: false,
          checkedBy: null,
          checkedByUid: null,
          checkedAt: null,
        })

        const current = scoreDoc.exists() ? (scoreDoc.data().points ?? 0) : 0
        tx.set(
          scoreRef,
          {
            uid,
            name: playerName,
            points: Math.max(0, current - 1),
            lastUpdated: serverTimestamp(),
          },
          { merge: true }
        )
      })
      updateDoc(doc(db, 'lists', listId), { lastActivityAt: serverTimestamp() }).catch(console.error)
    } catch (err) {
      console.error('Failed to uncheck item:', err)
    } finally {
      inFlightRef.current.delete(itemId)
    }
  }

  function handleDragEnd(event) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      onMove(active.id, over.id)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <ul className="item-list">
          {items.map((item) => (
            <SortableItem
              key={item.id}
              item={item}
              uid={uid}
              authReady={authReady}
              playerName={playerName}
              onCheck={handleCheck}
              onUncheck={handleUncheck}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}
