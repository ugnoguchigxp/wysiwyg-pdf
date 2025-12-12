// Minimal logger replacement for @logger
const createLogger = (_context: string) => {
  return {
    debug: (_message: string, ..._args: unknown[]) => {},
    info: (_message: string, ..._args: unknown[]) => {},
    warn: (_message: string, ..._args: unknown[]) => {},
    error: (_message: string, ..._args: unknown[]) => {},
  }
}

export const createContextLogger = createLogger
