import { pgTable, text, timestamp, uuid, jsonb, boolean, decimal, integer, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Clients table (pessoas físicas e jurídicas)
export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(), // Owner of this client record
  name: text('name').notNull(),
  cpfCnpj: text('cpf_cnpj'),
  personType: text('person_type').notNull().default('FISICA'), // FISICA, JURIDICA
  email: text('email'),
  phone: text('phone'),
  address: jsonb('address'), // { street, number, complement, district, city, state, zipCode }
  metadata: jsonb('metadata'), // Additional flexible data
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_clients_user_id').on(table.userId),
  cpfCnpjIdx: index('idx_clients_cpf_cnpj').on(table.cpfCnpj),
  nameIdx: index('idx_clients_name').on(table.name),
}));

// Processes table (processos judiciais)
export const processes = pgTable('processes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(), // Owner of this process record
  cnjNumber: text('cnj_number').notNull(), // Número CNJ único
  title: text('title'),
  court: text('court'), // Tribunal
  courtClass: text('court_class'), // Classe judicial
  subject: text('subject'), // Assunto
  status: text('status').notNull().default('active'), // active, archived, finished
  value: decimal('value', { precision: 15, scale: 2 }), // Valor da causa
  startDate: timestamp('start_date'),
  lastUpdate: timestamp('last_update'),
  nextDeadline: timestamp('next_deadline'),
  parties: jsonb('parties'), // { autores: [], reus: [], advogados: [] }
  movements: jsonb('movements'), // Array of movements/andamentos
  documents: jsonb('documents'), // Array of document references
  metadata: jsonb('metadata'), // Additional data from APIs
  sourceApi: text('source_api'), // escavador, solucionare, manual
  sourceData: jsonb('source_data'), // Original API response
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_processes_user_id').on(table.userId),
  cnjNumberIdx: uniqueIndex('idx_processes_cnj_number').on(table.cnjNumber),
  statusIdx: index('idx_processes_status').on(table.status),
  courtIdx: index('idx_processes_court').on(table.court),
}));

// Publications table (publicações dos diários)
export const publications = pgTable('publications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  processId: uuid('process_id').references(() => processes.id, { onDelete: 'cascade' }),
  publicationDate: timestamp('publication_date').notNull(),
  captureDate: timestamp('capture_date'),
  content: text('content').notNull(), // Full publication text
  summary: text('summary'), // AI-generated summary
  type: text('type'), // despacho, sentença, intimação, etc
  court: text('court'),
  diary: text('diary'), // Diário onde foi publicado
  page: integer('page'),
  edition: text('edition'),
  oab: text('oab'), // OAB do advogado relacionado
  sourceApi: text('source_api'),
  sourceData: jsonb('source_data'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_publications_user_id').on(table.userId),
  processIdIdx: index('idx_publications_process_id').on(table.processId),
  publicationDateIdx: index('idx_publications_date').on(table.publicationDate),
  oabIdx: index('idx_publications_oab').on(table.oab),
}));

// Client-Process relationship table (many-to-many)
export const clientProcesses = pgTable('client_processes', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  processId: uuid('process_id').notNull().references(() => processes.id, { onDelete: 'cascade' }),
  participationType: text('participation_type').notNull(), // AUTOR, REU, TERCEIRO
  active: boolean('active').notNull().default(true),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  clientProcessIdx: uniqueIndex('idx_client_process_unique').on(table.clientId, table.processId),
  clientIdIdx: index('idx_client_processes_client').on(table.clientId),
  processIdIdx: index('idx_client_processes_process').on(table.processId),
}));

// API Cost Tracking table
export const apiCosts = pgTable('api_costs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  provider: text('provider').notNull(), // escavador, solucionare
  operation: text('operation').notNull(), // processSearch, documentDownload, etc
  cost: decimal('cost', { precision: 10, scale: 2 }).notNull(),
  credits: integer('credits'), // If using credit system
  requestData: jsonb('request_data'),
  responseStatus: integer('response_status'),
  responseTime: integer('response_time'), // milliseconds
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_api_costs_user_id').on(table.userId),
  providerIdx: index('idx_api_costs_provider').on(table.provider),
  createdAtIdx: index('idx_api_costs_created_at').on(table.createdAt),
}));

// Lawyers table (advogados cadastrados)
export const lawyers = pgTable('lawyers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(), // Owner/firm this lawyer belongs to
  name: text('name').notNull(),
  oab: text('oab').notNull(),
  state: text('state').notNull(), // UF
  email: text('email'),
  phone: text('phone'),
  specialties: jsonb('specialties'), // Array of specialties
  active: boolean('active').notNull().default(true),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_lawyers_user_id').on(table.userId),
  oabStateIdx: uniqueIndex('idx_lawyers_oab_state').on(table.oab, table.state),
}));

// Define relationships
export const clientsRelations = relations(clients, ({ many }) => ({
  clientProcesses: many(clientProcesses),
}));

export const processesRelations = relations(processes, ({ many }) => ({
  publications: many(publications),
  clientProcesses: many(clientProcesses),
}));

export const publicationsRelations = relations(publications, ({ one }) => ({
  process: one(processes, {
    fields: [publications.processId],
    references: [processes.id],
  }),
}));

export const clientProcessesRelations = relations(clientProcesses, ({ one }) => ({
  client: one(clients, {
    fields: [clientProcesses.clientId],
    references: [clients.id],
  }),
  process: one(processes, {
    fields: [clientProcesses.processId],
    references: [processes.id],
  }),
}));

// Type exports
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type Process = typeof processes.$inferSelect;
export type NewProcess = typeof processes.$inferInsert;
export type Publication = typeof publications.$inferSelect;
export type NewPublication = typeof publications.$inferInsert;
export type ClientProcess = typeof clientProcesses.$inferSelect;
export type NewClientProcess = typeof clientProcesses.$inferInsert;
export type ApiCost = typeof apiCosts.$inferSelect;
export type NewApiCost = typeof apiCosts.$inferInsert;
export type Lawyer = typeof lawyers.$inferSelect;
export type NewLawyer = typeof lawyers.$inferInsert;