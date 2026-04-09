import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { db, doc, getDoc } from '../firebase'
import useListItems from '../hooks/useListItems'
import useLocalOrder from '../hooks/useLocalOrder'
import useScores from '../hooks/useScores'
import useRecentLists from '../hooks/useRecentLists'
import useAuth from '../hooks/useAuth'
import Scoreboard from './Scoreboard'
import AddItemForm from './AddItemForm'
import ItemList from './ItemList'
import ShareButton from './ShareButton'

export default function ListView() {
  const { listId } = useParams()
  const [listName, setListName] = useState('')
  const { items, loading, error } = useListItems(listId)
  const { sortedItems, moveItem } = useLocalOrder(listId, items)
  const scores = useScores(listId)
  const playerName = localStorage.getItem('tallyrally_name')
  const { addRecentList } = useRecentLists()
  const { uid, authReady } = useAuth()

  useEffect(() => {
    getDoc(doc(db, 'lists', listId)).then((snap) => {
      if (snap.exists()) {
        const name = snap.data().name
        setListName(name)
        addRecentList(listId, name)
      } else {
        setListName('List not found')
      }
    })
  }, [listId])

  const uncheckedCount = items.filter((i) => !i.checkedOff).length
  const totalCount = items.length

  return (
    <main className="view list-view">
      <header className="list-header">
        <div className="list-header-top">
          <div>
            <h1 className="list-title">{listName}</h1>
            {totalCount > 0 && (
              <span className="list-progress">
                {totalCount - uncheckedCount}/{totalCount} done
              </span>
            )}
          </div>
          <ShareButton listId={listId} />
        </div>
        <p className="player-badge">Playing as <strong>{playerName}</strong></p>
      </header>

      <Scoreboard scores={scores} currentPlayer={playerName} />
      <AddItemForm listId={listId} playerName={playerName} uid={uid} authReady={authReady} />

      {error ? (
        <div className="empty-state"><p>{error}</p></div>
      ) : loading ? (
        <div className="loading">Loading items...</div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <p>No items yet. Add something to get started!</p>
        </div>
      ) : (
        <ItemList items={sortedItems} listId={listId} playerName={playerName} uid={uid} authReady={authReady} onMove={moveItem} />
      )}
    </main>
  )
}
