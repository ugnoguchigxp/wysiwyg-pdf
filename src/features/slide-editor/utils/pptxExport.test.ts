
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  exportToPptx,
  isPptxAvailable,
  sanitizeHex,
  sanitizeNum,
} from '@/features/slide-editor/utils/pptxExport'
import type { Doc, TextNode, ShapeNode, ImageNode, LineNode } from '@/types/canvas'

// 1. Basic factory mock
vi.mock('pptxgenjs', () => {
  return {
    default: vi.fn(),
  }
})

// 2. Import the mocked module to configure implementation
import PptxGenJS from 'pptxgenjs'

describe('pptxExport', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Configure default implementation for each test
    // @ts-ignore
    PptxGenJS.mockImplementation(() => {
      const addSlide = vi.fn().mockImplementation(() => ({
        addText: vi.fn(),
        addShape: vi.fn(),
        addImage: vi.fn(),
        background: null,
      }))

      return {
        addSlide,
        writeFile: vi.fn(),
        defineLayout: vi.fn(),
        layout: '',
      }
    })
  })

  describe('isPptxAvailable', () => {
    it('returns true when pptxgenjs can be imported', async () => {
      const result = await isPptxAvailable()
      expect(result).toBe(true)
    })
  })

  describe('sanitizeHex', () => {
    it('removes # from valid hex', () => {
      expect(sanitizeHex('#ff0000')).toBe('ff0000')
      expect(sanitizeHex('ff0000')).toBe('ff0000')
    })
    it('expands 3-char hex', () => {
      expect(sanitizeHex('#f00')).toBe('ff0000')
      expect(sanitizeHex('f00')).toBe('ff0000')
    })
    it('returns default for invalid hex', () => {
      expect(sanitizeHex('invalid')).toBe('000000')
      expect(sanitizeHex('invalid', 'ffffff')).toBe('ffffff')
    })
    it('returns default for null/undefined', () => {
      expect(sanitizeHex(undefined)).toBe('000000')
    })
  })

  describe('sanitizeNum', () => {
    it('returns clean number', () => {
      expect(sanitizeNum(10)).toBe(10)
      expect(sanitizeNum(10.5)).toBe(10.5)
    })
    it('returns 0 for non-finite', () => {
      expect(sanitizeNum(undefined)).toBe(0)
      expect(sanitizeNum(Infinity)).toBe(0)
      expect(sanitizeNum(NaN)).toBe(0)
    })
  })

  describe('exportToPptx', () => {
    const mockDoc: Doc = {
      v: 1,
      title: 'Test Doc',
      unit: 'mm',
      id: 'doc1',
      surfaces: [
        { id: 's1', type: 'slide', w: 800, h: 600, bg: '#ffffff' },
        { id: 's2', type: 'slide', w: 800, h: 600, bg: undefined },
      ],
      nodes: [],
    }

    it('creates presentation, defines layout, and saves', async () => {
      await exportToPptx(mockDoc, 'test.pptx')

      expect(PptxGenJS).toHaveBeenCalled()
      // @ts-ignore
      const pptxInstance = PptxGenJS.mock.results[0].value
      expect(pptxInstance.defineLayout).toHaveBeenCalledWith({ name: 'A4', width: 11.69, height: 8.27 })
      expect(pptxInstance.writeFile).toHaveBeenCalledWith(expect.objectContaining({ fileName: 'test.pptx' }))
    })

    it('adds slides with background color', async () => {
      await exportToPptx(mockDoc)
      // @ts-ignore
      const pptxInstance = PptxGenJS.mock.results[0].value
      expect(pptxInstance.addSlide).toHaveBeenCalledTimes(2)

      const firstSlide = pptxInstance.addSlide.mock.results[0].value
      expect(firstSlide.background).toEqual({ color: 'ffffff' })

      const secondSlide = pptxInstance.addSlide.mock.results[1].value
      expect(secondSlide.background).toBeNull()
    })

    it('adds Text node correctly', async () => {
      const textNode: TextNode = {
        id: 't1',
        t: 'text',
        s: 's1',
        x: 10,
        y: 20,
        w: 100,
        h: 50,
        text: 'Hello PPTX',
        fontSize: 12,
        fill: '#aabbcc',
        align: 'c',
        vAlign: 'm',
      }
      const docWithText = { ...mockDoc, nodes: [textNode] }

      await exportToPptx(docWithText)

      // @ts-ignore
      const pptxInstance = PptxGenJS.mock.results[0].value
      const slide = pptxInstance.addSlide.mock.results[0].value
      expect(slide.addText).toHaveBeenCalledWith(
        'Hello PPTX',
        expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number),
          fontSize: expect.any(Number),
          color: 'aabbcc',
        })
      )
    })

    it('adds Shape node correctly', async () => {
      const shapeNode: ShapeNode = {
        id: 'sh1',
        t: 'shape',
        s: 's1',
        x: 50,
        y: 50,
        w: 100,
        h: 100,
        shape: 'circle',
        fill: '#00ff00',
        stroke: '#0000ff',
        strokeW: 2
      }
      const docWithShape = { ...mockDoc, nodes: [shapeNode] }

      await exportToPptx(docWithShape)

      // @ts-ignore
      const pptxInstance = PptxGenJS.mock.results[0].value
      const slide = pptxInstance.addSlide.mock.results[0].value
      expect(slide.addShape).toHaveBeenCalledWith(
        'oval',
        expect.objectContaining({
          x: expect.any(Number),
          fill: { color: '00ff00' },
          line: { color: '0000ff', width: expect.any(Number) }
        })
      )
    })

    it('adds Image node correctly', async () => {
      const imageNode: ImageNode = {
        id: 'img1',
        t: 'image',
        s: 's1',
        x: 0,
        y: 0,
        w: 10,
        h: 10,
        src: 'http://example.com/img.png'
      }
      const docWithImage = { ...mockDoc, nodes: [imageNode] }

      await exportToPptx(docWithImage)

      // @ts-ignore
      const pptxInstance = PptxGenJS.mock.results[0].value
      const slide = pptxInstance.addSlide.mock.results[0].value
      expect(slide.addImage).toHaveBeenCalledWith(
        expect.objectContaining({
          path: 'http://example.com/img.png',
          x: expect.any(Number)
        })
      )
    })

    it('adds Line node correctly with flip logic', async () => {
      const lineNode: LineNode = {
        id: 'l1',
        t: 'line',
        s: 's1',
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        pts: [0, 0, 100, 50],
        stroke: '#000000',
        strokeW: 1
      }

      const lineNodeRev: LineNode = {
        ...lineNode,
        id: 'l2',
        pts: [100, 50, 0, 0]
      }

      const docWithLines = { ...mockDoc, nodes: [lineNode, lineNodeRev] }

      await exportToPptx(docWithLines)

      // @ts-ignore
      const pptxInstance = PptxGenJS.mock.results[0].value
      const slide = pptxInstance.addSlide.mock.results[0].value

      expect(slide.addShape).toHaveBeenCalledWith('line', expect.objectContaining({
        flipH: false,
        flipV: false
      }))

      expect(slide.addShape).toHaveBeenCalledWith('line', expect.objectContaining({
        flipH: true,
        flipV: true
      }))
    })

    it('skips hidden nodes', async () => {
      const hiddenNode: TextNode = {
        id: 'h1', t: 'text', s: 's1', hidden: true, text: 'Hidden',
        x: 0, y: 0, w: 0, h: 0
      }
      const docHidden = { ...mockDoc, nodes: [hiddenNode] }
      await exportToPptx(docHidden)

      // @ts-ignore
      const pptxInstance = PptxGenJS.mock.results[0].value
      const slide = pptxInstance.addSlide.mock.results[0].value
      expect(slide.addText).not.toHaveBeenCalled()
    })
  })
})
