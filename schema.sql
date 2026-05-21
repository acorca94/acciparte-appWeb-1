-- ============================================================
-- Multi-tenant schema
-- Isolation strategy: tenant_id on every table + enforced at
-- query level (never rely solely on app logic)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tenants (organizations/clients)
CREATE TABLE tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        VARCHAR(60)  NOT NULL UNIQUE, -- used in JWT / subdomain
  name        VARCHAR(120) NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Users always belong to exactly one tenant
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'user', -- 'user' | 'admin'
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, email)  -- same email can exist in different tenants
);

-- Form submissions (two-step form data)
CREATE TABLE submissions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Step 1
  nombre            VARCHAR(150) NOT NULL,
  apellidos         VARCHAR(150) NOT NULL,
  lugar             VARCHAR(200) NOT NULL,
  -- Step 2
  hora_accidente VARCHAR(20) NOT NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes to keep tenant-scoped queries fast
CREATE INDEX idx_users_tenant      ON users(tenant_id);
CREATE INDEX idx_submissions_tenant ON submissions(tenant_id);
CREATE INDEX idx_submissions_user   ON submissions(user_id);

-- Password recovery columns (run only if the DB already exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expira TIMESTAMP;
