export default function Scoreboard({ scores, currentPlayer }) {
  if (scores.length === 0) return null

  const topScore = scores[0].points

  return (
    <section className="scoreboard" aria-label="Scores">
      {scores.map((score) => (
        <div
          key={score.id}
          className={[
            'score-chip',
            score.name === currentPlayer ? 'score-chip--me' : '',
            score.points === topScore && score.points > 0 ? 'score-chip--leader' : '',
          ].join(' ')}
        >
          {score.points === topScore && score.points > 0 && (
            <span className="crown">👑</span>
          )}
          <span className="score-name">{score.name}</span>
          <span className="score-points">{score.points}</span>
        </div>
      ))}
    </section>
  )
}
