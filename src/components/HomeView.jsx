import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, doc, setDoc, serverTimestamp } from '../firebase'
import useRecentLists from '../hooks/useRecentLists'
import useAuth from '../hooks/useAuth'

export default function HomeView() {
  const [listName, setListName] = useState('')
  const [playerName, setPlayerName] = useState(
    () => localStorage.getItem('tallyrally_name') || ''
  )
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()
  const { recentLists, addRecentList, removeRecentList } = useRecentLists()
  const { authReady } = useAuth()

  async function handleCreate(e) {
    e.preventDefault()
    if (!listName.trim() || !playerName.trim() || !authReady) return

    setCreating(true)
    try {
      const id = crypto.randomUUID()
      const name = listName.trim()
      await setDoc(doc(db, 'lists', id), {
        name,
        createdAt: serverTimestamp(),
        lastActivityAt: serverTimestamp(),
      })
      localStorage.setItem('tallyrally_name', playerName.trim())
      addRecentList(id, name)
      navigate(`/list/${id}`)
    } catch (err) {
      console.error('Failed to create list:', err)
      setCreating(false)
    }
  }

  return (
    <main className="view home-view">
      <div className="logo">
        <span className="logo-icon">🛒</span>
        <h1>TallyRally</h1>
      </div>
      <p className="tagline">Shop together. Score points. Have fun.</p>

      <form onSubmit={handleCreate} className="form-card">
        <label htmlFor="list-name">List name</label>
        <input
          id="list-name"
          type="text"
          placeholder="e.g. Weekend BBQ"
          value={listName}
          onChange={(e) => setListName(e.target.value)}
          maxLength={60}
          required
          autoFocus
        />

        <label htmlFor="player-name">Your name</label>
        <input
          id="player-name"
          type="text"
          placeholder="e.g. Alex"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          maxLength={30}
          required
        />

        <button type="submit" className="btn-primary" disabled={creating || !authReady}>
          {creating ? 'Creating...' : 'Create List'}
        </button>
      </form>

      {recentLists.length > 0 && (
        <section className="recent-lists">
          <h2 className="recent-lists-heading">Recent lists</h2>
          <ul className="recent-list-items">
            {recentLists.map((list) => (
              <li key={list.id} className="recent-list-item">
                <button
                  className="recent-list-link"
                  onClick={() => navigate(`/list/${list.id}`)}
                >
                  {list.name}
                </button>
                <button
                  className="recent-list-remove"
                  aria-label={`Remove ${list.name} from recent lists`}
                  onClick={() => removeRecentList(list.id)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
