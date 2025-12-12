import { describe, expect, it } from 'vitest'

import { SeededRandom } from '../../../src/utils/seededRandom'

describe('SeededRandom', () => {
  it('is deterministic for the same seed (string)', () => {
    const a = new SeededRandom('seed')
    const b = new SeededRandom('seed')

    const seqA = [a.next(), a.next(), a.next()]
    const seqB = [b.next(), b.next(), b.next()]

    expect(seqA).toEqual(seqB)
  })

  it('is deterministic for the same seed (number)', () => {
    const a = new SeededRandom(123)
    const b = new SeededRandom(123)
    expect(a.next()).toBe(b.next())
  })

  it('next() returns a value in [0, 1)', () => {
    const r = new SeededRandom('range')
    for (let i = 0; i < 100; i++) {
      const v = r.next()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('nextInt() returns an integer within inclusive bounds', () => {
    const r = new SeededRandom('int')
    for (let i = 0; i < 50; i++) {
      const v = r.nextInt(5, 7)
      expect([5, 6, 7]).toContain(v)
    }
  })

  it('nextBoolean() respects edge probabilities', () => {
    const r = new SeededRandom('bool')
    expect(r.nextBoolean(0)).toBe(false)
    expect(r.nextBoolean(1)).toBe(true)
  })

  it('pick() throws on empty array', () => {
    const r = new SeededRandom('pick')
    expect(() => r.pick([] as number[])).toThrow('Cannot pick from an empty array')
  })

  it('pick() returns an element from the array', () => {
    const r = new SeededRandom('pick2')
    const arr = ['a', 'b', 'c']
    expect(arr).toContain(r.pick(arr))
  })

  it('pickMultiple() returns all items if count > length', () => {
    const r = new SeededRandom('multi')
    const arr = [1, 2, 3]
    expect(r.pickMultiple(arr, 10)).toEqual(arr)
  })

  it('pickMultiple() returns unique items', () => {
    const r = new SeededRandom('unique')
    const arr = [1, 2, 3, 4]
    const picked = r.pickMultiple(arr, 3)
    expect(new Set(picked).size).toBe(picked.length)
  })

  it('nextDate() produces date within offset range and sets time', () => {
    const r = new SeededRandom('date')
    const base = new Date('2020-01-01T00:00:00.000Z')
    const d = r.nextDate(base, -2, 2)

    const diffDays = Math.round((d.getTime() - base.getTime()) / (24 * 60 * 60 * 1000))
    expect(diffDays).toBeGreaterThanOrEqual(-2)
    expect(diffDays).toBeLessThanOrEqual(2)

    expect(d.getHours()).toBeGreaterThanOrEqual(0)
    expect(d.getHours()).toBeLessThanOrEqual(23)
  })
})
