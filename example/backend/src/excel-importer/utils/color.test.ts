import type { ColorInfo } from '../types/excel'
import { applyTint, argbToCSS, colorInfoToCSS, cssToArgb } from '../utils/color'

describe('argbToCSS', () => {
  test('converts 8-character ARGB to CSS color with full opacity', () => {
    expect(argbToCSS('FFFF0000')).toBe('#FF0000')
    expect(argbToCSS('FF00FF00')).toBe('#00FF00')
    expect(argbToCSS('FF0000FF')).toBe('#0000FF')
    expect(argbToCSS('FFFFFFFF')).toBe('#FFFFFF')
    expect(argbToCSS('FF000000')).toBe('#000000')
  })

  test('converts 8-character ARGB to RGBA color with transparency', () => {
    expect(argbToCSS('80000000')).toBe('rgba(0, 0, 0, 0.50)')
    expect(argbToCSS('40FF0000')).toBe('rgba(255, 0, 0, 0.25)')
    expect(argbToCSS('CC00FF00')).toBe('rgba(0, 255, 0, 0.80)')
  })

  test('converts 6-character RGB to CSS color', () => {
    expect(argbToCSS('FF0000')).toBe('#FF0000')
    expect(argbToCSS('00FF00')).toBe('#00FF00')
    expect(argbToCSS('0000FF')).toBe('#0000FF')
  })

  test('handles hex with # prefix', () => {
    expect(argbToCSS('#FF0000')).toBe('#FF0000')
    expect(argbToCSS('#00FF00')).toBe('#00FF00')
  })
})

describe('applyTint', () => {
  test('applies positive tint to lighten color', () => {
    expect(applyTint('000000', 0.5)).toBe('#808080')
    expect(applyTint('FF0000', 0.5)).toBe('#ff8080')
    expect(applyTint('00FF00', 0.5)).toBe('#80ff80')
  })

  test('applies negative tint to darken color', () => {
    expect(applyTint('FFFFFF', -0.5)).toBe('#808080')
    expect(applyTint('FF0000', -0.5)).toBe('#800000')
    expect(applyTint('00FF00', -0.5)).toBe('#008000')
  })

  test('handles extreme tint values', () => {
    expect(applyTint('000000', 1.0)).toBe('#ffffff')
    expect(applyTint('FFFFFF', -1.0)).toBe('#000000')
  })

  test('handles zero tint', () => {
    expect(applyTint('FF0000', 0)).toBe('#ff0000')
    expect(applyTint('00FF00', 0)).toBe('#00ff00')
  })
})

describe('cssToArgb', () => {
  test('converts CSS hex color to ARGB', () => {
    expect(cssToArgb('#FF0000')).toBe('FFFF0000')
    expect(cssToArgb('#00FF00')).toBe('FF00FF00')
    expect(cssToArgb('#0000FF')).toBe('FF0000FF')
    expect(cssToArgb('#FFFFFF')).toBe('FFFFFFFF')
  })

  test('converts short hex color to ARGB', () => {
    expect(cssToArgb('#F00')).toBe('FFFF0000')
    expect(cssToArgb('#0F0')).toBe('FF00FF00')
    expect(cssToArgb('#00F')).toBe('FF0000FF')
  })

  test('converts rgba() to ARGB', () => {
    expect(cssToArgb('rgba(255, 0, 0, 0.5)')).toBe('80FF0000')
    expect(cssToArgb('rgba(0, 255, 0, 1)')).toBe('FF00FF00')
    expect(cssToArgb('rgba(0, 0, 255, 0.25)')).toBe('400000FF')
  })

  test('converts rgb() to ARGB (no alpha)', () => {
    expect(cssToArgb('rgb(255, 0, 0)')).toBe('FFFF0000')
    expect(cssToArgb('rgb(0, 255, 0)')).toBe('FF00FF00')
  })

  test('handles invalid CSS color', () => {
    expect(cssToArgb('invalid')).toBe('FF000000')
  })
})

describe('colorInfoToCSS', () => {
  test('converts ColorInfo with ARGB', () => {
    const color: ColorInfo = { argb: 'FFFF0000' }
    expect(colorInfoToCSS(color)).toBe('#FF0000')
  })

  test('converts ColorInfo with theme color', () => {
    const color: ColorInfo = { theme: 0 }
    expect(colorInfoToCSS(color)).toBe('#FFFFFF')
  })

  test('converts ColorInfo with theme color and tint', () => {
    const color: ColorInfo = { theme: 0, tint: 0.5 }
    expect(colorInfoToCSS(color)).toBe('#ffffff')
  })

  test('converts ColorInfo with indexed color', () => {
    const color: ColorInfo = { indexed: 2 }
    expect(colorInfoToCSS(color)).toBe('#FF0000')
  })

  test('returns undefined for undefined color', () => {
    expect(colorInfoToCSS(undefined)).toBeUndefined()
  })

  test('uses custom theme colors', () => {
    const customTheme = { 0: 'FF0000' }
    const color: ColorInfo = { theme: 0 }
    expect(colorInfoToCSS(color, customTheme)).toBe('#FF0000')
  })
})
