import { render, screen } from '@testing-library/react'
import Scoreboard from './Scoreboard'

const scores = [
  { id: 'Alice', name: 'Alice', points: 5 },
  { id: 'Bob', name: 'Bob', points: 3 },
  { id: 'Carol', name: 'Carol', points: 1 },
]

describe('Scoreboard', () => {
  it('renders nothing when scores array is empty', () => {
    const { container } = render(<Scoreboard scores={[]} currentPlayer="Alice" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders a chip for every player', () => {
    render(<Scoreboard scores={scores} currentPlayer="Alice" />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('Carol')).toBeInTheDocument()
  })

  it('shows the crown emoji for the leader when their score is above 0', () => {
    render(<Scoreboard scores={scores} currentPlayer="Bob" />)
    expect(screen.getByText('👑')).toBeInTheDocument()
  })

  it('does not show the crown when the top score is 0', () => {
    const zeroScores = [
      { id: 'Alice', name: 'Alice', points: 0 },
      { id: 'Bob', name: 'Bob', points: 0 },
    ]
    render(<Scoreboard scores={zeroScores} currentPlayer="Alice" />)
    expect(screen.queryByText('👑')).not.toBeInTheDocument()
  })

  it('applies score-chip--me class to the current player chip', () => {
    render(<Scoreboard scores={scores} currentPlayer="Bob" />)
    const bobChip = screen.getByText('Bob').closest('.score-chip')
    expect(bobChip).toHaveClass('score-chip--me')
  })

  it('applies score-chip--leader class to the leader chip', () => {
    render(<Scoreboard scores={scores} currentPlayer="Bob" />)
    const aliceChip = screen.getByText('Alice').closest('.score-chip')
    expect(aliceChip).toHaveClass('score-chip--leader')
  })

  it('does not apply score-chip--leader to non-leaders', () => {
    render(<Scoreboard scores={scores} currentPlayer="Alice" />)
    const bobChip = screen.getByText('Bob').closest('.score-chip')
    expect(bobChip).not.toHaveClass('score-chip--leader')
  })
})
