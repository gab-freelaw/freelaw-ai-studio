import { pgTable, uuid, text, timestamp, jsonb, integer, boolean, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { organizations } from './organizations';
import { documents } from './documents';

export const aiChats = pgTable('ai_chats', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  
  title: text('title').notNull(),
  type: text('type', { 
    enum: ['general', 'document_analysis', 'legal_research', 'contract_review', 'case_analysis'] 
  }).notNull().default('general'),
  
  model: text('model').notNull().default('gpt-4'),
  systemPrompt: text('system_prompt'),
  
  isArchived: boolean('is_archived').notNull().default(false),
  metadata: jsonb('metadata'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const aiMessages = pgTable('ai_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatId: uuid('chat_id').notNull().references(() => aiChats.id, { onDelete: 'cascade' }),
  
  role: text('role', { enum: ['user', 'assistant', 'system'] }).notNull(),
  content: text('content').notNull(),
  
  documentIds: jsonb('document_ids').$type<string[]>(), // Referenced documents
  citations: jsonb('citations'), // Legal citations found
  
  tokenCount: integer('token_count'),
  cost: decimal('cost', { precision: 10, scale: 6 }),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const aiPromptTemplates = pgTable('ai_prompt_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  
  prompt: text('prompt').notNull(),
  variables: jsonb('variables').$type<string[]>(), // Variable placeholders in the prompt
  
  isPublic: boolean('is_public').notNull().default(false),
  usageCount: integer('usage_count').notNull().default(0),
  
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const aiUsageMetrics = pgTable('ai_usage_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),
  
  date: timestamp('date').notNull(),
  model: text('model').notNull(),
  
  requestCount: integer('request_count').notNull().default(0),
  totalTokens: integer('total_tokens').notNull().default(0),
  totalCost: decimal('total_cost', { precision: 10, scale: 6 }).notNull().default('0'),
  
  metadata: jsonb('metadata'),
});

export const aiChatsRelations = relations(aiChats, ({ one, many }) => ({
  user: one(users, {
    fields: [aiChats.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [aiChats.organizationId],
    references: [organizations.id],
  }),
  messages: many(aiMessages),
}));

export const aiMessagesRelations = relations(aiMessages, ({ one }) => ({
  chat: one(aiChats, {
    fields: [aiMessages.chatId],
    references: [aiChats.id],
  }),
}));

export type AIChat = typeof aiChats.$inferSelect;
export type NewAIChat = typeof aiChats.$inferInsert;
export type AIMessage = typeof aiMessages.$inferSelect;
export type NewAIMessage = typeof aiMessages.$inferInsert;
export type AIPromptTemplate = typeof aiPromptTemplates.$inferSelect;
export type NewAIPromptTemplate = typeof aiPromptTemplates.$inferInsert;