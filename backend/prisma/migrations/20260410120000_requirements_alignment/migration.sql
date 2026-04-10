-- Align schema with requirements: Role MEMBER, Customer.updatedAt, Note.organizationId,
-- ActivityLog entityType/entityId (performedBy maps to existing "userId" column).

-- Rename enum value AGENT -> MEMBER (PostgreSQL 10+)
ALTER TYPE "Role" RENAME VALUE 'AGENT' TO 'MEMBER';

-- Customer.updatedAt (existing rows get a sensible initial value)
ALTER TABLE "Customer" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'MEMBER'::"Role";

-- Note.organizationId (denormalized for org scoping; backfilled from Customer)
ALTER TABLE "Note" ADD COLUMN "organizationId" TEXT;
UPDATE "Note" n
SET "organizationId" = c."organizationId"
FROM "Customer" c
WHERE n."customerId" = c."id";
ALTER TABLE "Note" ALTER COLUMN "organizationId" SET NOT NULL;

ALTER TABLE "Note"
  ADD CONSTRAINT "Note_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "Note_organizationId_idx" ON "Note"("organizationId");

-- ActivityLog: generic entity fields (spec: entityType, entityId; performedBy uses column "userId")
ALTER TABLE "ActivityLog" ADD COLUMN "entityType" TEXT;
ALTER TABLE "ActivityLog" ADD COLUMN "entityId" TEXT;
UPDATE "ActivityLog"
SET "entityType" = 'CUSTOMER',
    "entityId"  = "customerId";
ALTER TABLE "ActivityLog" ALTER COLUMN "entityType" SET NOT NULL;
ALTER TABLE "ActivityLog" ALTER COLUMN "entityId" SET NOT NULL;

CREATE INDEX "ActivityLog_entityType_entityId_idx" ON "ActivityLog"("entityType", "entityId");
