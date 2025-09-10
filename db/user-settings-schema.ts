import { pgTable, text, timestamp, uuid, jsonb, boolean, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// User Settings table - stores per-user configuration
export const userSettings = pgTable('user_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().unique(), // auth.uid() from Supabase
  
  // Solucionare Settings
  solucionareOfficeId: text('solucionare_office_id'), // Each user has their own office ID
  solucionareEnabled: boolean('solucionare_enabled').notNull().default(true),
  
  // Escavador Settings  
  escavadorEnabled: boolean('escavador_enabled').notNull().default(true),
  
  // API Preferences
  preferredProvider: text('preferred_provider').default('solucionare'), // solucionare, escavador, auto
  
  // Cost Controls
  dailyCostLimit: integer('daily_cost_limit').default(1000), // BRL
  monthlyCostLimit: integer('monthly_cost_limit').default(10000), // BRL
  costAlertsEnabled: boolean('cost_alerts_enabled').notNull().default(true),
  
  // Feature Flags
  autoImportEnabled: boolean('auto_import_enabled').notNull().default(false),
  andamentosEnrichEnabled: boolean('andamentos_enrich_enabled').notNull().default(true),
  discoveryFullEnabled: boolean('discovery_full_enabled').notNull().default(false),
  
  // Office/Firm Information
  firmName: text('firm_name'),
  firmCnpj: text('firm_cnpj'),
  firmAddress: jsonb('firm_address'),
  
  // Onboarding Status
  onboardingCompleted: boolean('onboarding_completed').notNull().default(false),
  onboardingStep: integer('onboarding_step').default(1),
  
  // Additional Settings
  metadata: jsonb('metadata'), // Flexible field for future settings
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Organization Settings (for multi-user firms)
export const organizationSettings = pgTable('organization_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().unique(),
  name: text('name').notNull(),
  
  // Shared Solucionare Settings
  solucionareOfficeId: text('solucionare_office_id'), // Shared office ID for the org
  solucionareRelationalName: text('solucionare_relational_name').default('Freelaw'),
  
  // Billing
  billingEmail: text('billing_email'),
  billingPlan: text('billing_plan').default('starter'), // starter, professional, enterprise
  
  // Limits
  maxUsers: integer('max_users').default(5),
  maxProcesses: integer('max_processes').default(1000),
  
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// User-Organization relationship
export const userOrganizations = pgTable('user_organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  organizationId: uuid('organization_id').notNull().references(() => organizationSettings.id),
  role: text('role').notNull().default('member'), // owner, admin, member
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

// Type exports
export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;
export type OrganizationSettings = typeof organizationSettings.$inferSelect;
export type NewOrganizationSettings = typeof organizationSettings.$inferInsert;
export type UserOrganization = typeof userOrganizations.$inferSelect;
export type NewUserOrganization = typeof userOrganizations.$inferInsert;