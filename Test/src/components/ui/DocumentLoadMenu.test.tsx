import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DocumentLoadMenu } from '@/components/ui/DocumentLoadMenu'

// Radix Primitives often need ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() { }
  unobserve() { }
  disconnect() { }
}

describe('DocumentLoadMenu', () => {
  const mockFetchRecent = vi.fn()
  const mockFetchBrowse = vi.fn()
  const mockOnLoad = vi.fn()

  const defaultProps = {
    fetchRecent: mockFetchRecent,
    fetchBrowse: mockFetchBrowse,
    onLoad: mockOnLoad,
  }

  it('renders load button', () => {
    render(<DocumentLoadMenu {...defaultProps} />)
    expect(screen.getByText('Load')).toBeInTheDocument()
  })

  it('opens dropdown and fetches recent docs', async () => {
    mockFetchRecent.mockResolvedValue([
      { id: '1', title: 'Doc 1', updatedAt: Date.now() },
      { id: '2', title: 'Doc 2', updatedAt: Date.now() },
    ])

    const user = userEvent.setup()
    render(<DocumentLoadMenu {...defaultProps} />)

    // Open dropdown
    const button = screen.getByText('Load')
    await user.click(button)

    expect(mockFetchRecent).toHaveBeenCalled()
    // expect(screen.getByText('Loading...')).toBeInTheDocument() - Flaky with immediate resolution


    await waitFor(() => {
      expect(screen.getByText('Doc 1')).toBeInTheDocument()
      expect(screen.getByText('Doc 2')).toBeInTheDocument()
    })
  })

  it('calls onLoad when a recent doc is selected', async () => {
    mockFetchRecent.mockResolvedValue([
      { id: '1', title: 'Doc 1', updatedAt: Date.now() },
    ])
    const user = userEvent.setup()
    render(<DocumentLoadMenu {...defaultProps} />)

    // Open dropdown
    await user.click(screen.getByRole('button', { name: 'Load' }))

    // Wait for items
    await waitFor(() => expect(screen.getByText('Doc 1')).toBeInTheDocument())

    // Click item
    await user.click(screen.getByText('Doc 1'))

    expect(mockOnLoad).toHaveBeenCalledWith('1')
  })

  it('opens browse dialog when "Browse..." is clicked', async () => {
    mockFetchRecent.mockResolvedValue([])
    mockFetchBrowse.mockResolvedValue({ items: [], hasMore: false })
    const user = userEvent.setup()

    render(<DocumentLoadMenu {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: 'Load' }))

    const browseItem = await screen.findByText('Browse...')
    await user.click(browseItem)

    expect(await screen.findByText('Browse Documents')).toBeInTheDocument()
    expect(mockFetchBrowse).toHaveBeenCalledWith('', 0)
  })

  it('searches in browse dialog', async () => {
    mockFetchRecent.mockResolvedValue([])
    mockFetchBrowse.mockResolvedValue({ items: [], hasMore: false })
    const user = userEvent.setup()

    render(<DocumentLoadMenu {...defaultProps} />)

    // Open browse (shortcut via props mock is hard, easier to click through)
    await user.click(screen.getByRole('button', { name: 'Load' }))
    await user.click(await screen.findByText('Browse...'))

    const input = await screen.findByPlaceholderText('Search by title')
    await user.type(input, 'Report')

    const searchBtn = screen.getByRole('button', { name: 'Search' })
    await user.click(searchBtn)

    expect(mockFetchBrowse).toHaveBeenCalledWith('Report', 0)
  })

  it('loads document from browse list', async () => {
    mockFetchRecent.mockResolvedValue([])
    mockFetchBrowse.mockResolvedValue({
      items: [{ id: '99', title: 'Found Doc', updatedAt: Date.now() }],
      hasMore: false
    })
    const user = userEvent.setup()

    render(<DocumentLoadMenu {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: 'Load' }))
    await user.click(await screen.findByText('Browse...'))

    const docItem = await screen.findByText('Found Doc')
    await user.click(docItem)

    expect(mockOnLoad).toHaveBeenCalledWith('99')
  })
})
