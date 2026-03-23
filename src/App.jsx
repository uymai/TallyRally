import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import HomeView from './components/HomeView'
import JoinView from './components/JoinView'
import ListView from './components/ListView'

function getPlayerName() {
  return localStorage.getItem('tallyrally_name')
}

function RequireName({ children, listId }) {
  const name = getPlayerName()
  if (!name) {
    return <Navigate to={`/join/${listId}`} replace />
  }
  return children
}

function ListRoute() {
  const { listId } = useParams()
  return (
    <RequireName listId={listId}>
      <ListView />
    </RequireName>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeView />} />
      <Route path="/join/:listId" element={<JoinView />} />
      <Route path="/list/:listId" element={<ListRoute />} />
    </Routes>
  )
}
