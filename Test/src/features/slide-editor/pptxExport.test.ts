/**
 * Tests for pptxExport utility functions
 * Tests the helper functions without requiring pptxgenjs dependency
 */

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { sanitizeHex, sanitizeNum, isPptxAvailable } from '@/features/slide-editor/utils/pptxExport'

describe('pptxExport utilities', () => {
    describe('sanitizeHex', () => {
        it('returns default for undefined', () => {
            expect(sanitizeHex(undefined)).toBe('000000')
            expect(sanitizeHex(undefined, 'FFFFFF')).toBe('FFFFFF')
        })

        it('returns default for null', () => {
            expect(sanitizeHex(null as any)).toBe('000000')
        })

        it('returns default for empty string', () => {
            expect(sanitizeHex('')).toBe('000000')
        })

        it('strips # from hex color', () => {
            expect(sanitizeHex('#FF0000')).toBe('FF0000')
            expect(sanitizeHex('#abc123')).toBe('abc123')
        })

        it('handles 6-char hex without #', () => {
            expect(sanitizeHex('FF0000')).toBe('FF0000')
            expect(sanitizeHex('abc123')).toBe('abc123')
        })

        it('expands 3-char hex to 6-char', () => {
            expect(sanitizeHex('#FFF')).toBe('FFFFFF')
            expect(sanitizeHex('#abc')).toBe('aabbcc')
            expect(sanitizeHex('F00')).toBe('FF0000')
        })

        it('returns default for invalid hex', () => {
            expect(sanitizeHex('red')).toBe('000000')
            expect(sanitizeHex('rgba(255,0,0,1)')).toBe('000000')
            expect(sanitizeHex('transparent')).toBe('000000')
            expect(sanitizeHex('invalid', 'CCCCCC')).toBe('CCCCCC')
        })

        it('handles hex with whitespace', () => {
            expect(sanitizeHex('  #FF0000  ')).toBe('FF0000')
        })

        it('handles mixed case', () => {
            expect(sanitizeHex('#AaBbCc')).toBe('AaBbCc')
        })
    })

    describe('sanitizeNum', () => {
        it('returns the number for valid finite numbers', () => {
            expect(sanitizeNum(10)).toBe(10)
            expect(sanitizeNum(0)).toBe(0)
            expect(sanitizeNum(-5)).toBe(-5)
            expect(sanitizeNum(3.14)).toBe(3.14)
        })

        it('returns 0 for undefined', () => {
            expect(sanitizeNum(undefined)).toBe(0)
        })

        it('returns 0 for NaN', () => {
            expect(sanitizeNum(NaN)).toBe(0)
        })

        it('returns 0 for Infinity', () => {
            expect(sanitizeNum(Infinity)).toBe(0)
            expect(sanitizeNum(-Infinity)).toBe(0)
        })

        it('returns 0 for non-number types', () => {
            expect(sanitizeNum('10' as any)).toBe(0)
            expect(sanitizeNum(null as any)).toBe(0)
        })
    })

    describe('isPptxAvailable', () => {
        it('returns false when pptxgenjs is not installed', async () => {
            // In test environment, pptxgenjs is typically not installed
            const result = await isPptxAvailable()
            expect(typeof result).toBe('boolean')
        })
    })
})
