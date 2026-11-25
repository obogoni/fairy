import { relations } from 'drizzle-orm/relations';
import { tenants, greetings } from './schema';

export const greetingsRelations = relations(greetings, ({ one }) => ({
  tenant: one(tenants, {
    fields: [greetings.tenantId],
    references: [tenants.id],
  }),
}));

export const tenantsRelations = relations(tenants, ({ many }) => ({
  greetings: many(greetings),
}));
