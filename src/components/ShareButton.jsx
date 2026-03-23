import { useState } from 'react'

export default function ShareButton({ listId }) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const url = `${window.location.origin}${window.location.pathname}#/list/${listId}`

    if (navigator.share) {
      try {
        await navigator.share({ title: 'TallyRally List', url })
      } catch {
        // User cancelled share
      }
      return
    }

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy this link:', url)
    }
  }

  return (
    <button className="btn-share" onClick={handleShare} aria-label="Share list">
      {copied ? 'Copied!' : 'Share'}
    </button>
  )
}
