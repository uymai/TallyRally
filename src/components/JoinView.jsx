import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

export default function JoinView() {
  const { listId } = useParams()
  const navigate = useNavigate()
  const [playerName, setPlayerName] = useState('')

  function handleJoin(e) {
    e.preventDefault()
    if (!playerName.trim()) return
    localStorage.setItem('tallyrally_name', playerName.trim())
    navigate(`/list/${listId}`, { replace: true })
  }

  return (
    <main className="view join-view">
      <div className="logo">
        <span className="logo-icon">🛒</span>
        <h1>TallyRally</h1>
      </div>
      <p className="tagline">Join the shopping list!</p>

      <form onSubmit={handleJoin} className="form-card">
        <label htmlFor="join-name">Your name</label>
        <input
          id="join-name"
          type="text"
          placeholder="e.g. Alex"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          maxLength={30}
          required
          autoFocus
        />

        <button type="submit" className="btn-primary">
          Join List
        </button>
      </form>
    </main>
  )
}
