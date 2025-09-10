import { db } from '@/db';
import { 
  userSettings,
  organizationSettings,
  userOrganizations,
  type NewUserSettings,
  type UserSettings
} from '@/db/user-settings-schema';
import { eq, and } from 'drizzle-orm';

// Get or create user settings
export async function getUserSettings(userId: string): Promise<UserSettings> {
  const existing = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Create default settings for new user
  const [created] = await db
    .insert(userSettings)
    .values({
      userId,
      solucionareEnabled: true,
      escavadorEnabled: true,
      preferredProvider: 'solucionare',
      dailyCostLimit: 1000,
      monthlyCostLimit: 10000,
      costAlertsEnabled: true,
      autoImportEnabled: false,
      andamentosEnrichEnabled: true,
      discoveryFullEnabled: false,
      onboardingCompleted: false,
      onboardingStep: 1
    })
    .returning();

  return created;
}

// Update user settings
export async function updateUserSettings(
  userId: string, 
  updates: Partial<Omit<UserSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
) {
  const [updated] = await db
    .update(userSettings)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(userSettings.userId, userId))
    .returning();

  return updated;
}

// Get user's office ID (from user settings or organization)
export async function getUserOfficeId(userId: string): Promise<string | null> {
  // First check user's personal settings
  const settings = await getUserSettings(userId);
  
  if (settings.solucionareOfficeId) {
    return settings.solucionareOfficeId;
  }

  // Check if user belongs to an organization with a shared office ID
  const userOrg = await db
    .select({
      officeId: organizationSettings.solucionareOfficeId
    })
    .from(userOrganizations)
    .innerJoin(
      organizationSettings,
      eq(userOrganizations.organizationId, organizationSettings.organizationId)
    )
    .where(eq(userOrganizations.userId, userId))
    .limit(1);

  if (userOrg.length > 0 && userOrg[0].officeId) {
    return userOrg[0].officeId;
  }

  return null;
}

// Set user's office ID
export async function setUserOfficeId(userId: string, officeId: string) {
  return updateUserSettings(userId, { solucionareOfficeId: officeId });
}

// Check if user has completed onboarding
export async function isOnboardingComplete(userId: string): Promise<boolean> {
  const settings = await getUserSettings(userId);
  return settings.onboardingCompleted;
}

// Update onboarding progress
export async function updateOnboardingProgress(
  userId: string, 
  step: number, 
  completed: boolean = false
) {
  return updateUserSettings(userId, {
    onboardingStep: step,
    onboardingCompleted: completed
  });
}

// Get user's API preferences
export async function getUserApiPreferences(userId: string) {
  const settings = await getUserSettings(userId);
  
  return {
    preferredProvider: settings.preferredProvider,
    solucionareEnabled: settings.solucionareEnabled,
    escavadorEnabled: settings.escavadorEnabled,
    andamentosEnrichEnabled: settings.andamentosEnrichEnabled,
    discoveryFullEnabled: settings.discoveryFullEnabled,
    officeId: settings.solucionareOfficeId
  };
}

// Check if user has exceeded cost limits
export async function checkCostLimits(userId: string, additionalCost: number = 0) {
  const settings = await getUserSettings(userId);
  
  // Get today's costs
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const { apiCosts } = await import('@/db/legal-schema');
  const dailyCosts = await db
    .select()
    .from(apiCosts)
    .where(
      and(
        eq(apiCosts.userId, userId),
        eq(apiCosts.createdAt, today)
      )
    );

  const todayTotal = dailyCosts.reduce((sum, cost) => 
    sum + parseFloat(cost.cost || '0'), 0
  ) + additionalCost;

  return {
    withinDailyLimit: todayTotal <= (settings.dailyCostLimit || 1000),
    todayTotal,
    dailyLimit: settings.dailyCostLimit || 1000,
    alertsEnabled: settings.costAlertsEnabled
  };
}