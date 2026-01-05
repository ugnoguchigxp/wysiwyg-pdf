import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { generateUUID, safeLocalStorage } from './browser'

describe('utils/browser', () => {
    describe('generateUUID', () => {
        it('uses crypto.randomUUID when available', () => {
            const mockUUID = '12345678-1234-1234-1234-1234567890ab'
            vi.stubGlobal('crypto', { randomUUID: () => mockUUID })

            expect(generateUUID()).toBe(mockUUID)

            vi.unstubAllGlobals()
        })

        it('falls back to custom implementation when crypto.randomUUID is not available', () => {
            // Ensure crypto is not available
            vi.stubGlobal('crypto', undefined)

            const uuid = generateUUID()
            expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)

            vi.unstubAllGlobals()
        })
    })

    describe('safeLocalStorage', () => {
        beforeEach(() => {
            vi.stubGlobal('window', {})
            vi.stubGlobal('localStorage', {
                getItem: vi.fn(),
                setItem: vi.fn(),
                removeItem: vi.fn(),
            })
        })

        afterEach(() => {
            vi.unstubAllGlobals()
        })

        it('gets item from localStorage when available', () => {
            vi.mocked(localStorage.getItem).mockReturnValue('value')
            expect(safeLocalStorage.getItem('key')).toBe('value')
            expect(localStorage.getItem).toHaveBeenCalledWith('key')
        })

        it('sets item in localStorage when available', () => {
            safeLocalStorage.setItem('key', 'value')
            expect(localStorage.setItem).toHaveBeenCalledWith('key', 'value')
        })

        it('removes item from localStorage when available', () => {
            safeLocalStorage.removeItem('key')
            expect(localStorage.removeItem).toHaveBeenCalledWith('key')
        })

        it('returns null and does not throw when window is undefined (SSR)', () => {
            vi.stubGlobal('window', undefined)
            vi.stubGlobal('localStorage', undefined)

            expect(safeLocalStorage.getItem('key')).toBeNull()
            expect(() => safeLocalStorage.setItem('key', 'value')).not.toThrow()
            expect(() => safeLocalStorage.removeItem('key')).not.toThrow()
        })

        it('handles localStorage errors gracefully (e.g., quota)', () => {
            vi.mocked(localStorage.setItem).mockImplementation(() => {
                throw new Error('Quota exceeded')
            })

            expect(() => safeLocalStorage.setItem('key', 'value')).not.toThrow()
        })
    })
})
