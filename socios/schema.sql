-- Banco Cloudflare D1 · AUVRIUN
CREATE TABLE IF NOT EXISTS societary_answers (
 partner_id INTEGER PRIMARY KEY CHECK(partner_id BETWEEN 1 AND 3),
 display_name TEXT NOT NULL,
 answers TEXT NOT NULL DEFAULT '{}',
 completed INTEGER NOT NULL DEFAULT 0 CHECK(completed IN (0,1)),
 revision INTEGER NOT NULL DEFAULT 0,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 completed_at TEXT
);
CREATE TABLE IF NOT EXISTS societary_audit (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 partner_id INTEGER NOT NULL CHECK(partner_id BETWEEN 1 AND 3),
 action TEXT NOT NULL CHECK(action IN ('save','finalize','reopen')),
 revision INTEGER NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_societary_audit_partner ON societary_audit(partner_id,created_at);
