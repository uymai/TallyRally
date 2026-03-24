import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { db, doc, runTransaction, increment, serverTimestamp } from '../firebase'

function SortableItem({ item, playerName, onCheck, onUncheck }) {
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
      {item.checkedOff && item.checkedBy === playerName && (
        <button
          className="uncheck-btn"
          onClick={() => onUncheck(item.id)}
          aria-label={`Undo check for ${item.text}`}
        >
          ↩
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

export default function ItemList({ items, listId, playerName, onMove }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

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

  async function handleUncheck(itemId) {
    const itemRef = doc(db, 'lists', listId, 'items', itemId)

    try {
      await runTransaction(db, async (tx) => {
        const itemDoc = await tx.get(itemRef)
        if (!itemDoc.exists()) return
        const data = itemDoc.data()
        if (!data.checkedOff || data.checkedBy !== playerName) return

        tx.update(itemRef, {
          checkedOff: false,
          checkedBy: null,
          checkedAt: null,
        })

        const scoreRef = doc(db, 'lists', listId, 'scores', playerName)
        const scoreDoc = await tx.get(scoreRef)
        const current = scoreDoc.exists() ? (scoreDoc.data().points ?? 0) : 0
        tx.set(
          scoreRef,
          {
            name: playerName,
            points: Math.max(0, current - 1),
            lastUpdated: serverTimestamp(),
          },
          { merge: true }
        )
      })
    } catch (err) {
      console.error('Failed to uncheck item:', err)
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
