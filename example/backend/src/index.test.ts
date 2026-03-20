describe('Worker', () => {
  it('should load without error', async () => {
    if (typeof Bun === 'undefined') {
      expect(true).toBe(true)
      return
    }
    const worker = (await import('./worker')).default
    expect(worker).toBeDefined()
  })
})
