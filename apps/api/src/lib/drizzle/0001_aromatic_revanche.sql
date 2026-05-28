-- NOTE: `author_id` references `user.id` (Better Auth, migration 0000) but a
-- FK constraint is intentionally omitted for v0. Drizzle FK declarations
-- across modules entangle schemas and complicate the per-module ownership
-- story. Revisit when cross-module relationships need DB-level enforcement.
CREATE TABLE "notes" (
	"id" text PRIMARY KEY NOT NULL,
	"author_id" text NOT NULL,
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
