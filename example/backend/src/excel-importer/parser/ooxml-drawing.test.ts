import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { extractChartImagesFromBuffer } from './ooxml-drawing'

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
}

describe('extractChartImagesFromBuffer', () => {
  test('extracts chart objects in XLSM as synthetic SVG images', async () => {
    const workbookPath = join(process.cwd(), 'template', 'standard_record.xlsm')
    if (!existsSync(workbookPath)) {
      // CI/環境差でテンプレートが存在しない場合はスキップ扱い
      expect(true).toBe(true)
      return
    }

    const bytes = readFileSync(workbookPath)
    const result = await extractChartImagesFromBuffer(toArrayBuffer(bytes))
    const images = [...result.values()].flat()

    expect(images.length).toBeGreaterThan(0)

    const chartImage = images.find((image) => image.extension === 'svg+xml')
    expect(chartImage).toBeDefined()
    expect(chartImage?.range.from.col).toBeGreaterThanOrEqual(0)
    expect(chartImage?.range.to.col).toBeGreaterThan(chartImage?.range.from.col ?? -1)

    const svgPrefix = Buffer.from(
      new Uint8Array((chartImage?.data as Uint8Array | ArrayBuffer) ?? new Uint8Array())
    )
      .toString('utf8')
      .slice(0, 120)
    expect(svgPrefix).toContain('<svg')
  })
})
