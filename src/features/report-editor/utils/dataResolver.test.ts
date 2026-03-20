import { describe, expect, test } from 'vitest'
import type { Doc } from '@/types/canvas'
import { resolveBindingData } from './dataResolver'

function decodeDataUrlBase64(src: string): string {
  const base64 = src.split(',')[1] || ''
  return Buffer.from(base64, 'base64').toString('utf-8')
}

describe('resolveBindingData', () => {
  test('resolves table placeholders and binds dialysis chart image from device data', () => {
    const doc: Doc = {
      v: 1,
      id: 'doc-1',
      title: 't',
      unit: 'mm',
      surfaces: [{ id: 'p1', type: 'page', w: 210, h: 297 }],
      nodes: [
        {
          id: 'table-1',
          t: 'table',
          s: 'p1',
          x: 0,
          y: 0,
          w: 100,
          h: 20,
          table: {
            rows: [10, 10],
            cols: [30, 35, 35],
            cells: [
              { r: 0, c: 0, v: '測定時間' },
              { r: 0, c: 1, v: '{装置情報}.[測定時刻]' },
              { r: 1, c: 0, v: '血液量' },
              { r: 1, c: 1, v: '{装置情報}.[血液流量]' },
              { r: 1, c: 2, v: '{装置情報}.[静脈圧]' },
            ],
          },
        },
        {
          id: 'img_chart_1',
          t: 'image',
          s: 'p1',
          x: 0,
          y: 30,
          w: 120,
          h: 50,
          src: 'data:image/svg+xml;base64,PHN2Zy8+',
        },
        {
          id: 'img_regular_1',
          t: 'image',
          s: 'p1',
          x: 0,
          y: 90,
          w: 30,
          h: 30,
          src: 'https://example.com/sample.png',
        },
      ],
    }

    const data = {
      装置情報: [
        { 測定時刻: '09:00', 血液流量: '200', 静脈圧: '100', 透析液圧: '150' },
        { 測定時刻: '10:00', 血液流量: '210', 静脈圧: '110', 透析液圧: '160' },
        { 測定時刻: '11:00', 血液流量: '190', 静脈圧: '95', 透析液圧: '145' },
      ],
    }

    const resolved = resolveBindingData(doc, data)

    const table = resolved.nodes.find((n) => n.id === 'table-1' && n.t === 'table')
    expect(table && table.t === 'table' && table.table.cells.find((c) => c.r === 0 && c.c === 1)?.v).toBe(
      '09:00'
    )

    const chart = resolved.nodes.find((n) => n.id === 'img_chart_1' && n.t === 'image')
    expect(chart && chart.t === 'image' && chart.src?.startsWith('data:image/svg+xml;base64,')).toBe(
      true
    )
    const decoded = decodeDataUrlBase64((chart as any).src)
    expect(decoded).toContain('<svg')
    expect(decoded).toContain('血液量')
    expect(decoded).toContain('静脈圧')
    expect(decoded).toContain('<polyline')

    const regular = resolved.nodes.find((n) => n.id === 'img_regular_1' && n.t === 'image')
    expect(regular && regular.t === 'image' && regular.src).toBe('https://example.com/sample.png')
  })

  test('keeps original chart image when source data is missing', () => {
    const doc: Doc = {
      v: 1,
      id: 'doc-2',
      title: 't',
      unit: 'mm',
      surfaces: [{ id: 'p1', type: 'page', w: 210, h: 297 }],
      nodes: [
        {
          id: 'img_chart_2',
          t: 'image',
          s: 'p1',
          x: 0,
          y: 0,
          w: 100,
          h: 50,
          src: 'data:image/svg+xml;base64,PHN2ZyBpZD0ib3JpZ2luYWwiLz4=',
        },
      ],
    }

    const resolved = resolveBindingData(doc, {})
    const chart = resolved.nodes[0]
    expect(chart.t).toBe('image')
    expect((chart as any).src).toContain('PHN2ZyBpZD0ib3JpZ2luYWwi')
  })
})
