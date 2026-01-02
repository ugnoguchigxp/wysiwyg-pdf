import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const documents = sqliteTable(
  'documents',
  {
    id: text('id').primaryKey(),
    user: text('user').notNull(),
    type: text('type').notNull(),
    title: text('title').notNull(),
    payload: text('payload').notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => ({
    userTitleUnique: uniqueIndex('documents_user_title_idx').on(table.user, table.title),
    typeUpdated: index('documents_type_updated_at_idx').on(table.type, table.updatedAt),
  })
)
