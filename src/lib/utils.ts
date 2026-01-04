import { type ClassValue, clsx } from 'clsx'

/**
 * クラス名を条件に応じて結合するユーティリティ。
 * Tailwind v4 では、コンポーネント設計レベルでクラスの衝突を避けることを推奨し、
 * ライブラリによる自動マージ（tailwind-merge）は使用しない。
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}
