import { useState, useEffect } from 'react'
import { auth, signInAnonymously, onAuthStateChanged } from '../firebase'

export default function useAuth() {
  const [uid, setUid] = useState(null)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid)
        setAuthReady(true)
      } else {
        signInAnonymously(auth).catch((err) => console.error('Anonymous sign-in failed:', err))
      }
    })
    return unsub
  }, [])

  return { uid, authReady }
}
