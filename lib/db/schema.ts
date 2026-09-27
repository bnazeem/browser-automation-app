import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const workflows = pgTable(
  "workflows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Clerk identifiers, stored as text since they are opaque strings.
    orgId: text("org_id").notNull(),
    name: text("name").notNull(),
    graph: jsonb("graph"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  
)

export type Workflow = typeof workflows.$inferSelect

