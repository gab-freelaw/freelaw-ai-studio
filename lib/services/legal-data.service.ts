import { db } from '@/db';
import { 
  clients, 
  processes, 
  publications, 
  clientProcesses, 
  apiCosts,
  lawyers,
  type NewClient,
  type NewProcess,
  type NewPublication,
  type NewClientProcess,
  type NewApiCost,
  type NewLawyer
} from '@/db/legal-schema';
import { eq, and, or, sql, inArray } from 'drizzle-orm';

// Upsert functions
export async function upsertClient(data: Omit<NewClient, 'id' | 'createdAt' | 'updatedAt'>) {
  const existing = await db
    .select()
    .from(clients)
    .where(
      and(
        eq(clients.userId, data.userId),
        data.cpfCnpj ? eq(clients.cpfCnpj, data.cpfCnpj) : eq(clients.name, data.name)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    const [updated] = await db
      .update(clients)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(clients.id, existing[0].id))
      .returning();
    return updated;
  }

  const [created] = await db.insert(clients).values(data).returning();
  return created;
}

export async function upsertProcess(data: Omit<NewProcess, 'id' | 'createdAt' | 'updatedAt'>) {
  const existing = await db
    .select()
    .from(processes)
    .where(eq(processes.cnjNumber, data.cnjNumber))
    .limit(1);

  if (existing.length > 0) {
    const [updated] = await db
      .update(processes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(processes.id, existing[0].id))
      .returning();
    return updated;
  }

  const [created] = await db.insert(processes).values(data).returning();
  return created;
}

export async function upsertPublication(data: Omit<NewPublication, 'id' | 'createdAt' | 'updatedAt'>) {
  // Check for duplicate by content hash or unique combination
  const contentHash = hashContent(data.content);
  const existing = await db
    .select()
    .from(publications)
    .where(
      and(
        eq(publications.userId, data.userId),
        data.processId ? eq(publications.processId, data.processId) : sql`true`,
        eq(sql`md5(${publications.content})`, contentHash)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    const [updated] = await db
      .update(publications)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(publications.id, existing[0].id))
      .returning();
    return updated;
  }

  const [created] = await db.insert(publications).values(data).returning();
  return created;
}

export async function linkClientToProcess(
  clientId: string,
  processId: string,
  participationType: string,
  notes?: string
) {
  const existing = await db
    .select()
    .from(clientProcesses)
    .where(
      and(
        eq(clientProcesses.clientId, clientId),
        eq(clientProcesses.processId, processId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    const [updated] = await db
      .update(clientProcesses)
      .set({ 
        participationType,
        notes,
        active: true,
        updatedAt: new Date() 
      })
      .where(eq(clientProcesses.id, existing[0].id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(clientProcesses)
    .values({
      clientId,
      processId,
      participationType,
      notes,
      active: true
    })
    .returning();
  return created;
}

export async function trackApiCost(data: Omit<NewApiCost, 'id' | 'createdAt'>) {
  const [created] = await db.insert(apiCosts).values(data).returning();
  return created;
}

export async function upsertLawyer(data: Omit<NewLawyer, 'id' | 'createdAt' | 'updatedAt'>) {
  const existing = await db
    .select()
    .from(lawyers)
    .where(
      and(
        eq(lawyers.userId, data.userId),
        eq(lawyers.oab, data.oab),
        eq(lawyers.state, data.state)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    const [updated] = await db
      .update(lawyers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(lawyers.id, existing[0].id))
      .returning();
    return updated;
  }

  const [created] = await db.insert(lawyers).values(data).returning();
  return created;
}

// Batch operations
export async function batchUpsertProcesses(
  userId: string,
  processesData: Array<Omit<NewProcess, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
) {
  const results = [];
  for (const processData of processesData) {
    const result = await upsertProcess({ ...processData, userId });
    results.push(result);
  }
  return results;
}

export async function batchUpsertClients(
  userId: string,
  clientsData: Array<Omit<NewClient, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
) {
  const results = [];
  for (const clientData of clientsData) {
    const result = await upsertClient({ ...clientData, userId });
    results.push(result);
  }
  return results;
}

export async function batchLinkClientsToProcesses(
  links: Array<{
    clientId: string;
    processId: string;
    participationType: string;
    notes?: string;
  }>
) {
  const results = [];
  for (const link of links) {
    const result = await linkClientToProcess(
      link.clientId,
      link.processId,
      link.participationType,
      link.notes
    );
    results.push(result);
  }
  return results;
}

// Query functions
export async function getProcessesByUser(userId: string) {
  return db
    .select()
    .from(processes)
    .where(eq(processes.userId, userId))
    .orderBy(sql`${processes.updatedAt} DESC`);
}

export async function getClientsByUser(userId: string) {
  return db
    .select()
    .from(clients)
    .where(eq(clients.userId, userId))
    .orderBy(sql`${clients.name} ASC`);
}

export async function getProcessWithRelations(processId: string) {
  const [process] = await db
    .select()
    .from(processes)
    .where(eq(processes.id, processId))
    .limit(1);

  if (!process) return null;

  const [pubs, clientLinks] = await Promise.all([
    db
      .select()
      .from(publications)
      .where(eq(publications.processId, processId))
      .orderBy(sql`${publications.publicationDate} DESC`),
    
    db
      .select({
        client: clients,
        link: clientProcesses
      })
      .from(clientProcesses)
      .innerJoin(clients, eq(clientProcesses.clientId, clients.id))
      .where(eq(clientProcesses.processId, processId))
  ]);

  return {
    ...process,
    publications: pubs,
    clients: clientLinks
  };
}

export async function getApiCostsSummary(userId: string, startDate?: Date, endDate?: Date) {
  const conditions = [eq(apiCosts.userId, userId)];
  
  if (startDate) {
    conditions.push(sql`${apiCosts.createdAt} >= ${startDate}`);
  }
  if (endDate) {
    conditions.push(sql`${apiCosts.createdAt} <= ${endDate}`);
  }

  const result = await db
    .select({
      provider: apiCosts.provider,
      operation: apiCosts.operation,
      totalCost: sql<number>`SUM(${apiCosts.cost})`,
      count: sql<number>`COUNT(*)`,
      avgResponseTime: sql<number>`AVG(${apiCosts.responseTime})`
    })
    .from(apiCosts)
    .where(and(...conditions))
    .groupBy(apiCosts.provider, apiCosts.operation);

  return result;
}

// Helper functions
function hashContent(content: string): string {
  // Simple hash for deduplication (in production, use crypto)
  return Buffer.from(content).toString('base64').substring(0, 32);
}

// Export types for use in other files
export type {
  Client,
  Process,
  Publication,
  ClientProcess,
  ApiCost,
  Lawyer
} from '@/db/legal-schema';