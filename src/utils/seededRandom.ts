/**
 * Seeded Random Generator
 * 文字列や数値をシードとして、決定論的なランダム値を生成するユーティリティ
 */
export class SeededRandom {
  private seed: number

  constructor(seed: string | number) {
    if (typeof seed === 'string') {
      this.seed = this.hashString(seed)
    } else {
      this.seed = seed
    }
  }

  /**
   * Simple hash function to convert string to 32-bit integer seed
   * FNV-1a hash variant
   */
  private hashString(str: string): number {
    let hash = 2166136261
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i)
      hash = Math.imul(hash, 16777619)
    }
    return hash >>> 0
  }

  /**
   * Mulberry32 algorithm
   * Returns a random number between 0 (inclusive) and 1 (exclusive)
   */
  public next(): number {
    this.seed += 0x6d2b79f5
    let t = this.seed
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  /**
   * Returns a random integer between min (inclusive) and max (inclusive)
   */
  public nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  /**
   * Returns a random boolean
   */
  public nextBoolean(probability = 0.5): boolean {
    return this.next() < probability
  }

  /**
   * Pick a random item from an array
   */
  public pick<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot pick from an empty array')
    }
    return array[this.nextInt(0, array.length - 1)]!
  }

  /**
   * Pick multiple random items from an array (unique)
   */
  public pickMultiple<T>(array: T[], count: number): T[] {
    if (count > array.length) {
      return [...array]
    }
    const result: T[] = []
    const copy = [...array]
    for (let i = 0; i < count; i++) {
      const index = this.nextInt(0, copy.length - 1)
      result.push(copy[index]!)
      copy.splice(index, 1)
    }
    return result
  }

  /**
   * Generate a random date within a range relative to a base date
   */
  public nextDate(baseDate: Date, minOffsetDays: number, maxOffsetDays: number): Date {
    const offsetDays = this.nextInt(minOffsetDays, maxOffsetDays)
    const date = new Date(baseDate)
    date.setDate(date.getDate() + offsetDays)
    // Randomize time
    date.setHours(this.nextInt(0, 23), this.nextInt(0, 59), this.nextInt(0, 59))
    return date
  }
}
