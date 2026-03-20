import { Database } from 'bun:sqlite'
import { drizzle as drizzleSqlite } from 'drizzle-orm/bun-sqlite'
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as pgSchema from './schema'
import * as sqliteSchema from './schema.sqlite'

const connectionString = process.env.DATABASE_URL
const dbType = process.env.DB_TYPE || 'sqlite' // デフォルトを sqlite に設定

// Postgres Client (保持)
export const pgClient = postgres(
  connectionString || 'postgres://postgres:postgres@localhost:5432/postgres',
  {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  }
)

// SQLite Client (Bun environment)
export const sqliteClient = new Database('data.sqlite')

// Instance selection
export const db =
  dbType === 'postgres'
    ? drizzlePg(pgClient, { schema: pgSchema })
    : (drizzleSqlite(sqliteClient, { schema: sqliteSchema }) as any)

export const schema = dbType === 'postgres' ? pgSchema : sqliteSchema

// Backward compatibility (client access)
export const client = dbType === 'postgres' ? pgClient : sqliteClient
