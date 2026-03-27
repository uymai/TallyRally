import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import JoinView from './JoinView'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

function renderJoinView(listId = 'list-abc') {
  return render(
    <MemoryRouter initialEntries={[`/${listId}`]}>
      <Routes>
        <Route path="/:listId" element={<JoinView />} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  localStorage.clear()
  mockNavigate.mockClear()
})

describe('JoinView', () => {
  it('renders the name input and join button', () => {
    renderJoinView()
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /join list/i })).toBeInTheDocument()
  })

  it('does not navigate when the name is empty', async () => {
    renderJoinView()
    await userEvent.click(screen.getByRole('button', { name: /join list/i }))
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('does not navigate when the name is whitespace only', async () => {
    renderJoinView()
    await userEvent.type(screen.getByLabelText(/your name/i), '   ')
    await userEvent.click(screen.getByRole('button', { name: /join list/i }))
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('saves the trimmed player name to localStorage on valid submit', async () => {
    renderJoinView('list-abc')
    await userEvent.type(screen.getByLabelText(/your name/i), '  Alex  ')
    await userEvent.click(screen.getByRole('button', { name: /join list/i }))
    expect(localStorage.getItem('tallyrally_name')).toBe('Alex')
  })

  it('navigates to the list route after a valid join', async () => {
    renderJoinView('list-abc')
    await userEvent.type(screen.getByLabelText(/your name/i), 'Alex')
    await userEvent.click(screen.getByRole('button', { name: /join list/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/list/list-abc', { replace: true })
  })
})
