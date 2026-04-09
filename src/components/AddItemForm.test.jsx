import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

const mockAddDoc = vi.fn().mockResolvedValue({})
const mockUpdateDoc = vi.fn().mockResolvedValue({})
const mockServerTimestamp = vi.fn(() => 'SERVER_TIMESTAMP')

vi.mock('../firebase', () => ({
  db: {},
  collection: vi.fn(() => 'collectionRef'),
  doc: vi.fn(() => 'docRef'),
  addDoc: (...args) => mockAddDoc(...args),
  updateDoc: (...args) => mockUpdateDoc(...args),
  serverTimestamp: () => mockServerTimestamp(),
}))

import AddItemForm from './AddItemForm'

beforeEach(() => {
  mockAddDoc.mockClear()
  mockUpdateDoc.mockClear()
})

describe('AddItemForm', () => {
  it('renders the text input and add button', () => {
    render(<AddItemForm listId="list1" playerName="Alice" uid="uid1" authReady={true} />)
    expect(screen.getByPlaceholderText(/add an item/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '+' })).toBeInTheDocument()
  })

  it('does not call Firestore when the input is empty', async () => {
    render(<AddItemForm listId="list1" playerName="Alice" uid="uid1" authReady={true} />)
    await userEvent.click(screen.getByRole('button', { name: '+' }))
    expect(mockAddDoc).not.toHaveBeenCalled()
    expect(mockUpdateDoc).not.toHaveBeenCalled()
  })

  it('calls addDoc and updateDoc with correct arguments on valid submit', async () => {
    render(<AddItemForm listId="list1" playerName="Alice" uid="uid1" authReady={true} />)
    await userEvent.type(screen.getByPlaceholderText(/add an item/i), 'Milk')
    await userEvent.click(screen.getByRole('button', { name: '+' }))

    await waitFor(() => expect(mockAddDoc).toHaveBeenCalledTimes(1))

    expect(mockAddDoc).toHaveBeenCalledWith('collectionRef', {
      text: 'Milk',
      addedBy: 'Alice',
      checkedOff: false,
      checkedBy: null,
      checkedByUid: null,
      checkedAt: null,
      createdAt: 'SERVER_TIMESTAMP',
    })
    expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', {
      lastActivityAt: 'SERVER_TIMESTAMP',
    })
  })

  it('clears the input after a successful submission', async () => {
    render(<AddItemForm listId="list1" playerName="Alice" uid="uid1" authReady={true} />)
    const input = screen.getByPlaceholderText(/add an item/i)
    await userEvent.type(input, 'Eggs')
    await userEvent.click(screen.getByRole('button', { name: '+' }))

    await waitFor(() => expect(input.value).toBe(''))
  })

  it('trims whitespace before submitting', async () => {
    render(<AddItemForm listId="list1" playerName="Alice" uid="uid1" authReady={true} />)
    await userEvent.type(screen.getByPlaceholderText(/add an item/i), '  Butter  ')
    await userEvent.click(screen.getByRole('button', { name: '+' }))

    await waitFor(() => expect(mockAddDoc).toHaveBeenCalledTimes(1))
    expect(mockAddDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ text: 'Butter' })
    )
  })
})
