# CRM Backend (NestJS)

Multi-tenant CRM API: organizations, users, customers (with soft delete), assignments, notes, and an activity log. Built with **TypeScript**, **NestJS**, **PostgreSQL**, and **Prisma**.

## Setup

1. Copy `.env` (see your team’s template) with `DATABASE_URL` and `JWT_SECRET`.
2. Install dependencies: `npm install`
3. Apply migrations: `npx prisma migrate deploy` (or `npx prisma migrate dev` in development)
4. Generate client (if needed): `npx prisma generate`
5. Run: `npm run start:dev` — API base path: `/api`

## Architecture

- **Modules** per domain: `auth`, `users`, `customers`, `assignments`, `notes`, `activity-logs`.
- **Controllers** handle HTTP; **services** hold business rules; **repositories** (where used) isolate Prisma queries.
- **Global** `ValidationPipe` (whitelist + transform), exception filter, logging interceptor, and response wrapper.

## Multi-tenancy isolation

- Every user has an `organizationId`. JWT carries `sub` and `organizationId`; `JwtStrategy` loads the full user from the database.
- Queries **scope by `organizationId`** (customers, users, assignments) or by relations that imply the org (e.g. note → customer / `note.organizationId`).
- Cross-organization access is rejected via `NotFoundException` / `ForbiddenException` patterns so IDs from another tenant do not leak data.

## Concurrency-safe assignment (max 5 active customers per user)

- Rule: a user may have at most **5** assignments to customers that are **not soft-deleted** and belong to the same organization.
- **Implementation:** `AssignmentsRepository.assignCustomer` runs a **transaction** that locks the assignee’s `User` row with `SELECT … FOR UPDATE`, then counts assignments and inserts only if under the cap.
- **Why:** Locking only assignment rows fails when the user has **zero** rows—parallel requests could all pass a count check. Serializing on the user row queues concurrent assigns for that user and prevents races.

## Performance strategy

- **Indexes** (see `prisma/schema.prisma`): e.g. `Customer (organizationId, deletedAt)`, `Note (customerId)`, `Note (organizationId)`, `ActivityLog (customerId)`, `ActivityLog (entityType, entityId)`, assignment uniques and `userId` index.
- **Customer list:** `count` and `findMany` run in **parallel**; pagination uses `skip` / `take`; search uses indexed filters where possible plus `ILIKE`-style `contains` on name/email/phone.
- **N+1:** List endpoints use Prisma `select` / `include` deliberately (e.g. assignments with nested `user`) instead of per-row queries in loops.

**Scaling (100k+ customers per org):** Current design stays valid with PostgreSQL; for very large orgs you would add read replicas, consider full-text search (e.g. PostgreSQL `tsvector`) for name/email, and optionally cursor-based pagination for deep pages.

## Soft delete integrity

- Customers use `deletedAt`; normal customer queries require `deletedAt: null`.
- **Notes** and **activity logs** remain stored when a customer is soft-deleted; restoring the customer makes notes visible again on customer detail flows.
- Assignments only count **non-deleted** customers toward the limit of 5.

## Activity log (requirements alignment)

Stored fields map to the spec as follows:

| Spec field     | Storage |
|----------------|---------|
| `entityType`   | `ActivityLog.entityType` |
| `entityId`     | `ActivityLog.entityId` |
| `action`       | `ActivityLog.action` |
| `performedBy`  | `ActivityLog.performedBy` (DB column `userId`) |
| `timestamp`    | `ActivityLog.createdAt` |

Customer-scoped events use `entityType = CUSTOMER` and `entityId = customerId`. Note events use `entityType = NOTE` and `entityId = noteId`. `customerId` remains a foreign key for customer-associated history.

## Production improvement: HTTP logging interceptor

- **What:** `LoggingInterceptor` logs method, URL, and duration for each request.
- **Why:** Low-cost observability for debugging and slow-request detection without adding infrastructure. Complements structured logging you might add later (JSON logs, correlation IDs).

## Trade-offs

- **Assignments** use a junction table instead of a single `assignedTo` on `Customer`—supports multiple assignees if you extend the product, at the cost of an extra join.
- **Activity log** keeps a required `customerId` FK so customer timelines stay simple; generic `entityType` / `entityId` cover the spec without dropping relational integrity.
- **Role enum** uses `ADMIN` and `MEMBER` (spec “member”); default role for new users is `MEMBER`.

## API documentation

OpenAPI/Swagger is not wired in this repo; endpoints follow REST-style routes under `/api` (e.g. `/api/customers`, `/api/notes`, `/api/assignments`).

## License

UNLICENSED (private project).
