CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    user TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS documents_user_title_idx
    ON documents(user, title);
  CREATE INDEX IF NOT EXISTS documents_type_updated_at_idx
    ON documents(type, updated_at);
