import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, doc, setDoc, serverTimestamp } from '../firebase'

export default function HomeView() {
  const [listName, setListName] = useState('')
  const [playerName, setPlayerName] = useState(
    () => localStorage.getItem('tallyrally_name') || ''
  )
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()

  async function handleCreate(e) {
    e.preventDefault()
    if (!listName.trim() || !playerName.trim()) return

    setCreating(true)
    try {
      const id = crypto.randomUUID()
      await setDoc(doc(db, 'lists', id), {
        name: listName.trim(),
        createdAt: serverTimestamp(),
      })
      localStorage.setItem('tallyrally_name', playerName.trim())
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
          required
        />

        <button type="submit" className="btn-primary" disabled={creating}>
          {creating ? 'Creating...' : 'Create List'}
        </button>
      </form>
    </main>
  )
}
